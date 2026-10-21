import json
from pathlib import Path

import pytest

from workflow_architect.architect import Architect
from workflow_architect.blueprint import Blueprint
from workflow_architect.gym import train
from workflow_architect.llm import ScriptedLLM, parse_json
from workflow_architect.runner import pick_route, run

EXAMPLE = Path(__file__).resolve().parent.parent / "examples" / "cold_email.yaml"
INPUTS = {"sender_context": "We build bots.", "recipient": "Sam, EM", "goal": "a call"}


def verdict(score: int, met: list[bool] | None = None) -> str:
    bp = Blueprint.load(EXAMPLE)
    return json.dumps({
        "scores": {c.name: {"score": score, "reason": "r"} for c in bp.rubric},
        "expectations_met": met or [],
        "top_fix": "be sharper",
    })


def tiny_blueprint(**overrides) -> dict:
    data = {
        "name": "t", "mission": "m", "pattern": "single_prompt", "pattern_rationale": "simple",
        "success_criteria": ["c"], "inputs": [{"name": "topic", "description": "d"}],
        "knobs": [{"name": "tone", "description": "d", "default": "dry"}],
        "steps": [{"id": "s", "purpose": "p", "prompt": "Write about {{topic}} in a {{tone}} way", "output_key": "out"}],
        "final_output": "out", "rubric": [{"name": "quality", "description": "great"}],
    }
    return data | overrides


def test_example_blueprint_is_valid():
    bp = Blueprint.load(EXAMPLE)
    assert bp.final_output == "final_email"
    assert len(bp.test_cases) >= 5


def test_wiring_errors_are_caught():
    bad = tiny_blueprint(steps=[{"id": "s", "purpose": "p", "prompt": "{{nope}}", "output_key": "out"}])
    with pytest.raises(ValueError, match="nope"):
        Blueprint.model_validate(bad)


def test_run_chain_and_refine_loop():
    bp = Blueprint.load(EXAMPLE)
    # brief, plan, draft, then refine: weak score -> rewrite -> passing score
    llm = ScriptedLLM(["BRIEF", "PLAN", "DRAFT", verdict(3), "BETTER", verdict(5)])
    result = run(bp, llm, INPUTS, {"tone": "playful"})
    assert result.output == "BETTER"
    assert "tone: playful" in llm.calls[2]["prompt"]  # knob reached the writing step
    assert "(not provided)" in llm.calls[0]["prompt"]  # optional input defaulted
    assert "BRIEF" in llm.calls[1]["prompt"]  # chain hand-off works


def test_run_rejects_unknown_knobs_and_missing_inputs():
    bp = Blueprint.load(EXAMPLE)
    with pytest.raises(ValueError, match="Unknown knobs"):
        run(bp, ScriptedLLM([]), INPUTS, {"vibe": "x"})
    with pytest.raises(ValueError, match="Missing required"):
        run(bp, ScriptedLLM([]), {"recipient": "x"})


def test_routing_with_when_conditions():
    bp = Blueprint.model_validate(tiny_blueprint(
        pattern="routing",
        steps=[
            {"id": "r", "kind": "route", "purpose": "p", "prompt": "Classify {{topic}}",
             "output_key": "kind", "routes": ["tech", "tech_founder"]},
            {"id": "a", "purpose": "p", "prompt": "A", "output_key": "out", "when": {"kind": "tech"}},
            {"id": "b", "purpose": "p", "prompt": "B", "output_key": "out", "when": {"kind": "tech_founder"}},
        ],
    ))
    result = run(bp, ScriptedLLM(["This is tech_founder.", "from b"]), {"topic": "x"})
    assert result.output == "from b"
    assert pick_route("TECH", ["tech", "tech_founder"]) == "tech"
    assert pick_route("unclear", ["tech"]) is None


def test_missed_expectation_caps_score():
    bp = Blueprint.load(EXAMPLE)
    case = bp.test_cases[0]
    bp.test_cases = [case]
    llm = ScriptedLLM(["B", "P", "D", verdict(5), verdict(5, met=[True, False])])
    report = train(bp, llm, verbose=False)
    assert report.overall == 3.0


def test_architect_repairs_then_revises():
    good = tiny_blueprint()
    broken = tiny_blueprint(final_output="missing")
    llm = ScriptedLLM([
        json.dumps(broken),  # draft fails validation
        "```json\n" + json.dumps(good) + "\n```",  # repair succeeds
        json.dumps({"pass": False, "score": 6, "issues": [{"severity": "high", "issue": "x", "fix": "y"}]}),
        json.dumps(good | {"name": "t2"}),  # revision
        json.dumps({"pass": True, "score": 9, "issues": []}),
    ])
    result = Architect(llm).design("make a thing", verbose=False)
    assert result.blueprint.name == "t2"
    assert len(result.reviews) == 2
    assert "validation" in llm.calls[1]["prompt"]


def test_parse_json_tolerates_prose():
    assert parse_json('Sure! {"a": 1} hope that helps') == {"a": 1}

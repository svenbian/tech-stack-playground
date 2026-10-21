"""The Blueprint: a complete, executable description of an agent workflow.

The architect writes Blueprints and the runner executes them. Keeping this a
plain data structure (and saving it as YAML) means every workflow is easy to
read, diff, and version.
"""

from __future__ import annotations

import re
from enum import Enum
from pathlib import Path

import yaml
from pydantic import BaseModel, Field, model_validator

PLACEHOLDER = re.compile(r"\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}")


class Pattern(str, Enum):
    single_prompt = "single_prompt"
    prompt_chain = "prompt_chain"
    routing = "routing"
    evaluator_optimizer = "evaluator_optimizer"
    hybrid = "hybrid"


class StepKind(str, Enum):
    generate = "generate"  # one LLM call -> text saved to output_key
    route = "route"  # LLM picks one label from `routes` -> saved to output_key
    refine = "refine"  # critique `target` against the rubric and rewrite, looped


class Tier(str, Enum):
    fast = "fast"  # cheap model for classification and extraction
    smart = "smart"  # strong model for writing and judging


class InputSpec(BaseModel):
    name: str
    description: str
    required: bool = True
    example: str = ""


class Knob(BaseModel):
    """A user-adjustable style or behaviour setting with a sensible default."""

    name: str
    description: str
    default: str
    options: list[str] = Field(default_factory=list, description="Empty = free text")


class Criterion(BaseModel):
    name: str
    description: str = Field(description="What a 5/5 looks like, concretely")
    weight: float = 1.0


class Step(BaseModel):
    id: str
    kind: StepKind = StepKind.generate
    purpose: str
    prompt: str = Field(description="Template; use {{name}} for inputs, knobs, or earlier outputs")
    output_key: str
    tier: Tier = Tier.smart
    temperature: float = 0.7
    when: dict[str, str] = Field(
        default_factory=dict, description="Run only if state[key] == value (used after a route step)"
    )
    routes: list[str] = Field(default_factory=list, description="route steps: allowed labels")
    target: str = Field("", description="refine steps: the state key to improve")
    max_iterations: int = 2
    pass_score: float = Field(4.5, description="refine steps: stop once the weighted score reaches this (1-5)")


class TestCase(BaseModel):
    __test__ = False  # stop pytest from collecting this as a test class

    name: str
    inputs: dict[str, str]
    knobs: dict[str, str] = Field(default_factory=dict)
    expectations: list[str] = Field(default_factory=list, description="Case-specific things the judge checks")


class Blueprint(BaseModel):
    name: str
    mission: str
    pattern: Pattern
    pattern_rationale: str
    success_criteria: list[str]
    non_goals: list[str] = Field(default_factory=list)
    inputs: list[InputSpec]
    knobs: list[Knob] = Field(default_factory=list)
    craft_principles: list[str] = Field(
        default_factory=list, description="Invariant domain expertise that holds whatever the knob settings"
    )
    steps: list[Step]
    final_output: str = Field(description="State key that holds the deliverable")
    guardrails: list[str] = Field(default_factory=list)
    rubric: list[Criterion]
    test_cases: list[TestCase] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def _check_wiring(self) -> "Blueprint":
        """Catch broken wiring before anything runs: every placeholder must resolve."""
        available = {i.name for i in self.inputs} | {k.name for k in self.knobs}
        available |= {"craft_principles", "guardrails", "rubric"}
        problems: list[str] = []
        for step in self.steps:
            for ref in PLACEHOLDER.findall(step.prompt):
                if ref not in available:
                    problems.append(f"step '{step.id}' uses {{{{{ref}}}}} before anything produces it")
            for key in step.when:
                if key not in available:
                    problems.append(f"step '{step.id}' has when-condition on unknown key '{key}'")
            if step.kind is StepKind.route and not step.routes:
                problems.append(f"route step '{step.id}' has no routes")
            if step.kind is StepKind.refine and step.target not in available:
                problems.append(f"refine step '{step.id}' targets unknown key '{step.target}'")
            available.add(step.output_key)
        if self.final_output not in available:
            problems.append(f"final_output '{self.final_output}' is never produced")
        if problems:
            raise ValueError("Blueprint wiring errors:\n- " + "\n- ".join(problems))
        return self

    # ---- persistence -------------------------------------------------
    def to_yaml(self) -> str:
        return yaml.safe_dump(self.model_dump(mode="json"), sort_keys=False, allow_unicode=True, width=100)

    def save(self, path: str | Path) -> Path:
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(self.to_yaml(), encoding="utf-8")
        return path

    @classmethod
    def load(cls, path: str | Path) -> "Blueprint":
        return cls.model_validate(yaml.safe_load(Path(path).read_text(encoding="utf-8")))

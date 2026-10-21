"""Executes a Blueprint step by step and keeps a full trace of what every call saw."""

from __future__ import annotations

from dataclasses import dataclass, field

from .blueprint import PLACEHOLDER, Blueprint, Step, StepKind
from .judge import judge
from .llm import LLM

REFINE_TEMPLATE = """{instructions}

## Current draft
<draft>
{draft}
</draft>

## Evaluator feedback (score {score:.2f}/5)
{feedback}
Most important fix: {top_fix}

Rewrite the draft to address the feedback. Keep what already works.
Respect every style setting and guardrail. Return only the improved deliverable."""


@dataclass
class RunResult:
    output: str
    state: dict[str, str]
    trace: list[dict] = field(default_factory=list)


def bullets(items) -> str:
    return "\n".join(f"- {i}" for i in items)


def render(template: str, state: dict[str, str]) -> str:
    def sub(match):
        key = match.group(1)
        if key not in state:
            raise KeyError(f"Template needs '{key}' but it is not in the run state")
        return state[key]

    return PLACEHOLDER.sub(sub, template)


def pick_route(raw: str, routes: list[str]) -> str | None:
    """Exact label first, then the longest label mentioned (so 'cto_founder' beats 'cto')."""
    cleaned = raw.strip().strip("`'\".").lower()
    for r in routes:
        if r.lower() == cleaned:
            return r
    mentioned = [r for r in routes if r.lower() in raw.lower()]
    return max(mentioned, key=len) if mentioned else None


def build_system(bp: Blueprint, step: Step) -> str:
    return (
        f"You are one step of the '{bp.name}' workflow.\n"
        f"Workflow mission: {bp.mission}\n"
        f"This step's job: {step.purpose}\n\n"
        f"Guardrails (never violate):\n{bullets(bp.guardrails) or '- none'}"
    )


def run(
    bp: Blueprint, llm: LLM, inputs: dict[str, str], knobs: dict[str, str] | None = None, verbose: bool = False
) -> RunResult:
    missing = [i.name for i in bp.inputs if i.required and not inputs.get(i.name)]
    if missing:
        raise ValueError(f"Missing required inputs: {', '.join(missing)}")
    unknown = set(knobs or {}) - {k.name for k in bp.knobs}
    if unknown:
        raise ValueError(f"Unknown knobs: {', '.join(sorted(unknown))}")

    knob_values = {k.name: k.default for k in bp.knobs} | (knobs or {})
    state: dict[str, str] = {i.name: inputs.get(i.name) or "(not provided)" for i in bp.inputs}
    state |= knob_values
    state["craft_principles"] = bullets(bp.craft_principles)
    state["guardrails"] = bullets(bp.guardrails)
    state["rubric"] = bullets(f"{c.name}: {c.description}" for c in bp.rubric)
    trace: list[dict] = []

    for step in bp.steps:
        if any(state.get(k) != v for k, v in step.when.items()):
            trace.append({"step": step.id, "skipped": True, "when": step.when})
            continue
        system = build_system(bp, step)
        prompt = render(step.prompt, state)

        if step.kind is StepKind.generate:
            out = llm.generate(prompt, system=system, tier=step.tier.value, temperature=step.temperature)
            trace.append({"step": step.id, "prompt": prompt, "output": out})

        elif step.kind is StepKind.route:
            prompt += f"\n\nReply with exactly one label from: {', '.join(step.routes)}"
            raw = llm.generate(prompt, system=system, tier=step.tier.value, temperature=0.0)
            out = pick_route(raw, step.routes)
            trace.append({"step": step.id, "prompt": prompt, "raw": raw, "output": out, "fallback": out is None})
            out = out or step.routes[0]

        else:  # refine: the evaluator-optimizer loop
            out = state[step.target]
            context = f"Mission: {bp.mission}\nInputs:\n" + bullets(f"{i.name}: {state[i.name]}" for i in bp.inputs)
            for iteration in range(1, step.max_iterations + 1):
                verdict = judge(llm, bp, out, context=context, knobs=knob_values)
                entry = {"step": step.id, "iteration": iteration, "score": verdict.weighted, "verdict": verdict.model_dump()}
                if verdict.weighted >= step.pass_score:
                    trace.append(entry | {"passed": True})
                    break
                feedback = bullets(f"{k}: {v.get('score')}/5, {v.get('reason')}" for k, v in verdict.scores.items())
                revise = REFINE_TEMPLATE.format(
                    instructions=prompt, draft=out, score=verdict.weighted, feedback=feedback, top_fix=verdict.top_fix
                )
                out = llm.generate(revise, system=system, tier=step.tier.value, temperature=step.temperature)
                trace.append(entry | {"revised_output": out})

        state[step.output_key] = out
        if verbose:
            print(f"[{step.id}] -> {step.output_key}: {out[:120]!r}")

    return RunResult(output=state[bp.final_output], state=state, trace=trace)

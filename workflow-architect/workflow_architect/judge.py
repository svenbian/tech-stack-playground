"""LLM-as-judge: scores an output against a blueprint's rubric.

Used in two places: inside `refine` steps (self-critique at runtime) and by the
eval gym (offline scoring). Per-criterion scores with reasons are far more
reliable and useful than a single "rate this 1-10".
"""

from __future__ import annotations

from pydantic import BaseModel

from .blueprint import Blueprint
from .llm import LLM, parse_json

JUDGE_SYSTEM = """You are a demanding, calibrated evaluator. You score work against an explicit rubric.
Scoring scale per criterion: 1 = fails, 2 = weak, 3 = acceptable, 4 = strong, 5 = exceptional (matches the 5/5 description exactly).
Most competent drafts deserve 3s. Only give a 5 when you could not name a concrete improvement.
Judge the output against the requested style settings: a casual email is not penalised for being casual.
Return JSON only."""

JUDGE_TEMPLATE = """## Task context
{context}

## Requested style settings
{knobs}

## Rubric
{rubric}

## Case-specific expectations (each must be met)
{expectations}

## Output to evaluate
<output>
{output}
</output>

Return JSON exactly in this shape:
{{"scores": {{"<criterion name>": {{"score": 1-5, "reason": "<one sentence, cite the output>"}}}},
  "expectations_met": [true/false per expectation, in order],
  "top_fix": "<the single change that would raise the score most>"}}"""


class Verdict(BaseModel):
    scores: dict[str, dict]
    expectations_met: list[bool] = []
    top_fix: str = ""
    weighted: float = 0.0

    def summary(self) -> str:
        parts = ", ".join(f"{k}={v.get('score')}" for k, v in self.scores.items())
        return f"{self.weighted:.2f} ({parts})"


def judge(
    llm: LLM,
    blueprint: Blueprint,
    output: str,
    *,
    context: str,
    knobs: dict[str, str],
    expectations: list[str] | None = None,
) -> Verdict:
    rubric = "\n".join(f"- {c.name} (weight {c.weight}): {c.description}" for c in blueprint.rubric)
    prompt = JUDGE_TEMPLATE.format(
        context=context,
        knobs="\n".join(f"- {k}: {v}" for k, v in knobs.items()) or "(defaults)",
        rubric=rubric,
        expectations="\n".join(f"- {e}" for e in expectations or []) or "(none)",
        output=output,
    )
    data = parse_json(llm.generate(prompt, system=JUDGE_SYSTEM, tier="smart", temperature=0.0, json_mode=True))
    verdict = Verdict.model_validate(data)
    verdict.weighted = weighted_score(blueprint, verdict)
    return verdict


def weighted_score(blueprint: Blueprint, verdict: Verdict) -> float:
    total = weight = 0.0
    for c in blueprint.rubric:
        entry = verdict.scores.get(c.name)
        if entry is None:  # the judge skipped a criterion, so count it as a fail rather than ignore it
            score = 1.0
        else:
            score = float(entry.get("score", 1))
        total += score * c.weight
        weight += c.weight
    score = total / weight if weight else 0.0
    if verdict.expectations_met and not all(verdict.expectations_met):
        score = min(score, 3.0)  # a missed hard expectation caps the result
    return round(score, 2)

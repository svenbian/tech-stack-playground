"""The Workflow Architect: turns a capability request into a reviewed, validated Blueprint.

    interview -> draft -> validate (repair on error) -> critique -> revise -> ... -> Blueprint

The architect is itself built with the patterns it teaches: a prompt chain whose
last stage is an evaluator-optimizer loop driven by `prompts/design_checklist.md`.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path

from pydantic import ValidationError

from .blueprint import Blueprint
from .llm import LLM, parse_json

ROOT = Path(__file__).resolve().parent.parent
SYSTEM = (ROOT / "prompts" / "architect_system.md").read_text(encoding="utf-8")
CHECKLIST = (ROOT / "prompts" / "design_checklist.md").read_text(encoding="utf-8")
EXAMPLE = ROOT / "examples" / "cold_email.yaml"

INTERVIEW_PROMPT = """A user wants this capability:
<request>
{request}
</request>

List the questions whose answers would most change the design (max {max_q}): audience, inputs available at run time,
what "elite" means to them, style range, hard constraints. Skip anything you can sensibly assume.
Return JSON: {{"questions": ["..."], "default_assumptions": ["what you will assume if unanswered"]}}"""

DRAFT_PROMPT = """Design a Blueprint for this capability.

<request>
{request}
</request>

<clarifications>
{clarifications}
</clarifications>

<blueprint_json_schema>
{schema}
</blueprint_json_schema>

<reference_blueprint note="An example of the quality bar, from a different request. Match its rigour, not its domain.">
{example}
</reference_blueprint>

Return only the Blueprint JSON."""

REPAIR_PROMPT = """Your Blueprint JSON failed validation:
<errors>
{errors}
</errors>

<your_blueprint>
{blueprint}
</your_blueprint>

Fix every error and return the complete corrected Blueprint JSON only."""

REVISE_PROMPT = """Revise this Blueprint to fix the review findings. Fix every high and medium issue and keep everything else intact.

<review>
{review}
</review>

<blueprint>
{blueprint}
</blueprint>

Return the complete revised Blueprint JSON only."""


@dataclass
class DesignResult:
    blueprint: Blueprint
    reviews: list[dict] = field(default_factory=list)
    clarifications: str = ""


class Architect:
    def __init__(self, llm: LLM, max_review_rounds: int = 2, max_repairs: int = 2):
        self.llm = llm
        self.max_review_rounds = max_review_rounds
        self.max_repairs = max_repairs

    def interview(self, request: str, max_questions: int = 5) -> dict:
        reply = self.llm.generate(
            INTERVIEW_PROMPT.format(request=request, max_q=max_questions),
            system=SYSTEM, tier="smart", temperature=0.3, json_mode=True,
        )
        return parse_json(reply)

    def design(self, request: str, clarifications: str = "", verbose: bool = True) -> DesignResult:
        log = print if verbose else (lambda *_: None)
        example = EXAMPLE.read_text(encoding="utf-8") if EXAMPLE.exists() else "(none)"
        prompt = DRAFT_PROMPT.format(
            request=request,
            clarifications=clarifications or "(none: state your assumptions in `assumptions`)",
            schema=json.dumps(Blueprint.model_json_schema()),
            example=example,
        )
        log("Drafting blueprint...")
        bp = self._generate_valid(prompt)
        reviews: list[dict] = []

        for round_no in range(1, self.max_review_rounds + 1):
            review = self.critique(bp)
            reviews.append(review)
            n_issues = len(review.get("issues", []))
            log(f"Review {round_no}: score {review.get('score')}/10, {n_issues} issues, pass={review.get('pass')}")
            if review.get("pass"):
                break
            bp = self._generate_valid(
                REVISE_PROMPT.format(review=json.dumps(review, indent=2), blueprint=bp.model_dump_json(indent=2))
            )
        return DesignResult(blueprint=bp, reviews=reviews, clarifications=clarifications)

    def critique(self, bp: Blueprint) -> dict:
        reply = self.llm.generate(
            f"{CHECKLIST}\n\n<blueprint>\n{bp.to_yaml()}\n</blueprint>",
            system=SYSTEM, tier="smart", temperature=0.0, json_mode=True,
        )
        return parse_json(reply)

    def _generate_valid(self, prompt: str) -> Blueprint:
        """Ask for a blueprint and feed validation errors back until it is valid (validate -> repair loop)."""
        raw = self.llm.generate(prompt, system=SYSTEM, tier="smart", temperature=0.4, json_mode=True)
        for attempt in range(self.max_repairs + 1):
            try:
                return Blueprint.model_validate(parse_json(raw))
            except (ValidationError, ValueError) as exc:  # json errors subclass ValueError
                if attempt == self.max_repairs:
                    raise RuntimeError(f"Architect could not produce a valid blueprint: {exc}") from exc
                raw = self.llm.generate(
                    REPAIR_PROMPT.format(errors=str(exc), blueprint=raw),
                    system=SYSTEM, tier="smart", temperature=0.0, json_mode=True,
                )
        raise AssertionError("unreachable")

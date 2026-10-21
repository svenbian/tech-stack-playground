"""The eval gym: run every test case through a blueprint, score it, and report what to fix next.

Training loop: `gym` -> read the weakest criterion and failures -> change ONE thing
in the blueprint -> `gym` again -> keep the change only if the score went up.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from statistics import mean

from .blueprint import Blueprint
from .judge import judge
from .llm import LLM
from .runner import bullets, run


@dataclass
class CaseResult:
    name: str
    output: str
    score: float
    verdict: dict
    error: str = ""


@dataclass
class GymReport:
    blueprint: str
    cases: list[CaseResult] = field(default_factory=list)

    @property
    def overall(self) -> float:
        scored = [c.score for c in self.cases if not c.error]
        return round(mean(scored), 2) if scored else 0.0

    def criterion_averages(self) -> dict[str, float]:
        totals: dict[str, list[float]] = {}
        for case in self.cases:
            for name, entry in case.verdict.get("scores", {}).items():
                totals.setdefault(name, []).append(float(entry.get("score", 0)))
        return {k: round(mean(v), 2) for k, v in totals.items()}

    def to_markdown(self) -> str:
        crit = self.criterion_averages()
        weakest = min(crit, key=crit.get) if crit else "n/a"
        lines = [
            f"# Gym report: {self.blueprint}",
            f"**Overall: {self.overall}/5** across {len(self.cases)} cases. Weakest criterion: **{weakest}**\n",
            "| Criterion | Avg |",
            "|---|---|",
            *[f"| {k} | {v} |" for k, v in sorted(crit.items(), key=lambda kv: kv[1])],
            "",
        ]
        for c in self.cases:
            lines.append(f"## {c.name}: {c.score}/5")
            if c.error:
                lines.append(f"ERROR: `{c.error}`\n")
                continue
            lines.append(f"Top fix: {c.verdict.get('top_fix', '')}\n")
            lines.append("```\n" + c.output.strip() + "\n```\n")
        return "\n".join(lines)


def train(bp: Blueprint, llm: LLM, out_dir: str | Path | None = None, verbose: bool = True) -> GymReport:
    if not bp.test_cases:
        raise ValueError("Blueprint has no test_cases; the gym needs them to measure anything")
    report = GymReport(blueprint=bp.name)
    for case in bp.test_cases:
        try:
            result = run(bp, llm, case.inputs, case.knobs)
            knobs = {k.name: k.default for k in bp.knobs} | case.knobs
            context = f"Mission: {bp.mission}\nInputs:\n" + bullets(f"{k}: {v}" for k, v in case.inputs.items())
            verdict = judge(llm, bp, result.output, context=context, knobs=knobs, expectations=case.expectations)
            report.cases.append(CaseResult(case.name, result.output, verdict.weighted, verdict.model_dump()))
        except Exception as exc:  # one broken case shouldn't hide the results of the rest
            report.cases.append(CaseResult(case.name, "", 0.0, {}, error=f"{type(exc).__name__}: {exc}"))
        if verbose:
            last = report.cases[-1]
            print(f"  {last.name}: {last.error or last.score}")

    if out_dir:
        out = Path(out_dir)
        out.mkdir(parents=True, exist_ok=True)
        (out / "gym_report.md").write_text(report.to_markdown(), encoding="utf-8")
        (out / "gym_report.json").write_text(
            json.dumps([c.__dict__ for c in report.cases], indent=2, ensure_ascii=False), encoding="utf-8"
        )
    return report

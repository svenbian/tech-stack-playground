"""Command line: python -m workflow_architect <command> ...

  design "<what you want>"            interview -> design -> review -> blueprint.yaml
  validate <blueprint.yaml>           check wiring without calling a model
  run <blueprint.yaml> -i k=v -k k=v  execute a blueprint once
  gym <blueprint.yaml>                run all test cases and write a scored report
  models                              list the Gemini models your key can use
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

from .blueprint import Blueprint


def pairs(items: list[str] | None) -> dict[str, str]:
    out = {}
    for item in items or []:
        key, sep, value = item.partition("=")
        if not sep:
            sys.exit(f"Expected key=value, got: {item}")
        out[key.strip()] = value
    return out


def slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", text.lower()).strip("_")[:40] or "workflow"


def get_llm():
    from .llm import GeminiLLM

    return GeminiLLM()


def cmd_design(args):
    from .architect import Architect

    architect = Architect(get_llm(), max_review_rounds=args.rounds)
    clarifications = ""
    if not args.no_interview:
        plan = architect.interview(args.request)
        answers = []
        print("A few questions first (press Enter to accept my assumption):")
        for question in plan.get("questions", []):
            answer = input(f"\n? {question}\n> ").strip()
            answers.append(f"Q: {question}\nA: {answer or '(no answer: use your default assumption)'}")
        assumptions = "\n".join(f"- {a}" for a in plan.get("default_assumptions", []))
        clarifications = "\n\n".join(answers) + f"\n\nDefault assumptions:\n{assumptions}"

    result = architect.design(args.request, clarifications)
    out_dir = Path(args.out or f"blueprints/{slug(result.blueprint.name)}")
    path = result.blueprint.save(out_dir / "blueprint.yaml")
    (out_dir / "design_reviews.json").write_text(json.dumps(result.reviews, indent=2), encoding="utf-8")
    print(f"\nBlueprint saved to {path}")
    print(f"Next: python -m workflow_architect gym {path}")


def cmd_validate(args):
    bp = Blueprint.load(args.blueprint)
    print(f"OK: '{bp.name}' ({bp.pattern.value}), {len(bp.steps)} steps, {len(bp.knobs)} knobs, "
          f"{len(bp.rubric)} rubric criteria, {len(bp.test_cases)} test cases")


def cmd_run(args):
    from .runner import run

    bp = Blueprint.load(args.blueprint)
    result = run(bp, get_llm(), pairs(args.input), pairs(args.knob), verbose=args.verbose)
    print(result.output)
    if args.trace:
        Path(args.trace).write_text(json.dumps(result.trace, indent=2, ensure_ascii=False), encoding="utf-8")


def cmd_gym(args):
    from .gym import train

    bp = Blueprint.load(args.blueprint)
    out_dir = args.out or str(Path(args.blueprint).parent / "gym")
    print(f"Training '{bp.name}' on {len(bp.test_cases)} cases...")
    report = train(bp, get_llm(), out_dir)
    print(f"\nOverall {report.overall}/5. Per criterion: {report.criterion_averages()}")
    print(f"Full report: {out_dir}/gym_report.md")


def cmd_models(_args):
    for name in get_llm().list_models():
        print(name)


def main(argv=None):
    parser = argparse.ArgumentParser(prog="workflow_architect", description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("design", help="design a new workflow blueprint")
    p.add_argument("request")
    p.add_argument("--out")
    p.add_argument("--rounds", type=int, default=2, help="max review/revise rounds")
    p.add_argument("--no-interview", action="store_true")
    p.set_defaults(func=cmd_design)

    p = sub.add_parser("validate", help="check a blueprint offline")
    p.add_argument("blueprint")
    p.set_defaults(func=cmd_validate)

    p = sub.add_parser("run", help="run a blueprint once")
    p.add_argument("blueprint")
    p.add_argument("-i", "--input", action="append", help="input as key=value (repeatable)")
    p.add_argument("-k", "--knob", action="append", help="knob as key=value (repeatable)")
    p.add_argument("--trace", help="write the full step trace to this JSON file")
    p.add_argument("-v", "--verbose", action="store_true")
    p.set_defaults(func=cmd_run)

    p = sub.add_parser("gym", help="score a blueprint on its test cases")
    p.add_argument("blueprint")
    p.add_argument("--out")
    p.set_defaults(func=cmd_gym)

    p = sub.add_parser("models", help="list available Gemini models")
    p.set_defaults(func=cmd_models)

    args = parser.parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main()

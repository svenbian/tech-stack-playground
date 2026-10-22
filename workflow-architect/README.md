# Gem Architect: a Claude Project that designs Gemini specialists

A Claude agent whose only job is designing **Gemini Gems and skills** that are experts at one task.
Ask it for, say, "a Gem that's elite at cold outreach emails but can change style when I ask". It
interviews you, writes a design brief, builds every file, reviews its own work against a checklist,
and hands you a ready-to-install package:

- **Gemini skill**: `SKILL.md` plus reference files. This is the primary format, because Google converts Gems to skills from **17 Nov 2026**.
- **Gem version**: Name, Description, Instructions and knowledge files, for use until then.
- **Test plan**: 6–8 test prompts plus a scoring rubric, to prove it's elite.
- **Install steps** for both.

You then test it in Gemini and paste results back. The architect diagnoses the weakest point and fixes one root cause at a time (the "manual gym").

## Set it up in Claude (about 3 minutes)
1. In claude.ai, go to **Projects → Create project**. Name it *Gem Architect*.
2. Open **Project instructions** and paste the whole of [`project/instructions.md`](project/instructions.md).
3. Under **Project knowledge**, upload all six files in [`project/knowledge/`](project/knowledge/).
4. Start a chat in the project: *"Make me a Gem that's elite at writing cold outreach emails, but flexible on style."*

## Or run it in Gemini, as a skill
The same architect is packaged as a Gemini skill in [`gemini-skill/skill-architect/`](gemini-skill/skill-architect/).
1. Download [`gemini-skill/skill-architect.zip`](gemini-skill/skill-architect.zip).
2. In Gemini, go to **Settings → Skills** and upload the ZIP.
3. In any chat, type `/skill-architect make me a skill that's elite at cold outreach emails`.

The skill delivers Gemini skills by default, and a Gem version only if you ask for one.

## How the architect works
```
Mode A: new build   intake (≤5 questions with defaults) → design brief → build files → self-review → deliver
Mode B: revise      change request → full updated files + one-line reason
Mode C: diagnose    pasted Gemini output → score vs rubric → root cause → fix one thing → rerun these tests
Mode D: questions   answers about agent, Gem and skill design
```

## What's in the knowledge files
| File | Purpose |
|---|---|
| `01_agent_design_principles.md` | The research: agent patterns (Anthropic, OpenAI, Google) translated into Gem/skill instructions; craft vs. style controls; evals |
| `02_gemini_platform_reference.md` | Gem and skill facts and limits, the Nov 2026 migration, what's unsupported |
| `03_output_templates.md` | Exact templates for SKILL.md, reference files, the Gem version, the test plan and install steps |
| `04_design_checklist.md` | The self-review every package must pass |
| `05_worked_example_cold_email.md` | A complete package that sets the quality bar (and is a cold-email skill you can install today) |
| `06_testing_and_iteration.md` | How testing in Gemini works, with a symptom → root cause → fix table |

## Keeping it current
Gemini's platform is changing fast. `02_gemini_platform_reference.md` was researched on 21 Oct 2026, and facts
marked ⚠️ come from secondary sources. When Google changes something, edit that file and re-upload it to the project.

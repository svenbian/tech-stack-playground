# Output templates

Use these exact structures for every package. Replace `<…>` placeholders and delete any guidance in *italics*.

---

## A. `SKILL.md` (primary deliverable)

````markdown
---
name: <lowercase-hyphen-name>
description: Use when <the user asks for X, or situation Y>. <What it produces in one clause>. Adapts <the main style controls> on request. Do not use for <near-miss task 1> or <near-miss task 2>.
---

# <Title>

## Role
You are <specific expert persona with credible experience>. Your job: <mission sentence>.

## What great looks like
- <success criterion 1>
- <success criterion 2>
- <…3–6 total>

## Craft principles (always apply, in every style)
1. <invariant expert principle, with the *why* in half a sentence>
2. <…5–8 total>

## Style controls
Defaults: <knob>=<default>, <knob>=<default>, …
The user can change any control at any time in plain words (e.g. "<example phrasing>"). Apply the change to everything after it until told otherwise.
- **<knob>**: <options or range>, default <default>
- **<knob>**: …
- **Voice sample** *(if relevant)*: if the user pastes an example of their own writing, match its rhythm, vocabulary and formality.
Precedence: explicit request in the latest message > earlier requests > defaults. Guardrails override all of them.

## Workflow
*Use the least elaborate flow that works (see `design-principles.md`, section 2).*
1. **Gather.** You need: <minimum required info>. If any is missing, ask for all of it in one short message. Optional but valuable: <optional info>.
2. **Analyse.** <what to work out before producing anything>. Read `<reference-file>.md` for <purpose>.
3. **Produce.** <how to create the output>. Follow the style controls exactly. Read `examples.md` for the quality bar.
4. **Self-check.** Before replying, check against `rubric.md` *(or inline list)*. Fix any failure silently.
5. **Deliver.** Output format:
   <exact format>
6. **Adjust.** When the user asks for changes, update only what they asked for, keep the craft principles, and re-run the self-check.

## Guardrails
- Never invent <facts / numbers / quotes / clients / results>. If something needed is missing, write `[NEEDS: …]` and tell the user.
- <domain-specific hard rules>
- You draft and the user decides and acts. Never claim to have sent, posted or submitted anything.

## Reference files
- `<file>.md`: <when to read it>
````

## B. Reference files
Keep each file focused on one purpose and written as plain Markdown. The usual set:
- `style-guide.md`: expanded craft guidance, do/don't pairs, banned phrases, and the vocabulary for each knob value.
- `examples.md`: 3–5 short, diverse exemplars, each labelled with its situation and knob settings, plus the line *"Illustrations of quality: never copy their content."* Optionally one bad example with an annotated critique.
- `rubric.md`: the self-check criteria with anchored 5/5 descriptions.
- *Domain-specific files where needed* (e.g. `frameworks.md`, `industry-notes.md`).

## C. Gem version (only if the user asks)
```text
Name: <Human-friendly name>
Description: <1 sentence>
Instructions:
<The SKILL.md body from "## Role" onward, unchanged, under ~4,000 characters.
 If it's longer, move material into knowledge files and reference them by filename.>
Knowledge files: <list the same reference files, 10 at most>
```

## D. Test plan

```markdown
# Test plan: <name>

## How to test
Run each prompt in a NEW chat with the skill (/<name>) or the Gem. Score the output 1–5 per rubric criterion. Paste any output scoring below 4 back to the Skill Architect with the test name.

## Rubric
| Criterion | 5/5 looks like | Weight |
|---|---|---|

## Test prompts
### T1 · typical
**Prompt:** <full realistic prompt with all the info>
**Expect:** <2–3 checkable behaviours>
### T2 · sparse information
### T3 · non-default style
### T4 · extreme style
### T5 · style change mid-chat (a 2-turn script)
### T6 · adversarial (e.g. asks it to fabricate)
### T7 · different sub-type of input
### T8 · edge case specific to the domain (optional)

## Pass bar
Elite = every test averages ≥ 4.5, with no criterion below 4 and no guardrail breaks.
```

## E. Install steps (include in every delivery)

```markdown
### As a Gemini skill (recommended: Gems convert to skills from 17 Nov 2026)
1. Save the files into a folder named `<name>/` (SKILL.md plus the reference .md files) and zip the folder.
2. Gemini → Settings → Skills → upload the ZIP (or create the skill manually and paste SKILL.md).
3. Use it by typing `/<name>` in a chat, or just ask naturally and Gemini will pick it up from the description.

### As a Gem (only if a Gem version was requested)
1. gemini.google.com → Gems → New Gem.
2. Paste the Name, Description and Instructions.
3. Upload the reference files under Knowledge.
4. Run test T1 in the preview pane, then save.
```

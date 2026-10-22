# Gemini platform reference: Gems and skills

*Researched 21 October 2026. Google is changing this quickly. Where a fact is marked ⚠️, tell the user to confirm it in the Gemini app.*

## The big change: Gems → skills
- Google announced (late September 2026) that **skills replace Gems** in the Gemini app.
- **Conversion starts 17 November 2026.** Existing Gems are converted to skills automatically, and Gems keep working until then.
- ⚠️ For Workspace (work/school) accounts, reports say Gems move into Settings on 17 Nov and stop no sooner than **1 March 2027** (education accounts: no sooner than 1 June 2027). Personal accounts: "November 2026".
- **So: design for skills.** Provide a Gem version only when the user asks (e.g. Workspace accounts that still use Gems).

## Gemini skills
**Format:** the open **`SKILL.md`** standard, a folder with:
```
skill-name/
├── SKILL.md          ← required: YAML frontmatter + instructions
└── *.md / *.txt      ← optional reference files
```
`SKILL.md` structure:
```markdown
---
name: cold-outreach-email
description: Use when ... Do not use when ...
---
# instructions in Markdown
```

**Rules and limits:**
- `name`: **lowercase with hyphens** (e.g. `cold-outreach-email`). Make the folder name match.
- `description`: up to **1,024 characters**. Gemini uses it to decide when to apply the skill automatically, so it's the most important line. Start with "Use when…", name the trigger situations, and name 1–2 situations where it should **not** be used.
- Files: plain text, Markdown, PDF and images are fine. **Binary formats (.docx, .doc, .xlsx) are not supported.** Use Markdown for reference files.
- ⚠️ About **100 MB per skill** upload; you can have any number, but only about **100 enabled at once**.
- **Scripts that call external websites won't work**, so instruction-only skills are the safe design.
- ⚠️ Not yet supported in skills: most Gem tools (Canvas, Deep Research, Guided Learning, video/music generation), **sharing skills**, and **attaching Drive files**.

**Using a skill:** type `/` plus the skill name in the prompt bar, or let Gemini apply it automatically when the description matches. **Several skills can be combined in one prompt.**

**Creating a skill:** Settings → Skills. You can write it manually, upload a `SKILL.md` or a **ZIP of the folder**, start from a template, or have Gemini draft it in chat.

**Writing instructions for skills:**
- Reference files are loaded when relevant, so in `SKILL.md`, say **when** to read each file (e.g. "Before drafting, read `style-guide.md`").
- Because skills can combine with other skills and with a normal chat, the instructions should **not assume they own the whole conversation**. Scope them to the task the description names.

## Gems (legacy, still valid until conversion)
Create at gemini.google.com → **Gems** → **New Gem**. Fields:
- **Name**
- **Description** (short)
- **Instructions**: the system prompt. ⚠️ The limit isn't officially documented and sources conflict (1,024 to ~4,000+ characters). **Design the core instructions to stay under ~4,000 characters** and move detail into knowledge files.
- **Knowledge**: ⚠️ up to **10 files** (about 100 MB each). Use Markdown or PDF.
- Google's recommended instruction structure: **Persona · Task · Context · Format**.
- There's a "use Gemini to rewrite instructions" helper. Tell users **not** to use it on architect-built instructions, since it tends to make them generic.
- Test in the Gem preview pane before saving.

## Design implications
1. One instruction body serves both formats. The skill version adds frontmatter, and the Gem version pastes the body into Instructions.
2. Keep core instructions ≤ ~4,000 characters. Put the rest in ≤ 9 reference files, leaving room under the 10-file Gem limit.
3. No external calls, no reliance on Canvas or Deep Research, and no reliance on the user's Drive files.
4. The user supplies research by pasting it into the chat, so the instructions should ask for it.

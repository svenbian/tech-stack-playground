# Agent design principles (for Gemini Gems and skills)

The research behind how the Skill Architect designs. A Gem or skill is a **single assistant inside one conversation**: it has no code, no loops and no separate model calls. So the classic agent patterns have to be expressed as *instructions*. This file explains each principle and how it translates.

---

## 1. Start from the outcome
Pin down the mission, the observable success criteria and the non-goals before writing any instruction. If you can't check a criterion, it isn't one. Non-goals stop scope creep, which is the main reason specialist assistants decay into generic ones.

## 2. Use the least elaborate design that works
Anthropic's *Building Effective Agents* (Dec 2024) describes a ladder: single prompt → prompt chaining → routing → parallelisation → orchestrator-workers → evaluator-optimizer → autonomous agent. The advice is to climb only as far as you must. Inside a Gem or skill, each rung becomes an instruction pattern:

| Classic pattern | How it looks inside Gem/skill instructions | Use it when |
|---|---|---|
| Single prompt | One clear task description plus the output format | The job is one step and well defined |
| **Prompt chaining** | Named **stages** the assistant moves through: "1. Gather → 2. Analyse → 3. Draft → 4. Check → 5. Deliver" | The job has natural sub-steps and skipping one causes failures (e.g. writing before analysing the recipient) |
| **Routing** | "First identify which kind of request this is: A, B or C. For A… for B…" | Inputs fall into types that need different handling |
| Parallelisation (voting/variants) | "Offer 2–3 distinct variants with a one-line rationale each" | The user benefits from choice, or quality varies run to run |
| **Evaluator-optimizer** | A **self-check stage**: "Before replying, check the draft against these criteria and fix any failure" | Quality matters and the criteria are concrete |
| Orchestrator / autonomous agent | Usually **not available**: there are no tools or loops you control. Split the work into several skills instead | Rarely. Prefer splitting |

Heuristics:
- Can you list the steps in advance? Then use stages (chaining).
- Do request types differ? Then route at the top of the instructions.
- An evaluator step with **vague** criteria only adds length. Make the check concrete.
- Chaining and routing are the easiest to debug, so prefer them.

## 3. Separate craft from style: how "elite *and* flexible" works
- **Craft principles** are the invariant expertise that holds whatever the tone (for cold email: relevance to the recipient, one clear ask, brevity, truthful proof). They are the specialist knowledge, so research them properly.
- **Style controls (knobs)** are everything a user may want to vary (tone, length, format, formality, language, persona, a voice sample). Each has a **default** and a way to change it in chat (e.g. "say 'casual' or 'shorter' at any time").
- **Precedence rule.** Always state it: the user's explicit style request in the current message overrides knob defaults, and **guardrails override everything**.
- A style change alters knobs and never the craft. The test plan checks that quality holds *across* styles, not just at the default.

## 4. Context engineering for instructions
From Anthropic's *Effective Context Engineering for AI Agents* (2025) and Google's Gem guidance:
- **Right altitude.** Avoid both brittle if/else rule lists and vague adjectives ("be compelling"). Give the goal, the reasoning, and the shape of a great answer.
- **Persona · Task · Context · Format.** This is Google's recommended Gem structure. Cover all four, but the persona should be a specific expert ("a B2B outbound specialist who has written 10,000 cold emails"), not "a helpful assistant".
- **Core instructions stay short; detail lives in files.** Long instructions dilute attention ("lost in the middle"). Put style guides, exemplar libraries and rubrics in reference files, and tell the instructions *when* to consult each.
- **Few-shot beats rules for style.** 2–3 short, *diverse* exemplars, labelled "illustrations, don't copy".
- **Explicit hand-offs between stages.** E.g. "Before drafting, write a 3-line plan: angle, opener, ask" (optionally shown to the user via a knob).
- **Ask, don't guess.** Tell the assistant what minimum information it needs and to ask for it in one message when it's missing.

## 5. Guardrails
From OpenAI's *A Practical Guide to Building Agents* (2025) and Google's *Agents* whitepaper (2024):
- Use layered guardrails: input expectations, output checks (length, format, banned phrases) and honesty rules.
- **No fabrication.** Facts, numbers, quotes, clients and results come only from what the user provides. Gaps are flagged ("[NEEDS: a real result you've achieved]").
- **Humans act.** The assistant drafts and the human sends, posts or pays.
- Refuse manipulative or deceptive tactics (fake urgency, fake "Re:" subjects, impersonation).

## 6. Evals: how "elite" is proven
From Hamel Husain's eval writing, Anthropic's eval guidance and the DSPy research:
- Define the rubric **before** tuning. Each criterion gets an anchored 5/5 description.
- Use 6–8 test prompts that span typical, sparse-info, non-default style, extreme style, mid-chat style change, adversarial and other-subtype cases.
- **Read the outputs.** Scores hide failure modes.
- **Change one thing at a time**, rerun the same prompts, and keep the change only if it helps without breaking other cases. That loop is the "gym".

## 7. Small and composable
From *12-Factor Agents* (HumanLayer, 2025): small focused agents beat one giant one. Gemini skills can be **combined in one prompt**, so a "cold email" skill and a "company research summary" skill are better than one mega-skill. When a request spans distinct jobs, recommend splitting it.

---
## Sources
- Anthropic, *Building Effective Agents* (2024); *Effective Context Engineering for AI Agents* (2025)
- OpenAI, *A Practical Guide to Building Agents* (2025)
- Google, *Agents* whitepaper (2024); Google's Gem prompting guidance (persona, task, context, format)
- HumanLayer, *12-Factor Agents* (2025)
- Hamel Husain, *Your AI Product Needs Evals*

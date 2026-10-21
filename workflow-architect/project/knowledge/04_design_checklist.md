# Design checklist: run before every delivery

Review your own package like a skeptical principal engineer would. Fix every "no" before delivering.

## Purpose
- [ ] Is the mission one clear sentence that names who, what, and what "great" means?
- [ ] Are the success criteria observable? Could two people agree on whether an output meets them?
- [ ] Do non-goals rule out the nearest tempting scope creep?

## Expertise
- [ ] Would a domain expert endorse the craft principles as *non-obvious and correct*? Is each one specific (no "be clear", "be engaging")?
- [ ] Is each principle explained with its *why*, so the model can generalise?
- [ ] Are there 2–5 diverse exemplars, labelled as illustrations?

## Flexibility
- [ ] Is everything a user would plausibly want to vary exposed as a style control with a default?
- [ ] Can each control be changed in plain words mid-chat, and is the precedence rule stated?
- [ ] Do the craft principles survive at extreme settings (ultra-short, very casual, another language)?

## Workflow
- [ ] Is it the least elaborate flow that works? Does every stage prevent a real failure?
- [ ] Does the assistant ask for missing required info in **one** message instead of guessing?
- [ ] Is there a concrete self-check stage tied to the rubric?
- [ ] Is the output format exact?
- [ ] Is the "Adjust" stage clear about changing only what was asked?

## Honesty and safety
- [ ] Is fabrication of facts, numbers, quotes, clients and results explicitly banned, with a `[NEEDS: …]` convention for gaps?
- [ ] Are deceptive or manipulative tactics in this domain named and banned?
- [ ] Does the human take every irreversible action?

## Platform fit (see 02)
- [ ] Is `name` lowercase-hyphen? Is `description` ≤1,024 characters, starting "Use when…", with "Do not use for…"?
- [ ] Are the core instructions ≤ ~4,000 characters, with long material in reference files that are each referenced with *when* to read them?
- [ ] Are there 10 or fewer files, with no .docx/.xlsx, no external calls, and no dependence on Canvas, Deep Research or Drive?
- [ ] Do the instructions avoid assuming they own the whole chat (skills can be combined)?

## Testability
- [ ] Does the rubric have 4–7 criteria with anchored 5/5 descriptions, including style adherence and honesty?
- [ ] Do the 6–8 test prompts cover typical, sparse, non-default style, extreme style, mid-chat change, adversarial and other-subtype cases, each with checkable expectations?
- [ ] Is every test prompt complete and realistic enough to paste straight into Gemini?

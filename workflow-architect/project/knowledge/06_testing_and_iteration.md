# Testing and iteration: the manual gym

There's no code harness. The user runs test prompts in Gemini and brings results back. Your job in **Mode C** is to turn those results into the single most valuable fix.

## What the user does
1. Run each test prompt from the test plan in a **fresh** chat (so earlier turns don't leak in).
2. Score each output 1–5 per rubric criterion. A rough score is fine.
3. Paste back the test name, the full output, and their scores or complaint.

## What you do
1. **Score it yourself** against the rubric, quoting the output as evidence. If you and the user disagree, say so: either the rubric is unclear or the user's taste differs, and either way the rubric needs updating.
2. **Find the weakest criterion.** Fix the lowest score first, and any guardrail break before everything else.
3. **Find the root cause** in the instructions. Typical causes:

| Symptom | Likely cause | Typical fix |
|---|---|---|
| Generic, could-be-anyone output | The craft principle is vague, or the workflow skips analysis | Make the principle concrete and add or strengthen the Analyse stage |
| Ignores a style request | The knob is not referenced in the Produce stage, or there's no precedence rule | Name the knob explicitly in Produce and state precedence |
| Style is right but quality drops | Craft and style are tangled in one rule | Split it into a craft principle plus a knob |
| Invents facts | The guardrail is buried, or there's no `[NEEDS:]` convention | Move it up, make it explicit, and add an example of flagging a gap |
| Copies exemplar wording | The exemplars are too similar, or not labelled as illustrations | Diversify them and add "never copy content" |
| Too long or wordy | The length knob is vague | Give word ranges, plus "cut any sentence that doesn't earn its place" |
| Asks too many questions | The minimum required info isn't defined | List the minimum and say "otherwise proceed with stated assumptions" |
| Skill triggers when it shouldn't (or doesn't when it should) | The `description` is too broad or too narrow | Rewrite the "Use when… / Do not use for…" lines |
| Inconsistent across runs | The instructions are ambiguous, or the format isn't exact | Pin down the output format and add one more exemplar |

4. **Change one thing.** Make the smallest edit that fixes the root cause. Several edits at once make it impossible to tell what worked.
5. **Deliver** the full revised file(s), a one-line explanation, and **which tests to rerun**: the failing one plus one that previously passed, to catch regressions.

## When it's "elite"
Every test averages ≥ 4.5, no criterion is below 4, and no guardrail breaks. After that, add a new test whenever real usage reveals a new failure, so the test plan grows with the assistant.

Review the blueprint below as a skeptical principal engineer. Check each item and report only real problems.

1. **Mission & criteria**: Is the mission one clear sentence? Are the success criteria observable and checkable?
2. **Craft vs knobs**: Are the domain's invariant expert principles captured in `craft_principles`? Is everything a user might want to vary exposed as a knob with a good default? Are the knobs actually referenced in the writing prompts?
3. **Pattern fit**: Is this the least autonomous pattern that meets the criteria? Does every step earn its cost? Is any step redundant or missing (e.g. no analysis before writing, no refine on a quality-critical deliverable)?
4. **Context per step**: Does each prompt get what it needs and nothing more? Is the altitude right (goal + reasoning + shape of a great answer, not vague adjectives or brittle rule lists)? Is there an exemplar where style matters?
5. **Wiring**: Do placeholders only reference earlier outputs, inputs, knobs or built-ins? Do route labels match the `when` conditions exactly? Is `final_output` correct?
6. **Rubric**: Does each criterion describe a concrete 5/5? Is there a knob-adherence criterion? Would this rubric separate a good output from a great one?
7. **Test cases**: Are there 5–8 cases covering typical, sparse-info, non-default knobs, extreme knobs, adversarial and different sub-type inputs, each with concrete expectations?
8. **Guardrails**: Are there rules against fabrication and deception, and is missing information flagged rather than invented? Are irreversible actions left to a human?

Return JSON:
{"pass": true/false, "score": 1-10, "issues": [{"severity": "high|medium|low", "area": "<checklist area>", "issue": "<what is wrong>", "fix": "<specific change>"}]}
Set "pass" to true only if there are no high-severity issues and score >= 8.

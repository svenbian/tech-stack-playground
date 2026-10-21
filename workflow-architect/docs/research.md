# What the research says about building agents

These are the principles the Workflow Architect follows. Every rule in
`prompts/architect_system.md` and `prompts/design_checklist.md` comes from
something on this page. Read this one first if you want to understand *why* the
architect designs things the way it does.

---

## 1. "Workflow" vs "agent": know which one you are building

Anthropic's *Building Effective Agents* (Dec 2024) draws the line people now use
across the industry:

- **Workflow**: LLM calls wired together through *predefined code paths*. You
  decide the steps; the model fills them in.
- **Agent**: the LLM *decides its own steps* and tool calls in a loop until it
  thinks it is done.

Workflows are predictable, cheap, and easy to debug. Agents are flexible but
cost more and fail in harder-to-see ways. **The advice is to use the simplest
thing that works.** Start with one good prompt, move to a workflow when one
prompt is not enough, and use an agent loop only when the steps truly cannot
be known in advance.

> Architect rule: always justify the pattern. Prefer the least autonomous
> design that meets the success criteria.

## 2. The six building-block patterns

All of these come from the same Anthropic guide. Spring AI, LangGraph, Google
ADK and others implement the same set under different names.

| Pattern | Shape | Use it when |
|---|---|---|
| **Prompt chaining** | A → B → C, each step's output feeds the next | The task splits cleanly into fixed sub-steps (research → draft → polish). Add code "gates" between steps to check them. |
| **Routing** | Classify first, then send to a specialised branch | Inputs fall into distinct categories that each need different handling (e.g. a cold email to a CTO vs. to a recruiter). |
| **Parallelisation** | Several calls at once, then merge (*sectioning*), or the same call N times then vote (*voting*) | Independent sub-tasks, or you need confidence from several attempts. |
| **Orchestrator-workers** | One LLM plans sub-tasks at runtime and hands them to workers | You can't know the sub-tasks in advance (e.g. "research this company", which needs a different number of searches each time). |
| **Evaluator-optimizer** | A generator drafts, an evaluator critiques against criteria, and the loop repeats | **Clear evaluation criteria exist** and iterating measurably helps. This is the core of an "elite" writing workflow. |
| **Autonomous agent** | LLM + tools in a loop, with environment feedback | Open-ended problems, many steps, and you trust the tools and guardrails. |

Pattern-choice heuristics:
- Can you list the steps before the task starts? → **chain**.
- Can't list them? → **orchestrator-workers** or an **agent**.
- Chaining and routing are easiest to trace, so prefer them for high-stakes work.
- An evaluator loop with *vague* criteria only adds cost. The rubric must be concrete.

## 3. Context engineering: what the model sees is what you get

Anthropic's *Effective Context Engineering for AI Agents* (2025) and many
practitioner guides (Mastra, Sourcegraph and others) agree on these points:

- **Context is a finite budget.** More tokens are not free. Models lose
  details buried in the middle of long contexts ("lost in the middle").
  Give each step **only what it needs**.
- **Right altitude for prompts.** Avoid both brittle if/else rule lists and
  vague "be great" instructions. Give the model the *goal*, the *reasoning*,
  and a few *strong examples*.
- **Few-shot examples beat long rule lists** for style. Pick a small,
  *diverse* set of canonical examples rather than a pile of edge cases.
- **Structured hand-offs.** Steps pass named, structured outputs (JSON or
  clearly delimited sections), not loose prose.
- **Make context observable.** Log exactly what entered every call so failures
  can be debugged. The runner in this repo keeps a full `trace`.

## 4. Tools and guardrails

From OpenAI's *A Practical Guide to Building Agents* (2025) and Google's
*Agents* whitepaper (2024):

- An agent is **model + instructions + tools**. Keep each one clean.
- **Fewer tools per step** gives more reliable steps. Write tool descriptions
  as carefully as prompts.
- **Layered guardrails.** Use input checks, output checks (format, length,
  banned claims) and human approval for risky or irreversible actions such as
  *sending* an email.
- **Human-in-the-loop** wherever a mistake is expensive or public.

## 5. Own your control flow (12-Factor Agents, HumanLayer, 2025)

- Own your prompts and your control flow. Don't hide them inside a framework.
- Treat the LLM as a function from **structured input to structured output**.
- Small, focused agents beat one giant agent.
- State should be explicit and serialisable, so you can pause, resume and replay.

> This is why blueprints here are plain YAML files you can read and diff, and
> the runner is about 200 lines of plain Python.

## 6. Evals are the engine of "elite" (the "gym")

From Hamel Husain's eval writing, Anthropic's eval guidance and the
DSPy/prompt-optimisation research:

- **You can't improve what you don't measure.** Define success criteria
  *before* writing prompts.
- **Write test cases early**, including edge cases and adversarial ones
  (missing info, hostile tone requests, weird inputs).
- **LLM-as-judge works when the rubric is specific.** Use per-criterion scores
  with anchored descriptions ("5 = names a specific, verifiable detail about
  the prospect") rather than "rate quality 1–10".
- **Look at the data.** Read real outputs and failures. Scores alone hide
  failure modes.
- **Iterate in a loop:** run evals → find the weakest criterion → change *one*
  thing → re-run. That loop is the gym.

## 7. Flexibility without losing quality: knobs

The goal here, "elite at cold email but able to change style when I ask",
maps onto a well-known approach. Separate the **invariant craft** (what makes
any cold email work: relevance, brevity, one clear ask) from the
**variable style** (tone, length, formality, humour). Expose the variable part
as named **knobs** with sensible defaults. A style request changes knob values
and leaves the craft rules alone. The evals then check that quality holds
*across* knob settings, not just at the default.

---

## Sources

- Anthropic, *Building Effective Agents* (Dec 2024): anthropic.com/engineering/building-effective-agents (summary: https://simonwillison.net/2024/Dec/20/building-effective-agents)
- Anthropic, *Effective Context Engineering for AI Agents* (2025)
- OpenAI, *A Practical Guide to Building Agents* (2025)
- Google, *Agents* whitepaper (2024), and the Gemini API docs: https://ai.google.dev/api
- HumanLayer, *12-Factor Agents* (2025): github.com/humanlayer/12-factor-agents
- Hamel Husain, *Your AI Product Needs Evals*, and related writing on LLM-as-judge
- Pattern write-ups: https://huggingface.co/blog/dcarpintero/design-patterns-for-building-agentic-workflows, https://spring.io/blog/2025/01/21/spring-ai-agentic-patterns
- Context engineering: https://mastra.ai/articles/context-engineering, https://sourcegraph.com/blog/context-engineering

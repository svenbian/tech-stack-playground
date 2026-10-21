# Workflow Architect

An agent whose one job is **designing workflows for other agents**. You describe a capability
("elite at cold outreach emails, but able to change style when I ask"). It interviews you,
designs a **Blueprint**, reviews its own design against a principal-engineer checklist, and hands
you a YAML file you can **run** and **train in a gym** (score against test cases) on Gemini.

```
 your request
     │
     ▼
 ┌────────────┐   ┌─────────┐   ┌──────────────────┐   ┌────────────────────┐
 │ interview  │──▶│  draft  │──▶│ validate/repair  │──▶│ critique ⇄ revise  │──▶ blueprint.yaml
 └────────────┘   └─────────┘   └──────────────────┘   └────────────────────┘
                                                                  │
                    run (one email) ◀─────────────────────────────┤
                    gym (score all test cases, find weakest criterion) ◀┘
```

## Why it is built this way
Every design rule is backed by research. See [`docs/research.md`](docs/research.md), the best place
to start learning. In short:

- **Least autonomy that works**: single prompt → chain → routing → evaluator loop. Each step must earn its cost.
- **Craft vs. knobs**: invariant expertise (`craft_principles`) is kept apart from adjustable style (`knobs`).
  That split is what makes a workflow *elite and flexible*.
- **Context engineering**: each step sees only what it needs, through `{{placeholders}}`.
- **Evals first**: every blueprint ships with a rubric and test cases. "Elite" is a score you measure.
- **Own your control flow**: plain YAML and ~800 lines of readable Python, no framework.

## Layout
| Path | What it is |
|---|---|
| `prompts/architect_system.md` | The architect's brain. You can also paste it into a Gemini Gem or AI Studio as-is. |
| `prompts/design_checklist.md` | The rubric the architect uses to critique its own designs. |
| `workflow_architect/blueprint.py` | The Blueprint schema, plus wiring validation (catches undefined placeholders). |
| `workflow_architect/architect.py` | interview → draft → repair → critique → revise loop. |
| `workflow_architect/runner.py` | Executes blueprints (`generate`, `route`, `refine` steps) with a full trace. |
| `workflow_architect/judge.py` | LLM-as-judge with per-criterion scores. |
| `workflow_architect/gym.py` | Runs all test cases and writes a scored report. |
| `workflow_architect/llm.py` | Gemini client plus a scripted fake for offline tests. Swap providers here. |
| `examples/cold_email.yaml` | Reference blueprint: the quality bar the architect imitates. |

## Setup
```bash
cd workflow-architect
pip install -r requirements.txt
export GEMINI_API_KEY=...            # from https://aistudio.google.com/apikey
python -m workflow_architect models  # confirm model ids, then optionally:
export WA_SMART_MODEL=gemini-3-pro-preview WA_FAST_MODEL=gemini-3-flash-preview
```

## Use it
```bash
# 1. Design a new workflow (asks you a few questions first)
python -m workflow_architect design "An agent that is elite at writing LinkedIn posts for B2B founders"

# 2. Check it (offline)
python -m workflow_architect validate blueprints/<name>/blueprint.yaml

# 3. Run it once, changing style through knobs
python -m workflow_architect run examples/cold_email.yaml \
  -i sender_context="I build Slack bots; 40 teams use my on-call bot" \
  -i recipient="Sam Lee, EM at Driftwood" -i goal="try the free beta" \
  -k tone=playful -k style_instructions="no exclamation marks" --trace trace.json

# 4. Train it in the gym
python -m workflow_architect gym examples/cold_email.yaml
```

### The gym loop (how a workflow becomes elite)
1. Run `gym` and open `gym/gym_report.md`. Find the **weakest criterion** and *read the actual outputs*.
2. Change **one thing** in the blueprint: a prompt, an exemplar, a craft principle, or a step.
3. Run `gym` again. Keep the change only if the score rose without breaking other cases.
4. When real usage shows a new failure, add it as a test case.

## Tests
```bash
python -m pytest -q   # offline, uses a scripted fake model
```

## Next steps
- **Gemini gym project**: point your cold-email project at `examples/cold_email.yaml` (or a freshly
  designed blueprint) and iterate with the gym loop.
- Possible extensions: parallel/voting steps, tool calls (web research), automatic prompt
  optimisation that proposes the "change one thing" step itself.

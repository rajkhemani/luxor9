---
name: interview-me
description: >-
  Luxor9 chat skill adapted from Addy Osmani's interview-me pattern.
  Asks developers one question at a time (with a guess) until configurable
  confidence and confirmation gates pass. Blocks blueprint/automation creation
  until intent is confirmed. First live category: b2b_real_estate.
---

# Interview Me (Luxor9)

## Overview

Before Luxor9 drafts a governed blueprint or runs CMO automation, the chat engine
must understand the developer's problem. This skill closes the gap between what
was asked and what is actually wanted — one question at a time.

Pattern credit: [addyosmani/agent-skills · interview-me](https://github.com/addyosmani/agent-skills/tree/main/skills/interview-me).

## Guardrails (caller-configurable)

Pass via chat `context.interview_guardrails`:

| Key | Default | Meaning |
|---|---|---|
| `enabled` | `true` | Master switch |
| `min_questions` | `3` | Floor before restate/automation |
| `confidence_threshold` | `95` | Confidence % required to offer restate |
| `require_explicit_yes` | `true` | Must confirm restate before blueprint |
| `category` | `b2b_real_estate` | Question template pack |
| `max_questions` | `12` | Soft stop / force restate |

## Demo behaviour

1. Developer states a problem in chat.
2. Agent replies with `HYPOTHESIS` + `CONFIDENCE` + one `Q`/`GUESS`.
3. No blueprint exists (`workflow.status = draft`).
4. After gates pass, agent restates intent and waits for **yes**.
5. Only then is a blueprint proposed (`awaiting_blueprint_approval`).

## Category templates

- **Live:** `b2b_real_estate`
- **Roadmap stubs:** `hospitality`, `financial_services`

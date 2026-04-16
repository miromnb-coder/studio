# Kivo Personal Memory Intelligence (Phase 5)

## Memory model (typed)
Kivo stores selective, high-signal memory records in `public.memory` using `type` as a category.

Categories:
- `profile`
- `goals`
- `projects`
- `preferences`
- `decisions`
- `routines`
- `blockers`
- `opportunities`
- `unfinished_items`

Legacy-compatible categories still supported:
- `preference`, `fact`, `goal`, `finance`, `other`

## Memory write policy
Kivo does **not** store everything.

It stores only candidates that pass all conditions:
1. Meaningful signal (`>= 14` chars)
2. High confidence (`>= 0.80`)
3. Not casual chatter (greetings / low-value one-offs)
4. Not sensitive noise (passwords, OTP, card details, etc.)
5. Not duplicates in recent category history

Write flow:
- Extract candidates from user input + assistant synthesis.
- Apply category-specific rules.
- Persist max 4 candidates per turn.

## Retrieval intelligence
When retrieving memory for a prompt:
- Kivo infers relevant categories from query intent.
- Retrieval uses semantic token overlap + recency + type affinity.
- Only top relevant records are included in prompt context.

Examples:
- Money queries boost `goals`, `finance`, `blockers`, `opportunities`.
- Build/app queries boost `projects`, `unfinished_items`, `decisions`.
- Planning queries boost `routines`, `unfinished_items`, `goals`.

## UX controls
New controls are provided via `/memory` and `/api/memory`:
- Inspect memory list
- Filter by category
- Search
- Edit single item
- Delete single item
- Clear category or clear all

## Analytics
Memory usefulness metrics (client analytics events):
- `memory_used_in_response`
- `memory_resume_action_clicked`
- `memory_task_resumed_completed` (reserved)
- `memory_problem_resolution_accelerated` (reserved)

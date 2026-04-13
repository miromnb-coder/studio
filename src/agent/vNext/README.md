# Agent vNext Scaffold

This folder contains an isolated, non-breaking scaffold for a future operator-grade agent engine.

## Architecture Layers

1. **router.ts**: classifies incoming requests into high-level intents.
2. **planner.ts**: creates a deterministic execution plan with dependency-aware steps.
3. **memory.ts**: fetches, ranks, and formats memory context.
4. **tools.ts**: registry + execution contract for tool adapters.
5. **generator.ts**: synthesizes the final answer (sync + stream scaffold).
6. **evaluator.ts**: scores execution quality and suggests retries/fallbacks.
7. **orchestrator.ts**: composes the full request lifecycle end-to-end.

## File Responsibilities

- `types.ts`: core shared types and contracts.
- `constants.ts`: defaults, limits, labels, supported intents/tools.
- `schemas.ts`: zod schemas for request/plan/tool/response validation.
- `prompts.ts`: prompt builders for future model-driven routing/planning/generation.
- `streaming.ts`: event helpers for stream lifecycle instrumentation.
- `errors.ts`: error classes and normalization helpers.
- `logger.ts`: lightweight structured logger.
- `utils.ts`: generic helper functions.
- `test-data.ts`: sample request object for local development.
- `index.ts`: barrel exports for public API surface.

## Future Integration Path

- Plug real provider adapters into `tools.ts` first.
- Integrate existing memory/history stores into `memory.ts`.
- Swap deterministic router/planner logic with model-driven strategies.
- Wire `runAgentVNext` into a protected API route behind a feature flag.

## Migration Guidance (Later)

- Keep current agent system as primary runtime while validating vNext.
- Add side-by-side telemetry for intent, step success, and latency.
- Migrate specific intents incrementally (e.g., `research` then `email`).

# PR 1 — Memory & Mastery foundation

This is an additive, non-persisted foundation. It does not change the current React UI, lesson IDs, existing V1 `linux-path-progress-v1` storage, imports, exports, or review scheduler.

## Registry
`src/curriculum/competencies.ts` defines 13 stable competencies covering all 12 current lessons. Prerequisites form an acyclic graph. The registry is re-exported by `src/lessons.ts` for curriculum integration.

## Engine
`src/mastery/engine.ts` records immutable, idempotent attempts. Proficiency requires independent practical evidence and delayed independent recall (at least 24 hours between evidence events). Hints and guided work do not qualify. `statusAt` identifies due proficiency reviews without mutating records.

`src/mastery/scheduler.ts` is a preliminary deterministic heuristic: incorrect = 10-minute retry, correct with hints/guided = next day, independent success = 2 days then doubling to 30 days. It is **not** the existing production scheduler and is not claimed to be scientifically optimal.

## Future PR requirements
- Introduce a validated V2 schema and migration without overwriting V1 data.
- Bound and validate attempt history before persistence.
- Add evidence-specific activity IDs and richer scoring for scenario assessments.
- Integrate the engine behind a feature flag only after migration tests.
- Preserve the existing simulator sandbox and its independent task validation.

## Verification
Run `npm ci`, `npm test`, `npm run build`, and `npm run test:browser`. No deployment is part of this PR.

# PR 3 — Non-destructive progress migration

This PR adds `src/migration/progressV2.ts` without wiring it into `src/App.tsx`. The live app continues to read and write `linux-path-progress-v1` as before.

## Migration contract
- Read and fully validate the existing V1 JSON.
- Copy it into the `legacy` field of the `original-learner` profile in V2, preserving preferences, lesson completion, independent challenges, counts, and exact due timestamps.
- Initialize competency mastery as empty/unassessed; never infer mastery from V1 lesson completion.
- Write and verify a staging record at `linux-path-progress-v2-staging`, then write and verify `linux-path-progress-v2`.
- Never remove or rewrite the original V1 key.
- If a V2 record already exists, validate and use it; never replace it with older V1 data.
- If a write fails or data is corrupt, return an explicit warning and do not claim success.

## Integration constraints for PR 4
- This module is currently opt-in only; calling `loadOrMigrateV2` is not yet part of app startup.
- Before enabling V2 in the UI, implement explicit recovery/export UX, profile isolation, and version-aware import/export.
- LocalStorage is not transactional: the V1 backup is retained, and staging may remain after a failed migration. Do not treat staging alone as an authoritative completed migration.
- For production, validate import size and consider bounded, compact mastery history before profiles become active.
- V1 must remain readable until migration has been proven on deployed browsers.

## Verification
`npm ci && npm test && npm run build && npm run test:browser`

Do not merge or deploy as part of this PR.

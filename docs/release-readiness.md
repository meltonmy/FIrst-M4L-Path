# Release readiness — stacked PRs 1–12

**Status: draft only. Do not merge or deploy until all gates are satisfied.**

## Automated gates (required for each head SHA)
1. GitHub Actions `npm ci` succeeds.
2. Vitest `npm test` succeeds.
3. TypeScript and production/offline build `npm run build` succeeds.
4. Playwright `npm run test:browser` succeeds.
5. Inspect final workflow logs, not only the GitHub PR badge. Confirm all jobs completed on the current head SHA.

## Manual browser acceptance (before any merge)
- Open with genuine pre-existing V1 progress; export V1 JSON first.
- Complete a lesson while V1-only and reload; confirm no V2 key appears.
- Explicitly activate V2 profiles; confirm original V1 key is byte-for-byte unchanged.
- Create a kids profile and an adult profile. Complete different lessons and quizzes; reload and switch back and forth; verify completion, settings and mastery never leak.
- Use guided practice and independent practical challenge; verify mastery is not immediately proficient. Test delayed independent recall.
- Verify due review queue and skill tree; placement must not award mastery.
- Export full backup, restore it on a clean browser, and confirm all profiles and review dates.
- Test invalid/truncated backup, quota errors, unavailable storage and interrupted restore. Verify no silent data reset.
- Test 390px mobile layout, keyboard-only operation, screen-reader labels, reduced motion, offline reload and browser history navigation.
- Confirm the simulator never executes arbitrary shell commands.

## Known limitations
- localStorage is not transactional and can be evicted by the browser; users must be encouraged to export backups.
- Backup restore across V1 and V2 keys is not atomic; review failure recovery and interruption UX.
- Proficiency scheduler is a deterministic heuristic, not a clinically or educationally validated algorithm.
- Placement is a small provisional assessment and is not saved.
- Mystery labs are limited to introductory simulated commands.

## Rollback
- Leave the original V1 key intact through migration.
- If V2 validation fails, do not overwrite it automatically; prompt for export/recovery.
- Revert UI activation separately from data schema; preserve backup keys.
- Do not delete or overwrite production user data as part of rollback.

## Review order
Merge only after explicit approval, in dependency order (PR 1 through PR 12), updating stacked PR bases as needed. No deployment until end-to-end release acceptance is signed off.

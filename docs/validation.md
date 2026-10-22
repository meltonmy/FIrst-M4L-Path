# First-release validation

Validated in this Linux cloud environment with Node 24.19.0 and system Chromium on 2026-10-22.

- Clean locked install: `npm ci --cache /workspace/.cache/linux-path-npm` passed.
- `npm test`: 53 tests passed (38 simulator/task tests; 15 progress/import/review tests). Every lesson's guided and independent state predicate has a working solution test and a fresh-state negative check.
- `npm run build`: TypeScript, Vite production bundling, and complete offline precache generation passed. Output is approximately 372 KB on disk, with no runtime CDN assets.
- `npm run test:browser`: 17 checks passed. Seven WCAG A/AA/2.1 AA axe scans cover Home, Path, Lesson, Practice, Review, Progress, and Settings. These scans are not a full accessibility certification.
- Browser workflows: lesson guided practice, independent challenge, recall feedback, completion, local reload, mode change, JSON file export, valid/invalid imports, replacement confirmation, review feedback, and reset/cancel passed.
- Simulator browser checks: persistent mutations, unsupported commands, history, hints, reset/cancel, network exercises, and preserving session state while switching lesson sections/modes passed.
- Layout checks at 390, 768, and 1440 pixels passed with no horizontal document overflow across all seven pages. Home screenshots were inspected at phone and desktop sizes.
- Offline checks disabled the browser's network after installation, reloaded the app, opened the networking lesson, and completed its simulated exercise. Production assets, all twelve bundled lessons, and the simulator remained usable. External references are intentionally not cached.
- A second production server served the `/FIrst-M4L-Path/` repository base path: deep lesson links, relative manifest, worker scope, offline reload, and a path-navigation exercise passed.
- Production preview was started on port 4173 and validated in Chromium. No public app deployment or GitHub Pages workflow was triggered.

## Not tested / remaining limits

- No native iOS/Android device installation or Safari/Firefox engine test was run. Browser-specific install UI is documented; manifest icons and scope were checked in Chromium.
- No manual screen-reader or young-child usability study was performed. Keyboard tab navigation, visible focus styles, semantic labels, and automated accessibility checks are included.
- Optional real-machine labs were not executed: the app is a simulator, and Docker/real networking are not runtime prerequisites. Real labs require the stated personal machine/VM prerequisites and permissions.
- The Red Hat documentation proxy denial prevented live verification of the explanatory RHEL 9/NetworkManager comparison. See `content-review.md`. Docker and Ubuntu facts were verified through the vendors' official GitHub documentation sources.
- GitHub Actions and public GitHub Pages deployment were prepared, not executed. Fresh-task environment snapshot restoration has not been tested; saved draft instructions do not themselves publish or restart an environment.

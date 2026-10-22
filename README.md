# Linux Path

Small steps. Real skills. A free, local-first Linux learning app for beginners and network engineers, built with React, TypeScript, and Vite. Younger learners should explore with a trusted adult.

## Open it locally

Requires Node.js 22.12+ (Node 24 also works) and npm. From this repository:

```sh
npm ci
npm run dev
```

Open `http://localhost:5173` in your browser. The development server listens on all interfaces for cloud use; use your environment's port forwarding when working remotely. A remote browser's `localhost` refers to that browser's machine, not the cloud machine. This chat does not provide a public preview URL.

To try the production app, including offline support:

```sh
npm run build
npm run preview -- --port 4173
```

Open `http://localhost:4173`. Wait for **Offline ready** in the header before disconnecting. Offline support requires HTTPS in production (localhost is also allowed); opening `dist/index.html` directly as a file will not work. Development mode intentionally does not register a service worker.

If npm's default cache is not writable in a restricted cloud environment, use `npm ci --cache /workspace/.cache/linux-path-npm` (or another writable cache location).

## What works

- Twelve complete 5–10 minute lessons: Linux, terminal basics, listing, paths, creation, reading, copying/moving, safe deletion, permissions, addresses/routes, troubleshooting, and containers.
- Explorer and Engineer presentations of the same skills. Switch in the header or Settings without losing progress.
- Objectives, original explanations, examples, guided practice, independent challenges, hints, recall checks with feedback, recaps, and suggested reviews.
- Home, learning path, lessons, free/guided practice, daily review, progress, and settings.
- Local browser persistence; JSON export/import with schema validation and replacement confirmation. Invalid imports leave progress unchanged. Reset requires confirmation.
- Completion tracked separately from successful independent challenges. No mastery percentage, streak penalties, accounts, subscriptions, paid APIs, backend, analytics, or AI services.
- Responsive layouts, keyboard navigation, visible focus, adjustable lesson text, reduced motion, and semantic native confirmation dialogs.
- All lessons, UI, icons, and simulator downloaded automatically after the first successful production load. The complete precache is under 400 KB uncompressed. External reference websites need Internet. Browsers can evict offline storage; keep an exported progress backup.

## The practice simulator

The simulator is a pure TypeScript virtual filesystem and command interpreter. It never calls a shell, subprocess, remote API, or host filesystem. Changes persist during the mounted practice session. Reset, switching missions, leaving the practice page, or reloading begins a fresh filesystem; saved learning records remain.

Supported syntax (also available through `help`):

```text
help                           pwd
ls [-a] [-l] [path]             cd [path]
mkdir [-p] path…                touch file…
cat file…                      less file
cp source destination          mv source destination
rm [-r] path…                  chmod MODE file
ip addr                        ip route
ping [-c 1…4] TARGET            clear
```

`chmod` accepts three octal digits or `u+x` / `u-x`. `ls` also accepts `-al` / `-la`. Quoted spaces, escaped characters, absolute paths, relative paths, `..`, `.`, and `~` are supported. History uses Up/Down. `cp`/`mv` handle files only; existing directory destinations are supported, and overwriting is refused. Failed commands are atomic, leaving the prior state intact. Only virtual items below `/home/learner` can change. Permissions are recorded and displayed, not enforced as a security model.

`less` displays the whole file; it is not an interactive pager. Ping targets are `127.0.0.1`, `192.168.10.1`, `1.1.1.1`, and `linuxpath.test` (scripted name-resolution failure). Ping never checks real connectivity. Scripts, operators, pipes, redirection, variables, wildcards, sudo, Docker, packages, real DNS, and arbitrary commands are deliberately unsupported and explained honestly. The app does not provide a real Linux environment.

Exercise validation inspects resulting filesystem state or recorded read-only observations. It accepts equivalent supported paths and command solutions. Lesson practice records demonstrated results; the free-practice missions are a sandbox and do not award saved lesson progress.

## Review and privacy

A correct recall answer schedules a review in 2 days, then 4, 8, and at most 16 days after later correct answers. A missed concept returns after 10 minutes. These simple spaced-review suggestions are not a guarantee of retention or certification success. Review early is available for previously attempted concepts.

All progress and preferences live in `localStorage` under `linux-path-progress-v1`, in that browser and origin. Private browsing, clearing site data, or changing origins can lose access to it. Export JSON before switching devices; import on the other browser. Imported data is validated, limited to 1 MB, and applied only after confirmation. Storage failures are visible and do not silently claim persistence.

## Validation

```sh
npm test             # Vitest: parser, virtual files, task solutions, progress, scheduling, imports
npm run build        # TypeScript, Vite, generated offline precache
npm run test:browser # Playwright: Chromium UI, transfers, mobile/tablet/desktop, offline, accessibility
```

Browser tests use `/usr/bin/chromium` when available in this cloud machine, otherwise Playwright’s installed Chromium. For another machine:

```sh
npx playwright install chromium
CHROMIUM_PATH=/absolute/path/to/chrome npm run test:browser
```

The browser tests start the production preview at port 4173 if it is not already running. Rebuild before running them after changes. For portability, point `CHROMIUM_PATH` to your installed Playwright or system Chrome executable. CI installs Chromium automatically. Automated accessibility checks supplement, and do not replace, human usability or screen-reader testing.

## Static hosting and GitHub Pages

Deployment is prepared but **has not been published**. `vite.config.ts` uses relative asset URLs (`base: './'`), the manifest uses a relative scope, and routing uses URL hashes. Both a root deployment and `/FIrst-M4L-Path/` work without server-side routing rewrites. The generated service worker scopes its cache to its own deployment path and cleans only older caches for that path.

To publish when you decide:

1. Push the project to GitHub.
2. In repository Settings → Pages, select **GitHub Actions** as the build source.
3. Manually run **Deploy Linux Path to GitHub Pages** in Actions.
4. Open the URL reported by that deployment. Wait for **Offline ready**, then test a reload while offline.

The deployment workflow has only `workflow_dispatch`; a normal push runs checks and does **not** publish. You can also upload the contents of `dist/` to any static HTTPS host. Rebuild after changes so `scripts/offline.mjs` produces the current asset list and content-derived cache version.

## Add a lesson

1. Add original content in `src/lessons.ts` using the `Lesson` shape: stable ID, module, objective, both explanations, worked example, guided task, independent challenge, staged hints, multiple-choice check, feedback, recap, deeper context, and references.
2. Extend `TaskId` and the state-based `checkTask` predicate in `src/simulator.ts`. Prefer tasks that inspect resulting files, paths, contents, modes, or relevant observations. Add seed files if needed.
3. Add alternative supported solutions and negative cases to `tests/unit/simulator.test.ts`. Validate commands the content actually teaches. Never implement host execution.
4. Verify version-sensitive guidance against current official distribution/vendor documentation. Label distro-specific commands and tool/version prerequisites. Use only personal disposable VMs for optional real labs, identify risks and cleanup, and never direct learners to employer systems.
5. Update release counts in the UI/docs if expanding beyond the initial twelve lessons, and rebuild/test offline. Keep stable IDs for progress compatibility; introduce an explicit progress migration before changing the schema version.

Content is separate from UI. `src/progress.ts` owns persistence/import/review scheduling; `src/simulator.ts` owns terminal behavior; `src/App.tsx` owns page components; `src/styles.css` owns responsive presentation. `public/` contains local icons and the manifest. No remote fonts or CDN assets are needed.

## Content references and limits

Docker container/kernel concepts and host/container port order were checked against the official Docker documentation source on GitHub. Ubuntu networking, `ip addr`, `ip route`, Netplan, and local hostname mappings were checked against Canonical's Ubuntu Server documentation source. The iproute2 upstream address/route manuals were also consulted. See `docs/content-review.md` for source links and remaining verification limits.

Full RHEL-specific administration, Kubernetes, and Helm lessons are not part of this release. No untested package-install or network-changing commands are presented as working simulator actions. Optional real-machine notes clearly identify effects and prerequisites.

## Roadmap

The full fourteen-module roadmap is visible. Unwritten modules are labeled **Coming later**, with no fake lesson buttons or completion states: text processing, users/groups/ownership/sudo, services, apt (Ubuntu/Debian) versus dnf (RHEL), deeper networking/SSH, storage, Bash, Docker Compose, Kubernetes/Helm, RHEL SELinux/firewalld, and integrated home lab missions. Available modules with more planned material explicitly say so. This app builds practical familiarity; it does not promise certification or production-administration readiness.

For the exact first-release test results and checks not run, see [docs/validation.md](docs/validation.md).

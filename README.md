# Full Stretch

An anatomy-first stretching companion to Full Body. Choose a region, follow a short guide, and complete a sequence of static holds.

**Phase 2 · Setup + Flexibility Baseline + Stretch History** — local development, version `0.2.0`.

## Run locally

Requires Node.js 22.12+ and npm.

```sh
npm ci
npm run dev
```

Open [Full Stretch locally](http://127.0.0.1:5174/). Full Body can continue running on port 5173.

```sh
npm test
npm run typecheck
npm run build
npm run preview
```

## Features

- Lazy-loaded procedural 3D anatomy with Front / Back views and thirteen keyboard-accessible region controls.
- Fourteen original static-stretch guides and a deterministic twelve-stretch full-body routine.
- Short setup: intentions, hold/set defaults, optional subjective baseline, and summary.
- Twenty-, thirty-, or forty-five-second holds; one, two, or three sets. Sessions capture their prescription when started.
- Deadline timer with pause, resume, skip, explicit side/set progression, and reload recovery.
- One saved active stretch, with an explicit Continue action and confirmation before replacing it.
- Finished targeted and full-body history, including partial time and skipped holds.
- Today's body coverage from saved history using the browser's local calendar day.
- Progress history, per-region totals, and detailed side/set results.
- Original/latest self-assessment, with every saved assessment retained.
- Settings defaults and a confirmed reset limited to Full Stretch's own data.
- Responsive layout, reduced-motion support, labeled forms, focus management, and announced storage errors.

## Architecture

| Location | Responsibility |
|---|---|
| `src/types/stretch.ts`, `src/data/` | Stable region IDs, canonical stretch library and routine |
| `src/types/profile.ts`, `src/lib/profile.ts` | Intentions, session preferences and self-assessments |
| `src/types/history.ts`, `src/lib/history.ts` | Finished records, totals and local-day coverage |
| `src/lib/session.ts`, `src/lib/sessionValidation.ts` | Pure session state machine, captured prescriptions and recovery validation |
| `src/lib/coverage.ts`, `src/lib/dates.ts` | Stretch completion versus region coverage; local date helpers |
| `src/lib/storage.ts` | Versioned repositories and storage failure handling |
| `src/hooks/useStretchStore.ts` | Root state, persistence and idempotent finish coordination |
| `src/components/profile/`, `src/components/progress/` | Setup, baseline, settings and history screens |
| `src/components/anatomy/`, `src/components/BodyMap.tsx` | Independent procedural anatomy, lazy loading and fallback |
| `src/components/session/SessionPage.tsx` | Guided holds and session summaries |
| `src/components/StretchGuide.tsx` | Original diagrams and concise text cues |

`Date.now()` supplies each active hold's deadline. An interval refreshes the view; visibility and focus changes reconcile elapsed time. Reloading restores the saved deadline. An expired deadline completes only the current hold; the next side, set or stretch always requires user input. Navigating away from a session pauses it.

A skipped hold preserves its elapsed time but does not earn completion. A stretch is complete only when every prescribed hold completes. Calves coverage requires **both** calf variations; an individual targeted variation can still show its own completion. Secondary regions are informational. The full-body routine covers eleven distinct regions; Biceps and Upper Back remain available as targeted stretches.

## Local data

The repositories use schema-versioned envelopes and only these browser keys:

- `full-stretch:profile:v1`
- `full-stretch:history:v1`
- `full-stretch:active-session:v1`

Storage failure leaves the app usable in memory and shows a notice. Valid history survives alongside malformed records. Unsupported future versions are retained and protected from automatic writes. Reset removes only these three keys and returns to setup. Browser data is local to the origin/device; there is no backend, account, cloud sync, schedule or Full Body integration.

The baseline records the user's perceived stretching experience. It does not measure range of motion, assign a flexibility score, or infer medical outcomes.

## Content and assets

The anatomy was independently adapted from the user's local Full Body procedural source and uses code-generated geometry. SVG guides are original schematic position references. No third-party exercise or anatomical images were downloaded in this phase.

Phase 1 general safety language was checked against [Mayo Clinic's stretching guidance](https://www.mayoclinic.org/healthy-lifestyle/fitness/in-depth/stretching/art-20047931): warm up first, breathe normally, hold steadily and stay within a comfortable range. Phase 2 preserves that content.

## Validation

See [PHASE2_REPORT.md](PHASE2_REPORT.md) for the current audit, all test/build results, bundle changes, exact browser states checked, and limitations. [PHASE1_REPORT.md](PHASE1_REPORT.md) is the historical foundation audit; its in-memory-only and single-calf coverage behavior is superseded by Phase 2.

Build output, dependencies, local QA artifacts, environment files and tool state are excluded by `.gitignore`.

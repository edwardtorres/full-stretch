# Full Stretch

An anatomy-first stretching companion to Full Body. Choose a region, follow a short guide, and complete a sequence of static holds.

**Phase 1 · Foundation + 3D Stretch Map** — local development, version `0.1.0`.

## Run locally

Requires Node.js 22.12+ and npm.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5174/**. Full Body can continue running on port 5173.

```sh
npm test
npm run typecheck
npm run build
npm run preview
```

## Phase 1 features

- Lazy-loaded procedural 3D anatomy with controlled Front / Back views.
- Thirteen selectable regions, with an equivalent keyboard-accessible text index.
- Fourteen original static-stretch guides, including straight-knee and bent-knee calf variations.
- Targeted stretching and a deterministic 12-stretch full-body routine.
- Thirty-second holds, two sets; unilateral stretches explicitly alternate left and right.
- Deadline-based timer with pause, resume, skip and explicit next-hold controls.
- Current-page completion feedback on the body and text controls.
- Original two-position SVG guides, responsive layout, reduced-motion support and modal menu.

## Architecture

| Location | Responsibility |
|---|---|
| `src/types/stretch.ts` | Stable region IDs, stretch, hold and result types |
| `src/data/regions.ts` | Region labels, views and accessible groups |
| `src/data/stretches.ts` | Typed library and standing → kneeling → floor routine |
| `src/lib/stretch.ts` | Lookup, sequences, completion and timing calculations |
| `src/lib/session.ts` | Pure session state machine |
| `src/components/anatomy/` | Independently adapted procedural Full Body anatomy |
| `src/components/session/SessionPage.tsx` | Guided holds and session summaries |
| `src/components/BodyMap.tsx` | Lazy import, viewport loading and fallback |
| `src/components/StretchGuide.tsx` | Original diagrams and concise text cues |

`Date.now()` supplies the wall-clock deadline. An interval only refreshes the view; visibility and focus changes immediately reconcile the timer. Paused time is excluded and each hold is capped at its prescribed duration. Side/set/stretch progression always requires user input.

A skipped hold records any elapsed hold time but does not earn completion. All holds of a stretch must finish before its **primary** region is marked complete. Secondary regions are informational. Completing either calf variation marks Calves complete. The full-body routine intentionally covers 11 distinct regions; Biceps and Upper Back remain available as targeted stretches.

State is kept in memory only. Reloading clears the current session and completion. There is no dependency on Full Body, backend, account, history, scheduling or deployment configuration.

## Content and assets

The anatomical model was adapted from the user's local Full Body procedural source; it uses code-generated geometry. SVG guides are original schematic position references. No third-party exercise or anatomical images were downloaded.

General safety language was checked against [Mayo Clinic's stretching guidance](https://www.mayoclinic.org/healthy-lifestyle/fitness/in-depth/stretching/art-20047931). The cues are written for this app: warm up first, breathe normally, hold steadily and stay within a comfortable range. This is general fitness guidance and makes no diagnostic or medical claims.

## Validation

See [PHASE1_REPORT.md](PHASE1_REPORT.md) for the implementation audit, test results, bundle sizes, exact browser states checked and limitations.

Build output, dependencies, local QA artifacts, environment files and tool state are excluded by `.gitignore`.

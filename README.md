# Full Stretch

An anatomy-first stretching companion to Full Body. Choose a region, follow a short guide, and complete a sequence of static holds.

**Phase 4 · Mobility + Dynamic Warm-Up** — local development, version `0.4.0`.

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
- Fourteen original static-stretch guides; Quick 5, Daily 10 and the original twelve-stretch routine, now named Full 20.
- Program details with ordered movements, included regions, hold counts and calculated planned hold time.
- A separate Mobility destination with Full Body, Upper Body and Lower Body dynamic warm-ups. These use timed movement or manual rep confirmation, not static holds.
- A distinct mobility movement map, timed movement recovery, skipped-movement summary and mobility history.
- A weekly schedule with one program or no program per weekday, saved immediately in Settings. Defaults: Tuesday/Thursday Daily 10, Saturday Full 20.
- Today's scheduled program on Dashboard and a compact weekly view on Programs. Any program can be started on any day.
- Short setup: intentions, hold/set defaults, optional subjective baseline, and summary.
- Twenty-, thirty-, or forty-five-second holds; one, two, or three sets. Sessions capture their prescription when started.
- Deadline timer with pause, resume, skip, explicit side/set progression, and reload recovery.
- One saved active session across flexibility and mobility, with an explicit Continue action and confirmation before replacing it.
- Finished targeted and named program history, including partial time and skipped holds. Phase 2 full-body records display as Full 20.
- Today's body coverage from saved history using the browser's local calendar day.
- Progress history with an Activity filter. Flexibility retains program/region filters and detailed side/set results; Mobility has its own movement counts and session time.
- Original/latest self-assessment, with every saved assessment retained.
- Settings defaults and a confirmed reset limited to Full Stretch's own data.
- Responsive layout, reduced-motion support, labeled forms, focus management, and announced storage errors.

## Architecture

| Location | Responsibility |
|---|---|
| `src/types/stretch.ts`, `src/data/` | Stable region IDs, canonical stretch library and routine |
| `src/types/program.ts`, `src/data/programs.ts`, `src/lib/programs.ts` | Centralized program definitions, generation inputs and duration calculations |
| `src/types/mobility.ts`, `src/data/mobility.ts`, `src/lib/mobility.ts` | Curated dynamic movements/routines, distinct timer and manual-rep reducer |
| `src/lib/mobilityHistory.ts`, `src/lib/sessionLaunch.ts` | Mobility history, activity isolation and shared one-active-slot conflict decision |
| `src/types/schedule.ts`, `src/lib/schedule.ts` | Seven stable weekday IDs, schedule normalization, local-day matching and weekly completion |
| `src/types/profile.ts`, `src/lib/profile.ts` | Intentions, session preferences and self-assessments |
| `src/types/history.ts`, `src/lib/history.ts` | Finished records, totals and local-day coverage |
| `src/lib/session.ts`, `src/lib/sessionValidation.ts` | Pure session state machine, captured prescriptions and recovery validation |
| `src/lib/coverage.ts`, `src/lib/dates.ts` | Stretch completion versus region coverage; local date helpers |
| `src/lib/storage.ts` | Versioned repositories and storage failure handling |
| `src/hooks/useStretchStore.ts` | Root state, persistence and idempotent finish coordination |
| `src/components/profile/`, `src/components/progress/` | Setup, baseline, settings and history screens |
| `src/components/programs/` | Programs, program details, today's program and weekly view |
| `src/components/mobility/` | Mobility listing, routine details, guided movement session, dynamic region map and history detail |
| `src/components/anatomy/`, `src/components/BodyMap.tsx` | Independent procedural anatomy, lazy loading and fallback |
| `src/components/session/SessionPage.tsx` | Guided holds and session summaries |
| `src/components/StretchGuide.tsx` | Original diagrams and concise text cues |

`Date.now()` supplies each active hold's deadline. An interval refreshes the view; visibility and focus changes reconcile elapsed time. Reloading restores the saved deadline. An expired deadline completes only the current hold; the next side, set or stretch always requires user input. Navigating away from a session pauses it.

A skipped hold preserves its elapsed time but does not earn completion. A stretch is complete only when every prescribed hold completes. Program coverage requires all movements for that region **included in that program**: Full 20 requires both calf variations; Quick 5 and Daily 10 include one and can cover Calves within their program. Comprehensive calf-library coverage still requires both. Secondary regions are informational. Full 20 covers eleven primary regions; Biceps and Upper Back remain available as targeted stretches, and Daily 10 also includes Upper Back.

Program names are tiers, not exact duration promises. The user’s hold/set defaults apply equally to all programs:

| Program | Movements | Holds at 30 sec × 2 | Planned holds at 30 sec × 2 | Planned holds at 20 sec × 1 |
|---|---:|---:|---:|---:|
| Quick 5 | 5 | 16 | 08:00 | 02:40 |
| Daily 10 | 8 | 24 | 12:00 | 04:00 |
| Full 20 | 12 | 42 | 21:00 | 07:00 |

Transitions add elapsed time. History sums actual held time separately from session duration. Starting a session captures its program ID, ordered movements, prescriptions and hold sequences; later preference or schedule changes cannot alter it.

A weekly check means that exact scheduled program was explicitly finished on that browser-local date. Finishing with skipped holds can satisfy the scheduled occurrence but does not earn skipped stretch coverage; Dashboard distinguishes “Finished with skips” from “Complete.” Repeated same-program sessions do not increase the weekly count. There are no streaks or adherence scores.

Mobility is an on-demand **dynamic warm-up** with its own data model. Full Body Warm-Up contains eight standing movements; Upper Body has five, Lower Body seven. Marching is timed; repetitions are confirmed by the user, with both sides or both directions spelled out. The timed movement uses a saved deadline, pauses without counting paused time, and stops at zero without starting the next movement. A skipped movement stays skipped. Mobility region marking means **moved dynamically**; it never becomes today's static stretch coverage or satisfies the flexibility-only weekly schedule. The Dashboard can mention a finished warm-up in a separate line. Time estimates depend on the user's pace and transitions. No movement is sensor counted.

## Local data

The repositories use schema-versioned envelopes and only these browser keys:

- `full-stretch:profile:v1`
- `full-stretch:history:v1`
- `full-stretch:active-session:v1`

New writes use envelope schema version 3. Versions 1 and 2 remain readable: old profiles receive the modest default schedule, full-body history becomes Full 20, older flexibility history gets its activity discriminator, and legacy active sessions receive program metadata and hold sequences derived from saved prescriptions. Loading alone does not rewrite history. A single active-session key holds either flexibility or mobility. A single history key holds both as distinct entry types.

Storage failure leaves the app usable in memory and shows a notice. Valid history survives alongside malformed records. Unsupported future versions are retained and protected from automatic writes. Reset removes only these three keys, including mobility records and the schedule within the profile, and returns to setup. Browser data is local to the origin/device; there is no backend, account, cloud sync or Full Body integration. Mobility is not part of the weekly schedule. Weekly scheduling has no times, reminders or calendar export. Editing the recurring pattern recalculates this week's display; historical schedule snapshots are not stored.

The baseline records the user's perceived stretching experience. It does not measure range of motion, assign a flexibility score, or infer medical outcomes.

## Content and assets

The anatomy was independently adapted from the user's local Full Body procedural source and uses code-generated geometry. SVG guides are original schematic position references. No third-party exercise or anatomical images were downloaded in this phase.

Phase 1 general safety language was checked against [Mayo Clinic's stretching guidance](https://www.mayoclinic.org/healthy-lifestyle/fitness/in-depth/stretching/art-20047931): warm up first, breathe normally, hold steadily and stay within a comfortable range. Later phases preserve that content.

## Validation

See [PHASE4_REPORT.md](PHASE4_REPORT.md) for the current audit, test/build results, bundle changes, exact browser states checked, and limitations. [PHASE3_REPORT.md](PHASE3_REPORT.md), [PHASE2_REPORT.md](PHASE2_REPORT.md) and [PHASE1_REPORT.md](PHASE1_REPORT.md) remain historical audits.

Build output, dependencies, local QA artifacts, environment files and tool state are excluded by `.gitignore`.

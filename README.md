# Full Stretch

A standalone, local-first app for guided static stretching and dynamic warm-ups, with an interactive 3D body map and insights from your recorded activity. The v1 feature set is complete; hosting and deployment are separate next steps.

## Features

- Interactive front/back 3D body map, with equivalent text region controls.
- Targeted static stretching, diagrams, cues, visible set/side labels, and explicit hold transitions.
- Quick 5, Daily 10, and Full 20 Flexibility programs.
- Persistent sessions: pause, resume, reload, skip, and finish early.
- Monday–Sunday Flexibility scheduling and today's program.
- Three Mobility warm-ups, with timed movements and manually confirmed repetitions.
- Optional subjective baseline, with original/latest responses and retakes.
- Separate Flexibility and Mobility history, with session details.
- Today coverage, 42-day coverage insights, recorded-week consistency, and twelve derived milestones.
- Responsive controls, keyboard navigation, modal focus management, reduced motion, and plain storage notices.

## Flexibility vs Mobility

**Flexibility** uses static stretch holds. Your hold length and set defaults apply to new targeted sessions and programs. **Mobility** uses dynamic movements with fixed timed or rep prescriptions. Programs are Quick 5 / Daily 10 / Full 20; warm-ups are Mobility routines; a session is an actual run of either activity. One session can be active at a time.

Program names indicate tiers, not exact durations. At 30-second holds and two sets, planned hold time is 08:00 / 12:00 / 21:00 respectively. Actual session time varies with transitions. Active sessions capture their prescription so later settings changes do not alter them.

## Analytics

Coverage describes **recorded stretching frequency**, not objective flexibility. Today highlights primary regions whose required static holds completed today. Recent coverage uses 42 local calendar days; All Time displays lifetime metrics while classifications remain based on recent history.

- **Well Covered:** at least four stretching days across three weeks, no gap above 21 days, and a recent recorded stretch.
- **Less Covered:** included less often relative to other regions, once enough recent history exists. It is not a judgment of ability.
- **Building Data:** more recorded stretching history is needed.

A Complete Week means every scheduled Flexibility program was explicitly finished on its scheduled local date. Skipped holds remain skipped in coverage. Streaks use recorded week schedules; unknown past schedules are not guessed. Milestones are derived from history, baseline, and week snapshots, not stored independently.

Baseline responses are your own perceptions, not measured range of motion. Mobility totals, movement regions, and history are separate from static coverage.

Calves have two library variations. Targeted comprehensive calf coverage requires both; Quick 5 and Daily 10 use their included variation, while Full 20 requires both. Full 20 covers eleven primary regions; Biceps and Upper Back remain available as targeted stretches.

## Tech Stack

React 19, TypeScript, Vite, Three.js, React Three Fiber, Drei, Lucide icons, and Vitest. The procedural anatomy is loaded in a separate lazy chunk. The timer engines and analytics are pure TypeScript modules.

## Local Development

```sh
npm install
npm run dev
npm test
npm run build
npm run typecheck
```

The local preview uses port 5174. Use `npm ci` for installation from the committed lockfile. Build output goes to `dist/` and is ignored by Git.

## Data & Privacy

Data stays in this browser's local storage. No account, backend, cloud sync, or Full Body integration. Browser profiles/devices do not share data. No app telemetry or remote exercise service is used.

Four app-owned keys hold the profile, history, active session, and week snapshots:

- `full-stretch:profile:v1`
- `full-stretch:history:v1`
- `full-stretch:active-session:v1`
- `full-stretch:week-snapshots:v1`

Repositories validate versioned data, preserve future-version records, salvage valid history alongside corrupt records, and report failures in plain language. Failed writes remain available in memory for the tab; reloading can lose them. Reset All Data removes only these four keys, including the records from which coverage and milestones are derived.

Timers reconcile a saved deadline on ticks, reload, focus, and visibility changes. Expiry completes only the current hold/movement; it never starts the next one. Navigating away pauses running sessions. Re-saving the same session ID cannot create duplicate history.

## Limitations

- Procedural anatomy and schematic diagrams, not a clinical model.
- Subjective baseline; no measured ROM, diagnosis, rehabilitation, or personalized medical advice.
- No notifications, accounts, cloud sync, or automated movement verification.
- History depends on user confirmations and this browser's storage.
- Sessions may remain in memory only if storage is blocked or full.
- WebGL availability varies; text region controls remain usable.
- The lazy anatomy bundle is about 902 kB raw / 246 kB gzip and produces a Vite size advisory.
- Responsive and keyboard checks are focused QA, not formal accessibility certification.

Move through a comfortable range. Stop if you experience sharp or unusual pain.

## Project Structure

`src/data/` contains the canonical libraries. `src/lib/` contains timer engines, validation, repositories, and derived analytics. `src/hooks/useStretchStore.ts` coordinates persistence. `src/components/` contains the pages and lazy anatomy. Historical `PHASE*_REPORT.md` files document each development phase.

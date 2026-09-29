# Full Stretch — Phase 4 audit

**Phase:** Mobility + Dynamic Warm-Up

**Version:** 0.4.0

**Scope:** Local Full Stretch project only. No deployment or Full Body integration.

## 1. What was added

Mobility is a separate dynamic warm-up experience alongside the existing static Flexibility experience. It has three curated routines, a 12-movement library, guided timed and rep-based sessions, a distinct region map, resumable active state, completed/skipped summaries, and its own history and Progress metrics. The existing Quick 5, Daily 10, Full 20, targeted stretches, and weekly flexibility schedule remain static-stretch features.

## 2. Files created

| File | Purpose |
|---|---|
| `src/types/mobility.ts` | Stable movement/routine IDs and dynamic prescriptions |
| `src/data/mobility.ts` | Twelve authored movements and three ordered routines |
| `src/lib/mobility.ts` | Dynamic session state machine, timer, result and restore rules |
| `src/lib/mobilityHistory.ts` | Typed history, validation, totals and region helpers |
| `src/lib/sessionLaunch.ts` | Shared active-session conflict decision |
| `src/lib/mobility.test.ts` | 63 Phase 4 unit/integration tests |
| `src/components/mobility/MobilityPage.tsx` | Mobility destination and routine selection |
| `src/components/mobility/MobilityDetail.tsx` | Ordered routine preview and start action |
| `src/components/mobility/MobilitySessionPage.tsx` | Guided movement, timer and completion summary |
| `src/components/mobility/MobilityRegionMap.tsx` | Dynamic-region context and text legend |
| `src/components/mobility/MobilityHistoryDetail.tsx` | Saved movement/result detail |
| `PHASE4_REPORT.md` | This audit |

## 3. Files modified

`src/App.tsx`, `src/components/Menu.tsx`, `src/components/Dashboard.tsx`, `src/components/progress/ProgressPage.tsx`, `src/hooks/useStretchStore.ts`, `src/types/history.ts`, `src/lib/history.ts`, `src/lib/storage.ts`, `src/lib/phase2.test.ts`, `src/lib/programs.test.ts`, `src/phase2.css`, `README.md`, `package.json`, and `package-lock.json`. Application changes connect the new activity to navigation, the single active slot, history, and filtered presentation. Documentation and package metadata reflect version 0.4.0. Dependencies did not change.

## 4. Mobility movement model

`MobilityMovement` has a stable ID, name, primary/secondary anatomy regions, purpose, setup/movement/safety cues, equipment/environment needs, position, and a discriminated prescription. Prescriptions are either a number of seconds or repetitions with explicit `perSide` and optional directional breakdown. Mobility movements are never represented as static `Stretch` records. Session steps snapshot the selected prescriptions at start.

## 5. Dynamic movement library

The 12 movements are March in Place (45 seconds), Arm Circles (10 forward and 10 backward), Shoulder Rolls (10 forward and 10 backward), Standing Torso Rotation (10 per side), Bodyweight Squat (10), Hip Hinge Reach (10), Reverse Lunge With Reach (6 per side), Front-to-Back Leg Swing (8 per side), Side-to-Side Leg Swing (8 per side), Ankle Rock (10 per side), Wall Slide (8), and Cat-Cow (8 cycles). They use no training equipment; wall support and floor space are identified where appropriate. Cues favor comfortable, controlled motion and advise stopping for sharp or unusual pain. There are no injury-prevention or diagnostic claims. The short, gradually increasing warm-up follows the [NSCA Coach dynamic warm-up discussion](https://www.nsca.com/contentassets/11647622285541019ee8ed532743cce5/coach-5.1.4-dynamic-warm-ups-for-the-land-based-athlete.pdf).

## 6. Mobility routine definitions

| Stable ID | Routine | Ordered movements | Editorial estimate |
|---|---|---:|---|
| `full-body-warmup` | Full Body Warm-Up | 8 | About 5–8 min at an easy pace |
| `upper-body-warmup` | Upper Body Warm-Up | 5 | About 3–5 min at an easy pace |
| `lower-body-warmup` | Lower Body Warm-Up | 7 | About 5–7 min at an easy pace |

Full Body follows march → arm circles → torso rotation → squat → hinge → reverse lunge/reach → front/back leg swing → ankle rock. All are standing. Upper Body begins with a 30-second march, then arm circles, shoulder rolls, torso rotation, and wall slides. Lower Body begins with a 45-second march, then squat, hinge, reverse lunge/reach, front/back and side/side leg swings, and ankle rock. IDs and lookup helpers are centralized for a future launch by routine ID; there is no URL/deep-link or cross-app communication yet. Durations depend on user pace, especially for repetitions.

## 7. Mobility session architecture

Mobility has its own reducer and phases: `ready`, `running`, `paused`, `movement-complete`, `complete`. Its state captures the routine ID, ordered movement/prescription snapshots, index, results, start/completion timestamps, remaining milliseconds, and timer deadline. `DONE`, `SKIP`, `NEXT`, and explicit early finish separate manual movement decisions. Early finish records remaining movements as skipped. A region is marked moved only if a movement with that primary region was completed. There is one shared active-session slot for both activities. Starting the other activity presents Continue current / Discard and start new.

## 8. Timed movement behavior

Marching starts only after Start movement. Running time uses `deadline = now + remainingMs`; it is reconciled on interval, focus, visibility, and reload. Pause stores the remaining time and clears the deadline; resume establishes a new deadline. Time clamps at zero, with no negative display. Expiry records the timed movement as completed, then waits for a separate Next movement action. Complete early and skip preserve actual elapsed timed milliseconds; pausing excludes paused time. No next movement auto-starts.

## 9. Rep movement behavior

The app does not count reps automatically. It presents the prescribed count, both sides or both directions when applicable, and one Movement complete control after the user performs the work. One history result represents both directions of Arm Circles or Shoulder Rolls. Skipping produces a skipped result. Rep results have `actualTimedMs: null`; the app never invents rep movement durations.

## 10. Active-session persistence

The existing `full-stretch:active-session:v1` key holds either a static or mobility session. Mobility restore retains routine, captured steps, index, results, phase, remaining time, deadline, and start time. If a running deadline expired while the page was away, restore completes that movement only. Old Phase 2 and Phase 3 static sessions still normalize and restore. The conflict prompt works in both directions; replacing a session requires the user to choose Discard and start new.

## 11. History model changes

`HistoryEntry` is a discriminated union: `activityType: 'flexibility'` or `'mobility'`. Mobility entries retain the stable routine ID, actual elapsed session seconds, ordered movement IDs, captured prescriptions, completed/skipped status, and actual timed milliseconds where applicable. The existing `full-stretch:history:v1` key stores both activity types. Mobility validation checks record identity, sequence, timestamps, result types and timing bounds. Separate history detail shows mobility results without pretending they are static holds.

## 12. Historical migration

New repository writes use envelope schema 3. Schema 1 and 2 data remain readable. Older history records without an activity discriminator are normalized to Flexibility in memory; the stored bytes are not rewritten simply by loading. Existing Phase 2 full-body naming and active-session normalization remain. Unsupported future schema versions stay protected from automatic overwrite. The three existing Full Stretch browser keys are unchanged, and the existing reset removes mobility data through them.

## 13. Progress changes

Progress offers an Activity choice. Flexibility retains its previous program and region controls, hold totals, baseline comparison and history detail. Mobility shows warm-up count, completed/prescribed movement count, elapsed mobility session time and dated mobility history. Static sessions cannot enter mobility totals; mobility seconds do not enter static hold time, stretch-region frequency, static program filters, or baseline comparisons.

## 14. Dashboard/static isolation

Today's static anatomy coverage is computed from Flexibility records only. Completed warm-ups may appear in a separate Warm-up today line. They do not color the static body or satisfy a scheduled Quick 5, Daily 10 or Full 20 occurrence. The weekly schedule and Programs page remain flexibility-only. Mobility does not alter subjective baseline entries.

## 15. Accessibility

Routine cards and controls are buttons; movement names are headings. Directions, per-side counts, movement status and map colors are expressed in text. The timed display has a textual remaining-time label and does not announce every 200 ms tick; state changes use a polite status. Existing focus placement, keyboard menu behavior, reduced-motion and responsive rules remain. The region map distinguishes Current movement, Moved, Upcoming movement and Not in this warm-up without relying on color alone.

## 16. Tests added

63 tests cover library IDs/ordering, three routines, valid prescriptions and anatomy IDs, timed deadlines/pause/resume/expiry/reload, manual reps and directions, skips/early finish, duration capture, region marking, history validation, schema compatibility, both active-session conflicts, static schedule/body/hold isolation, baseline isolation, activity filtering, reset and future-schema protection. Two existing suites were adjusted for schema 3 and the discriminated history type; existing static behavior tests remain.

## 17. `npm test` result

**Pass:** 204 tests in 6 files (141 prior + 63 new). Final run used `vitest run` through `npm test`.

## 18. `npm run build` result

**Pass:** Vite 7.3.6, 2,188 modules transformed. The existing lazy anatomy chunk still triggers Vite's >500 kB advisory; it was deliberately not aggressively refactored in this phase.

## 19. `npm run typecheck` result

**Pass:** `tsc --noEmit`.

## 20. Bundle-size changes

| Asset | Phase 3 baseline | Phase 4 | Change |
|---|---:|---:|---:|
| HTML, gzip | 0.39 kB | 0.39 kB | 0.00 kB |
| CSS, gzip | 7.05 kB | 8.05 kB | +1.00 kB |
| Main JS, gzip | 92.40 kB | 98.95 kB | +6.55 kB |
| Lazy anatomy JS, gzip | 246.13 kB | 246.13 kB | 0.00 kB |

Uncompressed Phase 4 outputs are HTML 0.64 kB, CSS 38.22 kB, main JS 331.99 kB, and lazy anatomy JS 902.21 kB. Anatomy remains a separate lazy chunk.

## 21. Known limitations

The 5–8/3–5/5–7 minute labels are pace estimates, not guarantees. Only marching is timed; rep movements rely on user completion, so a person can finish faster or slower. Guides are original text cues and a textual region map; new two-pose mobility illustrations were not added. There is no targeted mobility, recurring mobility schedule, deep link, Full Body launch, automatic rep sensing, personal movement adaptation, account or cloud sync. Browser history is local to the origin/device. No production deployment was done.

## 22. Exact manual states verified

Manual QA used a disposable local staging origin and a Phase 2 schema-1 fixture, leaving the real app's browser data untouched.

- **Full Body:** opened Mobility and the eight-step detail; started March at 45 seconds; advanced 10 seconds to 35 remaining; paused and advanced a test clock another 46 seconds without losing paused time; resumed and reloaded; recovered the deadline; advanced past expiry to 0, where it waited for Next; manually completed the seven rep movements; summary showed **8/8 completed, 0 skipped, 03:09 session duration** and eight primary regions moved. History retained `full-body-warmup`, March's actual 45 seconds, and null timed durations for rep movements.
- **Upper Body:** confirmed 30-second March and five-step order; completed March and Arm Circles, skipped Shoulder Rolls, then explicitly finished. Summary showed **2/5 completed, 3 skipped, 00:56 session duration**; skipped-only Upper Back was not marked moved. Saved history identified `upper-body-warmup`.
- **Lower Body:** inspected seven-step order and per-side prescriptions; finished all seven. Summary showed **7/7 completed, 0 skipped, 01:08 session duration**. History retained `lower-body-warmup`.
- **Both conflict directions:** with Daily 10 active, starting Mobility showed Continue current / Discard and start new; Continue returned to Daily 10 and Discard started Mobility. With Mobility active, starting Daily 10 showed the same choices; Continue returned to Mobility and Discard started Daily 10.
- **Static isolation:** after Mobility records, Dashboard still said no stretches completed today and showed **0/13** static regions, the scheduled Tuesday Daily 10 remained **Not finished**, and the Programs weekly count stayed **0/3**. Flexibility Progress retained one legacy Full 20 record and **21:00** hold time. Mobility Progress separately showed its warm-up count and movement/session-time totals. The Hamstrings baseline remained **Very tight**.
- **Historical compatibility:** the disposable schema-1 profile and Full 20 history loaded; the original baseline remained visible. Automated tests additionally checked schema-2 history load without a storage rewrite and Phase 2/3 active Flexibility restoration.
- **Responsive/UI:** Mobility list, routine detail, timed ready/running/paused, rep movement, summary, Dashboard and Mobility Progress were inspected at **390, 768 and 1440 px** with no horizontal overflow. The desktop movement cue-column fix and Current/Upcoming/Moved/Not in warm-up labels were visually rechecked. Menu keyboard Enter opened Programs; button controls and Progress activity selection were exercised. Browser console had **no warnings or errors** in the QA tab.

The test clock was accelerated for manual QA, so the displayed 03:09, 00:56 and 01:08 durations above are test-session durations, not proof of the editorial routine estimates.

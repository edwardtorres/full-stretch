# Full Stretch — Phase 3 audit

**Programs + Weekly Scheduling · version 0.3.0 · September 29, 2026**

Project: `/Users/edwardtorres/Desktop/FullStretch`

Starting commit: `15742d9` — `feat: add Full Stretch setup and persistent stretch history`

Local preview: [Full Stretch](http://127.0.0.1:5174/)

This report records implemented behavior, verification evidence and limitations. It does not claim clinical flexibility improvement or exact elapsed-session durations. Phases 1 and 2 were extended in place. Full Body was not modified. Nothing was deployed or pushed remotely.

## 1. What was added

- Three deliberate programs: **Quick 5**, **Daily 10**, **Full 20**.
- A Programs menu destination, minimal program rows and ordered program details.
- Shared program-session generation using the existing hold timer and reducer.
- Captured program identity, ordered stretches, prescriptions and hold sequences.
- A seven-day recurring schedule in the profile, with immediate Settings persistence.
- Today's scheduled program on Dashboard; a small local-calendar weekly view on Programs.
- Named program summaries/history and a program filter in Progress.
- Explicit program coverage rules, including different calf requirements within short programs versus Full 20.
- In-memory compatibility for Phase 2 profiles, full-body history and active sessions.

The existing anatomy, targeted guides, setup, self-assessments, timer controls, history details, reset scope and lazy 3D loading were retained. No recommendation system, streak, backend, account, notification or Full Body integration was added.

Before implementation, the library, stretch types, session engine, persistence, history, Dashboard, Progress, profile/preferences, menu and local-date helpers were inspected. The clean Phase 2 checkout passed its 94 tests, build and typecheck. Changes were developed and exercised in a temporary copy, then transferred to the existing Full Stretch repository. QA used a separate localhost origin so it did not replace the user's saved profile or history.

## 2. Files created

| File | Purpose |
|---|---|
| `src/types/program.ts` | Stable program IDs and typed definitions |
| `src/types/schedule.ts` | Stable weekday IDs and schedule entry types |
| `src/data/programs.ts` | Three centralized, intentionally ordered definitions |
| `src/lib/programs.ts` | Program lookup, included regions, prescriptions, counts and duration helpers |
| `src/lib/schedule.ts` | Defaults, normalization, local-date matching, weekly view and counts |
| `src/lib/programs.test.ts` | 47 additional program, schedule, migration and restore tests |
| `src/components/programs/ProgramsPage.tsx` | Program selection and weekly overview |
| `src/components/programs/ProgramDetail.tsx` | Ordered movements, coverage, counts and Start program |
| `src/components/programs/TodayProgram.tsx` | Dashboard scheduled, unscheduled and finished states |
| `src/components/programs/WeeklyView.tsx` | Monday–Sunday schedule with readable completion text |
| `src/components/profile/ScheduleFields.tsx` | Seven labeled native weekday selects |
| `PHASE3_REPORT.md` | This audit |

## 3. Files modified

| File | Change |
|---|---|
| `package.json`, `package-lock.json` | Version 0.2.0 → 0.3.0; dependency versions unchanged |
| `README.md` | Phase 3 features, model, calculated durations, compatibility and schedule limits |
| `src/App.tsx` | Programs/detail routes and one shared targeted/program launch/conflict flow |
| `src/components/Menu.tsx` | Activated Programs |
| `src/components/Dashboard.tsx` | Today's program, named Continue action and coverage wording |
| `src/components/BodyMap.tsx` | Optional context-specific coverage label |
| `src/components/profile/SettingsPage.tsx` | Immediate schedule updates and updated reset description |
| `src/components/progress/ProgressPage.tsx` | Program filter and recognizable session names |
| `src/components/progress/HistoryDetail.tsx` | Named program heading; exact hold details retained |
| `src/components/session/SessionPage.tsx` | Captured hold sequences, named program summaries and program coverage |
| `src/hooks/useStretchStore.ts` | Program start using the existing persistence and finish coordination |
| `src/lib/session.ts` | Canonical program state and captured hold sequences in the same reducer |
| `src/lib/sessionValidation.ts` | Program snapshots and legacy active-session normalization |
| `src/lib/storage.ts` | Schema 2 writes, schema 1/2 reads and in-memory normalization |
| `src/lib/history.ts` | Program IDs/names/filtering, legacy normalization and aggregated local-day coverage |
| `src/lib/coverage.ts` | Separate library coverage and included-program coverage helpers |
| `src/lib/profile.ts` | Schedule defaults, validation and safe normalization |
| `src/lib/phase2.test.ts` | Three fixture updates for schedule fields, legacy constructor typing and future schema version; all 94 prior scenarios retained |
| `src/types/profile.ts` | Typed weekly schedule on the profile |
| `src/types/history.ts` | Canonical targeted/program history plus nullable program ID |
| `src/phase2.css` | Phase 3 program and schedule styles, appended to the existing visual system |

The stretch library and original twelve-stretch order were not changed. Historical Phase 1/2 reports were not rewritten. Temporary QA controls, test fixtures, generated build output and dependencies are excluded from the source commit.

## 4. Program data model

Stable IDs are `quick-5`, `daily-10`, `full-20`. A `StretchProgram` contains `id`, `name`, `purpose`, `description` and a readonly ordered `stretchIds` list. Targeted sessions do not need a program definition.

Definitions contain movement choices, not calculated hold sequences or fixed duration promises. Names/descriptions are centralized. Included primary regions and planned time are derived from the canonical library and the user's current preferences. Secondary regions remain informational.

## 5. Program definitions

### Quick 5

Purpose: a short session with selected upper and lower body regions; explicitly described as limited coverage.

1. Cross-Body Shoulder Stretch — standing
2. 90-Degree Lat Stretch — standing
3. Straight-Knee Wall Calf Stretch — standing
4. Supine Hamstring Stretch — floor
5. Butterfly Stretch — floor

Five primary regions: Shoulders, Lats, Calves, Hamstrings, Adductors / Inner Thigh. The suggested prompt list was refined to keep the calf movement with standing work and include Butterfly at the end. Quick 5 does not imply comprehensive body coverage.

### Daily 10

Purpose: balanced regular flexibility work with more coverage than Quick 5.

1. Cross-Body Shoulder Stretch — standing
2. 90-Degree Lat Stretch — standing
3. Straight-Knee Wall Calf Stretch — standing
4. Half-Kneeling Hip Flexor Stretch — kneeling
5. Child's Pose Reach — kneeling
6. Supine Hamstring Stretch — floor
7. Butterfly Stretch — floor
8. Gentle Cobra Stretch — floor

Eight primary regions: Shoulders, Lats, Calves, Hip Flexors, Upper Back, Hamstrings, Adductors / Inner Thigh, Abs / Front Trunk. The exact list differs from the optional suggested list: kneeling/floor movements balance transitions and keep planned holds at 12 minutes with the normal 30-second/two-set defaults. This is a fixed editorial selection, independent of baseline responses.

### Full 20

The original twelve-stretch order is preserved:

1. Doorway Chest Stretch
2. Cross-Body Shoulder Stretch
3. 90-Degree Lat Stretch
4. Overhead Triceps Stretch
5. Standing Quadriceps Stretch
6. Straight-Knee Wall Calf Stretch
7. Bent-Knee Wall Calf Stretch
8. Half-Kneeling Hip Flexor Stretch
9. Supine Figure-Four Stretch
10. Supine Hamstring Stretch
11. Butterfly Stretch
12. Gentle Cobra Stretch

Eleven primary regions. Biceps and Upper Back are not included in this original routine. Both calf movements are included. Ordering moves from standing through kneeling to floor work.

## 6. Program session generation

`createProgramSession(programId, preferences)` produces a canonical `kind: 'program'` session. All programs use the existing reducer, deadline timer, pause/resume, explicit side/set/stretch transitions, skip handling, early finish, conflict dialog and idempotent history coordination.

A session snapshots its unique ID, program ID, ordered stretch IDs, per-stretch hold/set prescriptions, complete hold sequences and start timestamp. No program list or sequence is dynamically reordered after start. Targeted sessions use `kind: 'targeted'` and `programId: null`.

The compatibility constructor still accepts the old `full-body` argument and produces a Full 20 program session. It does not introduce a second timer engine.

## 7. Duration calculation

Each stretch's sequence accounts for unilateral left/right holds, selected set count and selected hold seconds. Planned hold time sums those prescribed holds. Program details and listing calculate current values; history sums actual held milliseconds separately.

| Program | Movements | Holds, 30 × 2 | Planned, 30 × 2 | Holds, 20 × 1 | Planned, 20 × 1 |
|---|---:|---:|---:|---:|---:|
| Quick 5 | 5 | 16 | 08:00 | 8 | 02:40 |
| Daily 10 | 8 | 24 | 12:00 | 12 | 04:00 |
| Full 20 | 12 | 42 | 21:00 | 21 | 07:00 |

All three use the same user defaults. Quick sessions have fewer movements, not silently shorter holds. Tier names are not exact timer promises. The UI labels **planned hold time** and explains that transitions add time; no arbitrary transition allowance is used. Actual hold time and total elapsed session duration remain distinct in history.

## 8. Schedule data model

`WeeklySchedule` stores seven `{ weekday, programId }` entries. Weekday IDs are `monday` through `sunday`; display labels are separate. Each weekday has exactly one known program ID or `null`.

Default pattern:

| Day | Program |
|---|---|
| Monday | No program |
| Tuesday | Daily 10 |
| Wednesday | No program |
| Thursday | Daily 10 |
| Friday | No program |
| Saturday | Full 20 |
| Sunday | No program |

An older profile without the schedule gets this modest default. A supplied malformed/partial schedule safely normalizes invalid or absent days to No program, preserving valid assignments and the rest of the profile.

## 9. Schedule persistence

The schedule is part of the profile, not a new browser key. Settings uses seven native selects with weekday labels and program names. A selection saves immediately; there is no separate schedule Save button. “Schedule updated” appears after a change. Hold/set defaults retain their existing Save defaults flow.

Existing namespaced keys are retained:

- `full-stretch:profile:v1`
- `full-stretch:history:v1`
- `full-stretch:active-session:v1`

New envelopes use schema version **2**; readers accept versions **1 and 2**. Future versions above 2 remain protected from automatic writes. Normalizing a loaded value alone does not write it back. Later explicit user changes can naturally save the normalized document using schema 2.

Schedule changes do not modify saved session prescriptions, results or timestamps. Reset still removes only the same three Full Stretch keys, including the schedule inside the profile. Storage failures retain the existing usable-in-memory behavior and visible notice.

## 10. Dashboard today's-program behavior

Today's weekday comes from the browser's local date, not a UTC substring. The existing local-day refresh runs periodically and when document visibility changes.

- Scheduled: weekday, program name, movement count and current planned holds; **Start today's program**.
- Unscheduled: **No program scheduled**, neutral guidance and **Start a program**.
- Active: a named **Continue Daily 10** or equivalent above the program area; no duplicate start action for that same active program.
- Finished exact scheduled program today: **Complete** if all included stretches completed; **Finished with skips** otherwise; Start again remains available.
- A different finished program saves normally but does not satisfy today's scheduled program.

Targeted muscle selection remains available, and the anatomy remains the main visual. Only one unfinished active session exists; starting another request uses the existing Continue/discard confirmation flow.

## 11. Weekly view

The compact weekly view lives on Programs. It shows Monday through Sunday, local month/day labels, Today, the assigned program or No program, and a textual **Finished** plus check only for the exact program finished on that date. Other rows remain unmarked visually; no red X, failure warning or streak appears. Accessible text also distinguishes unfinished and unscheduled rows.

The week begins at local Monday. Local-noon dates and calendar `setDate` operations avoid fixed-24-hour assumptions across DST and month/year boundaries. The count is finished scheduled occurrences / scheduled days. Duplicate same-program sessions on one date count once.

An explicit finish with skipped holds satisfies an occurrence under the prompt's “was finished” rule. Successful stretch/region coverage is calculated separately. Editing the recurring pattern recalculates the current week's assignments and matching history; there is no historical schedule snapshot.

## 12. History migration

Legacy `sessionType: 'full-body'` records normalize in memory to `sessionType: 'program', programId: 'full-20'`. Legacy targeted records receive `programId: null`. Exact recorded stretch order, prescriptions, side/set holds, actual milliseconds, statuses and timestamps are preserved.

New history stores canonical targeted/program type and program ID. Loading old history alone does not rewrite storage; tests compare the stored bytes before/after load. Valid old and new records coexist. Existing malformed-record recovery, deduplication and future-version protection remain.

The manual legacy fixture held all twelve original movements at 30 × 2: **42 completed holds / 21:00 actual holds**. After completing a new Quick 5, the resulting schema 2 write retained that original record with the same totals and its Full 20 identity.

## 13. Progress changes

Progress adds a labeled filter: **All, Quick 5, Daily 10, Full 20, Targeted**. It combines with the existing region filter without redesigning the page. Summary metrics follow the selected history. Rows and details use recognizable program names.

Exact per-stretch and per-side/set results remain expandable. The original starting assessment remains separate from program filtering. Baseline collection, retained assessments and original/latest comparison were not changed. Baseline does not influence program selection.

## 14. Region/program coverage semantics

- A hold earns completion only when its prescribed duration completed.
- A stretch earns completion only when all its prescribed holds completed.
- `programRegionCoverage` requires every stretch for that region **included in that program** to be fully completed.
- Full 20 Calves requires Straight-Knee and Bent-Knee calf stretches.
- Quick 5/Daily 10 can show Calves covered within that program after their single included calf variation completes.
- `regionCoverage` retains comprehensive calf-library semantics requiring both variations; an individual targeted calf variation is not comprehensive Calves coverage.
- Skipped holds preserve actual elapsed time but do not earn stretch coverage.
- Program summaries show only included primary regions; Quick 5 leaves the remaining regions neutral.

Dashboard aggregates successful same-local-day coverage from all finished sessions. Completed stretch IDs can combine across targeted sessions; program coverage combines completed movements for the same program that day. Multiple records remain individually visible in history. Session summary coverage is scoped to that session, independent of earlier Dashboard coverage.

## 15. Active-session compatibility

Legacy active targeted/full-body sessions without program metadata or stored sequences normalize from their captured prescriptions. Full-body becomes Full 20. Existing stretch/hold indices, results, remaining time, phase and deadline are retained. Loading normalization itself does not write storage.

New active snapshots include program ID, ordered list and complete hold sequences. Restore validates identity/order, known stretches, allowed prescriptions, sequences, result prefixes, indices, phase and timestamps. Preferences or schedule changes affect new sessions only.

Reload recovery reconciles the saved deadline. Expiration completes only the current hold; the next side/set/stretch still requires input. Navigation pauses a running hold. No other hold is automatically credited during an absence.

## 16. Tests added

**47 new tests** in `src/lib/programs.test.ts`, retaining **94 existing scenarios**. Coverage includes:

- Unique stable IDs, expected 5/8/12 counts, valid references, no duplicates and intentional posture ordering.
- Hold counts and planned time at 30 × 2 and 20 × 1 for all programs.
- Session identity, order, independent captured prescriptions and exact hold sequences.
- New preference effects versus unchanged active/history prescriptions and canonical library data.
- Quick limited coverage, single-calf short-program coverage and Full 20's two-calf requirement.
- Skipped hold coverage and actual history time.
- New program history, legacy full-body/targeted normalization, byte-preserving load and mixed old/new storage.
- Multiple same-day sessions, aggregated region coverage and complementary partial-program records.
- Program filtering.
- Default schedule, complete seven-day normalization, profile save/load and old baseline preservation.
- Local-date selection where UTC differs, unscheduled dates, DST/month/year week boundaries.
- Exact scheduled program/date completion, different-program exclusion, duplicate count protection and pattern edits.
- Explicit partial finish versus successful coverage.
- Active restore for each program, legacy active normalization without a write, exact deadlines and unchanged active sessions after schedule/preference edits.
- Invalid program IDs, lists, hold sequences and history identity rejection.

The Phase 2 fixture changes add the new profile schedule expectation, keep the old constructor's accepted argument type in its helper, and move the unsupported-future envelope fixture from schema 2 to schema 3. No prior test was deleted.

## 17. npm test result

**PASS — 141 tests across 5 files.** The Phase 2 pre-edit baseline was 94 tests across 4 files. Final tests were run in the actual Full Stretch checkout after transfer, not only in staging.

## 18. npm run build result

**PASS — `tsc --noEmit && vite build`.** The existing large anatomy-chunk warning remains; the anatomy continues to load lazily. No aggressive anatomy bundle changes or dependency updates were made. Build output is ignored and not committed.

## 19. npm run typecheck result

**PASS — `tsc --noEmit`.** Final typecheck was run in the actual project after transfer.

## 20. Bundle-size changes

Vite reported decimal kB for the production build:

| Output | Phase 2 | Phase 3 | Change | Phase 2 gzip | Phase 3 gzip | Gzip change |
|---|---:|---:|---:|---:|---:|---:|
| HTML | 0.64 | 0.64 | 0.00 | 0.39 | 0.39 | 0.00 |
| CSS | 28.98 | 32.93 | +3.95 | 6.43 | 7.05 | +0.62 |
| Main JS | 290.33 | 303.41 | +13.08 | 88.91 | 92.40 | +3.49 |
| Lazy anatomy JS | 902.21 | 902.21 | 0.00 | 246.13 | 246.13 | 0.00 |

Program/schedule screens are in the main shell; the existing anatomy stays in its independent lazy chunk. Dependency versions and lockfile dependency resolutions are unchanged.

## 21. Known limitations

- Tier names are approximate positioning; changing holds/sets can yield much shorter or longer sessions. Planned holds exclude transitions and rest.
- Weekly scheduling is a recurring weekday pattern: no clock times, date-specific overrides, notifications, calendar export or schedule history.
- Explicit finish satisfies the schedule even with skips; the Dashboard status and coverage preserve the distinction.
- Current program definitions are fixed. Future changes to their IDs/order or stretch side structure require a versioned migration because active/history validators compare captured data against current canonical definitions.
- Data remains local to browser origin/device. No accounts, server, cloud sync or Full Body sharing.
- Manual QA used an authored clock-advance control in a disposable test page; complete hold flows were exercised without waiting through real-time 8–21 minute sessions. The existing deadline timer remains the timing mechanism. This is not a long-duration real-device timing study.
- Responsive testing used desktop-browser viewports at 390, 768 and 1440 pixels, not physical mobile devices. Keyboard/semantic checks were performed; a full screen-reader audit was not.
- The procedural anatomy and schematic guides remain their Phase 1/2 assets. No clinical anatomy or range-of-motion claim is made.
- The existing approximately 902 kB lazy anatomy warning remains.
- No deployment, recommendation engine, scoring, streaks, achievements, dynamic routines, PNF, objective ROM, camera tracking or AI coaching was added.

## 22. Exact manual states verified

QA date: **September 29, 2026, browser-local Tuesday**. Disposable origin: `http://127.0.0.1:5176/qa-output/phase3.html`. The QA page and fixture/clock controls are temporary and excluded from the actual project/commit. The real preview uses port 5174.

### Setup and compatibility

1. A fresh QA origin displayed first-run setup.
2. Loaded an authored schema 1 Phase 2 profile/history fixture. Reload bypassed setup for the completed profile; 30 × 2 defaults and original self-assessment were retained. Missing schedule normalized to Tuesday/Thursday Daily 10 and Saturday Full 20.
3. The prior-day Full 20 fixture appeared in history with twelve completed stretches, 42 holds and 21:00 actual held time; it did not color today's body.

### Programs and Quick 5

4. Programs showed Quick 5 (5 / 16 / 08:00), Daily 10 (8 / 24 / 12:00), Full 20 (12 / 42 / 21:00) at 30 × 2, with tier/transition wording.
5. Quick 5 detail showed its five ordered movements, primary regions and single-calf program explanation.
6. Started and completed all five movements through explicit hold, side, set and stretch controls using the clock-advance test control.
7. Summary read **Quick 5 complete**, 5/5 stretches, 16 holds, 08:00 actual holds. Only Shoulders, Lats, Calves, Hamstrings and Adductors were covered; other regions stayed neutral.
8. Inspector showed `programId: quick-5`, canonical program history and cleared active storage. Saving the new entry retained the legacy Full 20's exact 42 holds / 21:00.

### Off-schedule and multiple sessions

9. Tuesday remained scheduled Daily 10 after Quick 5; Dashboard still offered Start today's program and weekly count remained 0/3.
10. Completed targeted Hamstrings at 30 × 2 on the same day: 4 holds / 02:00. It saved beside Quick 5; both appeared in Progress. Dashboard combined today's successful coverage.
11. Progress All showed both current-day sessions and prior-day Full 20. Quick-only, Targeted-only and Full 20 filters showed the appropriate records and 08:00, 02:00 and 21:00 totals.

### Schedule persistence and preferences

12. Settings exposed all seven weekday/program labels and the modest default pattern.
13. Changed Tuesday to Quick 5 without a Save step. Reload showed Tuesday Quick 5 **Complete** with 08:00 planned holds and Start again, recognizing that exact same-day program.
14. Restored Tuesday Daily 10, changed preferences to 20 seconds / 1 set and saved defaults. New Daily 10 planned holds became 04:00. Existing Quick 5 history remained 30 × 2 / 08:00.
15. Changed Tuesday to No program and reloaded: Dashboard showed **No program scheduled**, neutral guidance, Start a program and All programs. Restored Tuesday Daily 10 afterward.

### Daily 10 recovery and active invariance

16. Started Daily 10 at 20 × 1, began the first left-side hold, advanced 10 seconds and reloaded.
17. Dashboard offered **Continue Daily 10**, identified stretch 1/8 and showed the in-progress state. Continue restored the same program and **00:10** remaining running hold.
18. Navigated to Settings, changed Tuesday to Quick 5 and defaults to 45 × 3. Attempting to start Quick 5 displayed the one-active-session conflict dialog.
19. Continue current returned to the captured Daily 10 at 20 × 1 and 04:00 planned holds. New schedule/preferences did not mutate it.
20. Completed Daily 10: **Daily 10 complete**, 8/8 movements, 12 holds, 04:00 actual holds, eight included primary regions.
21. Restored Tuesday Daily 10 and 20 × 1 defaults. Weekly view showed 1/3, with only Tuesday Daily 10 checked Finished; Thursday/Saturday remained visually unmarked.

### Full 20

22. Full 20 detail retained the twelve original movements, 21 holds and 07:00 planned time at 20 × 1.
23. Completed the first six movements, including Straight-Knee calf. Current-session Calves did **not** show Complete even though an earlier Quick 5 had colored today's Dashboard calf.
24. Completed Bent-Knee calf. At 7/12 movements, current-session Calves showed Complete.
25. Finished Full 20: **Full 20 complete**, 12/12 movements, 21 holds and 07:00 actual holds; eleven primary regions.
26. Inspector showed five separate finished records: new Full 20, Daily 10, Targeted Hamstrings, Quick 5 and legacy Full 20; program IDs and totals were correct, and active storage was cleared.

### History, baseline and accessibility

27. Daily 10 history detail showed 20 seconds × 1 and left/right results of 20.0/20 seconds. Quick 5 detail retained 30 seconds × 2 and all four shoulder side/set results at 30.0/30 seconds.
28. Baseline original/latest comparison retained one saved assessment dated September 28, with Hamstrings **Very tight** in both columns and other fixture responses Comfortable. No retest was saved; program selection did not adapt to it.
29. Keyboard activation of menu and Continue, page/session heading focus, native weekday labels and Tab progression between weekday selects were inspected. The existing confirmation focus behavior remained available.
30. Browser developer logs contained **no application errors or warnings** in the exercised QA flow.

### Responsive states

For each row below, browser viewport width and document scroll width matched at **390, 768 and 1440**; no page-level horizontal overflow was found. The weekly view is included within Programs rather than a separate page.

| Required state | State exercised |
|---|---|
| Dashboard with today's program | Local Tuesday Daily 10, including active/finished variants |
| Programs listing | Three programs with current calculated times |
| Program detail | Quick 5 ordered detail; Full 20 original sequence additionally inspected |
| Weekly schedule | Monday September 28–Sunday October 4, Today and exact-program finish |
| Settings schedule controls | Seven labeled weekday selects |
| Quick 5 session | Captured 30 × 2 program session |
| Daily 10 session | Captured 20 × 1 program session |
| Full 20 session | Captured 20 × 1 program session |
| Program summary | Named completion, hold totals and included coverage |
| Progress with program history | Named programs and targeted history with filters |

Screenshots additionally inspected mobile Programs/Progress/schedule controls and tablet Programs/weekly view. Final actual-project preview loaded successfully on port 5174 after transfer and displayed the normal first-run setup for its current browser origin. Its console had no errors or warnings. Test clock/fixture controls are not present there, and the real user's local data was not replaced with QA fixtures. The disposable QA tab was closed and its separate server stopped after testing.

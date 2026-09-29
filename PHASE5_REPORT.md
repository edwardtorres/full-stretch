# Full Stretch — Phase 5 audit

**Phase:** Consistency + Coverage Insights

**Version:** 0.5.0

**Scope:** Local Full Stretch only. No Full Body integration or deployment.

## 1. What was added

Full Stretch now derives weekly Flexibility consistency, schedule-based Complete Weeks and week streaks, static region coverage, separate Mobility consistency, neutral self-report comparisons and 12 restrained milestones. The Dashboard keeps anatomy primary and adds a compact status line plus Today/Coverage body modes. Progress exposes detail without combining static and dynamic activity.

## 2. Files created

- `src/lib/analytics.ts` — pure week, coverage, baseline, Mobility and milestone calculations.
- `src/lib/weekSnapshots.ts` — local Monday dates, snapshot validation and current-week schedule recording.
- `src/lib/analytics.test.ts` — 74 new deterministic tests.
- `src/phase5.css` — responsive insight and coverage styling.
- `PHASE5_REPORT.md` — this report.

## 3. Files modified

`src/App.tsx`, `src/components/Dashboard.tsx`, `src/components/BodyMap.tsx`, `src/components/anatomy/AnatomyScene.tsx`, `src/components/anatomy/AnatomyModel.tsx`, `src/components/progress/ProgressPage.tsx`, `src/hooks/useStretchStore.ts`, `src/lib/storage.ts`, `src/main.tsx`, `README.md`, `package.json`, and `package-lock.json`. Dependencies did not change.

## 4. Weekly consistency model

Weeks are browser-local Monday–Sunday calendar weeks, calculated with local date components and `setDate`, including DST changes. Flexibility this week shows finished sessions, completed scheduled occurrences, unique primary regions with a fully completed stretch, completed hold count and completed hold time. A scheduled occurrence counts once when that exact program is explicitly finished on its local day. No adherence percentage or missed-day penalty is shown.

## 5. Complete Week semantics

A week is complete only if it has **at least one** scheduled Flexibility occurrence and all scheduled occurrences were explicitly finished. Unscheduled days do not matter. As in Phase 3, a finished program containing skipped holds satisfies that day's schedule, while skipped stretches earn no coverage. Repeating a program on one day does not complete another day. Mobility never completes a static schedule occurrence.

## 6. Streak semantics

Current and best streaks count consecutive **complete recorded weeks**, never consecutive days. A complete current week may join the streak. While the current week is incomplete, a streak through the previous completed week remains visible until this week ends. Prior incomplete, zero-schedule and unknown unsnapshotted weeks interrupt a streak. The best streak is derived from all recorded complete-week runs. There are no mutable streak counters or negative messages.

## 7. Mobility consistency

Mobility has separate totals for warm-ups this week, completed movements this week, this week's elapsed session time, lifetime warm-ups/movements/session time and the three-routine mix. Most used movement regions count warm-ups with at least one completed primary movement for each region, once per warm-up. These numbers do not enter Flexibility streaks, hold time or region classifications.

## 8. Region coverage metrics

Recent means the last **42 local calendar days**, including today; All Time includes older recorded Flexibility sessions. For each of 13 selectable regions, metrics use fully completed static stretches: sessions containing one, completed holds, actual completed hold seconds, latest completed stretch date, distinct local days and distinct weeks. A partial or skipped stretch does not earn a coverage day. A session can count once for each of its completed primary regions; no Mobility movement is included.

## 9. Coverage classification

Labels describe recorded activity, not physiology:

- **Well Covered:** at least four completed stretch days, activity in at least three distinct weeks within the last 42 days, no gap over 21 days between sampled stretch days, and a latest stretch within 21 days.
- **Less Covered:** at least four overall Flexibility days in the selected window, another region with at least four days, this region at or below 40% of the highest region's day count, and no completion for this region in the last 14 days.
- **Building Data:** all other cases, including new or sparse histories.

The same recency safeguards apply when viewing All Time metrics. A label is derived on demand and is never stored in history. Well Covered means “frequently included in your recent stretching,” not “flexible.”

## 10. Baseline change presentation

Progress presents original and latest self-reported answers as separate facts. If at least two assessments exist, each assessment area is labeled Changed or Unchanged; otherwise it says Needs more history. It does not infer measured range of motion, improvement, decline or a numeric flexibility score. Recent stretching frequency is never used to change a baseline response.

## 11. Anatomy analytics mode

Dashboard offers keyboard-accessible Today and Coverage buttons. Today preserves Phase 1–4 static completion colors and actions. Coverage shows last-42-day static classifications on the same lazy 3D body: teal Well Covered, muted amber Less Covered, neutral Building Data. A visible key, selected-region label and all 13 text buttons repeat the meanings without color. Selecting a region still leads directly to its static stretch; this mode does not become a targeted Mobility flow.

## 12. Milestones

Twelve stable IDs are reconstructed from deduplicated saved entries, assessments and recorded weeks: First Stretch Session, First Program, First Complete Week, 3-Week Streak, 5-Week Streak, 10/25/50 Flexibility Sessions, All Regions Stretched, First Baseline Retest, First Mobility Session and 10 Mobility Sessions. Earned dates are taken from the qualifying session, latest scheduled completion in the qualifying week, or second assessment. Locked milestones have no invented date. All Regions requires a completed static stretch in each of 13 regions **and both calf variations**. The interface shows static earned/locked states; no interruption, confetti or motion is added.

## 13. Dashboard changes

A small This Week line shows completed/scheduled Flexibility occurrences, regions stretched, current week streak, separate warm-ups this week and a calm Complete Week message when earned. The primary anatomy and direct stretch-start path remain. The existing Warm-up today line now summarizes multiple warm-ups without repeating the routine name.

## 14. Progress changes

Flexibility Progress adds weekly consistency and streaks; Recent/All Time region cards with exact metrics and labels; separate self-reported changes; and an earned/locked milestone list. Existing program and region history filters, static totals, detailed history and baseline navigation remain. Mobility Progress adds weekly warm-up/movement/time metrics, routine mix and a descriptive top-five movement-region list, while preserving its existing lifetime totals and history.

## 15. Static/Mobility isolation

Analytics accept typed Flexibility or Mobility arrays after the Phase 4 activity discriminator filters them. Mobility cannot affect static schedule completion, streaks, holds, coverage or static milestones. Flexibility cannot affect warm-up counts, movement totals, routine mix or Mobility time. Neither activity changes subjective baseline data. The Dashboard's Today body remains static-stretch coverage, independent of Coverage mode.

## 16. Persistence changes

A fourth Full Stretch-only key, `full-stretch:week-snapshots:v1`, stores a version-1 validated list of local Monday week keys with that week's seven scheduled program IDs. The current week's record is created on an onboarded app visit and updated when its schedule changes. Past records remain fixed. This avoids applying today's recurring pattern to an older week after edits. Weeks that predate Phase 5 without a snapshot are **unknown**, so they do not earn retroactive Complete Week or streak credit. No historical session is rewritten, and no classification or mutable counter is stored. Future snapshot schemas are protected from writes. Reset All Data removes the new key with the three existing Full Stretch keys.

## 17. Tests added

74 new tests cover Monday–Sunday boundaries and both DST transitions, snapshot creation/edit/validation/future protection/reset, exact scheduled completion and duplicate-day handling, zero-schedule and incomplete weeks, current/best streaks and missing weeks, Flexibility/Mobility isolation, 42-day and All Time coverage, classification thresholds, original/latest baseline presentation, and all milestone families including comprehensive calves and duplicate history IDs. Existing Phase 1–4 suites remain.

## 18. `npm test` result

**Pass:** 278 tests in seven files (204 existing + 74 new).

## 19. `npm run build` result

**Pass:** Vite 7.3.6, 2,191 modules transformed. The existing lazy anatomy chunk still triggers the >500 kB advisory and was not aggressively refactored.

## 20. `npm run typecheck` result

**Pass:** `tsc --noEmit`.

## 21. Bundle changes

| Asset, gzip | Phase 4 | Phase 5 | Change |
|---|---:|---:|---:|
| HTML | 0.39 kB | 0.39 kB | 0.00 kB |
| CSS | 8.05 kB | 8.71 kB | +0.66 kB |
| Main JS | 98.95 kB | 103.04 kB | +4.09 kB |
| Lazy anatomy JS | 246.13 kB | 246.19 kB | +0.06 kB |

Uncompressed Phase 5: HTML 0.64 kB, CSS 42.41 kB, main JS 346.96 kB, lazy anatomy JS 902.36 kB. Anatomy remains lazy.

## 22. Known limitations

Past Phase 1–4 weeks lack schedule snapshots, so old Complete Weeks and streaks cannot be safely reconstructed after schedule edits. A week when the app is never opened has no schedule snapshot; it remains unknown instead of being guessed. The current recurring pattern still governs today's schedule; editing it can change the current week's Complete Week state. Coverage labels use frequency and recency of completed stretches, not range of motion or tissue quality. Mobility region use describes movements performed, not mobility quality. Data is local to one browser origin/device. There is no backend, Full Body link or integration, account, notification or deployment.

## 23. Manual QA results

QA ran on a disposable local origin with valid schema-3 Flexibility/Mobility history and version-1 week snapshots, leaving the real app's browser data untouched.

- **Weekly consistency:** four Tuesdays (Sep 8, 15, 22 and 29, 2026) each had a completed Daily 10 and recorded Tuesday-only schedule. Dashboard and Progress showed **1/1 scheduled**, **4-week current/best streak**, and **Complete Week**. This week had two Flexibility sessions and nine static regions stretched. No penalty copy appeared.
- **Schedule edit:** adding Thursday Daily 10 in Settings immediately changed the current week to **1/2**, removed its Complete Week message and showed the prior **3-week streak**. Reload preserved 1/2 and the three past completed weeks. Past snapshots did not change.
- **Coverage:** four completed Hamstrings days showed **Well Covered**; Biceps with zero completed days showed **Less Covered** after adequate comparison history; Chest with one recent completed day showed **Building Data**. Each card displayed days, sessions, holds, time and last date. The 3D Coverage mode and region buttons repeated textual classifications; Today mode retained its static completion state. Three completed Mobility warm-ups did not change these labels.
- **Baseline:** Hamstrings showed Original **Very tight**, Latest **Moderately tight**, and **Changed**. Other unchanged answers displayed Unchanged. No objective improvement claim or score was shown.
- **Milestones:** First Stretch Session, First Program, First Complete Week, 3-Week Streak, First Baseline Retest and First Mobility Session displayed earned dates. 5-Week Streak, 10/25/50 Flexibility Sessions, All Regions Stretched and 10 Mobility Sessions remained locked. Earned/locked states reconstructed after reload.
- **Mobility:** three Upper Body warm-ups yielded three lifetime warm-ups, 15 completed movements and 04:30 session time; two this week yielded ten movements and 03:00. Routine mix showed Upper Body 3 and the other two 0. The static Dashboard and Flexibility metrics stayed separate.
- **Responsive/accessibility:** Dashboard Today/Coverage, Flexibility Progress and Mobility Progress had no horizontal overflow at **390, 768 and 1440 px**. The 390 px Mobility layout was visually reviewed. Enter activated the Today button. Native Activity and Coverage Window selectors worked. Body classifications, milestones and weekly status had text equivalents. The code retains the existing reduced-motion camera/CSS path; the QA browser reported reduced motion off, so an enabled OS reduced-motion setting was not manually simulated. Browser console had **no warnings or errors**.

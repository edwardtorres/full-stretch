# Full Stretch — Portfolio Handoff

## Project name

Full Stretch

## Short description

Full Stretch is an interactive 3D flexibility and mobility tracker combining guided static stretching, dynamic warm-ups, scheduling, and coverage insights. It makes recorded consistency visible while keeping self-reported assessments separate from measured range of motion.

## Technologies

React, TypeScript, Vite, Three.js, React Three Fiber, Drei, Vitest, Cloudflare Workers Static Assets.

## Key features

- Interactive front/back anatomical region selection with equivalent text controls.
- Guided targeted static stretches and Quick 5 / Daily 10 / Full 20 programs.
- Timestamp-based hold timers with persistent active sessions.
- Dynamic Mobility warm-ups with timed and manual repetition steps.
- Weekly scheduling, local history, Complete Weeks, and week streaks.
- Subjective baseline comparison, recorded coverage, and derived milestones.
- Responsive, keyboard-accessible controls and browser-local privacy.

## Technical highlights

The 3D anatomical map derives selection, Today coverage, and recent coverage tones from region state. Flexibility and Mobility use distinct activity engines and analytics behind one resumable active-session slot. Timestamp reconciliation supports pause, expiry, reload, and explicit transitions without duplicate results. Validated, versioned persistence protects newer records and handles write failures. Weekly schedule snapshots preserve historical plans, and pure derived analytics avoid inventing missing schedules or measuring clinical outcomes. Anatomy is lazy-loaded; equivalent text selection, native dialogs, reduced-motion handling, and layouts down to 320 pixels support usability.

## Problem

Many stretching tools present a timer or a generic exercise list. They make it difficult to connect an area of the body to a useful session, then see whether the user consistently includes that region over time.

## Solution

Combine anatomy selection, guided stretching, dynamic Mobility warm-ups, local history, and coverage in one quiet interface. The user can start from a body region or a ready-made routine and later inspect recorded frequency, schedule completion, and their own baseline responses.

## Live URL

[https://fullstretch.edwardtorres.dev/](https://fullstretch.edwardtorres.dev/)

## Repository

[https://github.com/edwardtorres/full-stretch](https://github.com/edwardtorres/full-stretch)

## Release

v1.0.0 · September 29, 2026. See [RELEASE_V1.md](RELEASE_V1.md).

## Recommended screenshot states

Capture the real rendered app at approximately **1440 pixels wide**. Use a disposable browser profile with realistic, clearly artificial activity records. Capture enough vertical page area to include the named sections. Do not create fake UI screenshots or recolor body classifications in an image editor.

| State | Exact setup and visible content |
|---|---|
| 1. Dashboard | Tuesday; Today mode; Front anatomy; Daily 10 scheduled; one completed region (Hamstrings is a useful example); today's program above the body; weekly summary below it. Default 30-second / two-set settings give Daily 10 12:00 planned hold time. |
| 2. Coverage | Dashboard Coverage mode with 42-day legend visible; four stretching days across at least three weeks for frequently included regions, a less-included region, and a recently introduced region needing more data. Capture Well Covered / Less Covered / Building Data in the body and text legend. |
| 3. Static session | Start targeted **Supine Hamstring Stretch**; default two sets; **Left side, Set 1 of 2**; ready or paused timer; setup/hold diagrams and guidance visible. |
| 4. Mobility | **Full Body Warm-Up**; **March in Place, Movement 1 of 8**, timer and movement map visible, or **Bodyweight Squat, Movement 4 of 8**, 10-rep prescription and explicit completion control visible. |
| 5. Progress | Flexibility activity; Recent / 42-day window; visible consistency, coverage, and milestone sections. Use recorded schedule snapshots and enough genuine app-produced fixture sessions to show a Complete Week and earned milestone. |

The release QA used actual app UI and isolated synthetic data. Production QA data was removed afterward. Portfolio captures should be made in a separate disposable profile, never by replacing someone's real browser history.

## Presentation limits

Describe coverage as recorded frequency, not anatomical health, measured flexibility, injury risk, or recovery. Baseline responses are self-reported. No notifications, accounts, cloud sync, or technical Full Body integration. Avoid claiming clinical accuracy or formal WCAG certification.

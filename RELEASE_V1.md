# Full Stretch v1.0.0

**Released:** September 29, 2026

**Live app:** [fullstretch.edwardtorres.dev](https://fullstretch.edwardtorres.dev/)

**Source:** [edwardtorres/full-stretch](https://github.com/edwardtorres/full-stretch)

## Product

A standalone 3D flexibility and mobility tracker. Choose a body region, follow static stretching guidance or a dynamic warm-up, and review your recorded activity. v1 preserves the Phase 6 feature set; this release adds hosting, metadata, artwork, render recovery, documentation, and a confirmation-button sizing fix.

## Features

- Interactive front/back procedural anatomy and equivalent text region buttons.
- Targeted stretches with diagrams, cues, explicit side/set transitions, and resumable holds.
- Quick 5, Daily 10, and Full 20 programs with captured prescriptions and calculated hold time.
- Weekly Flexibility schedule, local history, and recorded schedule snapshots.
- Full Body, Upper Body, and Lower Body dynamic Mobility warm-ups.
- Optional self-reported baseline, coverage insights, Complete Weeks, week streaks, and derived milestones.

## Architecture

React 19 / TypeScript / Vite / Three.js / React Three Fiber / Drei / Vitest. All activity logic runs in the browser. Navigation is React state under `/`, with no pathname router or new SPA fallback. Anatomy uses a lazy import, viewport loading, a body-specific fallback, and memoized scene inputs. The top-level error boundary displays a plain Reload app action, independently of storage notices.

## Flexibility and Mobility

Flexibility records static holds. Mobility records controlled dynamic movement with timed or manually confirmed repetition prescriptions. They share one active-session slot but keep separate history metrics. Mobility cannot satisfy a scheduled Flexibility program or color static coverage.

Program names describe tiers rather than guaranteed duration. With 30-second holds / two sets, planned hold time is Quick 5 **08:00**, Daily 10 **12:00**, Full 20 **21:00**, plus transitions. Full 20 includes both calf variations and eleven primary regions; Biceps and Upper Back remain available through targeted stretching (Daily 10 also includes Upper Back).

Timers use saved timestamps/deadlines. Pause excludes waiting time; focus, visibility changes, and reload reconcile elapsed time. Expiry completes the current hold/movement and waits for an explicit next action. Results are deduplicated by session identity.

## Local storage

| Key | Current schema | Content |
|---|---:|---|
| `full-stretch:profile:v1` | 3 | Onboarding, preferences, baseline, schedule |
| `full-stretch:history:v1` | 3 | Discriminated Flexibility / Mobility history |
| `full-stretch:active-session:v1` | 3 | One captured resumable activity |
| `full-stretch:week-snapshots:v1` | 1 | Recorded weekly schedules |

Repositories validate inputs, retain newer schemas, salvage valid history, and expose plain storage notices. Failed writes can leave data available only in memory for the tab. Reset All Data removes only these four keys; no `localStorage.clear()`.

## Analytics and snapshots

Well Covered / Less Covered / Building Data describe recent recorded stretching frequency and recency, not flexibility, ROM, recovery, or clinical outcomes. Classifications use 42 local calendar days even when lifetime metrics are selected. A Complete Week requires each scheduled Flexibility program to be explicitly finished on its assigned local date; skipped holds do not earn static coverage.

Normal onboarded use records the current week's schedule. Current-week schedule edits update that week's snapshot. Earlier snapshots remain unchanged. Unknown pre-snapshot weeks remain unknown, and empty-schedule/unknown weeks cannot bridge a streak. Future schema data is preserved. Milestones are derived from records rather than independent saved awards. Baseline Changed / Unchanged describes responses, not measured improvement.

## Hosting

Cloudflare Workers Static Assets, Worker `fullstretch-edward-torres`, compatibility date `2026-09-29`. Only `fullstretch.edwardtorres.dev` is configured. No handwritten runtime Worker, database, API, accounts, or state bindings. `workers.dev` and preview URLs are disabled.

Final deployed version: `18fd86bb-3b26-4470-942b-05fa722522ee`.

The custom domain resolves and trusted HTTPS returns 200. HTML/artwork revalidate (`public, max-age=0, must-revalidate`); hashed assets use one-year immutable caching. Production returns nosniff, DENY frame protection, strict-origin-when-cross-origin referrers, and camera/microphone/geolocation restrictions. No untested CSP was introduced. HTTP returns 200 rather than redirecting; shared zone settings were not changed. Existing unrelated domains returned HTTPS 200 before and after deployment.

Metadata includes the canonical URL, requested title/description, Open Graph/Twitter large-image metadata, a deterministic 1200×630 social card, SVG/64-pixel favicon, 180-pixel touch icon, and a minimal browser-display manifest. No service worker or install flow.

## Verification

Pre-release commit: `d7d3821d981287978193b74a52d2de25cd8ef59c` (clean main, version 0.6.0).

Clean `npm ci` succeeded in staging and the actual project. All **285 tests / 8 files** remain; build and TypeScript checks pass. Existing application dependency versions remain unchanged. Wrangler is pinned to patched **4.144.0**; final dependency audit reports zero vulnerabilities.

Production checks included onboarding/baseline, saved preferences and schedule after reload, lazy anatomy, Front/Back and direct 3D/text selection, a real-time four-hold hamstring session, running/paused reloads, a complete dynamic warm-up, Programs, both Progress activities, Baseline, Settings, and scoped QA cleanup. All release assets return HTTPS 200 with correct content types/cache headers. No application errors or warnings were captured in these production flows.

The built application was also exercised with disposable fixtures and a controlled clock on a separate local origin: all three programs completed, Mobility skip/partial/full completion, coverage classifications, streaks/milestones, baseline comparison, snapshot preservation/future-version protection, and reset with unrelated-key preservation. QA scripts/data/clocks are outside application source and `dist/`.

At **320×700**, required page/session/dialog states had document width 320 and no horizontally clipped primary controls. Representative Dashboard/Programs layouts were checked at 375, 390, 430, 768, 1024, 1440, and 1920 pixels. Primary targets are at least approximately 44 pixels; confirmation close buttons now remain 44×44.

## Accessibility and remaining manual verification

Landmarks, headings, text anatomy alternatives, named controls, explicit transitions, native dialogs, focus feedback, and non-live timer ticks were inspected. Native keyboard events exercised weekday and Progress selects; synthetic locator key presses were insufficient, so they were not counted as proof. Menu Tab/Shift-Tab traversal and Escape were checked using native events. Browser chrome can temporarily receive focus at the boundary; background page controls remained inert.

No real screen-reader speech/output was available through the enabled automation. A VoiceOver/NVDA pass remains manual. Reduced-motion handling was verified in source: camera snapping, instant region scrolling, CSS animation/transition suppression, unchanged timer logic. An OS reduced-motion run remains manual. No physical touch-device test or formal WCAG certification is claimed.

## Bundle

| Asset | Raw kB | gzip kB |
|---|---:|---:|
| HTML | 2.38 | 0.71 |
| CSS | 49.95 | 10.04 |
| Main JavaScript | 349.56 | 104.08 |
| Lazy anatomy | 902.38 | 246.21 |

Vite's existing >500 kB anatomy advisory remains. No Three.js rewrite was performed to hide it. Browser inventory shows the lazy chunk absent during onboarding and present with Dashboard anatomy. It remains one imported module through navigation; a complete browser request-count trace was not exposed by the tool.

## Privacy and limitations

No application tracking SDK, backend, cloud sync, accounts, or shared cross-app state. Data stays in this browser profile and may be cleared or unavailable. Hosting uses Cloudflare's normal infrastructure; local browser activity is not sent to an application API.

Procedural anatomy and schematic diagrams; subjective baseline; no objective ROM, diagnosis, clinical conclusions, automatic rep detection, notifications, or Full Body integration. Program timing excludes transitions. Coverage depends on recorded activity. WebGL availability varies; text controls remain available.

See [PHASE7_REPORT.md](PHASE7_REPORT.md) for the full release audit and [PORTFOLIO_HANDOFF.md](PORTFOLIO_HANDOFF.md) for presentation guidance.

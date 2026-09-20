# Design-system verification

Date: 2026-09-20. Single-agent implementation and verification, not an independent
accessibility audit or full WCAG conformance claim.

## 1. Strategy

Completed a staged extension of the uncommitted design-system migration supplied in
the worktree. Retained Astra's visual identity, React/Tailwind architecture, chart
data, routes, and integrations. Reused native controls, CSS custom properties,
container/intrinsic layouts, and native modal dialogs. No application replacement.

## 2. Findings that shaped implementation

- A regression test demonstrated stale location responses returning after a query
  was cleared. Requests now invalidate on query/focus/dismissal changes.
- The natal sidereal toolbar did not wrap. It now consumes the shared field and
  segmented-control styles used by dashboard.
- A 320px natal viewport produced a 556px document. Even after the toolbar repair,
  hidden aspect-table labels escaped the local scroll region. Positioning that
  region reduced document width to its 305px client width (15px browser scrollbar).
- Keyboard traversal escaped the full-screen AI overlay into hidden background
  controls. Native modal behavior now contains focus and restores the launcher.
- Recharts grid/tooltip colors and dashboard control/pending states remained outside
  the existing conventions; these now use shared semantic roles and visible status.

## 3. Changed surfaces

- Foundations: `apps/web/src/index.css`, `apps/web/tailwind.config.cjs`.
- Interactions: `PlaceSearchInput`, `AiChatDrawer`, `Modal`; added internal shared
  `useModalDialog` lifecycle hook.
- Consumers: `DashboardPage`, `NatalChartPage`, and the three shared metric charts
  (`ElementRadarChart`, `ModalityBarChart`, `HouseOccupancyChart`).
- Added search/drawer tests alongside the supplied primitive contracts.
- Added the design-system guide and this evidence report; linked both from README.
- Preserved the supplied changes to shell, report/Now/wiki pages, chart alternatives,
  shared components, package metadata, lockfile, and unrelated `agentic-flow.md`.

## 4. Tokens and themes

CSS palette/scale -> semantic roles -> minimal control/layout tokens, exposed through
the existing Tailwind mechanism. Completed status/border aliases, house-data color,
and layer roles; eliminated remaining literal colors in the three metric charts.
Only the established dark theme ships. Contrast, forced-color, and reduced-motion
preferences are respected. Legacy slate aliases and raw domain SVG encodings remain
documented migration exceptions; no second system or token-build dependency.

## 5. Responsive rules

- 80rem maximum shell with wrapping header/navigation.
- 18rem preferred minimum auto-fit pairs; no fixed device-specific markup variants.
- 64rem viewport split for the chart/detail layout, with a 22rem chart rail.
- 38rem detail-container threshold for three metric plots.
- Sticky rail only when at least 64rem wide and 56rem tall.
- Named, positioned local scroll regions retain full aspect matrices.
- Viewport-bounded modal/drawer, dynamic viewport height and safe-area composer.
- Wrapping zodiac controls and long-content resilience; no hidden essential data.

The existing thresholds were retained because the real chart/content measurements
passed. This session did not introduce arbitrary additional page breakpoints.

## 6. Accessibility

Location search implements editable manual-selection combobox semantics, active
descendant, keyboard/pointer selection, result/error status, and stale-request
rejection. Direct manual entry remains available after geocoding failure.

Modal lifecycle supplies native background inertness, scroll locking, and restoration.
The drawer retains a keyboard separator and range input as alternatives to dragging;
the conversation is a named focusable region. IME composition and Shift+Enter are
preserved. Selected segmented controls have an underline, not color alone. Shared
chart text alternatives, headers, captions, labels, and skip navigation are retained.

The drawer's modal behavior is an intentional accessibility interaction change:
users now close it before interacting with the background chart. No report/chat
state, provider, calculation, route, or resizing feature was removed.

Remaining risks: glyph-heavy wheels are dense at small sizes, complete screen-reader
and browser-zoom behavior has not been validated, and the existing Now pages can
still conflate unavailable optional data with loading. DOM/axe checks are not AT tests.

## 7. Evidence and results

Environment: Windows; Node 24.19.0; Vite 5.4.21; Vitest 2.1.9; VS Code integrated
Chromium 148.0.7778.280 / Electron 42.10.0. Local web `127.0.0.1:5173`, API `localhost:4000`.
Real saved natal/relationship reports were read without modifying people or reports.
Geocoder and mutation scenarios used browser route fixtures; AI calls were intercepted
to avoid provider charges or external transmission. Fixtures were removed afterward.

| Check | Result |
| --- | --- |
| Search stale-response regression | Failed before fix; passes after fix |
| `pnpm --filter @astro/web test` | 13 tests passed across 3 files |
| Astronomy-engine tests (root test run) | 17 tests passed across 3 files |
| `pnpm build` | Shared, engine, server, and web production builds passed |
| Editor diagnostics | No reported errors in touched web source |
| `pnpm --filter @astro/web lint` | Blocked: no ESLint configuration exists |
| `pnpm test` | Root gate failed: server has no tests; also logged a web worker exit; web suite passed independently afterward |
| `git -c core.whitespace=cr-at-eol diff --check` | Passed; normal check flags CRLF in existing changed pages |
| Axe WCAG 2 A/AA, 2.1 AA, 2.2 AA tags | Zero violations on each of six routes at 375px; also natal desktop and short-height open drawer |
| Six routes x seven viewport widths | Zero document overflow at 320, 375, 600, 768, 1024, 1280, 1536px |
| Landscape | Zero document overflow on all routes at 667 x 375px |
| SVG geometry | All inspected chart wheels square at every matrix width |
| Visual inspection | Desktop 1280 x 900 and mobile 375 x 812 natal screenshots, plus drawer screenshot; nonblank charts and readable layouts |
| Enlarged text | 32px root font at 320px with long heading: zero document overflow; insight dialog locally scrollable |
| Reduced motion/forced colors | Emulated preferences active; visible focus outline and 0.00001s transition duration observed |
| RTL probe | Natal document had zero overflow; not full RTL functionality verification |

Routes covered: dashboard, natal chart, natal Now, synastry report, synastry Now,
and wiki. An additional sidereal natal sweep passed all six named widths. Aspect
tables retained their full contents in internal scroll regions.

Actual browser keyboard checks (Playwright-driven, not screen-reader testing):

- Placement insight: Enter opens named modal, Tab stays inside, Escape restores trigger.
- Drawer: 12 successive Tabs stayed inside; Escape restored Ask AI and body scrolling.
- Sun legend toggle exposed false/true pressed states and retained chart interaction.
- Natal -> Now navigation rendered both charts; transit date changed successfully.
- Location: ArrowDown/Enter selected a result and populated latitude/timezone.
- Fixture-backed save failure retained form values; retry success cleared values.
- Fixture-backed removal failure retained the person; retry showed success.
- Long unbroken person name caused no document overflow at 320px.
- Empty people and API failure states retained navigation and readable feedback.
- Synastry form preserved sidereal/Fagan-Bradley, friendship, custom style and navigated
  to a rendered report with a cross-aspect matrix (POST intercepted, no DB write).

## 8. Tradeoffs

No additional runtime or development dependencies were introduced by this session;
existing test libraries in the supplied worktree were reused. Final production output:
775.90 kB JavaScript and 21.26 kB CSS, before gzip. Vite's >500 kB chunk warning remains;
no before/after baseline suitable for attributing the entire chunk size was captured.
Route/visualization splitting is a separate performance improvement, not a claim of
regression-free performance measurement. No new fonts, images, or layout-measurement
loop was added.

Native dialog and container queries assume evergreen browser support. Only the
integrated Chromium environment was tested; Firefox, Safari, real touch/virtual
keyboard devices and screen readers were unavailable. 320px reflow and 200% root-text
scaling are **not** actual 200%/400% browser zoom. No persistent screenshot-diff suite
exists yet; session screenshots are inspection evidence only.

## 9. Remaining work

1. Release validation: actual 200%/400% browser zoom, NVDA/VoiceOver reading/focus
   behavior, Firefox/Safari and physical mobile/virtual-keyboard checks.
2. Tooling: establish repository ESLint configuration and server-test policy; adopt
   deterministic browser fixtures and maintained visual-regression baselines in CI.
3. Follow-up UI migration: distinguish optional-data errors/loading in Now pages,
   improve full wheel textual alternatives, finish remaining palette-dependent
   subcomponents, and verify complete RTL behavior before offering localization.
4. Performance: measure route-level load cost and consider code-splitting charts/wiki.

## Definition of done

Implemented: representative workflows use shared foundations; required data/features
remain accessible; narrow/wide, expanded text, keyboard and preference checks above
passed; source changes reduce duplicated styling; APIs and migration rules documented.
Build and available scoped tests pass. Existing root-test/lint blockers are recorded.

**Verification-limited completion:** actual browser zoom, assistive technology,
cross-engine/mobile-device testing and persistent visual regression remain open
release gates. Do not describe this work as fully WCAG-conformant or independently
verified until those checks are completed.
# Astra UI System

## Audit and implementation plan

Recorded 2026-09-20 against the existing uncommitted UI migration. Preserve those
changes; this work completes and verifies them, not a replacement design system.

Product: a local, single-tenant astrology workspace for saved people, natal and
relationship charts, transits/progressions, glossary reference, and AI readings.
Birth data, calculation options, routes, API contracts, and provider integrations
must remain intact. No authentication, database migration, or brand redesign.

Stack: React 18, TypeScript, React Router 6, Vite 5, Tailwind 3, native SVG,
Recharts, pnpm workspaces. UI state is local hooks; remote state uses existing API
modules. Vitest/Testing Library and axe-core are installed. No repository-specific
agent instructions, browser policy, Storybook, or existing design-system docs were
found. README is the documentation entry point.

Preserve the dark celestial canvas, gold serif headings, violet actions, real chart
imagery, compact data presentation, and all six routes. Dark is the existing product
mode, not a newly inferred system preference; no unsolicited theme/density switch.
Assume current evergreen Chrome/Edge, Firefox, and Safari; verify available Chromium
and report other engines as untested. English is current; logical CSS and expanded
content checks support future translation, not a claim of complete RTL support.

### Priorities

1. Foundations: retain CSS custom properties in `apps/web/src/index.css` and Tailwind
   aliases. Complete focus/status/control/layout roles without another token pipeline.
2. Representative workflow: dashboard -> natal chart -> insight dialog -> Now page.
   Fix narrow zodiac controls, stale location suggestions, and overlay focus before
   expanding. Owning files: `PlaceSearchInput`, `AiChatDrawer`, `Modal`, `NatalChartPage`.
3. Components/accessibility: reuse shared buttons, fields, chart-data lists, scroll
   regions, shell/navigation, dialog, and report recipes. Avoid generic wrappers for
   native controls. Validate keyboard, names, selected states, and asynchronous status.
4. Visual/migration: reduce remaining duplicated colors/controls in report metrics and
   related pages; keep domain chart geometry and aspect encodings intact.
5. Documentation/verification: document APIs, exceptions, and repeatable checks here;
   record actual results separately in `design-system-verification.md`.

### Initial findings and risks

- Foundation, shared shell, native insight dialogs, responsive report classes, chart
  text alternatives, and six primitive tests already exist in the supplied worktree.
- Confirmed with a failing test: late geocoder responses repopulate a cleared field.
- Natal zodiac controls use a non-wrapping duplicate implementation, unlike dashboard.
- AI drawer is non-modal even when it covers the viewport; background focus can be
  obscured. Verify and repair using native dialog behavior, preserving resize/chat.
- Recharts/grid/tooltips still contain literal colors; Tailwind slate-400/500 aliases
  are a migration bridge, not permission for new palette-dependent application code.
- Some small links, field groups, SVG chart labels, and loading/error states need
  rendered accessibility checks. Existing astronomical computations are out of scope.
- No baseline actual-browser zoom, screen-reader, or cross-engine evidence exists yet.

### Acceptance criteria

- No horizontal document overflow at 320, 375, 768, 1024, 1280, and 1536 CSS pixels;
  intrinsically two-dimensional aspect tables may scroll inside a named region.
- Charts remain nonblank and square; labels and controls wrap without loss of data.
- Keyboard access to navigation, search results, chart alternatives, modal close,
  drawer resize, and composer. Escape closes overlays and focus returns to trigger.
- Selected controls have non-color state; inputs have labels; async errors/status
  are programmatically exposed. Target WCAG 2.2 AA, not a conformance certification.
- Check reduced-height landscape, enlarged text, content expansion, forced colors,
  reduced motion, and 200%/400% real browser zoom when tooling supports it. Explicitly
  distinguish viewport reflow simulations from real browser zoom.
- Focused UI tests, frontend build/typecheck, available lint, engine tests, live
  representative workflows, and automated accessibility checks run with honest results.

## Architecture and modes

`apps/web/src/index.css` is the browser source of truth. Tokens are CSS custom
properties in Tailwind's base layer, consumed directly by component CSS/SVG or
through `apps/web/tailwind.config.cjs`. No distribution package or token compiler is
needed: only the web app consumes this system. Engine/shared packages retain domain
data and must not depend on browser styling.

| Layer | Examples | Contract |
| --- | --- | --- |
| Foundation | `--palette-ink`, `--palette-violet`, `--space-*`, `--font-*` | Reusable values, not component API |
| Semantic | `--color-canvas`, `--color-text`, `--color-muted`, `--color-action`, `--color-danger`, `--color-focus` | Consume these by intent |
| Component/layout | `--control-size`, `--radius-control`, `--radius-panel`, `--inset-row`, `--content-width`, `--layer-*` | Only stable shared decisions |

RGB channel tokens support Tailwind alpha modifiers and SVG values such as
`rgb(var(--color-accent))`. Gold/violet brand roles retain existing color identity;
success/danger and cyan house data provide distinct semantic/data roles. Type uses
the existing local Segoe UI/Palatino families without network fonts, relative sizes,
zero tracking, and a restrained serif title. Do not add viewport-scaled typography.

Dark is the only shipping theme. Additional themes must override semantic values,
not fork components. `prefers-contrast: more` raises muted/border contrast;
`forced-colors` preserves native system colors and adds non-color selected/focus
indicators. `prefers-reduced-motion` suppresses animation/transition durations and
smooth scrolling; Recharts animations are disabled. No theme choice is offered, so
there is no persistence or light-mode claim. A future light mode requires full SVG,
tooltip, state, and contrast verification before release.

## Component contracts

Maturity: **adopted** means source, unit contracts where applicable, and Chromium
interaction checks exist; it does not mean independent accessibility certification.
**provisional** means the component still has documented compatibility limitations.

| Component/pattern | API and states | Responsive/accessibility contract | Maturity |
| --- | --- | --- | --- |
| `.btn-primary`, `.btn-secondary`, `.icon-button` | Native button/link; use `disabled`, label and optional `title` | 44px minimum block size at default text, wrapping labels, visible focus; icon buttons need accessible names | Adopted |
| `.input` | Native input/select/textarea with associated label, errors via `aria-describedby` | Full available width; 44px minimum; native date/select interaction; no placeholder-only labels | Adopted |
| `.segmented-control` | Group/fieldset of buttons with `aria-pressed` | Wraps; selected state is a filled action background about 9:1 against the unselected surface (a lightness change, not hue alone), plus an outline in forced colors; no tab semantics unless true tab panels exist | Adopted |
| `PlaceSearchInput` | `value`, `onChange(string)`, `onSelect(PlaceSuggestion)` unchanged | Editable manual-selection combobox; Up/Down, Enter, Escape, Tab; pointer selection retains input focus; in-flight stale results ignored | Adopted |
| `PersonForm` | Controlled `draft`/`onChange` (parent keeps drafts across dialog close), `onSubmit`, `saving`, submit label/icon; `draftFromPerson`/`draftToPayload` helpers | Shared by Add and Edit dialogs; native labelled inputs; unknown-time toggle carries the date between inputs | Adopted |
| Person rows | Non-interactive card with Include (toggle), Edit and Remove icon buttons; row is draggable; natal charts open by running a reading | No card-level click target; actions wrap below identity on narrow rows; quiet icon buttons with named actions; grip shown only for fine pointers | Adopted |
| `ReadingSlot` | `label`, `emptyText`, `person`, `dragActive`, `onDropPerson(id)`, `onClear` | Labelled group accepting only the custom person drag type; dashed when empty, solid when filled, highlighted while dragging/over. Reading mode follows the filled slots (one = natal, two = synastry), so there is no separate mode control. The Include toggle (`aria-pressed`) on each person is the required non-drag alternative (WCAG 2.5.7) and the main path on touch | Adopted |
| `Modal` | `open`, `onClose`, `title`, `children` unchanged | Native `showModal`, inert background, named dialog, Escape/close/outside click; bounded viewport scroll; trigger restoration | Adopted |
| `useModalDialog` | `open` -> dialog ref | Shared lifecycle for scroll locking and restoration; does not own application state | Internal |
| `AiChatDrawer` | Existing endpoints/title/archetype callback; always uses the Anthropic provider | Native modal, close button pinned top-right; keyboard separator and range resize alternative; named scroll region, labelled composer; IME/Shift+Enter retained; shows formatted snapshots while the reading streams | Adopted |
| `AiMarkdown` | `children` markdown string from the server | Allowlisted elements only (headings, paragraphs, lists, emphasis, quote, rule); links/images/code/HTML unwrapped to text; headings render one level below the drawer title; `.ai-markdown` supplies spacing and list markers | Adopted |
| `AppHeader` and shell | Existing routes | One header/main, skip link, wrapping navigation, `aria-current` | Adopted |
| `ReadingsMenu` | Reads `useSessionReadings()`; entries added by the dashboard reading form, removed with their people | Hidden until a reading is run this session; disclosure button (`aria-expanded`) over real links, newest first, current one marked; Escape returns focus; list anchors to the nav so it stays in the viewport | Adopted |
| `ChartDataList` | `label`, entries of `label`, numeric `value`, optional `onSelect` | Visible data alternatives; actions are real buttons, not clickable SVG-only targets | Adopted |
| `TransitList` | `hits`, `targetLabel`, optional `emptyMessage` | `.transit-row`: glyph cluster never breaks; orb wraps under the description when the row is narrow | Adopted |
| `ChartPointLegend` | Hidden point set, toggle/show/hide callbacks | Pressed state, visible text and strike-through when hidden | Adopted |
| `AspectGrid` | Existing point axes and aspects | Native headers/caption; named focusable local scroll region; aspect/orb text alternatives retained | Adopted |
| Metric charts | Existing balance/chart and optional selection callback | Semantic colors, fixed plot block size, no animation, visible counts and keyboard alternatives | Adopted |
| SVG wheel | Existing chart data and point visibility | Square CSS box, SVG accessible name; chart geometry/colors remain domain exceptions | Provisional |

### Examples and content rules

```tsx
<label htmlFor="report-date">Transit date</label>
<input id="report-date" className="input" type="date" />
<button className="btn-primary" disabled={pending}>
  {pending ? "Saving..." : "Save person"}
</button>
<Modal open={open} onClose={close} title="Placement details">
  <p>{details}</p>
</Modal>
<ChartDataList label="House counts" entries={houseCounts} />
```

Use concise task names, persistent labels, realistic long names, and domain-specific
empty/error states. Do not convert navigation to buttons or put interactive elements
inside other interactive elements. Do not attach `aria-describedby` to an entire
long structured dialog: its heading and content provide the reading structure.
Form mutations retain input on failure; a pending submit is disabled and success is
announced. Location search failure must not prevent direct location/coordinate entry.

## Layout recipes

- `.app-page`: centered `--content-width` maximum, 1rem gutters (1.5rem at 64rem), trailing space
  for the fixed launcher. Header/nav wrap in DOM order without a hidden mobile menu; below
  30rem the primary links share one full-width row with icons stacked over labels, so no
  destination is orphaned on a second line.
- `--inset-row` (0.75rem, 1rem at 40rem): inline padding for list rows and section headings
  that show a hover surface, so content never touches the highlighted edge. Headings use the
  same inset so their icons align with row content. Never set `padding-inline: 0` on a
  `.nav-link` or other control with a hover background.
- `.page-title`: 2rem below 40rem, 2.5rem above; `.page-heading` block margin follows the
  same step. Stepped rem sizes, not viewport-scaled type.
- `.report-pair`: auto-fit columns with an 18rem preferred minimum, bounded by 100%
  available width. Use for person pairs, chart comparisons, and form sections.
- `.report-layout`: one column below 64rem; then a 22rem chart rail plus flexible
  detail column. This leaves adequate width for real chart labels and report text.
  On the synastry report, only the summary metrics and house counts sit beside the rail;
  house explanations, cross-aspects, composite/Davison and transits follow at full width
  in a second `.report-details` block so long content is not confined under an empty rail.
- `.report-chart`: wrapping flex row. The wheel (`svg` child or `.report-wheel` figure when a
  caption is needed; 22rem basis, 420px max) and `.point-legend` (16rem basis) sit side by
  side whenever both fit (roughly 40-64rem viewports) and stack in the 22rem rail or on phones.
  No breakpoint: the item bases decide.
- `.report-details`: named inline-size container. `.report-metrics` becomes three
  columns at a **38rem container** width, not a viewport breakpoint, so each plot has
  useful room. Details/rail and nested sections permit intrinsic shrinkage.
- Sticky chart rail only at >=64rem width and >=56rem height; it stays in flow on
  reduced-height/landscape screens to avoid obstructing content.
- `.data-scroll`: explicitly positioned clipping/scroll boundary, keyboard focusable.
  The aspect table keeps a 34rem minimum for comparison. Absolutely positioned hidden
  labels must resolve inside this region or they can cause document overflow.
- `.ds-dialog`: maximum 36rem width with 1rem viewport gutters and bounded `dvh`
  height; `.chat-drawer`: end-aligned, viewport bounded, preserved 320-900px requested
  width, independently scrolling conversation. Safe-area padding protects composer.
- Charts use intrinsic widths and stable plot geometry; no content is deleted to fit.
- `.wiki-nav`: 2-column grid, 3 columns at 40rem (six fixed sections form even rows), sticky
  vertical list at 64rem. `.comparison-pair` selects auto-fit at a 10rem minimum.

Logical CSS supports inline-direction changes, but chart angular direction and drag
resizer semantics are not claimed to be a complete localized/RTL product experience.
Container queries, native dialog, and `dvh` require evergreen browsers; the single
column layout and `vh` remain fallbacks, not a legacy-browser support guarantee.

## Migration map

| Before | Current path | Follow-up |
| --- | --- | --- |
| Repeated page headers/wrappers | `App` shell, `AppHeader`, `.app-page` | Do not reintroduce page-local headers |
| Floating section panels and fixed page grids | `.report-section`, `.report-layout`, `.report-pair` | Keep sections unframed; cards only for repeated placements/reference items |
| Separate zodiac button styles | `.segmented-control`, native labelled fieldset | Use the same selection styling on both entry points |
| Ad hoc overlay div | Native dialogs + `useModalDialog` | Drawer now intentionally requires closing before background interaction |
| Mouse-only metric actions | `ChartDataList` beside plots | Preserve both visible data and pointer actions |
| Unbounded table/hidden-label positions | Positioned `.data-scroll` | Do not replace with document-wide overflow hiding |
| Untokenized Recharts grid/tooltip/bar colors | Semantic CSS tokens | Wheel wedges/aspect palette remain intentional domain exceptions |
| Late location responses/native button popup | Tested manual-selection combobox | Public callback API unchanged |

Legacy `midnight`, `aurora`, and `stardust` names are stable brand aliases.
`slate-400/500` mappings are temporary muted-text compatibility aliases; do not add
new uses. Migrate remaining slate backgrounds/borders and explanatory subcomponents
opportunistically to `surface`, `elevated`, `muted`, `line`, and status tokens. Remove
an alias only after a usage search finds no consumers and rendered contrast is tested.
Raw wheel geometry, zodiac wedge/aspect encodings, and the adjustable drawer's pixel
range are justified exceptions. No page/API exports or application routes were removed.

## Contribution and release gates

1. Identify the owning shared component and a real consumer before adding a token or
   primitive. Reuse native HTML and keep APIs small; no parallel UI framework.
2. Include a focused behavior regression for interaction changes and inspect an actual
   page for CSS/layout changes. Typechecking alone is not rendered-layout evidence.
3. Run `pnpm --filter @astro/web test`, `pnpm --filter @astro/web build`, and relevant
   engine tests. Run lint when a repo configuration exists; do not report an absent
   config as a pass. Use `git diff --check` for patch hygiene.
4. Exercise representative keyboard flow and axe at narrow/wide sizes; also test
   320/375/600/768/1024/1280/1536 widths, short landscape, content expansion, enlarged
   text, reduced motion, and forced colors. Real browser zoom and screen-reader work
   must be labelled separately from automation or viewport simulation.
5. Review snapshots visually and measure document overflow/chart bounds. Add persistent
   screenshot baselines when browser-test infrastructure is adopted; screenshots in a
   chat session are evidence, not a maintained visual-regression suite.
6. Record component status, compatibility impact, migration path, and exceptions here.
   Any breaking prop/token removal needs a consumer map and coordinated migration in
   the same release. Document temporary adapters with removal conditions.

Verification results and known limits: [design-system-verification.md](design-system-verification.md).
Interaction references: [WAI combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
and [WAI modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).
# Astra Synastry

A complete astrology synastry (relationship compatibility) application: natal charts, synastry,
composite & Davison charts, transits, secondary progressions, aspect-pattern detection,
compatibility scoring/graphs, and AI-generated narrative analysis (OpenAI + Anthropic).

## Architecture

Monorepo (pnpm workspaces):

- `packages/shared` — shared TypeScript types & constants (planets, signs, houses, aspects, orb tables, glyphs).
- `packages/astro-engine` — pure calculation engine (ephemeris via `sweph`, houses, aspects/patterns,
  natal/synastry/composite/davison/transits/progressions, compatibility scoring, geocoding/timezone helpers).
  Independently unit-tested against known astronomical reference points (equinoxes/solstices, retrograde windows).
- `apps/server` — Express + TypeScript API: Prisma (SQLite by default for local dev, Postgres-ready),
  REST routes, AI provider abstraction with SSE streaming and response caching. No authentication —
  intended for local/single-user use.
- `apps/web` — React + TypeScript + Vite UI: SVG chart-wheel (natal + synastry biwheel), aspect grid,
  compatibility dashboards (Recharts), AI analysis panel.

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- A database: **SQLite is used by default** (a local file, `apps/server/prisma/dev.db` — zero setup
  required). To use Postgres instead, change `provider` back to `"postgresql"` in
  `apps/server/prisma/schema.prisma`, point `DATABASE_URL` at your instance (the included
  `docker-compose.yml` can start one via `pnpm db:up`), and re-run the migration.

## Setup

```powershell
pnpm install
copy .env.example .env   # then fill in AI API keys as desired
pnpm --filter @astro/server prisma:migrate   # creates apps/server/prisma/dev.db
```

## Running locally

```powershell
pnpm dev:server   # http://localhost:4000
pnpm dev:web      # http://localhost:5173 (proxies /api to the server)
```

## Notes on accuracy & configuration

- The ephemeris engine defaults to Swiss Ephemeris's built-in **Moshier** approximation (arc-second
  accurate, no external data files required). Chiron requires real ephemeris data files (not bundled);
  it's silently omitted from a chart if no data file is configured. To enable full Swiss Ephemeris
  precision (and Chiron), download data files from the [Swiss Ephemeris repo](https://github.com/aloistr/swisseph/tree/master/ephe)
  and call `configureEphemeris({ mode: "swiss", ephePath: "/path/to/ephe" })` before computing charts.
- AI analysis requires `OPENAI_API_KEY` and/or `ANTHROPIC_API_KEY` in `.env`. Without a key configured,
  a placeholder analysis is returned so the rest of the app remains usable without any AI account.
- Geocoding/timezone resolution uses free, keyless services (OpenStreetMap Nominatim + the local `geo-tz`
  database), so no additional API keys are needed for birth-place lookup.

## Testing

```powershell
pnpm --filter @astro/astro-engine test   # ephemeris/aspect/synastry accuracy & integration tests
```

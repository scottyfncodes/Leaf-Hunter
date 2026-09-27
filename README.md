# Leaf Hunter

**Find the color. Chase the peak.**

A mobile-first, installable web app for finding where fall color is happening right now in Colorado and deciding whether it is worth the drive. No account, no backend: the first version runs entirely in the browser with seeded demo data and on-device storage.

## What it does

- **Explore** – a status headline generated from the dataset ("PEAK COLOR IS HAPPENING"), a purpose-built SVG trailhead map with foliage pins, and a list view with search and filters.
- **The Color Wave** – how color is moving down Colorado's elevation bands now and over the next seven days.
- **Location detail** – status, color percent, confidence, quick facts, recent reports, why go, photos, and maps deep links.
- **Hunt** – pick a time budget and optional preferences; get a handful of destinations with plain-language reasons.
- **Chase** – a lightweight foliage road trip from a start city along one road corridor, with an "open in Maps" link.
- **Leaf check** – a sub-20-second report flow (spot, slider, optional note and photo), persisted on the device.
- **Watchlist** – saved spots with change since your last look.
- **PWA** – manifest, service worker, standalone display, app icon, safe-area handling.

## Data honesty

Foliage timing is estimated from each spot's typical peak window (based on elevation and latitude) and adjusted by recent reports. Reports labelled **Demo** are generated deterministically from that model so the app feels alive on any date; they are not observations. User reports are labelled as stored on this device. Outside the season, the app says so instead of showing stale peak claims.

Preview any date with `?today=YYYY-MM-DD` before the hash, e.g. `/?today=2026-11-20#/`.

## Stack

Vite · React 18 · TypeScript · vanilla CSS with design tokens · Vitest · vite-plugin-pwa. No map provider, no runtime dependencies beyond React and React Router.

```
src/
  domain/     status model, season logic, filters, search, hunt, chase, color wave
  data/       regions/<region>/ (locations, map geometry), demo report generator
  storage/    ReportStore / FavoriteStore interfaces + localStorage implementation
  state/      React provider that wires domain + storage
  map/        SVG projection and the FoliageMap component
  screens/    Explore, Wave, LocationDetail, Hunt, Chase, Watchlist, More, Report
  components/ shared UI
```

Adding another state means adding `src/data/regions/<state>/` and listing it in `src/data/regions/index.ts`.

## Develop

```
npm install
npm run dev        # local dev server
npm test           # vitest
npm run typecheck
npm run build      # production build to dist/
```

Set `GITHUB_PAGES=true` (or `VITE_BASE=/your/path/`) when building for a sub-path host. `scripts/render-icons.mjs` regenerates the PNG icons from `public/icons/*.svg`.

## Deploy

`.github/workflows/deploy.yml` builds and deploys to GitHub Pages on pushes to `main`. In the repository settings, set Pages → Source to **GitHub Actions**. The app is served at `https://<owner>.github.io/Leaf-Hunter/`.

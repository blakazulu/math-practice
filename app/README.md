# חשבונייה — Math Practice App

Hebrew RTL web app to drill the 497-question math bank from the parent repo. Built with Vite + React + TypeScript + Tailwind, persists progress in localStorage, runs entirely client-side.

## Quickstart

```bash
npm install
npm run sync-data    # copy ../data/*.json + ../docs/images/ into public/data/
npm run dev          # http://localhost:5173
```

## Scripts

| Script | What |
| ------ | ---- |
| `npm run dev` | Start Vite dev server (auto-syncs data first) |
| `npm run build` | Type-check + bundle to `dist/` |
| `npm run preview` | Serve the built bundle locally |
| `npm test` | Run unit + component tests once (Vitest) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Playwright happy-path E2E (requires `npx playwright install chromium` once) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run sync-data` | Copy fresh JSON + images from repo into `public/data/` |

## Deployment

Static build → drop `dist/` on any host. The included `.github/workflows/deploy.yml` deploys to GitHub Pages automatically when files under `app/` or `data/` change on `main`.

## Adding images for image-dependent questions

1. Add the image to `docs/images/<name>.png` in the parent repo.
2. Edit `docs/images/mapping.json` to point the relevant `q_id`(s) to that file.
3. Run `npm run sync-data` and rebuild.

Multiple questions can share the same image (follow-up questions) — set their `image_file` to the same path.

## Architecture

- **Routing:** HashRouter so the site works from any subpath / static host.
- **State:** Zustand with three slices — `bank` (in-mem, loaded JSON), `users` (persisted localStorage with versioned schema), `session` (in-mem practice/exam state).
- **Styling:** Tailwind + Heebo, all design tokens defined in `tailwind.config.ts`.
- **Icons:** lucide-react only — no emoji anywhere in the UI.
- **Math:** KaTeX rendering inline `\(...\)` from question text.

See `docs/superpowers/specs/2026-05-17-math-practice-app-design.md` for full design.

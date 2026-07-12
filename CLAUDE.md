# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # dev server (Turbopack) at http://localhost:3000
npm run build            # production build
npm run start            # serve the production build
npm run typecheck        # tsc --noemit
npm run lint             # eslint .
npm run test:unit        # Vitest unit tests (no server/env) — this is what CI runs
npm run test:watch       # Vitest in watch mode
npm run test:integration # Playwright integration suite (alias: npm run playwright)
```

There is **no `format` script** and `npm run lint` is **ESLint-only** — Prettier is not
wired into lint or CI. Formatting follows `.prettierrc` (no semicolons, single quotes,
`printWidth` 100, `prettier-plugin-tailwindcss`); run `npx prettier --write` on changed
files manually before committing — but **only on code files**. Do not run it on `CLAUDE.md` or
other markdown: it reformats the whole file (`*emphasis*` → `_emphasis_`, blank lines after list
intros), burying the real change in unrelated churn. Hand-edit markdown instead.

There are two distinct test layers:
- **Unit (Vitest, `*.test.ts`)** live in a `__tests__/` directory next to the module they
  cover (e.g. `src/clients/youtube/__tests__/playlist-items.test.ts`). No network, no env, no
  server — fast and CI-safe. This is the layer to extend for pure logic. Config:
  `vitest.config.ts` (only matches `src/**/__tests__/**/*.test.ts`). Single test:
  `npx vitest run path/to/file.test.ts` or `npx vitest run -t "name"`.
- **Integration (Playwright, `*.spec.ts`)** live in `tests/`. Single test:
  `npx playwright test -g "name"`. Two gotchas:
  - Playwright's `webServer` runs `npm run build && npm run start`, so it always serves a
    **fresh production build** (no manual `npm run build` needed; `timeout` is raised for the
    cold build). It deliberately does **not** use the dev server: the Next dev runtime fails to
    hydrate React under Playwright's Chromium (HMR WebSocket handshake fails), so client
    interactions like the shorts toggle never fire — only the production build hydrates reliably.
  - `tests/api.spec.ts` and `tests/frontpage.spec.ts` hit the **live YouTube Data API and the
    real MongoDB**, and `/api/fetch-data` / `/api/refresh-channels` **mutate the database**.
    They need real env, so they are **local-only** — CI runs only `test:unit`.

Other notes:
- Node >= 24, ESM (`"type": "module"`). TypeScript is `@tsconfig/strictest` and ESLint is
  `strictTypeChecked` — expect `noUncheckedIndexedAccess`, so index/env access uses bracket
  notation (`process.env['X']`, `styles['title']`).
- `npm run build` prints **no JS size columns** (only Route/Revalidate/Expire), so bundle-size
  questions need measuring by hand:
  `find .next/static/chunks -name '*.js' -exec cat {} + | gzip -c | wc -c`. Compare branches with
  a clean `.next` each time.

## Environment

`SERVER_ENV` (`src/utils/server-env.ts`) parses env via zod **at module import time**, so the
app and most route modules fail to load if any are missing. Set them in `.envrc` (direnv):
`MONGODB_URI`, `YOUTUBE_API_KEY`, `SECRET` (and optionally `CRON_SECRET`). Never import
`server-env` into code meant to be unit-tested without env.

## Architecture

A YouTube subscription replacement: it tracks a set of channels, periodically pulls their
latest uploads into MongoDB, and renders them as a grid. The frontend never calls YouTube
directly — it only reads pre-computed videos from the DB.

**Data flow:** `POST /api/fetch-data` (intended to run on a schedule — see Vercel Cron and the
`CRON_SECRET` note in `src/utils/api-helpers.ts`) is the heavy refresh job. Per channel it:
lists the uploads playlist (`getVideosForChannelId`), fetches durations/live status
(`getContentDetailsForVideos`), classifies shorts, sorts newest-first, keeps the latest ~120,
and writes them. The homepage server component reads that stored set. The YouTube client lives
in `src/clients/youtube/`; the Mongo client + all DB access in `src/clients/mongodb/`.

**Per-channel resilience (both refresh routes):** channels are refreshed independently via
`Promise.allSettled`, so one failing channel never aborts the run. The settled results are fed
to a *pure, unit-tested* aggregator — `aggregateRefresh` (`fetch-data`) and `refreshAllChannels`
(`refresh-channels`) — which decides what to persist and shares one HTTP-status policy
(`src/utils/refresh-status.ts`, `refreshStatus`): **no channel succeeded → 500** (and the DB is
left untouched rather than blanked — `videosToStore` is `null`), **all succeeded → 200**, **some
succeeded → 207** (store the survivors). The empty-guard keys on *channels that succeeded*, not
on video count — a channel with zero uploads is still a success. When adding logic to a refresh
route, keep the fetch/`allSettled` in the route and the decision in the pure aggregator.

**MongoDB shape (`youtube-serverless` db):** two collections. `channels` holds one document per
tracked channel. `videos` holds a **single document** with a `videos` array — written with
`updateOne({}, …, { upsert: true })` and read with `findOne()`. Stored videos may predate the
shorts fields, so `normalizeStoredVideo` backfills `isShort`/`shortDetectionMethod` on read.

**Shorts detection (`src/utils/youtube-shorts.ts`):** `classifyShortVideo` prefers the
authoritative signal — `isVideoServedAsShort` does a `HEAD` on `youtube.com/shorts/<id>` and
inspects the redirect — and falls back to duration (≤ 3 min) when that's inconclusive. The
result is persisted with the method used (`youtube-shorts-url` | `duration` | `unknown`).

**Frontend:** App Router, React 19 with the **React Compiler enabled** (`reactCompiler: true`).
Manual `useMemo`/`useCallback`/`memo` are kept intentionally as a safety net alongside the
compiler — **do not strip them**; adding them is fine too. The page (`src/app/page.tsx`) is a
server component pulling the latest 60 via the `getVideos` server action. Shorts are hidden by
default and the "Show shorts" toggle is **purely client-side** (`?showShorts=1`), driven through
`window.history` and kept in sync with Next's `useSearchParams` (`src/hooks/use-search-params.ts`).
Because filtering happens client-side over the already-fetched set, the visible long-video count
varies with how many of the latest videos are shorts. Styling is Tailwind v4 + daisyUI.

**Caching (layered, invalidated explicitly):** page `revalidate = 3600`; the `getVideos` action
is wrapped in React `cache`; `getLatestVideos` is wrapped in `unstable_cache` (tag
`latest-videos`, 1h revalidate). Writes invalidate via `revalidateTag('latest-videos')`
(`putLatestVideos`) and `revalidatePath('/')` (the routes).

**API routes** (all under `src/app/api/`, all gated by `isApiRequestAuthenticated`, which accepts
`Authorization: Bearer <CRON_SECRET>`, `Authorization: <SECRET>`, or `?token=<SECRET>`):
`fetch-data` (refresh videos), `refresh-channels` (refresh channel metadata), `add-channel`
(add one by `channelId`/`username`; persists only with `?store=true`), `load-channels` (bulk
import via body), `dump-channels` (GET export). Auth is split for testability:
`isApiRequestAuthenticated` (`api-helpers.ts`) just adapts a `NextRequest` + `SERVER_ENV` into
the pure `isAuthorized` (`is-authorized.ts`), which holds the actual logic and is the unit-tested
part. The `cronSecret != null` guard there is load-bearing — without it a missing `CRON_SECRET`
would match the literal header `Bearer undefined`.

## Conventions

- **zod is the validation layer everywhere**, imported as `import * as z from 'zod/mini'` — the
  tree-shakeable entrypoint, never bare `'zod'`. Mini has **no method chaining**: wrappers are
  functions (`z.optional(x)`, `z.nullable(x)`, `z.readonly(x)`, `z.safeExtend(base, {…})` — prefer
  `safeExtend` over `extend`, which lets an overlapping key silently replace the base's with an
  incompatible type) and refinements go through `.check(…)` (`z.string().check(z.minLength(1))`,
  `z.array(x).check(z.maxLength(50))`, `z.int().check(z.positive())`). Runtime-validated function
  signatures via `z.function({...}).implementAsync(...)` work unchanged. When an
  `interface X extends z.infer<typeof schema>` is used as an array/element type, the codebase casts
  `schema as z.ZodMiniType<X, X>` (mini's name for `ZodType`) — this is intentional and
  repository-wide; keep it for consistency. Parsing uniformly uses `parseAsync`.
- Keep network/`fetch` and `SERVER_ENV` access out of pure logic so it stays unit-testable — see
  `src/clients/youtube/playlist-items.ts` (pure parse + filter) vs `index.ts` (does the fetch).
- When handling YouTube playlist data, remember deleted/private videos stay in the uploads
  playlist with degraded fields (empty thumbnails, no `videoPublishedAt`); they're dropped by
  whitelisting `public`/`unlisted` `privacyStatus` rather than blacklisting bad values.

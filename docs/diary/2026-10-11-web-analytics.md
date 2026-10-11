# Diary: Vercel Web Analytics for the web build

The user enabled Web Analytics (Hobby) on the Vercel project `dansk-grammatik` and asked for it to be wired into the app. The app is an Expo Router single-page web export (`"output": "single"` in `/app.json`), deployed to Vercel from GitHub.

## Step 1: Add page-view analytics

**Author:** main

### Prompt Context

**Verbatim prompt:** https://vercel.com/sushantjdk-2097s-projects/dansk-grammatik/analytics?source=prod-checklist&environment=all Implement web analytics for this project through Vercel. I've enabled it in hobby mode.
**Interpretation:** Make the production web build send page views to Vercel Web Analytics.
**Inferred intent:** See how the app is used, with route-level page views, without harming privacy.

### What I did
- **`/src/analytics/route.ts`:** pure helpers. `routeFromSegments` turns Expo Router segments into a route pattern (groups such as `(tabs)` drop out, `[id]` stays). `redactUrl` removes query strings and fragments. Tests are in `/src/analytics/route.test.ts`.
- **`/src/analytics/index.web.ts`:** sets up the `window.va` command queue, registers a `beforeSend` that applies `redactUrl`, and appends a deferred `<script src="/_vercel/insights/script.js" data-disable-auto-track="1">`. It is skipped in development (`__DEV__`). `trackPageview` sends `va('pageview', { route, path })`.
- **`/src/analytics/index.ts`:** a no-op for iOS and Android.
- **`/app/_layout.tsx`:** a `usePageviews` hook in `RootStack` starts analytics once and sends a page view each time the pathname changes.
- **`/README.md`:** a new "Analytics" section.

### Why
The app is a single-page app, so only the first load would count unless route changes are reported. Reporting route patterns also groups dynamic screens (`/sets/[id]`) into one page each.

### What worked
- I read `@vercel/analytics@2.0.1`'s source without installing it (`npm pack` into the scratchpad) and reproduced its `inject()`, `pageview()` and data attributes exactly.
- The production bundle contains the loader (I grepped `dist/_expo/static/js/web/entry-*.js` for `_vercel/insights/script.js` and `disableAutoTrack`).
- `https://dansk-grammatik.vercel.app/_vercel/insights/script.js` already returned `200 application/javascript` before this deploy.

### What didn't work
`npm install @vercel/analytics@^2.0.1` failed:
```
npm error ERESOLVE could not resolve
npm error Found: vite@7.3.6
npm error   peerOptional vite@"^5.0.0 || ^6.0.0 || ^7.0.0-0" from @vitest/mocker@3.2.7
npm error Conflicting peer dependency: vite@8.3.4
npm error   peer vite@"^8.0.0-beta.7 || ^8.0.0" from @sveltejs/vite-plugin-svelte@7.3.1
npm error       peerOptional @sveltejs/kit@"^1 || ^2" from @vercel/analytics@2.0.1
```
I didn't use `--legacy-peer-deps`, because Vercel's own `npm install` could then fail.

### What I learned
- Vercel's docs say neither the plain `inject()` nor the HTML snippet tracks route changes. Route tracking only comes from `disableAutoTrack` plus manual `pageview({ route, path })` calls.
- v2 reads its script and endpoint paths from a build-time variable (`VERCEL_OBSERVABILITY_CLIENT_CONFIG`). Metro only inlines `EXPO_PUBLIC_*` variables, so the package would fall back to `/_vercel/insights/script.js` anyway. Vercel still serves that path once Web Analytics is enabled.

### What was tricky
Privacy. Sign-in and password-reset links can carry tokens in the query or `#` fragment (`/src/auth/supabase.ts` sets `detectSessionInUrl: false`, so they can stay in the URL). `beforeSend` strips both from every event.

### What warrants review
- Confirm the Analytics tab shows views a few minutes after the deploy.
- In the browser's network tab on production, check for a request to `/_vercel/insights/view` with a path but no query string.
- While signed out, page views are recorded under whatever URL is open behind the sign-in screen.

### Future work
Custom events (for example answers checked, or the tap/type mode chosen) need the Pro plan; on Hobby only page views are recorded.

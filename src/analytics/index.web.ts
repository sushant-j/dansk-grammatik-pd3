/**
 * Vercel Web Analytics for the web build: cookieless page views, viewed in
 * the project's Analytics tab on Vercel.
 *
 * This does what `@vercel/analytics`'s `inject()` and `pageview()` do — a
 * `window.va` command queue and Vercel's script — without the package: its
 * optional SvelteKit peer chain conflicts with Vitest's Vite, and its build-
 * time config is read from an env var that Metro doesn't inline. The legacy
 * `/_vercel/insights/*` routes are served for every project with Web
 * Analytics enabled.
 *
 * Automatic tracking is off (`data-disable-auto-track`); the root layout
 * reports each screen with its route pattern instead, so "/sets/[id]" is one
 * page in the dashboard rather than one per set. Every URL loses its query
 * string and fragment before it is sent (see redactUrl).
 *
 * Not loaded in development: the script only exists on a Vercel deployment.
 */

import { redactUrl } from './route';

type VaEvent = { url: string } & Record<string, unknown>;
type Va = (...params: unknown[]) => void;

declare global {
  interface Window {
    va?: Va;
    vaq?: unknown[][];
  }
}

const SCRIPT_SRC = '/_vercel/insights/script.js';

let started = false;

export function startAnalytics(): void {
  if (started || __DEV__ || typeof window === 'undefined' || typeof document === 'undefined') return;
  started = true;

  // Calls made before the script has loaded wait in `vaq`; the script drains it.
  window.va =
    window.va ??
    ((...params: unknown[]) => {
      (window.vaq = window.vaq ?? []).push(params);
    });
  window.va('beforeSend', (event: VaEvent) => ({ ...event, url: redactUrl(event.url) }));

  if (document.head.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;
  const script = document.createElement('script');
  script.src = SCRIPT_SRC;
  script.defer = true;
  script.dataset.disableAutoTrack = '1';
  document.head.appendChild(script);
}

export function trackPageview(route: string, path: string): void {
  if (!started) return;
  window.va?.('pageview', { route, path });
}

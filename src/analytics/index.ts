/**
 * Page-view analytics. Vercel Web Analytics only exists on the web build
 * (see index.web.ts); on iOS and Android these do nothing.
 */

export function startAnalytics(): void {}

export function trackPageview(_route: string, _path: string): void {}

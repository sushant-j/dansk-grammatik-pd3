/**
 * Pure helpers for page-view analytics, kept apart from the browser code so
 * they can be tested.
 */

/**
 * The route pattern for a screen, from Expo Router's segments: groups such
 * as "(tabs)" drop out, dynamic segments stay as written. So every vocabulary
 * set counts as one page, "/sets/[id]", rather than one page per set.
 */
export function routeFromSegments(segments: readonly string[]): string {
  const parts = segments.filter((s) => !(s.startsWith('(') && s.endsWith(')')));
  return '/' + parts.join('/');
}

/**
 * A URL with its query string and fragment removed. Sign-in and
 * password-reset links can carry tokens there, and they must never reach
 * analytics; the path alone says which page was viewed.
 */
export function redactUrl(url: string): string {
  const cut = url.search(/[?#]/);
  return cut < 0 ? url : url.slice(0, cut);
}

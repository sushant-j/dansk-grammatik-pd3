import { describe, expect, it } from 'vitest';
import { redactUrl, routeFromSegments } from './route';

describe('routeFromSegments', () => {
  it('drops group segments and keeps dynamic ones as patterns', () => {
    expect(routeFromSegments(['(tabs)', 'progress'])).toBe('/progress');
    expect(routeFromSegments(['sets', '[id]'])).toBe('/sets/[id]');
    expect(routeFromSegments(['path', 'run', '[nodeId]'])).toBe('/path/run/[nodeId]');
  });
  it('is "/" for the index route', () => {
    expect(routeFromSegments([])).toBe('/');
    expect(routeFromSegments(['(tabs)'])).toBe('/');
  });
});

describe('redactUrl', () => {
  it('removes the query string and the fragment', () => {
    expect(redactUrl('https://x.app/drill/verbs?topic=vt-form')).toBe('https://x.app/drill/verbs');
    expect(redactUrl('https://x.app/#access_token=secret&type=recovery')).toBe('https://x.app/');
    expect(redactUrl('https://x.app/reset?code=abc#t=1')).toBe('https://x.app/reset');
  });
  it('leaves a clean URL alone', () => {
    expect(redactUrl('https://x.app/train')).toBe('https://x.app/train');
  });
});

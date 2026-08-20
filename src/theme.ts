/**
 * Design tokens. Two palettes (light/dark) resolved at runtime by useTheme().
 *
 * The field colours are load-bearing, not decoration: every field of the
 * sætningsskema keeps the same hue everywhere it appears — on the board, in a
 * rule card, in the grammar map. Learners come to read "the blue slot" as
 * "finite verb", which is the whole point of teaching with the schema.
 */

export type Mode = 'light' | 'dark';

const shared = {
  radius: { sm: 8, md: 12, lg: 18, xl: 26 },
  space: (n: number) => n * 4,
  font: {
    display: { fontSize: 30, fontWeight: '700' as const, letterSpacing: -0.6 },
    title: { fontSize: 21, fontWeight: '700' as const, letterSpacing: -0.3 },
    heading: { fontSize: 16, fontWeight: '700' as const, letterSpacing: -0.1 },
    body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
    chip: { fontSize: 16, fontWeight: '600' as const },
    label: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.8 },
    mono: { fontSize: 13, fontWeight: '500' as const },
  },
};

const light = {
  bg: '#FBF9F6',
  surface: '#FFFFFF',
  surfaceSunken: '#F1EDE7',
  border: '#E2DCD3',
  borderStrong: '#CFC6B9',
  text: '#1B1A18',
  textMuted: '#6B6559',
  textFaint: '#9A9184',
  accent: '#C8102E',
  accentSoft: '#FBE9EC',
  success: '#1F7A4D',
  successSoft: '#E4F3EB',
  warning: '#9A5B00',
  warningSoft: '#FBEEDC',
  shadow: 'rgba(27, 26, 24, 0.10)',
};

const dark: typeof light = {
  bg: '#141416',
  surface: '#1D1D20',
  surfaceSunken: '#111113',
  border: '#2E2E33',
  borderStrong: '#43434A',
  text: '#F2F0EC',
  textMuted: '#A5A099',
  textFaint: '#6F6A63',
  accent: '#FF5C74',
  accentSoft: '#3A1D24',
  success: '#5BD39B',
  successSoft: '#12301F',
  warning: '#F0B357',
  warningSoft: '#33240E',
  shadow: 'rgba(0, 0, 0, 0.45)',
};

/** Per-field hues, indexed by FieldId. Kept in sync with grammar/fields.ts. */
const fieldHues = {
  forfelt:            { light: '#6E5BD0', dark: '#A392F0' },
  konjunktional:      { light: '#6E5BD0', dark: '#A392F0' },
  finitVerbum:        { light: '#0E6FBF', dark: '#5AB0F5' },
  subjekt:            { light: '#1F7A4D', dark: '#5BD39B' },
  centraladverbial:   { light: '#C8102E', dark: '#FF7C90' },
  infinitVerbum:      { light: '#2E8FA8', dark: '#68C7DE' },
  objekt:             { light: '#B4690E', dark: '#F0B357' },
  indholdsadverbial:  { light: '#8A5A9B', dark: '#C79BD6' },
} as const;

export type FieldHueKey = keyof typeof fieldHues;

export type Theme = typeof shared & {
  mode: Mode;
  c: typeof light;
  field: (k: FieldHueKey) => string;
};

export function buildTheme(mode: Mode): Theme {
  const c = mode === 'dark' ? dark : light;
  return {
    ...shared,
    mode,
    c,
    field: (k) => fieldHues[k][mode],
  };
}

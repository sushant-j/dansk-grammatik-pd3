/**
 * Design tokens. Two palettes (light/dark) resolved at runtime by useTheme().
 *
 * The field colours are load-bearing, not decoration: every field of the
 * sætningsskema keeps the same hue everywhere it appears — on the board, in a
 * rule card, in the grammar map. Learners come to read "the blue slot" as
 * "finite verb", which is the whole point of teaching with the schema.
 */

export type Mode = 'light' | 'dark';

/**
 * One typeface: Atkinson Hyperlegible Next. It was drawn for low-vision
 * readers, which makes it unusually good for second-language learners too —
 * I/l/1, O/0 and rn/m never blur, and æ, ø, å stay distinct at small sizes.
 * Each weight is its own family on native, so tokens name the family rather
 * than relying on fontWeight (see `fontFamilyFor`).
 */
export const FONT = {
  regular: 'AtkinsonHyperlegibleNext_400Regular',
  italic: 'AtkinsonHyperlegibleNext_400Regular_Italic',
  medium: 'AtkinsonHyperlegibleNext_500Medium',
  semibold: 'AtkinsonHyperlegibleNext_600SemiBold',
  bold: 'AtkinsonHyperlegibleNext_700Bold',
  extrabold: 'AtkinsonHyperlegibleNext_800ExtraBold',
} as const;

/** Map a weight (and italic flag) to the family file that carries it. */
export function fontFamilyFor(weight: string | number | undefined, italic = false): string {
  const w = Number(weight === 'bold' ? 700 : weight === 'normal' || weight == null ? 400 : weight);
  if (italic && w < 500) return FONT.italic;
  if (w >= 800) return FONT.extrabold;
  if (w >= 700) return FONT.bold;
  if (w >= 600) return FONT.semibold;
  if (w >= 500) return FONT.medium;
  return FONT.regular;
}

// Type scale follows the classic 12·14·16·18·21·24·36 progression.
const shared = {
  radius: { sm: 6, md: 10, lg: 14, xl: 22 },
  space: (n: number) => n * 4,
  font: {
    display: { fontSize: 34, fontWeight: '800' as const, letterSpacing: -0.8, lineHeight: 38 },
    title: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3, lineHeight: 28 },
    heading: { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.1, lineHeight: 22 },
    body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
    chip: { fontSize: 16, fontWeight: '600' as const },
    label: { fontSize: 13, fontWeight: '500' as const, letterSpacing: 0, lineHeight: 18 },
    mono: { fontSize: 13, fontWeight: '500' as const },
  },
};

/*
 * Light is exercise-book paper: a cool grey-green off-white, not cream, with
 * graphite ink. Red is the Dannebrog red and is reserved for the one thing to
 * do next — never decoration. Field hues (below) are untouched.
 */
const light = {
  bg: '#F2F3EF',
  surface: '#FFFFFF',
  surfaceSunken: '#E8EAE4',
  border: '#D8DBD4',
  borderStrong: '#BCC0B8',
  text: '#16181B',
  textMuted: '#555B61',
  textFaint: '#868B90',
  accent: '#C8102E',
  accentSoft: '#FAE6E9',
  success: '#1F7A4D',
  successSoft: '#E1F1E8',
  warning: '#9A5B00',
  warningSoft: '#F8ECD8',
  shadow: 'rgba(22, 24, 27, 0.08)',
};

const dark: typeof light = {
  bg: '#111317',
  surface: '#1A1D22',
  surfaceSunken: '#0C0E11',
  border: '#2A2E35',
  borderStrong: '#3E434C',
  text: '#EEF0F2',
  textMuted: '#A6ACB3',
  textFaint: '#70767E',
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
  fontFamily: typeof FONT;
  mode: Mode;
  c: typeof light;
  field: (k: FieldHueKey) => string;
};

export function buildTheme(mode: Mode): Theme {
  const c = mode === 'dark' ? dark : light;
  return {
    ...shared,
    fontFamily: FONT,
    mode,
    c,
    field: (k) => fieldHues[k][mode],
  };
}

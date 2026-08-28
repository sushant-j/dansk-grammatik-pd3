/**
 * Verb bank for the tense trainer.
 *
 * Danish splits verbs into two entirely different systems, and conflating
 * them is the single biggest source of tense errors at this level:
 *
 * - Weak verbs form the past tense with a suffix (-ede or -te) glued onto the
 *   stem, plus a matching perfektum suffix (-et or -t). Which of the two
 *   suffixes a given verb takes correlates loosely with the sound at the end
 *   of the stem, but — like en/et gender — it is ultimately a property of the
 *   word, not something reliably derivable, so it is treated the same way:
 *   memorised per verb, with `wrongPast` recording the specific suffix-swap
 *   error a learner would produce.
 * - Strong verbs change their internal vowel instead (ablaut) — "gå" becomes
 *   "gik", not "gåede". There is no suffix rule to almost-apply here; the verb
 *   simply has to be known. `wrongPast` for these records the over-regularised
 *   form a learner produces by reaching for a weak ending anyway.
 *
 * `perfectAux` is the third, orthogonal fact this bank carries: most verbs
 * take "har" in the perfect tense, but a specific, learnable class — verbs of
 * motion or change of state — take "er" instead ("han ER gået", "hun ER
 * blevet syg"). This has nothing to do with weak/strong; "gå" is strong and
 * takes "er", "se" is also strong but takes "har".
 */

export type VerbClass = 'weak-ede' | 'weak-te' | 'strong';
export type PerfectAux = 'har' | 'er';

export interface VerbEntry {
  id: string;
  infinitive: string;
  present: string;
  /** Datid — simple past. */
  past: string;
  /** The specific wrong form this verb invites: a suffix-swap for weak verbs, an over-regularised guess for strong ones. */
  wrongPast: string;
  /** Perfektum — past participle, used after the auxiliary. */
  participle: string;
  verbClass: VerbClass;
  perfectAux: PerfectAux;
  glossEn: string;
}

export const VERB_BANK: VerbEntry[] = [
  // ── Weak, -ede group ─────────────────────────────────────────────────
  { id: 'v-arbejde', infinitive: 'arbejde', present: 'arbejder', past: 'arbejdede', wrongPast: 'arbejdte', participle: 'arbejdet', verbClass: 'weak-ede', perfectAux: 'har', glossEn: 'to work' },
  { id: 'v-snakke', infinitive: 'snakke', present: 'snakker', past: 'snakkede', wrongPast: 'snakte', participle: 'snakket', verbClass: 'weak-ede', perfectAux: 'har', glossEn: 'to chat' },
  { id: 'v-huske', infinitive: 'huske', present: 'husker', past: 'huskede', wrongPast: 'huskte', participle: 'husket', verbClass: 'weak-ede', perfectAux: 'har', glossEn: 'to remember' },
  { id: 'v-cykle', infinitive: 'cykle', present: 'cykler', past: 'cyklede', wrongPast: 'cyklte', participle: 'cyklet', verbClass: 'weak-ede', perfectAux: 'har', glossEn: 'to cycle' },
  { id: 'v-vaske', infinitive: 'vaske', present: 'vasker', past: 'vaskede', wrongPast: 'vaskte', participle: 'vasket', verbClass: 'weak-ede', perfectAux: 'har', glossEn: 'to wash' },
  { id: 'v-ønske', infinitive: 'ønske', present: 'ønsker', past: 'ønskede', wrongPast: 'ønskte', participle: 'ønsket', verbClass: 'weak-ede', perfectAux: 'har', glossEn: 'to wish' },
  { id: 'v-elske', infinitive: 'elske', present: 'elsker', past: 'elskede', wrongPast: 'elskte', participle: 'elsket', verbClass: 'weak-ede', perfectAux: 'har', glossEn: 'to love' },
  { id: 'v-lave', infinitive: 'lave', present: 'laver', past: 'lavede', wrongPast: 'lavte', participle: 'lavet', verbClass: 'weak-ede', perfectAux: 'har', glossEn: 'to make, to do' },

  // ── Weak, -te group ──────────────────────────────────────────────────
  { id: 'v-spise', infinitive: 'spise', present: 'spiser', past: 'spiste', wrongPast: 'spisede', participle: 'spist', verbClass: 'weak-te', perfectAux: 'har', glossEn: 'to eat' },
  { id: 'v-købe', infinitive: 'købe', present: 'køber', past: 'købte', wrongPast: 'købede', participle: 'købt', verbClass: 'weak-te', perfectAux: 'har', glossEn: 'to buy' },
  { id: 'v-læse', infinitive: 'læse', present: 'læser', past: 'læste', wrongPast: 'læsede', participle: 'læst', verbClass: 'weak-te', perfectAux: 'har', glossEn: 'to read' },
  { id: 'v-rejse', infinitive: 'rejse', present: 'rejser', past: 'rejste', wrongPast: 'rejsede', participle: 'rejst', verbClass: 'weak-te', perfectAux: 'har', glossEn: 'to travel' },
  { id: 'v-betale', infinitive: 'betale', present: 'betaler', past: 'betalte', wrongPast: 'betalede', participle: 'betalt', verbClass: 'weak-te', perfectAux: 'har', glossEn: 'to pay' },
  { id: 'v-vise', infinitive: 'vise', present: 'viser', past: 'viste', wrongPast: 'visede', participle: 'vist', verbClass: 'weak-te', perfectAux: 'har', glossEn: 'to show' },
  { id: 'v-høre', infinitive: 'høre', present: 'hører', past: 'hørte', wrongPast: 'hørede', participle: 'hørt', verbClass: 'weak-te', perfectAux: 'har', glossEn: 'to hear' },

  // ── Strong / irregular ───────────────────────────────────────────────
  { id: 'v-gå', infinitive: 'gå', present: 'går', past: 'gik', wrongPast: 'gåede', participle: 'gået', verbClass: 'strong', perfectAux: 'er', glossEn: 'to go, to walk' },
  { id: 'v-se', infinitive: 'se', present: 'ser', past: 'så', wrongPast: 'seede', participle: 'set', verbClass: 'strong', perfectAux: 'har', glossEn: 'to see' },
  { id: 'v-komme', infinitive: 'komme', present: 'kommer', past: 'kom', wrongPast: 'kommede', participle: 'kommet', verbClass: 'strong', perfectAux: 'er', glossEn: 'to come' },
  { id: 'v-give', infinitive: 'give', present: 'giver', past: 'gav', wrongPast: 'givede', participle: 'givet', verbClass: 'strong', perfectAux: 'har', glossEn: 'to give' },
  { id: 'v-tage', infinitive: 'tage', present: 'tager', past: 'tog', wrongPast: 'tagede', participle: 'taget', verbClass: 'strong', perfectAux: 'har', glossEn: 'to take' },
  { id: 'v-sige', infinitive: 'sige', present: 'siger', past: 'sagde', wrongPast: 'sigede', participle: 'sagt', verbClass: 'strong', perfectAux: 'har', glossEn: 'to say' },
  { id: 'v-få', infinitive: 'få', present: 'får', past: 'fik', wrongPast: 'fåede', participle: 'fået', verbClass: 'strong', perfectAux: 'har', glossEn: 'to get, to receive' },
  { id: 'v-blive', infinitive: 'blive', present: 'bliver', past: 'blev', wrongPast: 'blivede', participle: 'blevet', verbClass: 'strong', perfectAux: 'er', glossEn: 'to become, to stay' },
  { id: 'v-finde', infinitive: 'finde', present: 'finder', past: 'fandt', wrongPast: 'findede', participle: 'fundet', verbClass: 'strong', perfectAux: 'har', glossEn: 'to find' },
  { id: 'v-falde', infinitive: 'falde', present: 'falder', past: 'faldt', wrongPast: 'faldede', participle: 'faldet', verbClass: 'strong', perfectAux: 'er', glossEn: 'to fall' },
  { id: 'v-stå', infinitive: 'stå', present: 'står', past: 'stod', wrongPast: 'ståede', participle: 'stået', verbClass: 'strong', perfectAux: 'har', glossEn: 'to stand' },
  { id: 'v-sidde', infinitive: 'sidde', present: 'sidder', past: 'sad', wrongPast: 'siddede', participle: 'siddet', verbClass: 'strong', perfectAux: 'har', glossEn: 'to sit' },
  { id: 'v-sove', infinitive: 'sove', present: 'sover', past: 'sov', wrongPast: 'sovede', participle: 'sovet', verbClass: 'strong', perfectAux: 'har', glossEn: 'to sleep' },
  { id: 'v-drikke', infinitive: 'drikke', present: 'drikker', past: 'drak', wrongPast: 'drikkede', participle: 'drukket', verbClass: 'strong', perfectAux: 'har', glossEn: 'to drink' },
];

export function verbById(id: string): VerbEntry | undefined {
  return VERB_BANK.find((v) => v.id === id);
}

import type { WritingTask } from '../feedback/types';

/**
 * Writing-studio tasks, grouped by exam. Official tasks are transcribed from
 * the papers SIRI publishes on danskogproever.dk and say so via `source`;
 * everything without a `source` is practice written to the exam's format.
 */

export type WritingExam = 'PD3' | 'PD2' | 'FVU';

export interface WritingTaskEntry {
  name: string;
  exam: WritingExam;
  task: WritingTask;
}

const PD3_2022 = 'Official PD3 paper, May–June 2022 (danskogproever.dk)';
const PD2_2023 = 'Official PD2 paper, May–June 2023 (danskogproever.dk)';

export const WRITING_TASKS: WritingTaskEntry[] = [
  // ── PD3 ────────────────────────────────────────────────────────────────
  {
    name: 'E-mail',
    exam: 'PD3',
    task: {
      kind: 'letter',
      register: 'uformel',
      label: 'Delprøve 1 · e-mail to a friend · no length requirement',
      source: `${PD3_2022} · Delprøve 1`,
      prompt:
        'Du har fået en mail fra din danske ven Mia. Hun har været udstationeret i New York i tre år for et dansk firma, og nu skal hun snart hjem til Odense sammen med sin familie.\n\n' +
        '“… Tak for snakken i sidste uge, det var hyggeligt at tale med dig på Skype. Jeg er meget spændt på at høre om din køreprøve. Hvordan gik det?\n' +
        'Som du ved, er vores tid i New York snart slut, og vi skal hjem til Odense om tre uger. Jeg skal arbejde sammen med nogle kolleger, jeg ikke kender. Hvad synes du, jeg skal gøre for at få en god start på arbejdet?\n' +
        'Børnene er jo blevet teenagere, og de er meget kede af at sige farvel til deres venner her i New York. Jeg er spændt på, om de kan holde kontakten. Tror du, det er muligt?\n' +
        'Jens har fået nyt arbejde i Danmark, som han glæder sig til at komme i gang med efter 3 år som hjemmegående. Det nye job ligger dog 30 km fra Odense, så vi overvejer at købe en ekstra bil, men han kan også tage toget. Hvad ville du gøre?”',
      focus: [
        'Tak for mailen.',
        'Kom ind på de understregede dele i mailen: “Hvordan gik det”, “Hvad synes du, jeg skal gøre for at få en god start på arbejdet”, “Tror du, det er muligt”, “Hvad ville du gøre”.',
        'Foreslå, at I mødes, når Mia kommer hjem.',
      ],
    },
  },
  {
    name: '2A · diagram',
    exam: 'PD3',
    task: {
      kind: 'essay',
      minWords: 200,
      source: `${PD3_2022} · Delprøve 2A`,
      prompt:
        'Klimabekymring og alder\n\n' +
        'Diagram: Andel personer i forskellige aldersgrupper, der er meget bekymrede over klimaforandringer (aflæst fra søjlerne):\n' +
        '• 18-34 år: ca. 27 %\n• 35-49 år: ca. 24 %\n• 50-70 år: ca. 22 %\n• Alle: ca. 24 %\n\n' +
        'Undersøgelsen er foretaget blandt et repræsentativt udvalg på 2.000 personer i alderen 18-70 år. Kilde: ida.dk',
      focus: [
        'Beskriv kort hovedtrækkene i diagrammet.',
        'Fortæl, hvilke årsager der kan være til de forskelle, diagrammet viser.',
        'Hvilke fordele og ulemper mener du, der kan være for samfundet ved, at unge bekymrer sig om klimaforandringerne? Begrund dine synspunkter. (Ca. 50 % af besvarelsen.)',
      ],
    },
  },
  {
    name: '2B · opinion',
    exam: 'PD3',
    task: {
      kind: 'essay',
      minWords: 200,
      source: `${PD3_2022} · Delprøve 2B`,
      prompt:
        'En attraktiv arbejdsplads\n\n' +
        'Der er forskellige faktorer, der kan have betydning for, hvor attraktiv en arbejdsplads er for medarbejderne. Her er nogle eksempler:\n' +
        '• Godt samarbejde mellem kolleger\n• Fleksible arbejdstider\n• Indflydelse på egne arbejdsopgaver\n• God løn\n• Mulighed for efteruddannelse\n• Personalegoder',
      focus: [
        'Fortæl kort om en attraktiv arbejdsplads, du har været på eller har hørt om.',
        'Kommentér en eller to af faktorerne fra listen.',
        'Vurdér, om det er lederens personlige kvalifikationer eller faglige kvalifikationer, der er vigtigst for, om en arbejdsplads er attraktiv. (Ca. 50 % af besvarelsen.)',
      ],
    },
  },
  {
    name: 'Practice essay',
    exam: 'PD3',
    task: {
      kind: 'essay',
      minWords: 200,
      prompt:
        'Mange flytter fra landet til de store byer. Skriv om fordele og ulemper ved at bo i en storby, og giv din egen mening.',
    },
  },

  // ── PD2 ────────────────────────────────────────────────────────────────
  {
    name: '1A · Facebook',
    exam: 'PD2',
    task: {
      kind: 'letter',
      register: 'uformel',
      label: 'Delprøve 1A · Facebook post · four points',
      source: `${PD2_2023} · Delprøve 1A`,
      prompt:
        'Et opslag på Facebook\n\n' +
        'Du vil gerne ud at rejse, men du har ikke nogen at rejse sammen med. Derfor vil du skrive et opslag på Facebook, hvor du søger en person, som du kan rejse sammen med.\n\n' +
        'Skriv opslaget.',
      focus: [
        'Fortæl lidt om dig selv.',
        'Fortæl, hvornår du gerne vil rejse.',
        'Fortæl, hvor du gerne vil rejse hen og hvorfor.',
        'Fortæl lidt om, hvem du gerne vil rejse sammen med (fx alder, køn, interesser).',
        'Begynd og afslut opslaget på en passende måde.',
      ],
    },
  },
  {
    name: '1B · job application',
    exam: 'PD2',
    task: {
      kind: 'letter',
      register: 'formel',
      label: 'Delprøve 1B · job application · four points',
      source: `${PD2_2023} · Delprøve 1B`,
      prompt:
        'En jobansøgning\n\n' +
        'Du vil gerne arbejde som køkkenmedhjælper på en restaurant. Du har set på nettet, at Restaurant Nimo søger køkkenmedhjælpere. Du vil skrive en jobansøgning til Restaurant Nimo.\n\n' +
        'Skriv jobansøgningen til Restaurant Nimo.',
      focus: [
        'Fortæl lidt om dig selv, og hvordan du er som person.',
        'Fortæl, hvad du har lavet før.',
        'Fortæl, hvorfor du gerne vil arbejde som køkkenmedhjælper.',
        'Fortæl, hvordan du kan kontaktes.',
        'Begynd og afslut jobansøgningen på en passende måde.',
      ],
    },
  },
  {
    name: '2 · e-mail',
    exam: 'PD2',
    task: {
      kind: 'letter',
      register: 'uformel',
      minWords: 100,
      label: 'Delprøve 2 · e-mail to a friend · min. 100 words',
      source: `${PD2_2023} · Delprøve 2`,
      prompt:
        'Du har fået en e-mail fra din ven Viktor. I e-mailen skriver han bl.a.:\n\n' +
        '“… Du skrev, at du gerne vil flytte, fordi du ikke er tilfreds med din bolig. Skriv og fortæl mig lidt om, hvorfor du er utilfreds med din bolig, og hvor du vil flytte hen …”',
      focus: [
        'Skriv et svar til Viktor og fortæl, hvorfor du ikke er tilfreds med din bolig, og hvor du gerne vil flytte hen.',
        'Du skal skrive minimum 100 ord. Din hilsen og afslutning tæller ikke med.',
      ],
    },
  },
  {
    name: 'Formal letter',
    exam: 'PD2',
    task: {
      kind: 'letter',
      register: 'formel',
      label: 'Practice · formal letter',
      prompt:
        'Skriv en e-mail til din kommune. Du har fået et brev om, at du skal møde til en samtale den 3. marts, men du kan ikke komme. Forklar hvorfor, og foreslå en anden dato.',
    },
  },

  // ── FVU-dansk (practice: no official papers are published) ─────────────
  {
    name: 'Trin 1 · list',
    exam: 'FVU',
    task: {
      kind: 'letter',
      register: 'uformel',
      label: 'Practice · trin 1 · notes in bullet points',
      prompt:
        'Du skal holde fødselsdag for dit barn på lørdag. Der kommer ti gæster.\n\nLav en huskeliste i punktform over det, du skal købe og gøre før festen.',
      focus: ['Skriv mindst seks punkter.', 'Stav ordene så godt du kan, uden ordbog.'],
    },
  },
  {
    name: 'Trin 1–2 · message',
    exam: 'FVU',
    task: {
      kind: 'letter',
      register: 'uformel',
      label: 'Practice · trin 1–2 · short message',
      prompt:
        'Skriv en besked til en ven, der har inviteret dig til fødselsdag. Sig tak, forklar at du kommer lidt senere, og fortæl hvorfor.',
    },
  },
  {
    name: 'Trin 3–4 · opinion',
    exam: 'FVU',
    task: {
      kind: 'letter',
      register: 'formel',
      label: 'Practice · trin 3–4 · letter to the editor',
      prompt:
        'Kommunen vil lukke biblioteket i din by for at spare penge.\n\nSkriv et læserbrev til den lokale avis, hvor du siger din mening.',
      focus: [
        'Skriv, hvad du mener, og giv mindst to grunde.',
        'Skriv, hvad folk der er uenige med dig, kan mene, og svar på det.',
        'Slut med en kort konklusion.',
      ],
    },
  },
];

/**
 * Exam guides for PD2, PD3 and FVU-dansk, as the official sources describe
 * them: danskogproever.dk (SIRI) for PD2/PD3, and BEK nr. 249 af 11/03/2024
 * (bilag 4–7) for FVU-dansk. Long official texts are linked, not copied.
 */

export type GuideExam = 'PD2' | 'PD3' | 'FVU';

export interface GuideDoc {
  label: string;
  url: string;
}

export interface GuidePart {
  name: string;
  time: string;
  what: string;
}

export interface GuideSection {
  key: string;
  title: string;
  danish: string;
  summary: string;
  parts: GuidePart[];
  tips: string[];
  docs: GuideDoc[];
  route?: { label: string; path: string };
}

export interface ExamGuide {
  exam: GuideExam;
  title: string;
  intro: string;
  sections: GuideSection[];
  published: string;
}

const SIRI = 'https://danskogproever.dk/media';
const FVU_BEK = 'https://www.retsinformation.dk/eli/lta/2024/249';

const PD3: ExamGuide = {
  exam: 'PD3',
  title: 'Prøve i Dansk 3',
  intro:
    'Level B2. Reading, writing and speaking each get a grade on the 7-point scale. You pass with an average of at least 2.0, and speaking counts double (e.g. 4, 7 and 10 gives 7.8). The exam is held in May–June and November–December.',
  sections: [
    {
      key: 'reading',
      title: 'Reading',
      danish: 'Læseforståelse',
      summary: '90 minutes, no aids at all. 39 points: 1 point per answer in Delprøve 1 and 3, 2 points per answer in 2A and 2B.',
      parts: [
        {
          name: 'Delprøve 1',
          time: '25 min',
          what: '15 factual questions, mostly hv-questions (hvem, hvad, hvor, hvornår) plus a few yes/no. Find the answers in a text collection of about 14 pages under about 5 headings, using its table of contents. Answer briefly.',
        },
        {
          name: 'Delprøve 2A',
          time: '65 min for 2A, 2B and 3',
          what: '3 multiple-choice questions (3 options) on a 1½-page text about a social issue. The questions follow the order of the text.',
        },
        {
          name: 'Delprøve 2B',
          time: '',
          what: 'A text of about 2 pages with 5 paragraphs removed. Put them back in the right places. There are 2 extra paragraphs that do not fit.',
        },
        {
          name: 'Delprøve 3',
          time: '',
          what: 'A 1-page text with 8 words or expressions removed. Choose the right one from 4 options each time.',
        },
      ],
      tips: [
        'Delprøve 1 rewards speed, not deep reading: read the question, jump to the section it names, and answer in as few words as possible.',
        'In 2B, look at the first and last sentence of each missing paragraph. Pronouns (den, det, de) and connectors (derfor, desuden, til gengæld) show which way they link.',
        '2A and 2B are worth double points per answer, so do not rush them to save time for Delprøve 3.',
        'Delprøve 3 tests word choice and grammar together. The gender, adjective, verb and word-order trainers in this app are direct practice for it.',
      ],
      docs: [
        { label: 'Text collection 2023 (Delprøve 1)', url: `${SIRI}/szzplwje/pd3-tekstsamling-sommer-2023.pdf` },
        { label: 'Questions 2023 (Delprøve 1)', url: `${SIRI}/n3iio431/pd3-laeseforstaaelse-1-opgavehaefte-sommer-2023.pdf` },
        { label: 'Answer key 2023 (Delprøve 1)', url: `${SIRI}/f5dlnjbt/rettenoegle-dp3-delproeve-1-sommer-2023-pdf.pdf` },
        { label: 'Texts 2023 (Delprøve 2A, 2B, 3)', url: `${SIRI}/nj1d0ymo/pd3-laeseforstaaelse-2-teksthaefte-sommer-2023.pdf` },
        { label: 'Questions 2023 (Delprøve 2A, 2B, 3)', url: `${SIRI}/slkdckdc/pd3-laeseforstaaelse-2-opgavehaefte-sommer-2023.pdf` },
        { label: 'Answer key 2023 (Delprøve 2A, 2B, 3)', url: `${SIRI}/wo5gwhyp/rettenoegle-pd3-delproeve-2a-2b-og-3-sommer-2023.pdf` },
      ],
    },
    {
      key: 'writing',
      title: 'Writing',
      danish: 'Skriftlig fremstilling',
      summary: '2½ hours. Dictionaries are allowed, but not phrase books with ready-made sentences. Answer Delprøve 1 and either 2A or 2B.',
      parts: [
        {
          name: 'Delprøve 1',
          time: '',
          what: 'Reply to an e-mail from a friend. It contains four questions, and you must answer all of them. There is no length requirement.',
        },
        {
          name: 'Delprøve 2A',
          time: '',
          what: 'Facts task, at least 200 words. Using a diagram or table: (1) briefly describe it, (2) explain causes of some of the differences, (3) discuss pros and cons or similar.',
        },
        {
          name: 'Delprøve 2B',
          time: '',
          what: 'Opinion task, at least 200 words. Using a box of 6 themes: (1) briefly tell about your own experience, (2) explain one or two of the examples, (3) discuss pros and cons or similar.',
        },
      ],
      tips: [
        'If you only answer Delprøve 1 you cannot pass. If you only answer Delprøve 2 you cannot get 12.',
        'Point 3 of Delprøve 2 is about 50% of the whole answer and decides your grade, so plan roughly 100 words for it.',
        'Answer only what the task asks. Anything off-task is not assessed.',
        'Use a clear structure: one opening sentence per point, connectors (desuden, på den anden side, derfor) and a short conclusion.',
      ],
      docs: [
        { label: 'Official writing paper 2022', url: `${SIRI}/apahvtdf/pd3-skriftlig-fremstilling-sommer-2022.pdf` },
        { label: 'Example of a passing answer', url: `${SIRI}/ncfhgdmf/260921-pd3-besvarelse-002.pdf` },
      ],
      route: { label: 'Practise the official 2022 tasks in the Writing studio', path: '/write' },
    },
    {
      key: 'speaking',
      title: 'Speaking',
      danish: 'Mundtlig kommunikation',
      summary: 'Two parts of about 5 minutes each, with an examiner (who asks the questions) and a censor (who takes notes and times you). Both decide the grade.',
      parts: [
        {
          name: 'Delprøve 1',
          time: '≈2 min + 2½ min',
          what: 'A week before the exam your language centre gives you a social-issue topic, e.g. "Livsstilssygdomme med fokus på diabetes". You present it for about 2 minutes (neither shorter nor longer) and may bring one sheet of your own notes. Then the examiner asks follow-up questions.',
        },
        {
          name: 'Delprøve 2',
          time: '≈4½ min',
          what: 'Unprepared. You draw topic A, B or C and get about 10 seconds to look at its two pictures. The examiner asks a first required question about one picture (usually "Hvorfor tror du, …?"). Then comes a second, broader one ("Hvilke fordele og ulemper…?"). Each is followed by follow-up questions.',
        },
      ],
      tips: [
        'In Delprøve 1 the examiner asks four kinds of follow-up question: clarifying ("Vil du godt forklare det lidt nærmere?"), elaborating ("Kan du ikke fortælle lidt mere om det?"), explaining ("…men hvorfor tror du så, at …?") and taking a position ("Mener du, at …? Hvorfor/hvorfor ikke?").',
        'Give a reason every time. If you do not justify an answer, the examiner has to ask again, and that pulls your grade down.',
        'Delprøve 1 topics are set by your own school, not centrally, so there is no national list. Prepare a 2-minute structure (introduction, 2–3 points, your opinion) that fits any social topic.',
      ],
      docs: [
        { label: 'Official oral examiner booklet, May–June 2024', url: `${SIRI}/prob2ifo/censor-og-eksaminatorhaefte-pd3-mdt.pdf` },
        { label: 'Example picture sheet (Delprøve 2)', url: `${SIRI}/u0hdwfmo/eksempel-pd3-mundtlig-kommunikation-opgave.pdf` },
      ],
      route: { label: 'Open the topic archive (includes the full 2024 set)', path: '/topics' },
    },
  ],
  published:
    'SIRI publishes one sample paper per section (reading 2023, writing 2022, oral May–June 2024). Papers from November–December 2024 and from 2025 are not public, so this app does not guess at them.',
};

const PD2: ExamGuide = {
  exam: 'PD2',
  title: 'Prøve i Dansk 2',
  intro:
    'Reading and writing are at level B1, speaking at B1+. Each section gets a grade on the 7-point scale. You pass with an average of at least 2.0, and speaking counts double. The exam is held in May–June and November–December.',
  sections: [
    {
      key: 'reading',
      title: 'Reading',
      danish: 'Læseforståelse',
      summary: '1½ hours, no dictionary. 30 points, 1 per answer. In every task the first item is a worked example.',
      parts: [
        {
          name: 'Opgave 1',
          time: 'Delprøve 1 · 30 min',
          what: '3–4 reference texts (e.g. lists of restaurants or hotels from a website), about 1,900–2,200 words in total. Find specific facts and write short answers to 6 questions.',
        },
        {
          name: 'Opgave 2',
          time: '',
          what: '9 short ads or notices (A–I, about 375 words in total). Match 6 sentences to the right ad.',
        },
        {
          name: 'Opgave 3',
          time: 'Delprøve 2 · 60 min',
          what: 'A text of about 300 words with 9 words removed. Put each word back in the right gap. There are 5 extra words that fit nowhere.',
        },
        {
          name: 'Opgave 4',
          time: '',
          what: 'A text of about 500–550 words in 6 paragraphs, with one sentence removed from each. Put the sentences back. There are 2 extra sentences.',
        },
        {
          name: 'Opgave 5',
          time: '',
          what: 'An interview of about 450–500 words in 8 paragraphs (A–H). For each of 5 questions, say which paragraph holds the answer.',
        },
      ],
      tips: [
        'Opgave 1 and 2 are about speed: do not read every text, just scan for the information the question asks for.',
        'In Opgave 3 the missing words can be nouns, verbs, adjectives, adverbs or conjunctions. Check that the word fits the grammar of the gap (en/et, plural, past tense) as well as the meaning.',
        'In Opgave 4 and 5, read the whole paragraph around a gap before choosing, not just the sentence.',
      ],
      docs: [
        { label: 'Texts 2021 (Opgave 1–2)', url: `${SIRI}/l2flsoum/pd2-laeseforstaaelse-1-teksthaefte-vinter-2021.pdf` },
        { label: 'Questions 2021 (Opgave 1–2)', url: `${SIRI}/zy0jfrd3/pd2-laeseforstaaelse-1-opgavehaefte-vinter-2021.pdf` },
        { label: 'Answer key 2021 (Opgave 1–2)', url: `${SIRI}/sjgneglh/pd2-rettenoegle-til-laeseforstaaelse-1-vinter-2021.pdf` },
        { label: 'Texts and questions 2021 (Opgave 3–5)', url: `${SIRI}/4mbbof1d/pd2-laeseforstaaelse-2-vinter-2021.pdf` },
        { label: 'Answer key 2021 (Opgave 3–5)', url: `${SIRI}/nj1hv4v2/pd2-rettenoegle-til-laeseforstaaelse-2-vinter-2021.pdf` },
      ],
    },
    {
      key: 'writing',
      title: 'Writing',
      danish: 'Skriftlig fremstilling',
      summary: '1½ hours. Dictionaries are allowed, but not phrase books. Answer either 1A or 1B, and Delprøve 2.',
      parts: [
        {
          name: 'Delprøve 1A / 1B',
          time: '',
          what: 'A (semi-)formal text to people you do not know well, e.g. a complaint, a job application, an invitation or a Facebook post. There is always a situation and four points you must cover. Begin and end the text in a suitable way.',
        },
        {
          name: 'Delprøve 2',
          time: '',
          what: 'A personal e-mail to a friend answering the two questions in their e-mail. At least 100 words for the two answers. Your greeting and sign-off do not count towards the 100.',
        },
      ],
      tips: [
        'Delprøve 2 matters most. If you only answer Delprøve 1 you cannot pass; if you only answer Delprøve 2 you cannot get 12.',
        'Examiners look at: answering every point; linking sentences with og, men, fordi, når, hvis and at; the right tense (past tense for things that happened); word choice; word order (where the verb goes, and where ikke, også and altid go); inflection (to børn, not to barn); spelling and full stops.',
        'Write some longer sentences. A text made only of short sentences is harder to follow and scores lower on coherence.',
      ],
      docs: [
        { label: 'Official writing paper, May 2023', url: `${SIRI}/2qwlnkpj/pd2-proevegrundlag-maj-2023.pdf` },
        { label: 'Example of a passing answer (May 2023)', url: `${SIRI}/23gnfps5/eksempel-paa-besvarelse.pdf` },
      ],
      route: { label: 'Practise the official May 2023 tasks in the Writing studio', path: '/write' },
    },
    {
      key: 'speaking',
      title: 'Speaking',
      danish: 'Mundtlig kommunikation',
      summary: 'You take it in pairs with another candidate: about 20 minutes in total for the two of you, 10 per part.',
      parts: [
        {
          name: 'Delprøve 1',
          time: '≈1½ min + 3½ min',
          what: 'A topic you choose and prepare yourself about your own everyday life, e.g. your job. Present it for about 1½ minutes, then answer the examiner’s questions about it.',
        },
        {
          name: 'Delprøve 2',
          time: '',
          what: 'There are three everyday topics (A, B, C), each with pictures. You describe the situation in your picture and answer questions about your own experiences and opinions. The other candidate does the same. Then the two of you discuss a case the examiner gives you, e.g. how to hold a big party without much money.',
        },
      ],
      tips: [
        'Choose a Delprøve 1 topic you know well and have words for. Your work, your family or your daily routine are safe choices.',
        'Describe the picture with a clear structure: who, where, what they are doing, and how they seem to feel.',
        'In the conversation, talk with your partner, not just to the examiner: ask "Hvad synes du?", agree or disagree, and suggest solutions.',
      ],
      docs: [
        { label: 'Example pictures (Delprøve 2, 2021)', url: `${SIRI}/ucykomoc/pd2-mundtlig-vinter-2021.pdf` },
      ],
      route: { label: 'Practise word order (verb position, ikke/også/altid)', path: '/train' },
    },
  ],
  published:
    'SIRI publishes one sample per section: reading from winter 2021, writing from May 2023 and oral pictures from winter 2021. Delprøve 2 picture topics from later sessions are not public.',
};

const FVU: ExamGuide = {
  exam: 'FVU',
  title: 'FVU-dansk',
  intro:
    'FVU-dansk (which replaced FVU-læsning in 2024) has four levels (trin 1–4), each with a written test in reading, spelling and writing. Every test has two task sets: set 1 with no aids, then a break of at most 15 minutes, then set 2, where you may use spellcheck, grammar check and the dictionaries from your course. The result is pass or fail. Trin 4 is level G in adult education (avu).',
  sections: [
    {
      key: 'levels',
      title: 'Test by level',
      danish: 'Prøven på hvert trin',
      summary: 'All tests are set centrally. Length per level:',
      parts: [
        {
          name: 'Trin 1',
          time: '1 h 45 min',
          what: 'Set 1: 30 min · Set 2: 60 min. Assessed: spelling words by their sounds; spelling common words that are not spelt as they sound; using word parts (roots and endings) to read and spell; finding facts in simple everyday texts; writing short notes in bullet points; writing short texts with a clear purpose.',
        },
        {
          name: 'Trin 2',
          time: '2 h 15 min',
          what: 'Set 1: 30 min · Set 2: 1 h 30 min. Assessed: sound rules that depend on context; spelling common loanwords; word classes and inflection; reading different text types with understanding; making personal notes in a simple structure; writing connected texts with a clear purpose.',
        },
        {
          name: 'Trin 3',
          time: '2 h 15 min',
          what: 'Set 1: 30 min · Set 2: 1 h 30 min. Assessed: spelling patterns that come from word structure; using context and grammar to build words; matching vocabulary to the text type; reading different text types with understanding; writing texts with a clear purpose; arguing for different viewpoints.',
        },
        {
          name: 'Trin 4',
          time: '2 h 15 min',
          what: 'Set 1: 30 min · Set 2: 1 h 30 min. Assessed: spelling patterns from word structure and foreign spelling patterns; reading texts with factual content and picking out the key points; presenting factual content in writing; arguing for different viewpoints; varying vocabulary to suit the text type.',
        },
      ],
      tips: [
        'Set 1 is without any aids, so this is where spelling counts most. The spelling trainer covers some of the classic traps: silent d, hv-, nogen/nogle and og/at.',
        'In set 2 you can use spellcheck. Save time to read your text through once more, because spellcheck does not catch wrong-but-real words (e.g. og instead of at).',
        'From trin 3 you must argue for different viewpoints: give a reason for each opinion and use words like fordi, derfor and på den anden side.',
      ],
      docs: [
        { label: 'Official rules: BEK nr. 249 af 11/03/2024 (FVU-dansk is in bilag 4–7)', url: FVU_BEK },
      ],
      route: { label: 'Practise spelling (silent d, hv-, nogen/nogle, og/at)', path: '/spelling' },
    },
  ],
  published:
    'FVU-dansk test papers are distributed to schools through Prøveshoppen and are not published, so this app has no official FVU sample papers. The writing tasks marked FVU in the Writing studio are practice tasks written to the official assessment criteria.',
};

export const EXAM_GUIDES: Record<GuideExam, ExamGuide> = { PD2, PD3, FVU };
export const GUIDE_ORDER: GuideExam[] = ['PD3', 'PD2', 'FVU'];

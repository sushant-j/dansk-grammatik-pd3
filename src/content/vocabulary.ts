/**
 * Hard-word bank for PD3-level argumentative Danish.
 *
 * These are not beginner vocabulary lists. Every entry is a word that shows up
 * in genuine PD3 model answers — cause/consequence/pros-cons/opinion register —
 * and that a B1 learner typically has not met yet: abstract nouns, set legal
 * and welfare terms, and the discourse connectors that hold an argumentative
 * answer together. Each is traced to the real sentence it came from, so the
 * flashcard is never a word floating free of context.
 *
 * `category: 'connector'` entries are the linking words that structure a PD3
 * answer (der kan være flere årsager, på den anden side, hvilket betyder...).
 * These matter as much as content vocabulary: an answer that never links two
 * clauses reads as a list, not an argument, and examiners mark for exactly
 * this.
 */

export type VocabCategory = 'connector' | 'noun' | 'verb' | 'adjective' | 'phrase';

export interface VocabEntry {
  id: string;
  word: string;
  category: VocabCategory;
  /** Simple Danish definition — the register PD3 itself expects you to work in. */
  definitionDa: string;
  /** English gloss. Short; this is a memory aid, not a dictionary entry. */
  glossEn: string;
  /** A real sentence this word appears in, from the topic archive. */
  example: string;
  /** English translation of the example, for a learner who is still lost. */
  exampleEn: string;
  /** Topic id(s) in TOPICS or PRACTICE_TOPICS this word is drawn from. */
  sourceTopics: string[];
  cefr: 'B1' | 'B2' | 'C1';
}

export const VOCABULARY: VocabEntry[] = [
  // ── Connectors: cause ──────────────────────────────────────────────────
  {
    id: 'v-der-kan-vaere-flere-aarsager',
    word: 'der kan være flere årsager til',
    category: 'connector',
    definitionDa: 'Bruges til at introducere en forklaring, når man ikke er 100% sikker på grunden.',
    glossEn: 'there can be several reasons for',
    example: 'Jeg tror, at der kan være flere årsager til, at folk vælger at arbejde frivilligt.',
    exampleEn: 'I think there can be several reasons why people choose to volunteer.',
    sourceTopics: ['2011-s-velg-rende-arbejde'],
    cefr: 'B1',
  },
  {
    id: 'v-det-skyldes',
    word: 'det skyldes',
    category: 'connector',
    definitionDa: 'Peger direkte på årsagen til noget — mere præcist end "det er fordi".',
    glossEn: 'it is due to / this is because of',
    example: 'Jeg tror, det skyldes en stærk demokratisk tradition og en udbredt følelse af borgerpligt.',
    exampleEn: 'I think this is due to a strong democratic tradition and a widespread sense of civic duty.',
    sourceTopics: ['practice-valgdeltagelse'],
    cefr: 'B2',
  },
  {
    id: 'v-paa-grund-af',
    word: 'på grund af',
    category: 'connector',
    definitionDa: 'Angiver en direkte årsag — mere formelt end "fordi".',
    glossEn: 'due to / because of',
    example: 'Jeg tror, det er blevet mere almindeligt på grund af lovgivning om øremærket barsel.',
    exampleEn: 'I think it has become more common due to legislation on earmarked parental leave.',
    sourceTopics: ['practice-foraeldreskab'],
    cefr: 'B1',
  },

  // ── Connectors: contrast ─────────────────────────────────────────────────
  {
    id: 'v-paa-den-anden-side',
    word: 'på den anden side',
    category: 'connector',
    definitionDa: 'Introducerer et modsat synspunkt eller en konsekvens, uden at afvise det første punkt.',
    glossEn: 'on the other hand',
    example: 'På den anden side kan det også betyde, at forældrene får mindre tid til deres egne børn.',
    exampleEn: 'On the other hand, it can also mean that parents have less time for their own children.',
    sourceTopics: ['2011-s-velg-rende-arbejde'],
    cefr: 'B1',
  },
  {
    id: 'v-paa-den-ene-side',
    word: 'på den ene side … på den anden side',
    category: 'connector',
    definitionDa: 'Sætter to modsatte synspunkter op mod hinanden i samme svar.',
    glossEn: 'on the one hand … on the other hand',
    example: 'På den ene side er forældrene gode rollemodeller. På den anden side kan det skabe stress i familien.',
    exampleEn: 'On the one hand the parents are good role models. On the other hand it can create stress in the family.',
    sourceTopics: ['2011-s-velg-rende-arbejde'],
    cefr: 'B1',
  },
  {
    id: 'v-selvom',
    word: 'selvom',
    category: 'connector',
    definitionDa: 'Introducerer en indrømmelse — noget der er sandt, selvom det modsiger hovedpointen.',
    glossEn: 'even though / although',
    example: 'Selvom Danmark har en høj dagpengesats og kontanthjælp, føler nogle sig utrygge ved at miste jobbet.',
    exampleEn: 'Even though Denmark has a high unemployment benefit rate, some feel insecure about losing their job.',
    sourceTopics: ['practice-ulighed'],
    cefr: 'B1',
  },
  {
    id: 'v-dog',
    word: 'dog',
    category: 'connector',
    definitionDa: 'Blødt modsætningsord — svagere end "men", ofte placeret midt i sætningen.',
    glossEn: 'however / though',
    example: 'Ulempen er dog, at de frivillige ikke har en uddannelse inden for pleje.',
    exampleEn: 'The downside, however, is that volunteers do not have training in care work.',
    sourceTopics: ['2011-s-velg-rende-arbejde'],
    cefr: 'B2',
  },
  {
    id: 'v-alligevel',
    word: 'alligevel',
    category: 'connector',
    definitionDa: 'Angiver at noget sker på trods af en forventning.',
    glossEn: 'nevertheless / anyway',
    example: 'Mange ved, det er usundt, men gør det alligevel.',
    exampleEn: 'Many know it is unhealthy, but do it anyway.',
    sourceTopics: [],
    cefr: 'B1',
  },

  // ── Connectors: addition / structuring ──────────────────────────────────
  {
    id: 'v-derudover',
    word: 'derudover',
    category: 'connector',
    definitionDa: 'Tilføjer endnu et punkt til det, du allerede har sagt.',
    glossEn: 'in addition / furthermore',
    example: 'Derudover er det en god måde at møde nye mennesker på.',
    exampleEn: 'In addition, it is a good way to meet new people.',
    sourceTopics: ['2011-s-velg-rende-arbejde'],
    cefr: 'B1',
  },
  {
    id: 'v-desuden',
    word: 'desuden',
    category: 'connector',
    definitionDa: 'Ligesom "derudover" — tilføjer et nyt argument.',
    glossEn: 'moreover / besides',
    example: 'Desuden betyder kontanthjælpsloftet og andre stramninger, at ydelserne er lavere end tidligere.',
    exampleEn: 'Moreover, the welfare cap and other tightenings mean the benefits are lower than before.',
    sourceTopics: ['practice-ulighed'],
    cefr: 'B2',
  },
  {
    id: 'v-samtidig',
    word: 'samtidig',
    category: 'connector',
    definitionDa: 'Viser at to ting sker eller er sande på samme tid.',
    glossEn: 'at the same time / meanwhile',
    example: 'Samtidig er det en god idé, at skoler og arbejdspladser tilbyder sund mad i kantinen.',
    exampleEn: 'At the same time, it is a good idea for schools and workplaces to offer healthy food in the canteen.',
    sourceTopics: [],
    cefr: 'B1',
  },
  {
    id: 'v-for-det-foerste',
    word: 'for det første … for det andet',
    category: 'connector',
    definitionDa: 'Nummererer dine argumenter, så svaret bliver let at følge.',
    glossEn: 'firstly … secondly',
    example: 'For det første giver det mange mennesker en rigtig god følelse. For det andet er det en god måde at møde nye mennesker på.',
    exampleEn: 'Firstly, it gives many people a really good feeling. Secondly, it is a good way to meet new people.',
    sourceTopics: ['2011-s-velg-rende-arbejde'],
    cefr: 'B1',
  },
  {
    id: 'v-hvilket-betyder',
    word: 'hvilket betyder/kan',
    category: 'connector',
    definitionDa: 'Knytter en konsekvens direkte til den forudgående sætning, uden at starte en ny.',
    glossEn: 'which means / which can',
    example: 'Det kan skade solidariteten, hvilket kan svække sammenhængskraften i samfundet.',
    exampleEn: 'It can damage solidarity, which can weaken social cohesion.',
    sourceTopics: ['practice-ulighed'],
    cefr: 'B2',
  },

  // ── Connectors: opinion ──────────────────────────────────────────────────
  {
    id: 'v-jeg-tror',
    word: 'jeg tror',
    category: 'connector',
    definitionDa: 'Udtrykker en formodning — bruges når man gætter på en årsag, ikke når man er sikker.',
    glossEn: 'I think / I believe',
    example: 'Jeg tror, at mange gør det, fordi fast fashion er økonomisk tilgængeligt.',
    exampleEn: 'I think many do it because fast fashion is financially accessible.',
    sourceTopics: ['practice-toejforbrug'],
    cefr: 'B1',
  },
  {
    id: 'v-efter-min-mening',
    word: 'efter min mening / jeg mener',
    category: 'connector',
    definitionDa: 'Udtrykker en holdning frem for en formodning — bruges typisk til vurderingsspørgsmål.',
    glossEn: 'in my opinion / I believe (as a judgement)',
    example: 'Jeg mener, dette er et strukturelt problem, der kræver mere end individuel handling.',
    exampleEn: 'I believe this is a structural problem that requires more than individual action.',
    sourceTopics: ['practice-toejforbrug'],
    cefr: 'B1',
  },

  // ── Fordele / ulemper vocabulary ─────────────────────────────────────────
  {
    id: 'v-fordelen-er',
    word: 'fordelen/ulempen er (at)',
    category: 'connector',
    definitionDa: 'Den faste indledning til fordele-og-ulemper-svar.',
    glossEn: 'the advantage/disadvantage is (that)',
    example: 'Fordelen er, at ansatte har en høj tryghed via A-kasser og dagpenge.',
    exampleEn: 'The advantage is that employees have high security through unemployment funds and benefits.',
    sourceTopics: ['practice-ulighed'],
    cefr: 'B1',
  },
  {
    id: 'v-opveje',
    word: 'opveje',
    category: 'verb',
    definitionDa: 'Når en fordel er stor nok til at gøre en ulempe mindre vigtig.',
    glossEn: 'to outweigh',
    example: 'Jeg tror dog, den høje sikkerhed opvejer den øgede fleksibilitet.',
    exampleEn: 'I do think the high security outweighs the increased flexibility.',
    sourceTopics: ['practice-ulighed'],
    cefr: 'C1',
  },

  // ── Content nouns ─────────────────────────────────────────────────────────
  {
    id: 'v-incitament',
    word: 'incitament',
    category: 'noun',
    definitionDa: 'Noget der motiverer én til at handle på en bestemt måde, typisk økonomisk.',
    glossEn: 'incentive',
    example: 'Jeg tror, de mener, at incitamentet til at stræbe efter succes er afgørende for økonomisk vækst.',
    exampleEn: 'I think they believe the incentive to strive for success is crucial for economic growth.',
    sourceTopics: ['practice-ulighed'],
    cefr: 'C1',
  },
  {
    id: 'v-solidaritet',
    word: 'solidaritet',
    category: 'noun',
    definitionDa: 'Følelsen af sammenhold og gensidig støtte i en gruppe eller et samfund.',
    glossEn: 'solidarity',
    example: 'For stor ulighed kan føre til social uro og mistillid, hvilket kan skade solidariteten.',
    exampleEn: 'Too much inequality can lead to social unrest and distrust, which can damage solidarity.',
    sourceTopics: ['practice-ulighed'],
    cefr: 'C1',
  },
  {
    id: 'v-sammenhaengskraft',
    word: 'sammenhængskraft',
    category: 'noun',
    definitionDa: 'Det, der holder et samfund sammen — fælles værdier og tillid mellem mennesker.',
    glossEn: 'social cohesion',
    example: 'Hvad tror du, det betyder for et samfunds sammenhængskraft, at der er stor tolerance over for minoriteter?',
    exampleEn: 'What do you think it means for a society’s cohesion that there is great tolerance for minorities?',
    sourceTopics: ['practice-frisind'],
    cefr: 'C1',
  },
  {
    id: 'v-stigmatisere',
    word: 'stigmatisere',
    category: 'verb',
    definitionDa: 'At give en gruppe et negativt stempel, så de bliver set ned på.',
    glossEn: 'to stigmatise',
    example: 'Der er en følelse af, at samfundet stigmatiserer modtagere af offentlig støtte.',
    exampleEn: 'There is a feeling that society stigmatises recipients of public support.',
    sourceTopics: ['practice-ulighed'],
    cefr: 'C1',
  },
  {
    id: 'v-oeremaerket',
    word: 'øremærket',
    category: 'adjective',
    definitionDa: 'Sat til side til ét bestemt formål — kan ikke bruges til noget andet.',
    glossEn: 'earmarked (ring-fenced)',
    example: 'Det er blevet mere almindeligt på grund af lovgivning om øremærket barsel.',
    exampleEn: 'It has become more common due to legislation on earmarked parental leave.',
    sourceTopics: ['practice-foraeldreskab'],
    cefr: 'C1',
  },
  {
    id: 'v-brugerbetaling',
    word: 'brugerbetaling',
    category: 'noun',
    definitionDa: 'Et gebyr borgeren selv betaler for en ellers offentlig ydelse.',
    glossEn: 'user fee / co-payment',
    example: 'Nogle mener, at det offentlige sundhedsvæsen bør indføre en form for brugerbetaling.',
    exampleEn: 'Some believe the public health system should introduce a form of user fee.',
    sourceTopics: ['practice-velfaerd'],
    cefr: 'C1',
  },
  {
    id: 'v-skattetryk',
    word: 'skattetryk',
    category: 'noun',
    definitionDa: 'Hvor meget skat borgere og virksomheder samlet set betaler, sat i forhold til økonomien.',
    glossEn: 'tax burden',
    example: 'Den danske velfærdsmodel finansieres gennem et af verdens højeste skattetryk.',
    exampleEn: 'The Danish welfare model is financed through one of the highest tax burdens in the world.',
    sourceTopics: ['practice-velfaerd'],
    cefr: 'C1',
  },
  {
    id: 'v-sofavaelger',
    word: 'sofavælger',
    category: 'noun',
    definitionDa: 'En person, der bliver hjemme og ikke stemmer til et valg.',
    glossEn: 'a non-voter (lit. "sofa voter")',
    example: "Nogle mennesker vælger at være 'sofavælgere', fordi de ikke synes, de kan finde et parti, de er enige med.",
    exampleEn: 'Some people choose to be non-voters because they feel they cannot find a party they agree with.',
    sourceTopics: ['practice-valgdeltagelse'],
    cefr: 'B2',
  },
  {
    id: 'v-ytringsfrihed',
    word: 'ytringsfrihed',
    category: 'noun',
    definitionDa: 'Retten til frit at sige sin mening, også når andre er uenige eller stødte.',
    glossEn: 'freedom of speech',
    example: 'Danmark har en meget stærk tradition for ytringsfrihed.',
    exampleEn: 'Denmark has a very strong tradition of freedom of speech.',
    sourceTopics: ['practice-frisind'],
    cefr: 'B2',
  },
  {
    id: 'v-mangfoldighed',
    word: 'mangfoldighed',
    category: 'noun',
    definitionDa: 'Stor variation af mennesker med forskellig baggrund, kultur eller erfaring.',
    glossEn: 'diversity',
    example: 'Fordele er, at mangfoldighed bringer nye perspektiver og innovation til virksomheden.',
    exampleEn: 'The advantage is that diversity brings new perspectives and innovation to the company.',
    sourceTopics: ['practice-frisind'],
    cefr: 'B2',
  },
  {
    id: 'v-retfaerdiggoere',
    word: 'retfærdiggøre',
    category: 'verb',
    definitionDa: 'At forklare eller undskylde noget, så det virker acceptabelt.',
    glossEn: 'to justify',
    example: 'Det er let at retfærdiggøre et køb, når prisen er lav.',
    exampleEn: 'It is easy to justify a purchase when the price is low.',
    sourceTopics: ['practice-toejforbrug'],
    cefr: 'C1',
  },
  {
    id: 'v-belaste',
    word: 'belaste',
    category: 'verb',
    definitionDa: 'At lægge en byrde på noget — fx miljøet eller en persons økonomi.',
    glossEn: 'to burden / to put strain on',
    example: 'Mange danskere køber billigt tøj, selvom de ved, at det belaster klimaet.',
    exampleEn: 'Many Danes buy cheap clothes even though they know it burdens the climate.',
    sourceTopics: ['practice-toejforbrug'],
    cefr: 'B2',
  },
  {
    id: 'v-cirkulaer',
    word: 'cirkulær (økonomi/forbrug)',
    category: 'adjective',
    definitionDa: 'Når materialer bliver genbrugt igen og igen i stedet for smidt ud.',
    glossEn: 'circular (economy/consumption)',
    example: 'En voksende klimabevidsthed hos forbrugerne, der ønsker at handle mere cirkulært.',
    exampleEn: 'A growing climate awareness among consumers who want to shop more circularly.',
    sourceTopics: ['practice-toejforbrug'],
    cefr: 'C1',
  },
  {
    id: 'v-rollemodel',
    word: 'rollemodel',
    category: 'noun',
    definitionDa: 'En person, hvis adfærd andre — ofte børn — lærer af og efterligner.',
    glossEn: 'role model',
    example: 'Forældrene er gode rollemodeller, fordi de lærer børnene, at det er vigtigt at hjælpe andre.',
    exampleEn: 'The parents are good role models because they teach their children that it is important to help others.',
    sourceTopics: ['2011-s-velg-rende-arbejde'],
    cefr: 'B1',
  },
  {
    id: 'v-erstatte',
    word: 'erstatte',
    category: 'verb',
    definitionDa: 'At sætte noget nyt i stedet for noget andet, fx et menneske eller en ting.',
    glossEn: 'to replace',
    example: 'De frivillige må ikke erstatte det professionelle personale.',
    exampleEn: 'Volunteers must not replace the professional staff.',
    sourceTopics: ['2011-s-velg-rende-arbejde'],
    cefr: 'B1',
  },
  {
    id: 'v-supplement',
    word: 'supplement',
    category: 'noun',
    definitionDa: 'Noget ekstra, der lægges til det, der allerede findes — ikke en erstatning.',
    glossEn: 'a supplement / addition',
    example: 'Frivilligt arbejde skal være noget ekstra — et supplement — og ikke en erstatning for de ansatte.',
    exampleEn: 'Volunteer work should be something extra — a supplement — not a replacement for the employees.',
    sourceTopics: ['2011-s-velg-rende-arbejde'],
    cefr: 'B2',
  },
  {
    id: 'v-prisfoelsom',
    word: 'prisfølsom',
    category: 'adjective',
    definitionDa: 'Meget påvirket af prisændringer i sine beslutninger om at købe noget.',
    glossEn: 'price-sensitive',
    example: 'Fordelen er, at unge er meget prisfølsomme.',
    exampleEn: 'The advantage is that young people are very price-sensitive.',
    sourceTopics: [],
    cefr: 'C1',
  },
  {
    id: 'v-kropsideal',
    word: 'kropsideal',
    category: 'noun',
    definitionDa: 'Et samfunds eller en gruppes forestilling om, hvordan en "perfekt" krop ser ud.',
    glossEn: 'body ideal',
    example: 'Det handler om kropsidealer og identitet.',
    exampleEn: 'It is about body ideals and identity.',
    sourceTopics: [],
    cefr: 'B2',
  },
];

export function vocabById(id: string): VocabEntry | undefined {
  return VOCABULARY.find((v) => v.id === id);
}

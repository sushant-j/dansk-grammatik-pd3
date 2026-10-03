/**
 * The PD3 oral-exam topic archive (Mundtlig kommunikation), 2011–2020.
 *
 * Transcribed from a learner's own study set covering every official exam
 * session in that window: each session (S = spring/maj-juni, V = autumn/
 * november-december) sets 2–6 topics, each topic carries the obligatory
 * question(s) the examiner asks, its follow-up, and a model answer written in
 * PD3-appropriate register. This is the "what has actually been asked" data
 * the search screen runs against — the same 56 topics a real candidate sat.
 *
 * Two more sessions (2023-S, 2023-V) are in `officialSessions` below, official titles
 * only, because the source PDFs are exam prompt sheets keyed to two images
 * per topic (`Emne A/B/C`) rather than a Q&A key.
 *
 * 2024-S is the one recent session whose examiner booklet SIRI has published:
 * its questions are verbatim; the model answers are written for this app.
 * No 2024-V or 2025 booklet is public, so those sessions are absent rather
 * than guessed.
 */

export type Term = 'S' | 'V';

export interface TopicQuestion {
  kind: 'main' | 'follow' | 'obligatory';
  q: string;
  a: string;
  /** Which picture a first obligatory question belongs to (the examiner picks one). */
  situation?: 'A' | 'B';
  /** The examiner's suggested one-line introduction to that picture. */
  intro?: string;
}

export interface Topic {
  id: string;
  year: number;
  term: Term;
  /** Emne label (A/B/C) when the source distinguished one; '' otherwise. */
  label: string;
  title: string;
  questions: TopicQuestion[];
  /** The two pictures on the candidate's sheet, when known. */
  scenes?: [string, string];
  /** Set when questions are verbatim from a published official booklet. */
  source?: { label: string; url: string };
}

const OFFICIAL_2024_S = {
  label: 'Censor- og eksaminatorhæfte, PD3 mundtlig, maj-juni 2024 (SIRI)',
  url: 'https://danskogproever.dk/media/prob2ifo/censor-og-eksaminatorhaefte-pd3-mdt.pdf',
};

export const TOPICS: Topic[] = [
  {
    id: '2024-s-stoette-til-kultur',
    year: 2024,
    term: 'S',
    label: 'A',
    title: `Støtte til kultur`,
    scenes: ['En familie på vej ind på et kunstmuseum med gratis adgang for børn', 'En biograf, der reklamerer for en ny dansk film'],
    source: OFFICIAL_2024_S,
    questions: [
      {
        kind: 'main',
        situation: 'A',
        intro: `Situation A viser en familie, der er på vej ind på et kunstmuseum, hvor der er gratis adgang for børn.`,
        q: `Børn kan ofte få gratis adgang eller rabat til kulturinstitutioner som fx museer eller teatre. Hvorfor tror du, de kan det?`,
        a: `Jeg tror, der er flere grunde til det. For det første vil man gerne have, at børn møder kunst og kultur tidligt i livet, så de får interesse for det og bliver ved med at bruge museer og teatre, når de bliver voksne. For det andet gør det det billigere for familier at tage afsted sammen, så det ikke kun er familier med god økonomi, der har råd til det. Derudover får museerne flere besøgende, fordi forældrene jo betaler fuld pris.`,
      },
      {
        kind: 'follow',
        q: `Synes du, det er en god idé at tage børn med på museum? Hvorfor?/Hvorfor ikke?`,
        a: `Ja, det synes jeg helt klart. Børn lærer rigtig meget af at se tingene i virkeligheden i stedet for bare at læse om dem i en bog. Mange museer har i dag aktiviteter for børn, hvor de selv må røre ved tingene eller prøve noget, og det gør det sjovt at lære. Det kræver dog, at man ikke bliver for længe, for små børn bliver hurtigt trætte. Derfor skal man vælge en udstilling, der passer til barnets alder.`,
      },
      {
        kind: 'main',
        situation: 'B',
        intro: `Situation B viser en biograf, der reklamerer for en ny dansk film.`,
        q: `I Danmark kan kunstnere få støtte af staten til at lave film. Hvorfor tror du, de kan det?`,
        a: `Jeg tror, det skyldes, at Danmark er et lille land med et lille sprog. Det er meget dyrt at lave en film, og fordi kun omkring seks millioner mennesker taler dansk, kan en dansk film sjældent tjene pengene hjem. Uden støtte ville der sandsynligvis næsten kun blive vist amerikanske film i biograferne. Desuden er film en vigtig del af den danske kultur, fordi de fortæller historier om danske forhold, som vi kan genkende os selv i.`,
      },
      {
        kind: 'follow',
        q: `Synes du, det er vigtigt, at staten støtter danske film? Hvorfor?/Hvorfor ikke?`,
        a: `Ja, overordnet set synes jeg det. Danske film er med til at bevare det danske sprog og den danske kultur, og nogle af dem er blevet kendt i hele verden, hvilket også er god reklame for Danmark. På den anden side er det skatteydernes penge, og der er andre områder som sundhed og ældrepleje, der også mangler penge. Derfor er det vigtigt, at støtten bliver fordelt fornuftigt, og at det ikke kun er de samme få instruktører, der får pengene.`,
      },
      {
        kind: 'obligatory',
        q: `Nogle kommuner vælger at bruge mange penge på store, internationale sportsbegivenheder som europamesterskaber og verdensmesterskaber. Hvilke fordele og ulemper mener du, der kan være ved det for kommunerne?`,
        a: `En af fordelene er, at kommunen bliver kendt i udlandet, og at der kommer mange turister, som bruger penge på hoteller, restauranter og butikker. Det kan skabe arbejdspladser og give borgerne en stor fælles oplevelse. Derudover kan det inspirere børn og unge til at dyrke mere sport. Ulempen er derimod, at det er meget dyrt, og at det ikke er sikkert, at man tjener pengene hjem igen. Hvis kommunen bruger mange penge på et stort arrangement, kan der blive færre penge til skoler og ældrepleje. Samlet set mener jeg, at det kan være en god idé, hvis kommunen har en realistisk plan og samarbejder med private sponsorer.`,
      },
      {
        kind: 'follow',
        q: `Mener du, at en kommune hellere skulle prioritere at bruge penge på andre områder end store, internationale sportsbegivenheder – fx børnepasning eller ældrepleje? Hvorfor?/Hvorfor ikke?`,
        a: `Ja, som udgangspunkt mener jeg det. Kommunens vigtigste opgave er velfærden for borgerne, og børnepasning og ældrepleje er noget, som rigtig mange er afhængige af hver dag. En sportsbegivenhed varer kun et par uger, mens dårlige normeringer i daginstitutionerne påvirker børnene i mange år. Når det er sagt, behøver det ikke at være enten-eller. Hvis begivenheden skaber indtægter, kan den måske ligefrem give penge tilbage til velfærden.`,
      },
    ],
  },
  {
    id: '2024-s-mangel-paa-arbejdskraft',
    year: 2024,
    term: 'S',
    label: 'B',
    title: `Mangel på arbejdskraft`,
    scenes: ['En travl sygeplejerske med ansvar for mange patienter', 'En byggeplads, hvor arbejdet endnu ikke er gået i gang'],
    source: OFFICIAL_2024_S,
    questions: [
      {
        kind: 'main',
        situation: 'A',
        intro: `Situation A viser en sygeplejerske, der har ansvar for mange patienter og har travlt.`,
        q: `Der mangler arbejdskraft i sundhedssektoren, fx sygeplejersker og social- og sundhedsassistenter. Hvorfor tror du, der gør det?`,
        a: `Jeg tror, der er flere årsager. For det første bliver der flere og flere ældre i Danmark, som har brug for pleje og behandling, så behovet for personale stiger hele tiden. For det andet er arbejdet hårdt, både fysisk og psykisk, og mange arbejder om aftenen, om natten og i weekenderne. Derudover synes mange, at lønnen ikke står mål med det store ansvar. Derfor vælger færre unge uddannelsen, og nogle af dem, der er uddannet, skifter til et andet job.`,
      },
      {
        kind: 'follow',
        q: `Hvilke problemer mener du, der kan være ved, at der mangler sygeplejersker og social- og sundhedsassistenter?`,
        a: `Det største problem er, at det går ud over patienterne. Hvis der er for få ansatte, bliver ventetiderne længere, og personalet har mindre tid til den enkelte patient, så der kan ske flere fejl. Samtidig bliver de ansatte, der er tilbage, mere stressede og bliver måske sygemeldt, hvilket gør manglen endnu større. Det bliver en ond cirkel. Desuden kan det betyde, at ældre ikke får den hjælp i hjemmet, de har brug for.`,
      },
      {
        kind: 'main',
        situation: 'B',
        intro: `Situation B viser en byggeplads, hvor arbejdet endnu ikke er gået i gang.`,
        q: `Der mangler arbejdskraft i byggebranchen, fx tømrere og jord- og betonarbejdere. Hvorfor tror du, der gør det?`,
        a: `Jeg tror især, det skyldes, at mange unge hellere vil gå i gymnasiet og læse videre end tage en erhvervsuddannelse. Håndværksfag har måske ikke så høj status, som de burde have. Desuden er arbejdet fysisk hårdt, og man arbejder ofte udenfor i al slags vejr. Samtidig bliver der bygget rigtig meget i Danmark i disse år, både boliger og infrastruktur, så efterspørgslen efter håndværkere er meget høj.`,
      },
      {
        kind: 'follow',
        q: `Hvilke problemer mener du, der kan være ved, at der mangler arbejdskraft inden for byggebranchen?`,
        a: `Et problem er, at byggeprojekter bliver forsinkede og dyrere, fordi firmaerne ikke kan få folk nok. Det kan for eksempel betyde, at der bliver bygget færre boliger, så det bliver endnu sværere at finde et sted at bo i de store byer. Derudover kan virksomhederne blive nødt til at sige nej til opgaver, hvilket går ud over deres økonomi. På længere sigt kan det skade væksten i hele samfundet.`,
      },
      {
        kind: 'obligatory',
        q: `Ved mangel på arbejdskraft kan man fra politisk side vælge at gøre det nemmere for virksomheder at rekruttere udenlandsk arbejdskraft. Hvilke fordele og ulemper mener du, der kan være ved det for samfundet?`,
        a: `Den største fordel er, at virksomhederne hurtigt kan få de medarbejdere, de mangler, så de kan blive ved med at producere og vokse. Det giver flere skatteindtægter, og velfærden kan opretholdes, selvom der bliver flere ældre. Udenlandske medarbejdere kan også bidrage med nye idéer og kompetencer. På den anden side kan det presse lønningerne ned i nogle brancher, hvis arbejdsgiverne udnytter, at udenlandske arbejdere vil arbejde for mindre. Der kan også være sproglige barrierer og udfordringer med integration. Jeg mener derfor, at det er en god løsning, så længe der er ordentlige løn- og arbejdsvilkår, og man samtidig uddanner flere i Danmark.`,
      },
      {
        kind: 'follow',
        q: `Mener du, det er i orden at rekruttere udenlandsk arbejdskraft, selvom der er borgere i Danmark, der er arbejdsløse? Hvorfor?/Hvorfor ikke?`,
        a: `Ja, det mener jeg godt kan være i orden. De arbejdsløse har ikke altid de kompetencer, som virksomhederne efterspørger, eller de bor måske et andet sted i landet end der, hvor jobbene er. Det tager lang tid at omskole folk, og i mellemtiden har virksomhederne brug for hjælp. Men samtidig synes jeg, det er vigtigt, at jobcentrene gør mere for at opkvalificere de ledige, så udenlandsk arbejdskraft bliver et supplement og ikke en erstatning.`,
      },
    ],
  },
  {
    id: '2024-s-paedagogik-i-folkeskolen',
    year: 2024,
    term: 'S',
    label: 'C',
    title: `Pædagogik i folkeskolen`,
    scenes: ['En folkeskoleklasse, hvor flere børn er urolige og uopmærksomme', 'En klasse, hvor eleverne arbejder sammen om en opgave'],
    source: OFFICIAL_2024_S,
    questions: [
      {
        kind: 'main',
        situation: 'A',
        intro: `Situation A viser en folkeskoleklasse, hvor flere af børnene er urolige og uopmærksomme.`,
        q: `I nogle klasser i folkeskolen er der meget uro. Hvorfor tror du, der er det?`,
        a: `Jeg tror, der kan være mange forskellige årsager. En af dem er, at der ofte er mange elever i klasserne, og at nogle elever har brug for særlig støtte, som læreren ikke har tid til at give. Derudover bruger børn i dag meget tid på mobiltelefoner og skærme, og det kan gøre det sværere for dem at koncentrere sig i længere tid. Det kan også handle om, at undervisningen er for stillesiddende, så eleverne ikke får brugt deres energi.`,
      },
      {
        kind: 'follow',
        q: `Hvad mener du, lærerne kan gøre for at begrænse uroen i klasserne?`,
        a: `Jeg mener, at lærerne kan lave klare regler og rutiner sammen med eleverne, så alle ved, hvad der forventes. Det kan også hjælpe at variere undervisningen med bevægelse og gruppearbejde, så eleverne ikke skal sidde stille i flere timer. Mange skoler har desuden indført, at mobiltelefonerne skal afleveres om morgenen, og det synes jeg er en god idé. Endelig er et godt samarbejde med forældrene vigtigt, fordi det er lettere at løse problemerne, når skole og hjem trækker i samme retning.`,
      },
      {
        kind: 'main',
        situation: 'B',
        intro: `Situation B viser en klasse, hvor eleverne sidder og arbejder sammen om en opgave.`,
        q: `Eleverne får ikke karakterer i de første klasser i folkeskolen. Hvorfor tror du, det er sådan?`,
        a: `Jeg tror, det er, fordi man i Danmark lægger stor vægt på, at små børn skal lære med lyst og ikke føle sig presset. Hvis børn får karakterer allerede som syvårige, begynder de måske at sammenligne sig med hinanden, og de svage elever kan miste selvtilliden. I stedet får elever og forældre mundtlig feedback, for eksempel til skole-hjem-samtaler. Desuden handler de første skoleår meget om at udvikle sig socialt og lære at samarbejde, og det kan man ikke give en karakter for.`,
      },
      {
        kind: 'follow',
        q: `Kan der være nogen problemer ved, at der ikke gives karakterer i de første klasser i folkeskolen?`,
        a: `Ja, det kan der godt. Et problem kan være, at hverken eleverne eller forældrene får et klart billede af, hvordan barnet klarer sig fagligt. Hvis feedbacken er for uklar, risikerer man, at problemer først bliver opdaget sent. Nogle elever bliver også mere motiverede af at have et konkret mål. Derfor synes jeg, det er vigtigt, at lærerne giver tydelig og konkret feedback, selvom der ikke er karakterer.`,
      },
      {
        kind: 'obligatory',
        q: `I folkeskolen går eleverne typisk i samme klasse i de fleste fag, selvom de har forskelligt fagligt niveau. Hvilke fordele og ulemper mener du, der kan være ved det i forhold til børnenes faglige og sociale udvikling?`,
        a: `Fordelen er især social. Når børn med forskellige baggrunde og forskelligt niveau går i klasse sammen, lærer de at respektere hinanden og at samarbejde, hvilket er vigtigt i et demokratisk samfund. De dygtige elever kan også lære meget af at forklare tingene til de andre. Ulempen er derimod faglig. Det er svært for én lærer at undervise både de stærkeste og de svageste elever på samme tid, så de dygtige kan komme til at kede sig, mens de svage kan føle, at de ikke kan følge med. Efter min mening er det bedste en blanding, hvor man for det meste går i samme klasse, men nogle gange bliver delt op efter niveau i fag som matematik.`,
      },
      {
        kind: 'follow',
        q: `Hvad mener du, det betyder for samfundet, at børn går i samme klasse, selvom de har forskelligt fagligt niveau?`,
        a: `Jeg mener, det er med til at skabe sammenhængskraft i samfundet. Når børn fra forskellige sociale lag går i skole sammen, får de forståelse for hinanden, og det kan mindske forskellene mellem rige og fattige på længere sigt. Det er en del af den danske tradition for lighed. På den anden side kan samfundet miste noget, hvis de mest talentfulde elever ikke bliver udfordret nok. Derfor er det vigtigt, at lærerne har ressourcer til at differentiere undervisningen.`,
      },
    ],
  },
  {
    id: '2011-s-velg-rende-arbejde',
    year: 2011,
    term: 'S',
    label: '',
    title: `Velgørende arbejde`,
    questions: [
      {
        kind: 'main',
        q: `Hvorfor tror du, nogle mennesker vælger at lave frivilligt arbejde?`,
        a: `Jeg tror, at der kan være flere årsager til, at folk vælger at arbejde frivilligt. For det første giver det mange mennesker en rigtig god følelse i maven at gøre en forskel for andre, som har brug for hjælp. Derudover er det en god måde at møde nye mennesker på og blive en del af et fællesskab. Det kan også være, at man gerne vil lære noget nyt, som man kan bruge på sit CV, når man skal søge arbejde.`,
      },
      {
        kind: 'follow',
        q: `Hvad tror du, det betyder for familielivet, at forældre engagerer sig i frivilligt arbejde?`,
        a: `Det kan have både positive og negative konsekvenser for familien. På den ene side er forældrene gode rollemodeller, fordi de lærer børnene, at det er vigtigt at hjælpe andre mennesker i samfundet. På den anden side kan det også betyde, at forældrene får mindre tid til at hygge sig med deres egne børn derhjemme. Hvis de har for travlt, kan det skabe stress i familien, så det handler om at finde en god balance.`,
      },
      {
        kind: 'main',
        q: `Kommunerne gør mere og mere brug af frivillig arbejdskraft. Hvilke fordele og ulemper mener du, der kan være ved det?`,
        a: `Der er både fordele og ulemper ved at bruge frivillige. En stor fordel er, at de frivillige ofte har tid til at give ekstra omsorg, som de ansatte har for travlt til, for eksempel at gå ture eller spille spil med de ældre. Ulempen er dog, at de frivillige ikke har en uddannelse inden for pleje. Derfor må de ikke erstatte det professionelle personale, da det kan gå ud over kvaliteten og sikkerheden for borgerne.`,
      },
      {
        kind: 'follow',
        q: `Hvad mener du om, at kommuner bruger frivillig arbejdskraft for at spare penge?`,
        a: `Jeg synes, det er problematisk, hvis kommunen kun bruger frivillige for at spare penge. Det kan betyde, at rigtige jobs forsvinder, og at uddannet personale bliver fyret. Frivilligt arbejde skal være noget ekstra – et supplement – og ikke en erstatning for de ansatte. På den måde sikrer man, at de ældre og syge får den bedste behandling af professionelle folk.`,
      },
    ],
  },
  {
    id: '2011-s-spisevaner',
    year: 2011,
    term: 'S',
    label: '',
    title: `Spisevaner`,
    questions: [
      {
        kind: 'main',
        q: `Hvorfor tror du, mange mennesker vælger usund mad, selvom de ved, det er skadeligt?`,
        a: `Jeg tror, at der er flere grunde til det. For det første er usund mad som fastfood ofte billigere og nemmere at få fat i, når man har travlt i hverdagen. Derudover smager fedt og sukker rigtig godt, og vores hjerne elsker det, hvilket gør det svært at sige nej. Mange mennesker er måske også for trætte til at lave sund mad, når de kommer hjem fra arbejde.`,
      },
      {
        kind: 'follow',
        q: `Hvad tror du, det betyder for sundheden i samfundet, at mange mennesker vælger usund mad?`,
        a: `Det er et stort problem, fordi det betyder, at flere mennesker bliver overvægtige og får sygdomme som diabetes og hjerteproblemer. Det går ud over deres livskvalitet, så de måske dør tidligere. På den anden side er det også dyrt for samfundet, fordi hospitalerne skal bruge rigtig mange penge på at behandle disse sygdomme, som man faktisk kunne have undgået med sundere mad.`,
      },
      {
        kind: 'main',
        q: `Hvordan kan samfundet fremme sunde spisevaner?`,
        a: `Jeg synes, at samfundet kan gøre flere ting. Man kunne for eksempel sætte prisen ned på frugt og grøntsager og samtidig sætte prisen op på sodavand og slik (afgifter). Derudover er det en god idé, at skoler og arbejdspladser tilbyder sund og lækker mad i kantinen. Man kan også lave kampagner, der fortæller folk, hvorfor det er vigtigt at spise sundt.`,
      },
      {
        kind: 'follow',
        q: `Hvordan tror du, det kan påvirke børns spisevaner, hvis de får sunde alternativer i skolen?`,
        a: `Det vil have en meget positiv effekt. Hvis børn vænner sig til at spise sundt i skolen hver dag, bliver det en naturlig del af deres liv. De får også mere energi til at koncentrere sig og lære noget i timerne. På den måde tager de de gode vaner med sig ind i voksenlivet, og de kan måske endda påvirke deres forældre derhjemme.`,
      },
    ],
  },
  {
    id: '2011-s-lykke',
    year: 2011,
    term: 'S',
    label: '',
    title: `Lykke`,
    questions: [
      {
        kind: 'main',
        q: `Hvad tror du, gør mennesker lykkelige i deres hverdag?`,
        a: `Jeg tror, at det vigtigste for at være lykkelig er at have gode relationer til familie og venner. Når man har nogen at dele livet med, føler man sig ikke alene. Derudover betyder tryghed meget, for eksempel at man har et arbejde, man er glad for, og et sted at bo. Når man ikke skal bekymre sig om fremtiden, er det nemmere at være glad og tilfreds.`,
      },
      {
        kind: 'follow',
        q: `Hvilken rolle tror du, økonomisk tryghed spiller for lykke?`,
        a: `Penge er ikke alt, men det spiller en stor rolle. Hvis man hele tiden stresser over regninger og mangler penge til mad, er det meget svært at være lykkelig. Økonomisk tryghed giver ro i maven og frihed til at gøre ting, man godt kan lide. Men når man først har nok til det nødvendige, tror jeg ikke, man bliver mere lykkelig af at få endnu flere penge.`,
      },
      {
        kind: 'main',
        q: `Hvordan tror du, det påvirker lykken, hvis man bruger meget tid på sociale medier?`,
        a: `Det kan påvirke lykken både positivt og negativt. På den ene side er det hyggeligt at holde kontakt med venner. Men på den anden side ser man ofte kun andres "perfekte" liv på sociale medier. Det kan få en til at sammenligne sig selv med andre og føle, at man ikke er god nok. Det kan desværre føre til ensomhed og dårligt humør.`,
      },
      {
        kind: 'follow',
        q: `Hvordan kan samfundet støtte mennesker i at leve et lykkeligere liv?`,
        a: `Samfundet kan skabe rammerne for det gode liv ved at sikre tryghed. Det betyder, at vi skal have et godt sundhedsvæsen, gode skoler og hjælp, hvis man mister sit job. Derudover kan samfundet støtte foreninger og klubber, hvor folk kan mødes og være sammen. Det er også vigtigt at fokusere på at mindske stress på arbejdspladserne, så folk har overskud.`,
      },
    ],
  },
  {
    id: '2011-v-frivilligt-arbejde',
    year: 2011,
    term: 'V',
    label: 'A',
    title: `Frivilligt arbejde`,
    questions: [
      {
        kind: 'main',
        q: `Hvorfor tror du, mange mennesker vælger at lave frivilligt arbejde?`,
        a: `Jeg tror, at mange vælger det, fordi de gerne vil gøre en forskel for andre mennesker eller for naturen. Det giver mening i hverdagen at hjælpe uden at få penge for det. Derudover er det en god måde at møde nye mennesker på og blive en del af et fællesskab. Nogle gør det også for at lære noget nyt, som de kan bruge i deres karriere senere hen.`,
      },
      {
        kind: 'follow',
        q: `Hvad tror du, det betyder for familielivet, at forældre engagerer sig i frivilligt arbejde?`,
        a: `Det kan være rigtig positivt, fordi forældrene viser deres børn, at det er vigtigt at tage ansvar og være hjælpsom. Børn lærer meget af at se deres forældre gøre noget godt. Men på den anden side kan det også stresse familien, hvis forældrene bruger al deres fritid på det frivillige arbejde. Så har de måske ikke tid nok til at være sammen med deres egne børn.`,
      },
      {
        kind: 'follow',
        q: `Hvad tror du, frivilligt arbejde betyder for den enkelte persons livskvalitet?`,
        a: `Det betyder rigtig meget for livskvaliteten. Når man hjælper andre, føler man sig nyttig og værdsat, hvilket giver selvtillid. Mange føler sig også mindre ensomme, fordi de kommer ud og er sociale sammen med andre. Det giver en følelse af glæde og tilfredsstillelse at vide, at man har gjort en andens dag lidt bedre.`,
      },
      {
        kind: 'follow',
        q: `Hvordan tror du, det påvirker samfundet, når flere engagerer sig i frivilligt arbejde?`,
        a: `Det gør samfundet stærkere og bedre at leve i. Når folk hjælper hinanden, skaber det tillid og sammenhold mellem borgerne. Det betyder også, at vi kan løse flere opgaver, som det offentlige måske ikke har råd til, for eksempel i sportsklubber eller besøgsvenner til ældre. Det er med til at binde os sammen som nation.`,
      },
      {
        kind: 'main',
        q: `Kommuner bruger ofte frivillige til opgaver som ældrepleje og socialt arbejde. Hvad mener du om det?`,
        a: `Jeg synes, det kan være positivt, hvis de frivillige laver sociale aktiviteter, som giver livskvalitet, for eksempel hygge og gåture. Det giver de ældre mere omsorg. Men det er meget vigtigt, at de frivillige ikke erstatter det uddannede personale. De må ikke lave plejeopgaver, da de ikke har den faglige viden, og det kan være utrygt for de ældre.`,
      },
      {
        kind: 'follow',
        q: `Synes du, at frivillige skal have samme ansvar som professionelle medarbejdere? Hvorfor/Hvorfor ikke?`,
        a: `Nej, det synes jeg bestemt ikke. De professionelle har en uddannelse og får løn for at have ansvaret. De frivillige gør det af lyst, og de har ikke den samme viden om medicin eller pleje. Hvis man giver frivillige for stort ansvar, kan der ske fejl, og de frivillige kan blive stressede over opgaver, de ikke kan løse.`,
      },
      {
        kind: 'main',
        q: `Synes du, at unge bør lære værdien af frivilligt arbejde i skolen?`,
        a: `Ja, det synes jeg er en rigtig god idé. Hvis skolen introducerer frivilligt arbejde, lærer de unge at tage ansvar for andre og vise empati. Det er en vigtig del af at blive en god borger. Samtidig kan de unge udvikle deres sociale evner og få mere selvtillid, når de oplever, at de kan gøre en forskel for andre mennesker.`,
      },
      {
        kind: 'follow',
        q: `Hvad tror du, frivilligt arbejde kan lære unge om samfundets udfordringer?`,
        a: `Det kan åbne deres øjne for, hvordan andre mennesker lever. De kan lære om problemer som ensomhed blandt ældre, fattigdom eller miljøproblemer. Når de ser virkeligheden tæt på, forstår de bedre, hvorfor det er vigtigt at hjælpe. Det gør dem til mere bevidste og ansvarlige mennesker i fremtiden.`,
      },
      {
        kind: 'follow',
        q: `Synes du, at frivilligt arbejde skal være en del af skolens pensum? Hvorfor/Hvorfor ikke?`,
        a: `Både ja og nej. Det er godt at prøve det, så man lærer, hvad det er. Men selve ordet "frivillig" betyder jo, at man selv vælger det. Hvis skolen tvinger eleverne til det, kan det være, at de mister lysten og ser det som en kedelig pligt. Så det skal være motiverende, ikke tvang.`,
      },
    ],
  },
  {
    id: '2011-v-b-rn-og-skolegang',
    year: 2011,
    term: 'V',
    label: 'B',
    title: `Børn og Skolegang`,
    questions: [
      {
        kind: 'main',
        q: `Hvorfor tror du, mange forældre vælger at sende deres børn i privatskole?`,
        a: `Jeg tror, forældre gør det, fordi de vil give deres børn den bedst mulige skolegang. De håber ofte på mindre klasser i privatskolen, så læreren har mere tid til hvert enkelt barn. Nogle vælger det også på grund af bestemte værdier, for eksempel en kreativ skole, eller fordi de er utilfredse med problemer som larm eller mobning i den lokale folkeskole.`,
      },
      {
        kind: 'follow',
        q: `Hvad tror du, det betyder for børns sociale liv, at de går i en privatskole fremfor en folkeskole?`,
        a: `Det kan give et meget stærkt fællesskab, fordi skolen måske er mindre, og alle kender alle. Men på den anden side kan det betyde, at børnene kun møder andre børn, der ligner dem selv og kommer fra samme type familier. I folkeskolen møder man alle typer mennesker fra lokalområdet, hvilket er sundt for at forstå forskellighed.`,
      },
      {
        kind: 'follow',
        q: `Synes du, det er fair, at privatskoler får offentlig støtte? Hvorfor/Hvorfor ikke?`,
        a: `Jeg synes, det kan være fair, fordi forældrene til børn i privatskoler også betaler skat. Privatskolerne hjælper med at uddanne børnene, hvilket er godt for samfundet. Men det er vigtigt, at staten ikke prioriterer privatskoler højere end folkeskolen. Alle børn skal have ret til en god uddannelse, uanset om forældrene har råd til at betale ekstra eller ej.`,
      },
      {
        kind: 'follow',
        q: `Tror du, privatskoler kan øge forskellen mellem børn i samfundet? Hvorfor/Hvorfor ikke?`,
        a: `Ja, det tror jeg desværre godt, det kan. Da det koster penge at gå i privatskole, er det ofte børn fra familier med god økonomi, der går der. Børn fra familier med færre penge bliver i folkeskolen. Det betyder, at børnene bliver opdelt efter deres forældres indkomst, og så mødes de ikke på tværs af samfundslag.`,
      },
    ],
  },
  {
    id: '2011-v-udseende',
    year: 2011,
    term: 'V',
    label: 'C',
    title: `Udseende`,
    questions: [
      {
        kind: 'main',
        q: `Hvorfor tror du, mange mennesker lægger stor vægt på deres udseende?`,
        a: `Jeg tror, det handler meget om selvtillid og lysten til at blive accepteret af andre. Vi lever i en tid, hvor udseendet betyder meget, og mange tror, at man får mere succes, hvis man ser godt ud. Det er ofte det første, folk lægger mærke til, når man mødes, så man vil gerne give et godt indtryk, både privat og på arbejdet.`,
      },
      {
        kind: 'follow',
        q: `Hvad tror du, det betyder for unge, at sociale medier ofte fremhæver et bestemt ideal for skønhed?`,
        a: `Det lægger et kæmpe pres på de unge. De ser hele tiden billeder af "perfekte" mennesker på Instagram og TikTok, men de glemmer, at billederne er redigerede. Det gør, at mange unge føler sig forkerte eller grimme, fordi de ikke kan leve op til idealet. Det kan desværre føre til dårligt selvværd og mistrivsel.`,
      },
      {
        kind: 'follow',
        q: `Synes du, det er en god idé at bruge kosmetiske operationer for at ændre sit udseende? Hvorfor/Hvorfor ikke?`,
        a: `Hvis man har et kompleks, der gør en meget ked af det, kan det måske hjælpe på selvtilliden. Men generelt synes jeg ikke, det er en god idé. Vi bør lære at elske os selv, som vi ser ud. Der er altid en risiko ved operationer, og det er ærgerligt, hvis man gør det bare for at ligne et ideal fra sociale medier.`,
      },
      {
        kind: 'main',
        q: `Nogle mener, at reklamer, der viser "perfekte" kroppe, skal reguleres. Hvilke fordele og ulemper mener du, der kan være ved det?`,
        a: `En stor fordel er, at det kan beskytte især unge mennesker mod det enorme pres for at se perfekte ud. Hvis reklamer viser mere almindelige kroppe, bliver idealet mere realistisk. En ulempe kan være, at det begrænser virksomhedernes frihed til at reklamere, som de vil. Det kan også være svært at lave regler for, hvad der er "perfekt".`,
      },
    ],
  },
  {
    id: '2012-s-karriere-og-videreuddannelse',
    year: 2012,
    term: 'S',
    label: 'A',
    title: `Karriere og videreuddannelse`,
    questions: [
      {
        kind: 'main',
        q: `Hvordan kan videreuddannelse bidrage til at forbedre en persons karrieremuligheder?`,
        a: `Når man tager en videreuddannelse, får man ny viden og lærer nye ting, som virksomhederne har brug for. Verden forandrer sig hele tiden, så det er vigtigt at følge med. Det gør, at man kan søge bedre stillinger, få mere ansvar og ofte en højere løn. Det viser også chefen, at man er ambitiøs og gerne vil udvikle sig.`,
      },
      {
        kind: 'main',
        q: `Hvilke udfordringer kan voksne opleve, når de vælger at videreuddanne sig?`,
        a: `Den største udfordring er ofte at få tiden til at slå til. Voksne har typisk både arbejde, børn og huslige pligter, så det kan være svært at finde tid til at læse lektier. Derudover kan det være dyrt, eller man skal måske gå ned i løn i en periode. Nogle kan også være bange for, om de kan følge med de yngre studerende.`,
      },
      {
        kind: 'main',
        q: `Hvordan påvirker et stort fokus på karriere balancen mellem arbejde og familieliv?`,
        a: `Hvis man fokuserer meget på sin karriere, betyder det ofte lange arbejdsdage. Det går ud over tiden med familien. Man har mindre tid og energi til at være sammen med børnene og ægtefællen. Det kan skabe stress og dårlig samvittighed, fordi man føler, at man svigter derhjemme, selvom man har succes på arbejdet.`,
      },
    ],
  },
  {
    id: '2012-s-sport-og-motion',
    year: 2012,
    term: 'S',
    label: 'B',
    title: `Sport og motion`,
    questions: [
      {
        kind: 'main',
        q: `Hvilken rolle spiller sport og motion for menneskers mentale sundhed?`,
        a: `Det spiller en kæmpe rolle. Når man dyrker motion, danner hjernen stoffer, der gør en glad og afslappet. Det er en af de bedste måder at modvirke stress, angst og dårligt humør på. Man får renset hovedet. Hvis man dyrker sport sammen med andre, får man også et socialt fællesskab, hvilket hjælper mod ensomhed.`,
      },
      {
        kind: 'main',
        q: `Hvilke faktorer kan motivere folk til at begynde eller fortsætte med at dyrke motion?`,
        a: `For mange er helbredet den største motivation – de vil gerne tabe sig eller undgå sygdomme. Men det sociale betyder også rigtig meget. Hvis man træner sammen med en ven eller et hold, er det hyggeligere, og man støtter hinanden. Det skal også være sjovt; hvis man kan lide aktiviteten, er det nemmere at blive ved.`,
      },
      {
        kind: 'main',
        q: `Hvordan kan man gøre sport og motion mere tilgængeligt for alle aldersgrupper?`,
        a: `Man kan gøre det nemmere ved at tilbyde gratis eller billige aktiviteter. Kommunen kan lave udendørs træningspladser i parker og gode cykelstier, som alle kan bruge. Det er også vigtigt, at der er mange forskellige tilbud, så der både er noget for de unge, der vil have action, og de ældre, der måske vil gå ture eller lave gymnastik.`,
      },
      {
        kind: 'main',
        q: `Hvordan påvirker adgangen til grønne områder folks trivsel i storbyen?`,
        a: `Grønne områder er som åndehuller i en travl by. De giver folk mulighed for at komme væk fra larm og beton. Det sænker stressniveauet at være i naturen, og folk bruger parkerne til at løbe, lege med børnene eller bare slappe af. Det betyder rigtig meget for livskvaliteten, især hvis man bor i lejlighed.`,
      },
      {
        kind: 'main',
        q: `Hvad betyder det for byens udvikling, at mange mennesker flytter fra landdistrikter til storbyer?`,
        a: `Det betyder, at storbyerne vokser og får flere penge og muligheder. Men det skaber også problemer som mangel på boliger og meget trafik. På den anden side er det et stort problem for landdistrikterne. De mister arbejdskraft, butikker lukker, og det bliver svært at holde liv i de små byer. Det skaber en ubalance i landet.`,
      },
      {
        kind: 'main',
        q: `Hvordan kan moderne teknologi hjælpe med at gøre storbyer mere bæredygtige og attraktive?`,
        a: `Teknologien kan hjælpe på mange måder. Man kan lave smarte systemer til offentlig transport, så busser og tog kører bedre. Man kan også bygge huse, der bruger mindre energi. Apps kan hjælpe borgerne med at finde vej eller se, hvor meget strøm de bruger. Det gør byen grønnere og nemmere at bo i.`,
      },
    ],
  },
  {
    id: '2012-v-foreninger',
    year: 2012,
    term: 'V',
    label: 'A',
    title: `Foreninger`,
    questions: [
      {
        kind: 'main',
        q: `Hvilken rolle spiller foreninger i det danske samfund?`,
        a: `Foreninger er en meget vigtig del af dansk kultur og demokrati. Det er steder, hvor folk mødes om en fælles interesse, uanset hvem de er. I en forening, som en fodboldklub, lærer man at samarbejde og tage ansvar. Det skaber stærke netværk og fællesskaber, som er med til at binde samfundet sammen.`,
      },
      {
        kind: 'main',
        q: `Hvad kan få flere unge til at melde sig ind i foreninger?`,
        a: `Foreningerne skal tilbyde noget, de unge synes er spændende, måske e-sport eller fitness i stedet for kun gammeldags sport. Det er også vigtigt, at det er fleksibelt, så de unge ikke skal binde sig for meget, da de har travlt. Man kan også bruge sociale medier til at vise, hvor sjovt fællesskabet er i foreningen.`,
      },
      {
        kind: 'main',
        q: `Hvilke udfordringer står foreninger overfor i dag, og hvordan kan de løses?`,
        a: `Den største udfordring er ofte at finde frivillige ledere og trænere, fordi folk har så travlt i hverdagen. Medlemstallet falder måske også i nogle klubber. Løsningen kan være at gøre de frivillige opgaver mindre og mere overskuelige. Man kan også prøve at samarbejde med skoler for at få fat i de unge.`,
      },
    ],
  },
  {
    id: '2012-v-socialt-samv-r',
    year: 2012,
    term: 'V',
    label: 'B',
    title: `Socialt samvær`,
    questions: [
      {
        kind: 'main',
        q: `Hvordan har digitale medier påvirket måden, vi har socialt samvær på?`,
        a: `Det har ændret sig meget. I dag kan vi nemt holde kontakt med venner og familie over hele verden via beskeder og video. Det er positivt. Men på den anden side "mødes" vi mindre fysisk. Nogle gange erstatter skærmen det rigtige samvær, og det kan gøre relationerne mere overfladiske, fordi man mister nærværet.`,
      },
      {
        kind: 'main',
        q: `Hvad kan virksomheder gøre for at fremme socialt samvær blandt medarbejderne?`,
        a: `Virksomheder kan arrangere ting som fredagsbarer, sommerfester eller fælles frokoster. Det er vigtigt at skabe plads til hygge, så kollegerne lærer hinanden at kende. De kan også opfordre til små kaffepauser i hverdagen. Når medarbejderne har det godt sammen socialt, bliver de gladere for deres arbejde og samarbejder bedre.`,
      },
      {
        kind: 'main',
        q: `Hvordan kan socialt samvær i familien styrkes i en travl hverdag?`,
        a: `Det handler om at prioritere tiden sammen. Man kan aftale at spise aftensmad sammen hver dag uden telefoner ved bordet. Det giver ro til at snakke. Man kan også sætte tid af i weekenden til at lave noget sjovt sammen, som at spille spil eller gå en tur. Det vigtigste er at være nærværende, når man er sammen.`,
      },
    ],
  },
  {
    id: '2012-v-overv-gning',
    year: 2012,
    term: 'V',
    label: 'C',
    title: `Overvågning`,
    questions: [
      {
        kind: 'main',
        q: `Hvordan påvirker overvågning i det offentlige rum folks følelse af tryghed?`,
        a: `Det er meget forskelligt fra person til person. Mange føler sig mere trygge, fordi de ved, at politiet kan finde forbryderne, hvis der sker noget. Det kan skræmme tyve væk. Men andre føler det modsat; de synes, det er ubehageligt, at "nogen kigger med". De føler, at deres privatliv bliver krænket.`,
      },
      {
        kind: 'main',
        q: `Kan overvågning på arbejdspladsen have en positiv effekt? Hvorfor eller hvorfor ikke?`,
        a: `Det kan være positivt, hvis det bruges til sikkerhed, for eksempel i en bank eller butik for at undgå røveri. Så beskytter det de ansatte. Men hvis chefen bruger det til at overvåge, om de ansatte arbejder hurtigt nok, er det meget negativt. Det skaber stress og mistillid, og medarbejderne føler sig kontrolleret.`,
      },
      {
        kind: 'main',
        q: `Tror du, at overvågning kan mindske kriminalitet i boligområder?`,
        a: `Ja, det tror jeg til en vis grad. Hvis tyvene ser kameraer på husene, vælger de måske at gå videre til et andet sted. Det har en afskrækkende effekt. Men det løser ikke alle problemer, for nogle kriminelle tager bare masker på. Så det kan hjælpe, men det stopper ikke kriminalitet helt.`,
      },
    ],
  },
  {
    id: '2013-s-trafiksikkerhed',
    year: 2013,
    term: 'S',
    label: 'A',
    title: `Trafiksikkerhed`,
    questions: [
      {
        kind: 'main',
        q: `Hvorfor tror du, at der er så mange trafikulykker?`,
        a: `Jeg tror, den største grund er uopmærksomhed. Mange mennesker har travlt og kigger på deres mobiltelefon eller GPS, mens de kører bil. Det tager kun et sekund at køre galt. Der er også stadig problemer med folk, der kører for stærkt eller kører, selvom de har drukket alkohol. Det er meget farligt for alle i trafikken.`,
      },
      {
        kind: 'main',
        q: `Hvad kan man gøre for at forbedre trafiksikkerheden?`,
        a: `Man kan gøre flere ting. For det første kan man lave kampagner, der minder folk om at køre pænt og lægge mobilen væk. Man kan også forbedre vejene, for eksempel ved at lave flere cykelstier, så cyklisterne er sikre. Politiet kan også lave flere kontroller for at fange dem, der kører for stærkt.`,
      },
      {
        kind: 'main',
        q: `Hvordan kan teknologien hjælpe med at gøre trafikken mere sikker?`,
        a: `Moderne biler bliver mere og mere sikre. Mange nye biler har automatiske bremser, der selv stopper bilen, hvis man kommer for tæt på en anden. Der findes også systemer, der advarer, hvis man er ved at køre ud over striberne på vejen. Alt dette hjælper føreren med at undgå ulykker, selvom man bliver træt.`,
      },
    ],
  },
  {
    id: '2013-s-regler-og-forbud',
    year: 2013,
    term: 'S',
    label: 'B',
    title: `Regler og forbud`,
    questions: [
      {
        kind: 'main',
        q: `Hvorfor tror du, at der bliver lavet nye regler og forbud?`,
        a: `Regler bliver lavet for at beskytte borgerne og få samfundet til at fungere godt. For eksempel bliver miljøregler lavet for at mindske forurening. Andre regler, som rygeloven, er lavet for at beskytte vores sundhed. Når verden ændrer sig, opstår der nye problemer, og så er politikerne nødt til at lave nye regler.`,
      },
      {
        kind: 'main',
        q: `Hvad er fordelen ved forbud som fx rygeforbud i offentlige rum?`,
        a: `Fordelen er helt klart sundhed. Det beskytter de ansatte på restauranter og andre gæster mod passiv rygning, som er skadeligt. Det gør det også mere behageligt at være ude, fordi luften er ren. På den måde kan forbuddet også motivere rygere til at ryge mindre eller helt stoppe.`,
      },
      {
        kind: 'main',
        q: `Synes du, at nogle regler er unødvendige?`,
        a: `Ja, nogle gange kan det godt føles sådan. Hvis der er regler for småting, som folk selv burde kunne finde ud af, bliver man irriteret. Hvis reglerne begrænser vores frihed uden en god grund, eller hvis de ikke bliver håndhævet alligevel, så virker de overflødige. Regler skal give mening for borgerne.`,
      },
    ],
  },
  {
    id: '2013-s-arbejde-og-karriere',
    year: 2013,
    term: 'S',
    label: 'C',
    title: `Arbejde og karriere`,
    questions: [
      {
        kind: 'main',
        q: `Hvad tror du, der er vigtigt for folk, når de vælger en karriere?`,
        a: `Jeg tror, det vigtigste for mange er interesse. Man skal lave noget, man synes er spændende, da man bruger mange timer på jobbet. Lønnen er selvfølgelig også vigtig for at kunne leve godt. For mange betyder balancen mellem arbejde og fritid også mere i dag – at der er tid til familien ved siden af.`,
      },
      {
        kind: 'main',
        q: `Hvordan kan virksomheder hjælpe deres ansatte med at udvikle sig?`,
        a: `De kan tilbyde kurser og efteruddannelse, så medarbejderne lærer nyt. Det er også godt med en mentorordning, hvor en erfaren kollega hjælper en ny. Virksomheden kan også give medarbejderne nye og sværere opgaver, så de bliver udfordret. Det motiverer de ansatte og gør dem dygtigere.`,
      },
      {
        kind: 'main',
        q: `Hvad er udfordringerne ved at have en karriere og samtidig have en familie?`,
        a: `Den store udfordring er tid og energi. En karriere kræver ofte overarbejde og fuld fokus, mens en familie kræver nærvær og tid til praktiske ting som madpakker og hentning. Man kan føle sig splittet og have konstant dårlig samvittighed over ikke at slå til begge steder. Det kræver meget planlægning.`,
      },
    ],
  },
  {
    id: '2013-v-socialt-samv-r-p-arbejdspladsen',
    year: 2013,
    term: 'V',
    label: 'A',
    title: `Socialt samvær på arbejdspladsen`,
    questions: [
      {
        kind: 'main',
        q: `Nogle udlændinge mener, det er vigtigt at kunne tale dansk med sine danske kolleger på arbejdet, også selvom arbejdssproget er engelsk. Hvorfor tror du, de mener det?`,
        a: `Jeg tror, de mener det, fordi det sociale liv i pauserne ofte foregår på dansk. Hvis man kan dansk, forstår man humoren og kulturen bedre, og man bliver en del af fællesskabet. Det gør det meget nemmere at få venner og føle sig hjemme på arbejdspladsen, hvis man taler samme sprog som kollegerne.`,
      },
      {
        kind: 'main',
        q: `Mange mener, at det er vigtigt at deltage i sociale arrangementer på arbejdspladsen, fx kageordninger, firmaudflugter og firmafester. Hvorfor tror du, de mener det?`,
        a: `Det er vigtigt for sammenholdet. Når man hygger sig sammen uden for arbejdsopgaverne, lærer man hinanden bedre at kende som mennesker. Det opbygger tillid. Når man har det sjovt sammen socialt, bliver det også nemmere at arbejde sammen i hverdagen, og man bliver gladere for sit job.`,
      },
      {
        kind: 'main',
        q: `Kolleger kan også være nærmeste venner. Hvilke fordele og ulemper mener du, der kan være ved det?`,
        a: `En fordel er, at det er fantastisk at gå på arbejde, når ens bedste ven er der. Man støtter hinanden og har det sjovt. Ulempen er, hvis man bliver uvenner privat, eller hvis den ene bliver chef for den anden. Det kan også være svært for de andre kolleger, hvis to personer holder meget sammen og danner en "klub".`,
      },
    ],
  },
  {
    id: '2013-v-fleksibilitet-p-jobbet',
    year: 2013,
    term: 'V',
    label: 'B',
    title: `Fleksibilitet på jobbet`,
    questions: [
      {
        kind: 'main',
        q: `Det er blevet ret almindeligt med flekstid på mange arbejdspladser, hvor de ansatte ikke skal møde på et bestemt tidspunkt. Hvorfor tror du, det er det?`,
        a: `Det er for at hjælpe medarbejderne med at få hverdagen til at hænge sammen. Moderne familier har travlt, og flekstid gør det muligt at hente børn eller gå til lægen uden stress. Det giver frihed og viser tillid fra arbejdsgiveren. Når medarbejderne har frihed, bliver de ofte mindre stressede og mere produktive.`,
      },
      {
        kind: 'main',
        q: `I nogle typer job er det blevet mere almindeligt, at de ansatte kan arbejde hjemme engang imellem. Hvorfor tror du, det er det?`,
        a: `Hjemmearbejde sparer tid på transport, hvilket giver mere fritid. Derudover er der ofte mere ro derhjemme end på et storrumskontor, så man kan koncentrere sig bedre om svære opgaver. Teknologien gør det muligt i dag, så det er en fordel for både medarbejderen, der får ro, og virksomheden, der får effektive ansatte.`,
      },
      {
        kind: 'main',
        q: `På mange arbejdspladser er det blevet almindeligt at arbejde i teams, hvor de ansatte selv har ansvar for at planlægge og udføre arbejdet. Hvilke fordele og ulemper mener du, der kan være ved det?`,
        a: `Fordelen er, at medarbejderne tager mere ansvar og føler sig motiverede, når de selv kan bestemme. Man bruger hinandens styrker. Ulempen kan være, at det tager lang tid at blive enige i gruppen. Hvis samarbejdet ikke fungerer, eller hvis nogen ikke laver noget, kan det skabe konflikter og frustration.`,
      },
    ],
  },
  {
    id: '2013-v-b-rneopdragelse-og-gr-nser',
    year: 2013,
    term: 'V',
    label: 'C',
    title: `Børneopdragelse og grænser`,
    questions: [
      {
        kind: 'main',
        q: `Nogle forældre lader deres børn larme og løbe omkring på for eksempel restauranter, selv om det kan genere andre mennesker. Hvorfor tror du, det er sådan?`,
        a: `Jeg tror, nogle forældre er bange for at sætte grænser og være "de sure". De vil gerne undgå konflikter og gråd, mens de er ude. Andre forældre mener måske, at børn skal have lov til at udfolde sig frit, og at andre voksne skal være tolerante. De glemmer måske at tage hensyn til de andre gæster.`,
      },
      {
        kind: 'main',
        q: `Nogle gange finder forældre sig i, at deres teenagebørn råber ad dem. Hvorfor tror du, de finder sig i det?`,
        a: `Måske er de usikre på deres rolle som forældre eller bange for at miste kontakten til deres barn. De vil gerne være venner med deres børn. Det kan også være, at de bare er trætte og ikke orker konflikten lige nu. Nogle tænker måske, at det bare er en fase med hormoner, som går over igen.`,
      },
      {
        kind: 'main',
        q: `Der er mange forældre, der mener, at børn skal være med til at bestemme fra en tidlig alder. Hvilke fordele og ulemper mener du, der kan være ved det?`,
        a: `Fordelen er, at børnene bliver selvstændige og lærer at mærke efter, hvad de vil. Det giver selvtillid. Ulempen er, at det kan være en stor byrde for et lille barn at skulle bestemme alt. Børn har brug for trygge rammer og voksne, der tager ansvaret. De kan blive forvirrede eller "små tyranner", hvis de altid får deres vilje.`,
      },
    ],
  },
  {
    id: '2013-v-sund-livsstil',
    year: 2013,
    term: 'V',
    label: '',
    title: `Sund livsstil`,
    questions: [
      {
        kind: 'obligatory',
        q: `For at få folk til at leve sundere, kan politikerne lægge flere afgifter på usunde varer som f.eks. cigaretter og spiritus. Hvilke fordele og ulemper mener du, der kan være ved det?`,
        a: `Der er både fordele og ulemper ved højere afgifter. På den ene side er en stor fordel, at højere priser får folk til at købe mindre af det usunde, især unge mennesker, som ikke har så mange penge. Det kan forbedre folkesundheden. På den anden side er ulempen, at det rammer skævt socialt. Det bliver dyrere for fattige mennesker at leve, mens de rige bare betaler prisen uden problemer.`,
      },
      {
        kind: 'follow',
        q: `Hvor effektivt tror du, det vil være med flere afgifter sammenlignet med oplysningskampagner?`,
        a: `Jeg tror, at begge dele er nødvendige for at ændre folks vaner. Afgifter virker her og nu, fordi det kan mærkes på pengepungen. Men på den anden side er oplysningskampagner vigtige på lang sigt, fordi de lærer folk, hvorfor det er vigtigt at leve sundt. Hvis man kun bruger afgifter, kan folk føle sig tvunget, men med oplysning forstår de meningen.`,
      },
    ],
  },
  {
    id: '2013-v-uddannelse-og-k-n',
    year: 2013,
    term: 'V',
    label: '',
    title: `Uddannelse og køn`,
    questions: [
      {
        kind: 'main',
        q: `Hvorfor tror du, at piger klarer sig bedre end drenge i skole- og uddannelsessystemet?`,
        a: `Jeg tror, der kan være flere årsager til det. For det første er piger ofte mere modne og disciplinerede til at lave lektier og sidde stille i timerne. Derudover passer undervisningsformen måske bedre til piger. Drenge har ofte mere brug for at bevæge sig, og de kan miste motivationen, hvis der er for meget stillesiddende bogligt arbejde i skolen.`,
      },
      {
        kind: 'follow',
        q: `Hvad tror du, det kan betyde for drengenes fremtid, hvis de ikke klarer sig godt i skolen?`,
        a: `Det kan have alvorlige konsekvenser for deres fremtid. Hvis de ikke får gode karakterer, kan det være svært at komme ind på en uddannelse og få et godt job senere hen. På den måde risikerer de at få dårligere økonomi og livskvalitet. Det kan også gå ud over deres selvtillid, hvis de føler, at de har fejlet i skolen.`,
      },
      {
        kind: 'main',
        q: `Hvorfor tror du, at langt flere kvinder end mænd vælger at blive pædagog, lærer eller sygeplejerske?`,
        a: `Det handler nok meget om traditioner og kultur. Kvinder har historisk set haft omsorgsopgaverne i familien, og derfor vælger mange stadig fag, der handler om mennesker og omsorg. På den anden side mangler der også mandlige rollemodeller i disse fag. Hvis en ung mand aldrig ser en mandlig pædagog, tænker han måske ikke på, at det er en mulighed for ham.`,
      },
      {
        kind: 'follow',
        q: `Kan der efter din mening være nogen problemer ved, at langt flere kvinder end mænd vælger disse uddannelser?`,
        a: `Ja, jeg synes, det er et problem for ligestillingen og kvaliteten. Børn og patienter har brug for at møde både mænd og kvinder. For eksempel har drenge i børnehaven brug for mandlige rollemodeller at spejle sig i. Derudover kan det skabe et meget ensidigt arbejdsmiljø, hvis der kun er kvinder på en arbejdsplads.`,
      },
      {
        kind: 'main',
        q: `Hvad mener du, det betyder, at der nu er flere kvinder end mænd på universitetsuddannelser som læge, teolog og jurist?`,
        a: `Det er positivt, at kvinder har fået adgang til de lange uddannelser og kan få magtfulde jobs. Det viser, at vi har ligestilling i uddannelsessystemet. Men på den anden side kan det blive et problem, hvis mændene helt forsvinder fra disse fag. Det er altid bedst med en blanding af køn, da mænd og kvinder kan have forskellige perspektiver på tingene.`,
      },
    ],
  },
  {
    id: '2013-v-at-bo-og-arbejde-som-udl-nding',
    year: 2013,
    term: 'V',
    label: '',
    title: `At bo og arbejde som udlænding`,
    questions: [
      {
        kind: 'main',
        q: `Hvorfor vælger flere og flere at bo og arbejde i et andet land end deres hjemland?`,
        a: `Jeg tror, den største grund er ønsket om et bedre liv. Mange flytter for at få et job med højere løn eller bedre arbejdsvilkår, end de kan få derhjemme. Derudover er der også mange, der gør det for eventyret. De vil gerne opleve en ny kultur, lære et nyt sprog og udfordre sig selv personligt.`,
      },
      {
        kind: 'follow',
        q: `Hvad er efter din mening de største problemer ved at bo og arbejde i et andet land?`,
        a: `Det største problem er ofte sproget og kulturen. Det kan være meget svært at lære et nyt sprog, og man kan føle sig isoleret, hvis man ikke forstår, hvad folk siger. Derudover savner man ofte sin familie og venner fra hjemlandet. Det kan også være svært at forstå de uskrevne regler på arbejdspladsen i det nye land.`,
      },
      {
        kind: 'main',
        q: `Selvom man kan klare sig på engelsk på mange arbejdspladser i Danmark, er der alligevel mange, der bruger tid og energi på at lære dansk. Hvorfor tror du, det er sådan?`,
        a: `Jeg tror, de gør det for at blive en rigtig del af samfundet. Selvom man kan arbejde på engelsk, foregår det sociale liv – frokostpauserne og hyggesnakken – ofte på dansk. Hvis man vil have danske venner og forstå kulturen i dybden, er det nødvendigt at kunne sproget. Det gør hverdagen meget nemmere.`,
      },
      {
        kind: 'obligatory',
        q: `Når man flytter til et andet land, møder man ofte en ny kultur. Hvilke fordele og ulemper mener du, der kan være ved det?`,
        a: `En stor fordel er, at man bliver mere åben og tolerant. Man lærer, at der er mange måder at leve på, hvilket udvikler en som menneske. Ulempen kan være det, man kalder "kulturchok". Man kan blive forvirret over de nye regler og normer, og man kan føle sig misforstået eller ensom i starten.`,
      },
    ],
  },
  {
    id: '2014-v-unge-for-ldre-og-ldre-for-ldre',
    year: 2014,
    term: 'V',
    label: '',
    title: `Unge forældre og ældre forældre`,
    questions: [
      {
        kind: 'main',
        q: `Hvorfor tror du, at nogle par venter så længe med at få børn (til omkring 40 år)?`,
        a: `Jeg tror, det handler om tryghed og frihed. Mange vil gerne have styr på karrieren og økonomien først, så de kan give barnet et godt liv. De vil have hus og bil på plads. Derudover vil mange gerne nyde deres ungdom og frihed til at rejse og opleve verden, før de binder sig til det store ansvar, det er at være forældre.`,
      },
      {
        kind: 'follow',
        q: `Kan der efter din mening være nogle ulemper ved, at folk venter så længe med at få børn?`,
        a: `Ja, der er bestemt ulemper. For det første falder fertiliteten med alderen, så det kan være svært for kvinder at blive gravide naturligt. Det kan kræve behandling. For det andet har ældre forældre måske mindre fysisk energi til at lege vildt med børnene, og de risikerer at dø tidligere i barnets liv.`,
      },
      {
        kind: 'obligatory',
        q: `Nogle par venter pga. karriere. Hvilke fordele og ulemper er der ved det?`,
        a: `Fordelen er, at de ofte har en rigtig god økonomi og mere ro på, fordi de har "løbet hornene af sig" på arbejdsmarkedet. De kan være mere tålmodige. Ulempen er, at karrierejob ofte kræver mange timer. Hvis man får børn sent og stadig arbejder meget, kan man få svært ved at finde tid til at være sammen med barnet.`,
      },
    ],
  },
  {
    id: '2014-v-hjemmeboende-og-udeboende-unge',
    year: 2014,
    term: 'V',
    label: '',
    title: `Hjemmeboende og udeboende unge`,
    questions: [
      {
        kind: 'main',
        q: `Drenge flytter ofte senere hjemmefra end piger. Hvorfor tror du, det er sådan?`,
        a: `Jeg tror, det kan handle om modenhed og kultur. Piger er ofte hurtigere til at blive selvstændige og vil gerne skabe deres eget hjem. Drenge har det måske lidt for godt hjemme hos mor og far, hvor der bliver lavet mad og vasket tøj. Der kan også være et mindre socialt pres på drenge for at flytte tidligt.`,
      },
      {
        kind: 'follow',
        q: `Kan der være nogen problemer ved, at drenge først flytter hjemmefra, når de er i 20'erne?`,
        a: `Ja, det kan være et problem for deres udvikling. Hvis de bor hjemme for længe, lærer de ikke at tage ansvar for praktiske ting som madlavning, rengøring og økonomi. De bliver mindre selvstændige. Det kan give dem et chok, når de endelig flytter ud og skal klare alt selv.`,
      },
      {
        kind: 'obligatory',
        q: `I Danmark opdrages børn til at være selvstændige tidligt. Hvilke fordele og ulemper er der?`,
        a: `En stor fordel er, at børnene får selvtillid og lærer at tro på sig selv. De bliver gode til at træffe beslutninger og klare sig i verden. Ulempen kan være, at man lægger for stort et ansvar på dem for tidligt. Børn har stadig brug for voksne til at guide dem, og de kan føle sig ensomme, hvis de skal klare alt selv.`,
      },
    ],
  },
  {
    id: '2014-v-myldretidstrafik',
    year: 2014,
    term: 'V',
    label: '',
    title: `Myldretidstrafik`,
    questions: [
      {
        kind: 'main',
        q: `Mange vælger at køre i bil til arbejde, selvom der er kø. Hvorfor tror du, de gør det?`,
        a: `Jeg tror, det handler om komfort og fleksibilitet. I en bil kan man sidde alene, høre radio og køre præcis, når man vil. Man slipper for at skifte mellem bus og tog eller stå op i en fyldt togvogn. For mange er det også nødvendigt, hvis de bor et sted, hvor den offentlige transport er dårlig.`,
      },
      {
        kind: 'follow',
        q: `Er det et problem, at folk vælger bilen frem for bus eller tog?`,
        a: `Ja, det er et stort problem for samfundet og miljøet. Når alle kører i hver sin bil, skaber det lange køer, så folk spilder tid på vejene. Derudover forurener bilerne luften med CO2 og partikler, hvilket er dårligt for klimaet og vores sundhed i byerne.`,
      },
      {
        kind: 'obligatory',
        q: `Nogle mener, der skal være kørselsafgifter i byerne. Hvilke fordele og ulemper er der?`,
        a: `Fordelen er, at det vil få færre til at tage bilen, hvilket giver mindre trængsel og renere luft. Det kan motivere folk til at tage cyklen eller bussen. Ulempen er, at det rammer socialt skævt. Dem med mange penge er ligeglade med afgiften, mens dem med lave indkomster måske ikke har råd til at køre på arbejde.`,
      },
    ],
  },
  {
    id: '2015-s-undervisningsformer-i-skolen',
    year: 2015,
    term: 'S',
    label: '',
    title: `Undervisningsformer i skolen`,
    questions: [
      {
        kind: 'main',
        q: `Der er meget gruppearbejde i skolen. Hvorfor tror du, der er det?`,
        a: `Det er fordi, man gerne vil forberede eleverne til virkeligheden. I de fleste jobs i dag skal man kunne samarbejde med andre. Gruppearbejde lærer børnene at lytte til andre, gå på kompromis og løse opgaver i fællesskab. Derudover kan eleverne lære af hinanden, fordi de har forskellige styrker.`,
      },
      {
        kind: 'obligatory',
        q: `Eleverne skal selv være med til at bestemme, hvad de skal lære. Hvilke fordele og ulemper er der?`,
        a: `En stor fordel er motivationen. Hvis eleverne selv vælger emner, de synes er spændende, vil de arbejde hårdere og lære mere. De føler ejerskab. Ulempen er, at børn ikke altid ved, hvad der er vigtigt at lære. De vælger måske de svære ting fra, og så får de ikke den grundlæggende viden, de har brug for.`,
      },
    ],
  },
  {
    id: '2015-s-at-bo-alene-eller-i-parforhold',
    year: 2015,
    term: 'S',
    label: '',
    title: `At bo alene eller i parforhold`,
    questions: [
      {
        kind: 'main',
        q: `Det er mere almindeligt at bo alene i dag. Hvorfor tror du, det er sådan?`,
        a: `Jeg tror, det handler om frihed og økonomi. I dag har vi råd til at bo alene, hvilket man ikke altid havde før. Mange nyder at kunne bestemme alt selv – hvad de vil spise, hvornår de vil sove, og hvordan de vil indrette sig – uden at skulle diskutere det med en partner.`,
      },
      {
        kind: 'follow',
        q: `Hvad betyder det for måden, man lever på, hvis man bor alene?`,
        a: `Det giver en stor personlig frihed og ro i hverdagen. Man kan fokusere 100% på sig selv og sine egne interesser. Men på den anden side kan det også føre til ensomhed, fordi man ikke har nogen at dele hverdagens oplevelser med, når man kommer hjem. Man skal selv opsøge det sociale.`,
      },
      {
        kind: 'obligatory',
        q: `Vi har stor frihed til at vælge vores liv. Hvilke fordele og ulemper er der?`,
        a: `Fordelen er, at vi kan skabe præcis det liv, der gør os lykkelige, uanset hvad andre tænker. Vi er ikke tvunget ind i faste roller. Ulempen er, at de mange valg kan skabe stress og tvivl. Mange bliver bange for at vælge forkert eller går rundt med en følelse af, at græsset er grønnere på den anden side.`,
      },
    ],
  },
  {
    id: '2015-s-offentlige-ydelser',
    year: 2015,
    term: 'S',
    label: '',
    title: `Offentlige ydelser`,
    questions: [
      {
        kind: 'main',
        q: `Unge over 18 år kan få SU uafhængigt af forældrenes økonomi. Hvorfor tror du, det er sådan?`,
        a: `Det er for at sikre lighed i Danmark. Vi vil gerne have, at alle unge har mulighed for at uddanne sig, uanset om deres forældre er rige eller fattige. Når de får SU, bliver de økonomisk uafhængige og kan flytte hjemmefra. Det betyder, at det er talent og evner, der tæller, ikke forældrenes pengepung.`,
      },
      {
        kind: 'follow',
        q: `Kan der være problemer ved dette system?`,
        a: `Ja, nogle mener, at de unge bliver for forkælede eller tager for let på studiet, fordi de får pengene "gratis". Der er også en risiko for, at de bruger pengene på fest og sjov i stedet for bøger og bolig. På den anden side er det en meget dyr ordning for staten, som kræver høje skatter.`,
      },
      {
        kind: 'obligatory',
        q: `Det offentlige betaler for mange ting i Danmark (gratis læge, uddannelse). Hvilke fordele og ulemper er der?`,
        a: `Den største fordel er tryghed. Ingen behøver at frygte at blive syg eller miste jobbet, fordi samfundet griber en. Det skaber et meget stabilt samfund med lav ulighed. Ulempen er, at vi betaler en af verdens højeste skatter. Det kan også gøre, at nogle mister lysten til at arbejde ekstra, fordi de skal betale så meget i skat.`,
      },
    ],
  },
  {
    id: '2015-v-menneskers-forhold-til-dyr',
    year: 2015,
    term: 'V',
    label: '',
    title: `Menneskers forhold til dyr`,
    questions: [
      {
        kind: 'main',
        q: `Hvorfor tror du, at mange mennesker bruger mange penge på deres kæledyr?`,
        a: `For rigtig mange er kæledyret, som en hund eller kat, en del af familien. Især for folk, der bor alene, giver dyret selskab, tryghed og betingelsesløs kærlighed. Derfor vil de gerne forkæle dyret med det bedste foder og udstyr. De føler et stort ansvar for, at dyret har det godt og er sundt.`,
      },
      {
        kind: 'follow',
        q: `Hvad betyder det for børn at vokse op med dyr?`,
        a: `Det er meget sundt for børn. De lærer at tage ansvar, fordi dyret skal fodres og luftes hver dag. De lærer også empati, altså at forstå andres behov. Desuden er et kæledyr en god ven, der altid lytter og trøster, hvis barnet er ked af det eller føler sig ensom.`,
      },
      {
        kind: 'obligatory',
        q: `Hvilke fordele og ulemper er der ved strengere regler for dyrevelfærd?`,
        a: `Fordelen er helt klart, at dyrene får et bedre liv uden smerte og stress. Det er etisk rigtigt at behandle dyr ordentligt. Ulempen kan være, at det bliver dyrere at producere kød og mælk, hvilket giver højere priser i supermarkedet. Det kan også være svært for landmændene at leve op til de mange nye krav.`,
      },
    ],
  },
  {
    id: '2015-v-kost-og-livsstil',
    year: 2015,
    term: 'V',
    label: '',
    title: `Kost og livsstil`,
    questions: [
      {
        kind: 'main',
        q: `Hvorfor spiser mange usundt, selvom de ved, det er skadeligt?`,
        a: `Jeg tror, det handler om vaner og bekvemmelighed. I en travl hverdag er det nemmere at købe færdigmad eller fastfood end at lave mad fra bunden. Desuden smager fedt og sukker godt, og det giver en hurtig belønning til hjernen. Nogle bruger også mad som trøst, hvis de er kede af det eller stressede.`,
      },
      {
        kind: 'follow',
        q: `Hvad betyder sundhedskampagner for motivationen?`,
        a: `Kampagner kan være gode til at give viden og gøre folk opmærksomme på problemet. Men viden er ikke altid nok til at ændre adfærd. Folk har brug for konkrete værktøjer og måske billigere sunde alternativer. Hvis kampagnerne bliver for belærende, kan folk også blive irriterede og lukke af.`,
      },
    ],
  },
  {
    id: '2015-v-danskernes-drikkevaner',
    year: 2015,
    term: 'V',
    label: '',
    title: `Danskernes drikkevaner`,
    questions: [
      {
        kind: 'main',
        q: `Hvorfor er alkoholforbruget faldet lidt de senere år?`,
        a: `Jeg tror, det skyldes et større fokus på sundhed generelt. Folk er blevet mere bevidste om, hvor skadeligt alkohol er for kroppen, takket være oplysningskampagner. De unge generationer har måske også andre interesser, som fitness og træning, der ikke passer sammen med tømmermænd og alkohol.`,
      },
      {
        kind: 'obligatory',
        q: `Unge får lov at drikke lidt alkohol af deres forældre. Hvilke fordele og ulemper er der?`,
        a: `Fordelen kan være, at de unge lærer at omgås alkohol under trygge rammer derhjemme, så de ikke drikker sig sanseløst berusede til fester. Ulempen er, at det kan sende et signal om, at alkohol er nødvendigt for at hygge sig. Forskning viser også, at unge, der får lov at drikke hjemme, ofte drikker mere generelt.`,
      },
    ],
  },
  {
    id: '2016-s-unge-og-kriminalitet',
    year: 2016,
    term: 'S',
    label: '',
    title: `Unge og kriminalitet`,
    questions: [
      {
        kind: 'main',
        q: `Hvorfor tror du, at nogle unge begår småkriminalitet?`,
        a: `Jeg tror, det ofte handler om gruppepres og lysten til at være en del af et fællesskab. Hvis vennerne stjæler, gør man det måske også for at være "sej". Det kan også handle om kedsomhed eller spænding. Nogle unge fra socialt udsatte familier mangler måske også voksne, der sætter grænser for dem.`,
      },
      {
        kind: 'follow',
        q: `Hvad betyder det for deres fremtid?`,
        a: `Det kan have meget alvorlige konsekvenser. Hvis de får en plettet straffeattest, kan det være svært at få et job eller komme ind på en uddannelse senere. Det kan også give dem et dårligt ry og en negativ selvopfattelse, som gør det svært at komme ud af kriminaliteten igen og få et normalt liv.`,
      },
      {
        kind: 'obligatory',
        q: `Unge under 15 år straffes ikke med fængsel. Hvilke fordele og ulemper er der?`,
        a: `En stor fordel er, at vi undgår at ødelægge deres liv ved at sætte dem i fængsel sammen med voksne kriminelle. Det er bedre at hjælpe dem med pædagoger og sociale indsatser. Ulempen er, at ofrene kan føle det uretfærdigt. De unge kan måske også tro, at kriminalitet er risikofrit, fordi der ikke kommer en hård straf.`,
      },
    ],
  },
  {
    id: '2016-s-boformer-og-livsstil',
    year: 2016,
    term: 'S',
    label: '',
    title: `Boformer og livsstil`,
    questions: [
      {
        kind: 'main',
        q: `Hvorfor flytter børnefamilier ofte i hus i forstæderne?`,
        a: `De gør det for at få mere plads og ro. I byen bor man ofte i små lejligheder, men i forstaden kan man få et hus med have, hvor børnene kan lege trygt. Det er også ofte billigere at købe hus uden for byen. De søger et børnevenligt miljø med skoler og institutioner tæt på.`,
      },
      {
        kind: 'obligatory',
        q: `Hvilke fordele og ulemper er der ved en alternativ livsstil (uden sociale medier/luksus)?`,
        a: `Fordelen er, at man får mere ro og mindre stress. Man fokuserer på de nære relationer og naturen i stedet for at glo på en skærm. Det er også godt for miljøet. Ulempen er, at man kan blive isoleret. Det kan være svært at følge med i samfundet eller holde kontakt med venner, hvis man melder sig helt ud af den digitale verden.`,
      },
    ],
  },
  {
    id: '2016-s-behandling-af-sygdom',
    year: 2016,
    term: 'S',
    label: '',
    title: `Behandling af sygdom`,
    questions: [
      {
        kind: 'main',
        q: `Hvorfor går folk til lægen for at få penicillin mod forkølelse, selvom det ikke virker?`,
        a: `Jeg tror, det handler om utålmodighed og manglende viden. Folk har travlt med arbejde og familie og har ikke tid til at ligge syge. De håber på en "mirakelpille". Mange ved ikke, at penicillin kun virker mod bakterier, og at forkølelse er en virus, som kroppen selv skal bekæmpe over tid.`,
      },
      {
        kind: 'obligatory',
        q: `Patienter ligger kortere tid på hospitalet i dag. Hvilke fordele og ulemper er der?`,
        a: `En klar fordel er, at man kommer sig hurtigere i sine egne trygge rammer derhjemme, hvor man sover og spiser bedre. Man undgår også hospitalsinfektioner. Ulempen er, at nogle patienter, især ældre der bor alene, kan føle sig meget utrygge. De kan være bange for komplikationer eller for ikke at kunne klare sig selv.`,
      },
    ],
  },
  {
    id: '2016-v-unge-og-konomi',
    year: 2016,
    term: 'V',
    label: '',
    title: `Unge og økonomi`,
    questions: [
      {
        kind: 'main',
        q: `Mange studerende tager studielån oveni SU'en. Hvorfor?`,
        a: `Jeg tror, de gør det for at kunne fokusere 100% på studiet uden at skulle arbejde for meget ved siden af. SU'en rækker sjældent til både husleje, mad og bøger i de dyre studiebyer. Nogle gør det også for at opretholde en vis levestandard, så de har råd til at gå på café, rejse og være sociale med vennerne.`,
      },
      {
        kind: 'main',
        q: `Unge tager hurtige lån via mobilen (kviklån). Hvorfor?`,
        a: `De gør det, fordi det er utrolig nemt og hurtigt. Man skal ikke vise dokumentation eller tale med en bankrådgiver. Det kan være fristende, hvis man lige står og mangler penge til en ny telefon eller en bytur. Mange unge tænker desværre ikke på de tårnhøje renter, og hvor dyrt det bliver at betale tilbage.`,
      },
      {
        kind: 'obligatory',
        q: `Forældrekøb af lejligheder. Hvilke fordele og ulemper er der?`,
        a: `Fordelen er, at den unge får en tryg og god bolig under studiet, hvilket kan være svært at finde selv. Det kan også være en god investering for forældrene. Ulempen er, at det skaber ulighed. Det er kun de rige, der har råd til det. De unge lærer måske heller ikke at være økonomisk ansvarlige, når de får det hele foræret.`,
      },
    ],
  },
  {
    id: '2016-v-b-rneopdragelse',
    year: 2016,
    term: 'V',
    label: '',
    title: `Børneopdragelse`,
    questions: [
      {
        kind: 'main',
        q: `Forældre sætter børn til husarbejde, selvom det tager længere tid. Hvorfor?`,
        a: `Det gør de for opdragelsens skyld. De vil gerne lære børnene ansvar og selvstændighed. Når børn hjælper med madlavning eller rengøring, lærer de praktiske færdigheder, som de får brug for som voksne. Det giver også børnene en følelse af at være en vigtig del af fællesskabet i familien, hvor man hjælper hinanden.`,
      },
    ],
  },
  {
    id: '2016-v-jobvalg',
    year: 2016,
    term: 'V',
    label: '',
    title: `Jobvalg`,
    questions: [
      {
        kind: 'main',
        q: `Nogle vælger job med høj status og løn (fx læge/direktør) trods mange timer. Hvorfor?`,
        a: `Jeg tror, de bliver drevet af ambitioner og ønsket om anerkendelse. Det giver status og respekt i samfundet at have en flot titel. Den høje løn giver også økonomisk frihed og mulighed for luksus. For nogle er arbejdet deres store passion, og de finder mening i at arbejde hårdt og opnå resultater, selvom det koster på fritiden.`,
      },
    ],
  },
  {
    id: '2017-s-studerende-og-erhvervserfaring',
    year: 2017,
    term: 'S',
    label: '',
    title: `Studerende og erhvervserfaring`,
    questions: [
      {
        kind: 'main',
        q: `Mange studerende har et studierelevant job. Hvorfor gør de det?`,
        a: `De gør det primært for at forbedre deres karrieremuligheder. Erfaring på CV'et er guld værd, når man er færdiguddannet. Det giver dem en fordel frem for dem, der kun har læst bøger. Derudover giver det en bedre forståelse af faget at prøve det i praksis, og så tjener de selvfølgelig også ekstra penge til hverdagen.`,
      },
      {
        kind: 'main',
        q: `Nogle vælger ulønnet praktik. Hvorfor?`,
        a: `De ser det som en investering i fremtiden. Selvom de ikke får løn her og nu, får de værdifuld erfaring og skaber netværk i branchen. Det kan føre til et rigtigt job senere. I nogle brancher er det den eneste måde at få foden indenfor på, så de er villige til at arbejde gratis for at lære og vise, hvad de kan.`,
      },
      {
        kind: 'obligatory',
        q: `Arbejde og rejse før studiet (sabbatår). Hvilke fordele og ulemper er der?`,
        a: `Fordelen er, at de unge bliver mere modne og får livserfaring. Når de har set verden og prøvet at arbejde, er de ofte mere motiverede for at læse. Ulempen er, at de kommer senere i gang med uddannelsen og dermed senere ud på arbejdsmarkedet. Det betyder, at samfundet må vente på deres arbejdskraft og skattebetaling.`,
      },
    ],
  },
  {
    id: '2017-s-pensionsalder',
    year: 2017,
    term: 'S',
    label: '',
    title: `Pensionsalder`,
    questions: [
      {
        kind: 'main',
        q: `Nogle ældre bliver længere på arbejdsmarkedet. Hvorfor?`,
        a: `Jeg tror, mange gør det, fordi de er glade for deres arbejde og kollegerne. Det giver mening og struktur i hverdagen at have noget at stå op til. De føler, at de stadig kan bidrage med noget. For andre handler det om økonomi; de vil gerne spare mere op til pensionen, så de kan leve godt senere.`,
      },
      {
        kind: 'obligatory',
        q: `Pensionsalderen stiger for alle. Hvilke fordele og ulemper er der?`,
        a: `Fordelen er, at det hjælper samfundsøkonomien. Når vi lever længere, skal vi også arbejde længere for at betale til velfærden. Ulempen er, at det er meget hårdt for dem med fysisk krævende jobs, som murere eller rengøringsassistenter. Deres kroppe er ofte nedslidte, og det er uretfærdigt, at de skal arbejde lige så længe som dem på kontor.`,
      },
    ],
  },
  {
    id: '2017-s-b-rns-brug-af-tablets',
    year: 2017,
    term: 'S',
    label: '',
    title: `Børns brug af tablets`,
    questions: [
      {
        kind: 'main',
        q: `Nogle børn bruger meget tid på tablets. Hvorfor?`,
        a: `Det er, fordi tablets er designet til at være underholdende. Der er masser af spil og videoer, som fanger børns opmærksomhed. For forældrene kan det også være en nem måde at få ro på, hvis de selv har travlt med madlavning eller arbejde. Nogle gange bruges tabletten som en slags "barnepige".`,
      },
      {
        kind: 'obligatory',
        q: `Børn bruger tablets fra de er helt små. Hvilke fordele og ulemper er der?`,
        a: `En fordel er, at børnene bliver teknologisk dygtige meget tidligt, og der findes mange gode lærings-apps. De kan lære tal og bogstaver på en sjov måde. Ulempen er, at de sidder for meget stille og ikke bruger kroppen. Det kan også gå ud over deres sociale evner, hvis de kigger på en skærm i stedet for at lege med andre børn.`,
      },
    ],
  },
  {
    id: '2017-v-arbejdsvilk-r',
    year: 2017,
    term: 'V',
    label: '',
    title: `Arbejdsvilkår`,
    questions: [
      {
        kind: 'main',
        q: `Nogle arbejder freelance uden fast indkomst. Hvorfor?`,
        a: `Jeg tror, de vælger det på grund af friheden. Som freelancer er man sin egen chef og bestemmer selv sine arbejdstider og opgaver. Man kan arbejde hjemmefra eller fra en café. Det giver en stor fleksibilitet, som mange sætter pris på, især hvis man har en kreativ uddannelse eller gerne vil undgå faste rammer.`,
      },
      {
        kind: 'main',
        q: `Medarbejdere skal arbejde i teams. Hvorfor?`,
        a: `Det er, fordi to hjerner tænker bedre end én. Når man arbejder sammen, kan man sparre med hinanden, få nye idéer og løse problemerne hurtigere. Man kan udnytte hinandens forskellige styrker. Det skaber også et bedre sammenhold på arbejdspladsen, når man er fælles om at nå målene.`,
      },
      {
        kind: 'obligatory',
        q: `Selvplanlægning af arbejde og tid. Hvilke fordele og ulemper er der?`,
        a: `Fordelen er, at det giver stor frihed og tillid. Man kan tilrettelægge arbejdet, så det passer ind i ens privatliv, fx hvis man skal hente børn. Det øger motivationen. Ulempen er, at arbejdet og fritiden flyder sammen. Hvis man ikke er god til at sætte grænser, kan man ende med at arbejde hele tiden og få stress.`,
      },
    ],
  },
  {
    id: '2017-v-sociale-medier-og-privatliv',
    year: 2017,
    term: 'V',
    label: '',
    title: `Sociale medier og privatliv`,
    questions: [
      {
        kind: 'main',
        q: `Unge lægger private billeder på sociale medier. Hvorfor?`,
        a: `De gør det for at få opmærksomhed og anerkendelse. Når de får likes og kommentarer, føler de sig set og værdsat. Det er også en måde at vise sin identitet på og fortælle omverdenen, hvem man er, og hvad man oplever. De tænker måske ikke over konsekvenserne, men lever i nuet.`,
      },
      {
        kind: 'obligatory',
        q: `Sociale medier gemmer alt for altid. Hvilke fordele og ulemper er der?`,
        a: `En fordel er, at det fungerer som et digitalt fotoalbum, hvor man kan se tilbage på gode minder. Ulempen er, at dumme ting, man gjorde som ung, kan forfølge en resten af livet. Et upassende billede kan dukke op, når man senere skal søge job, og det kan skade ens ry og karriere.`,
      },
    ],
  },
  {
    id: '2017-v-arbejde-og-stress',
    year: 2017,
    term: 'V',
    label: '',
    title: `Arbejde og stress`,
    questions: [
      {
        kind: 'main',
        q: `Folk med spændende jobs går ned med stress. Hvorfor?`,
        a: `Det er ofte, fordi de er meget engagerede og har svært ved at sige nej. Når jobbet er spændende, glemmer man at holde pauser. Der kan også være høje krav og forventninger, som man gerne vil leve op til. Hvis man brænder sit lys i begge ender uden at hvile, ender man med at brænde ud.`,
      },
      {
        kind: 'obligatory',
        q: `Konstant adgang til arbejde via internettet. Hvilke fordele og ulemper er der?`,
        a: `Fordelen er fleksibilitet. Man kan arbejde hjemmefra eller ordne en lille ting om aftenen, så man kan gå tidligt næste dag. Ulempen er, at man aldrig har helt fri. Mange føler, at de skal tjekke mails hele tiden, også i weekenden. Det betyder, at hjernen aldrig slapper helt af, hvilket kan føre til stress.`,
      },
    ],
  },
  {
    id: '2018-s-frivilligt-arbejde-2',
    year: 2018,
    term: 'S',
    label: 'A',
    title: `Frivilligt arbejde`,
    questions: [
      {
        kind: 'main',
        q: `Nogle studerende bruger tid på at lave frivilligt ulønnet arbejde, selvom de også har travlt med deres studier. Hvorfor tror du, de gør det?`,
        a: `Jeg tror, at de studerende ser det som en vigtig investering i deres fremtid. For det første pynter det rigtig meget på deres CV, når de engang skal søge job, fordi det viser, at de er engagerede. Derudover er det en god måde at få et netværk på og møde folk fra branchen. Mange gør det også, fordi de gerne vil gøre en forskel og støtte en god sag, hvilket giver mening i en travl hverdag.`,
      },
      {
        kind: 'follow',
        q: `Hvad tror du, det betyder for studerendes fremtidige jobmuligheder, at de laver frivilligt arbejde?`,
        a: `Det betyder rigtig meget for deres jobmuligheder. Arbejdsgivere elsker at se frivilligt arbejde på et CV, fordi det viser, at personen har overskud og sociale kompetencer. På den måde skiller de sig ud fra mængden af andre ansøgere. Det giver dem også noget praktisk erfaring, som man ikke altid kan læse sig til i bøgerne på universitetet.`,
      },
      {
        kind: 'main',
        q: `Nogle danskere laver frivilligt ulønnet arbejde, når de er gået på pension. Hvorfor tror du, de gør det?`,
        a: `Jeg tror, at mange pensionister savner at have noget at stå op til om morgenen, når de stopper med at arbejde. Frivilligt arbejde giver dem en struktur i hverdagen og en følelse af stadig at være nyttige. Derudover er det en fantastisk måde at undgå ensomhed på, fordi de bliver en del af et fællesskab og møder andre mennesker.`,
      },
      {
        kind: 'follow',
        q: `Hvad tror du, det betyder for pensionisters livskvalitet, at de laver frivilligt ulønnet arbejde?`,
        a: `Det øger deres livskvalitet helt enormt. Det holder dem aktive både fysisk og mentalt, hvilket er sundt for helbredet. Når de hjælper andre, føler de sig værdsatte, og det giver glæde. På den anden side beskytter det også mod ensomhed, som desværre er et problem for mange ældre mennesker i Danmark.`,
      },
      {
        kind: 'obligatory',
        q: `På mange institutioner, fx plejehjem, skoler og museer, bruger man frivillige udover den professionelle arbejdskraft. Hvilke fordele og ulemper mener du, der kan være ved det?`,
        a: `En stor fordel er, at de frivillige kommer med ekstra overskud og tid til hygge, som det faste personale ofte har for travlt til. Det giver mere omsorg til de ældre eller børnene. Men på den anden side er der en ulempe ved kvaliteten. De frivillige er ikke uddannede, så de må ikke overtage professionelle opgaver som medicin eller pleje, da det kan være farligt.`,
      },
    ],
  },
  {
    id: '2018-s-sygefrav-r-p-arbejdspladsen',
    year: 2018,
    term: 'S',
    label: 'B',
    title: `Sygefravær på arbejdspladsen`,
    questions: [
      {
        kind: 'main',
        q: `Nogle mennesker går sommetider på arbejde, selvom de er forkølede. Hvorfor tror du, de gør det?`,
        a: `Jeg tror, det handler meget om pligtfølelse. Mange vil ikke svigte deres kolleger eller chefen, fordi de ved, at de andre får mere travlt, hvis de bliver hjemme. Derudover kan nogle være bange for at virke dovne eller pjækkede, hvis de melder sig syge med "kun" en forkølelse. De tænker måske, at det går over, hvis de bare tager en pille.`,
      },
      {
        kind: 'follow',
        q: `Hvad tror du, det betyder for ens forhold til kollegerne, at man nogle gange går på arbejde, selvom man er forkølet?`,
        a: `Det kan faktisk skabe dårlig stemning. På den ene side vil man gerne vise, at man er flittig, men på den anden side bliver kollegerne ofte irriterede, fordi man risikerer at smitte dem. Hvis hele kontoret bliver sygt, fordi én person mødte op med forkølelse, går det ud over produktiviteten og arbejdsmiljøet.`,
      },
      {
        kind: 'obligatory',
        q: `Nogle virksomheder tilbyder gratis lægetjek og rådgivning om kost og motion for at reducere sygefravær. Hvilke fordele og ulemper er der ved det?`,
        a: `Fordelen er helt klart, at medarbejderne bliver sundere og får mere energi, hvilket er godt for både dem selv og virksomheden. Det kan mindske sygefraværet. Ulempen kan dog være, at det føles som om, arbejdsgiveren blander sig i privatlivet. Nogle kan føle et pres for at være "sunde og perfekte", og det kan faktisk skabe stress.`,
      },
    ],
  },
  {
    id: '2018-v-arbejdsmilj',
    year: 2018,
    term: 'V',
    label: 'A',
    title: `Arbejdsmiljø`,
    questions: [
      {
        kind: 'main',
        q: `På mange arbejdspladser har man sociale arrangementer som fx firmafester og skovture. Hvorfor tror du, man har det?`,
        a: `Man har det for at styrke sammenholdet mellem kollegerne. Når man oplever noget sjovt sammen uden for kontoret, lærer man hinanden at kende på en ny måde. Det opbygger tillid. På den måde bliver det nemmere at arbejde sammen i hverdagen, fordi man har det godt med hinanden og kender mennesket bag jobbet.`,
      },
      {
        kind: 'main',
        q: `På mange arbejdspladser kommer medarbejderne på kursus i teambuilding. Hvorfor tror du, de gør det?`,
        a: `Jeg tror, det handler om at forbedre samarbejdet og kommunikationen. På et teambuilding-kursus lærer man at løse problemer sammen og bruge hinandens styrker. Det kan være med til at løse konflikter i gruppen. Formålet er at gøre teamet mere effektivt, så de kan levere bedre resultater, når de kommer tilbage på arbejde.`,
      },
      {
        kind: 'obligatory',
        q: `I nogle virksomheder giver man en bonus til medarbejdere, hvis de gør en særlig indsats. Hvilke fordele og ulemper er der ved det?`,
        a: `En fordel er, at det motiverer folk til at arbejde hårdt og yde en ekstra indsats, fordi de gerne vil have belønningen. Det kan øge produktiviteten. Men på den anden side er der en stor ulempe: Det kan skabe dårlig stemning og misundelse mellem kollegerne. Hvis nogen føler, at det er uretfærdigt, hvem der får bonussen, skader det samarbejdet.`,
      },
    ],
  },
  {
    id: '2018-v-uddannelsesvalg',
    year: 2018,
    term: 'V',
    label: 'B',
    title: `Uddannelsesvalg`,
    questions: [
      {
        kind: 'main',
        q: `Nogle studerende vælger at studere et eller flere år på et universitet i udlandet. Hvorfor tror du, de vælger det?`,
        a: `Jeg tror, de gør det for oplevelsens skyld. De vil gerne se verden, lære en ny kultur at kende og blive bedre til sprog, især engelsk. Derudover ser det rigtig godt ud på CV'et. Arbejdsgivere kan godt lide folk, der har været i udlandet, fordi det viser, at man er selvstændig og tør kaste sig ud i nye udfordringer.`,
      },
      {
        kind: 'obligatory',
        q: `Unge skal normalt ikke betale for at få en uddannelse i Danmark. Hvilke fordele og ulemper er der ved det for samfundet?`,
        a: `Den største fordel er lighed. Det betyder, at alle unge kan blive læge eller advokat, uanset om deres forældre er rige eller fattige. Det sikrer, at vi udnytter alt talent i Danmark. Ulempen er, at det er meget dyrt for staten, og det kræver høje skatter. Nogle mener også, at de studerende tager for lang tid om at blive færdige, fordi det er "gratis".`,
      },
    ],
  },
  {
    id: '2018-v-test-i-skolen',
    year: 2018,
    term: 'V',
    label: 'C',
    title: `Test i skolen`,
    questions: [
      {
        kind: 'main',
        q: `Nogle mener, at det er vigtigt for børns læring, at de bliver testet i skolen fra de er helt små. Hvorfor tror du, de mener det?`,
        a: `De mener nok, at test er et godt værktøj til at se, hvor børnene ligger fagligt. På den måde kan læreren hurtigt opdage, hvis et barn har problemer med at læse eller regne, og give hjælp. Det kan også forberede børnene på, at man bliver målt og vejet senere i livet, for eksempel til eksamen.`,
      },
      {
        kind: 'follow',
        q: `Mener du, der kan være nogen problemer ved at teste børn i skolen?`,
        a: `Ja, jeg synes, der er store problemer ved det. Det kan skabe stress og pres hos meget små børn, som bliver bange for at fejle. Skolen skal også handle om trivsel og leg, ikke kun om resultater. Hvis man tester for meget, risikerer man, at børnene mister lysten til at lære, fordi det bliver for alvorligt.`,
      },
      {
        kind: 'obligatory',
        q: `Skolernes karaktergennemsnit offentliggøres på nettet. Hvilke fordele og ulemper er der ved det?`,
        a: `En fordel er, at forældre kan se, hvordan skolerne klarer sig, før de vælger skole til deres børn. Det skaber åbenhed. Ulempen er, at det kan skabe en dårlig konkurrence mellem skolerne. Skolerne fokuserer måske kun på at få høje karakterer i stedet for at hjælpe de svage elever eller fokusere på trivsel og dannelse.`,
      },
    ],
  },
  {
    id: '2019-s-transportformer',
    year: 2019,
    term: 'S',
    label: 'A',
    title: `Transportformer`,
    questions: [
      {
        kind: 'main',
        q: `Der er flere og flere danskere, der køber en elcykel i stedet for en almindelig cykel. Hvorfor tror du, det er sådan?`,
        a: `Jeg tror, det er blevet populært, fordi det gør cykelturen meget nemmere. Med en elcykel kan man cykle langt uden at komme til at svede, hvilket er smart, hvis man skal på arbejde. Det gør det muligt for ældre eller folk med dårlig kondition at cykle igen. Det er også et billigere alternativ til at have en bil nummer to.`,
      },
      {
        kind: 'follow',
        q: `Mener du, der kan være problemer ved elcykler (trafiksikkerhed/sundhed)?`,
        a: `Ja, der er en risiko for trafiksikkerheden, fordi elcykler kører hurtigere end almindelige cykler. Bilisterne overser dem måske, og ulykkerne kan blive alvorlige. På den anden side får man heller ikke helt den samme motion som på en almindelig cykel, fordi motoren hjælper til, men det er stadig bedre end at sidde i en bil.`,
      },
      {
        kind: 'obligatory',
        q: `Nogle mener, der skal investeres i hurtigtog i hele landet. Hvilke fordele og ulemper er der?`,
        a: `Fordelen er, at det binder Danmark sammen. Hvis man kan komme fra Odense til København på kort tid, kan man bo billigere og arbejde i byen. Det er også meget bedre for miljøet end biler og fly. Ulempen er, at det er utrolig dyrt at bygge nye jernbaner, og det kan ødelægge naturen, der hvor skinnerne skal ligge.`,
      },
    ],
  },
  {
    id: '2019-s-arbejde-og-arbejdstid',
    year: 2019,
    term: 'S',
    label: 'B',
    title: `Arbejde og arbejdstid`,
    questions: [
      {
        kind: 'main',
        q: `Nogle mennesker vælger i perioder at arbejde på deltid. Hvorfor tror du, de gør det?`,
        a: `Jeg tror, de gør det for at få mere tid til det, der betyder noget for dem. Mange småbørnsforældre gør det for at hente børn tidligt og undgå stress i hverdagen. Andre gør det måske for at have tid til en hobby eller uddannelse. Det handler om at skabe en bedre balance mellem arbejde og fritid.`,
      },
      {
        kind: 'obligatory',
        q: `Nogle mener, at arbejdstiden skal sættes ned til 30 timer om ugen. Hvilke fordele og ulemper er der?`,
        a: `En stor fordel ville være, at folk fik mere overskud og mindre stress. Det ville give gladere medarbejdere og færre sygemeldinger. På den anden side er ulempen økonomien. Hvis vi arbejder mindre, producerer vi mindre, og så bliver samfundet fattigere. Virksomhederne ville måske mangle arbejdskraft til at løse opgaverne.`,
      },
    ],
  },
  {
    id: '2019-s-kultur',
    year: 2019,
    term: 'S',
    label: 'C',
    title: `Kultur`,
    questions: [
      {
        kind: 'main',
        q: `Nogle danskere mener, at det skal være gratis at gå på museum. Hvorfor tror du, de mener det?`,
        a: `De mener det nok, fordi kultur og historie er vigtigt for alle, ikke kun dem med mange penge. Hvis det er gratis, kan børnefamilier, studerende og pensionister bruge museerne meget mere. Det er med til at danne os som mennesker og forstå vores samfund, så det burde være en fælles gode ligesom biblioteket.`,
      },
      {
        kind: 'obligatory',
        q: `Flere kommuner bruger penge på dyre kulturhuse. Hvilke fordele og ulemper er der?`,
        a: `Fordelen er, at et kulturhus kan samle byen. Det giver folk et sted at mødes til teater, musik og fællesskab, hvilket gør byen attraktiv at bo i. Ulempen er prisen. Det koster mange millioner at bygge og drive, og nogle borgere synes, at pengene hellere skulle bruges på ældrepleje eller bedre skoler, som er mere nødvendige.`,
      },
    ],
  },
  {
    id: '2019-v-k-n-og-arbejde',
    year: 2019,
    term: 'V',
    label: 'A',
    title: `Køn og arbejde`,
    questions: [
      {
        kind: 'main',
        q: `I Danmark er der færre kvinder end mænd, der arbejder med it og finans. Hvorfor tror du, det er sådan?`,
        a: `Jeg tror, det skyldes gamle traditioner og fordomme. Mange piger tror måske, at IT er "nørdet" eller kun for drenge, fordi de mangler kvindelige rollemodeller i branchen. Kulturen på arbejdspladserne kan også være meget maskulin, hvilket måske skræmmer nogle kvinder væk. Det starter allerede i skolen, hvor drenge og piger vælger forskelligt.`,
      },
      {
        kind: 'obligatory',
        q: `Man kunne lave regler (kvoter) for fordelingen af mænd og kvinder på uddannelser. Hvilke fordele og ulemper er der?`,
        a: `Fordelen ville være, at vi hurtigere får ligestilling og et mere blandet arbejdsmarked, hvilket er sundt for arbejdsmiljøet. Ulempen er, at det begrænser folks frie valg. Det kan føles uretfærdigt, hvis en dygtig mand ikke kommer ind på studiet, bare fordi der skal være plads til en kvinde – eller omvendt.`,
      },
    ],
  },
  {
    id: '2019-v-kostvaner-og-livsstil',
    year: 2019,
    term: 'V',
    label: 'B',
    title: `Kostvaner og livsstil`,
    questions: [
      {
        kind: 'main',
        q: `De fleste spiser slik eller chips, selvom de ved, det er usundt. Hvorfor tror du, de gør det?`,
        a: `Det er simpelthen fordi, det smager godt og er hyggeligt. Vi forbinder ofte fredag aften og hygge med slikskålen. Derudover er sukker vanedannende, så kroppen beder om det, når vi er trætte eller stressede. Det er nemt at falde i, når det står lige foran os i supermarkedet.`,
      },
      {
        kind: 'obligatory',
        q: `I medierne fremstilles succesfulde folk ofte som smukke og slanke. Hvilke fordele og ulemper er der ved det?`,
        a: `En lille fordel kunne være, at det inspirerer nogen til at leve sundt og dyrke motion. Men ulemperne er meget større. Det skaber et urealistisk ideal, som almindelige mennesker ikke kan leve op til. Især unge kan få lavt selvværd og føle sig forkerte, hvis de tror, at man skal være tynd for at være succesfuld.`,
      },
    ],
  },
  {
    id: '2019-v-studieboliger',
    year: 2019,
    term: 'V',
    label: 'C',
    title: `Studieboliger`,
    questions: [
      {
        kind: 'main',
        q: `Mange vil studere i Aarhus eller København trods boligmangel. Hvorfor?`,
        a: `Det er fordi, de store byer har det hele: De bedste uddannelser, det vildeste studieliv og de bedste jobmuligheder bagefter. De unge vil gerne være der, hvor det sker, og hvor deres venner er. De tager chancen med boligen, fordi de prioriterer det sociale liv og karrieren højere end en billig husleje.`,
      },
      {
        kind: 'obligatory',
        q: `I universitetsbyer kan man vælge at bygge studieboliger i stedet for ældreboliger. Hvilke fordele og ulemper er der?`,
        a: `Fordelen ved studieboliger er, at man tiltrækker unge, som skaber liv og vækst i byen. Det sikrer fremtidens arbejdskraft. Ulempen er, at man risikerer at svigte de ældre, som har betalt skat hele livet. Det kan skabe en konflikt mellem generationerne, hvis de ældre føler, at der ikke er plads til dem i byen længere.`,
      },
    ],
  },
  {
    id: '2020-s-b-rns-tid-online',
    year: 2020,
    term: 'S',
    label: 'A',
    title: `Børns tid online`,
    questions: [
      {
        kind: 'main',
        q: `På nogle skoler må elever ikke bruge deres mobiltelefon i skoletiden. Hvorfor tror du, det er sådan?`,
        a: `Jeg tror, skolerne gør det for at styrke fællesskabet og koncentrationen. Hvis eleverne sidder med næsen i skærmen i frikvarteret, snakker de ikke sammen eller leger. I timerne er mobilen en stor distraktion, der forstyrrer indlæringen. Ved at fjerne den, tvinger man eleverne til at være nærværende sammen med hinanden.`,
      },
      {
        kind: 'main',
        q: `Nogle børn vil hellere spille computer end lege udenfor. Hvorfor?`,
        a: `Det er fordi, computerspil er designet til at være utrolig spændende. De giver hurtige belønninger, og man kan være en helt i en anden verden. Mange børn er også sociale online, hvor de snakker med vennerne over headsettet, mens de spiller. For dem føles det lige så socialt som at lege i gården.`,
      },
      {
        kind: 'obligatory',
        q: `Nogle børn lever hele deres sociale liv online. Hvilke fordele og ulemper er der?`,
        a: `Fordelen er, at man kan finde venner med samme interesser, selvom man føler sig anderledes i skolen. Det kan være en tryg base. Ulempen er, at man går glip af den fysiske kontakt. Man lærer ikke at læse kropssprog eller se folk i øjnene, hvilket er vigtige sociale kompetencer i den virkelige verden.`,
      },
    ],
  },
  {
    id: '2020-s-det-offentlige-sundhedsv-sen',
    year: 2020,
    term: 'S',
    label: 'B',
    title: `Det offentlige sundhedsvæsen`,
    questions: [
      {
        kind: 'main',
        q: `Nogle mener, der skal være gebyr ved lægebesøg. Hvorfor?`,
        a: `De mener det nok for at undgå, at folk går til lægen med småting, som går over af sig selv. Hvis det koster penge, vil folk tænke sig om en ekstra gang. Det kunne spare tid for lægerne og penge for samfundet, så der er mere tid til dem, der er alvorligt syge.`,
      },
      {
        kind: 'obligatory',
        q: `Der bliver færre men større hospitaler (superhospitaler). Hvilke fordele og ulemper er der?`,
        a: `Fordelen er kvaliteten. På et stort hospital kan man samle de dygtigste specialister og det bedste udstyr, så patienterne får den bedste behandling. Ulempen er afstanden. For folk, der bor på landet eller i yderområderne, kan der blive meget langt til nærmeste hospital, hvilket kan skabe utryghed i akutte situationer.`,
      },
    ],
  },
  {
    id: '2020-s-arbejde-og-sprog',
    year: 2020,
    term: 'S',
    label: 'C',
    title: `Arbejde og sprog`,
    questions: [
      {
        kind: 'main',
        q: `Firmaer betaler danskkurser til udenlandske ansatte, selvom arbejdssproget er engelsk. Hvorfor?`,
        a: `De gør det for at fastholde medarbejderne og sikre trivsel. Hvis man bor i Danmark, er det vigtigt at kunne sproget for at få venner og fungere i samfundet uden for arbejdet. På arbejdspladsen styrker det også det sociale sammenhold, hvis alle kan snakke sammen ved kaffemaskinen på dansk.`,
      },
      {
        kind: 'obligatory',
        q: `Udlændinge kan arbejde i Danmark uden at kunne dansk. Hvilke fordele og ulemper er der for samfundet?`,
        a: `En stor fordel er, at vi kan tiltrække dygtig arbejdskraft fra hele verden til virksomhederne, hvilket skaber vækst. Vi mangler hænder, så det er nødvendigt. Ulempen er integrationen. Hvis de aldrig lærer dansk, lever de måske i et parallelsamfund og bliver aldrig en rigtig del af Danmark, og de rejser måske hurtigt igen.`,
      },
    ],
  },
  {
    id: '2020-v-arbejdsliv-og-familieliv',
    year: 2020,
    term: 'V',
    label: 'A',
    title: `Arbejdsliv og familieliv`,
    questions: [
      {
        kind: 'main',
        q: `Nogle venter med at få børn, til de er sidst i 30'erne. Hvorfor?`,
        a: `Jeg tror, de prioriterer karriere og frihed først. De vil gerne have et fast job, en god økonomi og måske et hus, før de får børn. Mange vil også gerne rejse og "leve livet", før det store ansvar kommer. I dag tager uddannelserne også lang tid, så man er ofte ældre, før man er helt klar.`,
      },
      {
        kind: 'main',
        q: `Nogle får børn, mens de studerer. Hvorfor?`,
        a: `De gør det, fordi studielivet kan være mere fleksibelt end et fuldtidsjob. Som studerende kan man ofte selv planlægge sin læsning og har måske færre timer, hvor man skal møde op. Det giver tid til barnet. De tænker måske også, at de så er helt klar til at fokusere på karrieren, når de er færdige.`,
      },
      {
        kind: 'obligatory',
        q: `Moren holder ofte den længste orlov. Hvilke fordele og ulemper er der?`,
        a: `Fordelen er hensynet til barnet og amning, som gør det naturligt for mange, at moren er hjemme i starten. Det skaber en tæt tilknytning. Ulempen er ligestillingen. Når kvinder er væk længe, sakker de bagud lønmæssigt og karrieremæssigt i forhold til mændene. Det kan også betyde, at fædrene får et mindre tæt forhold til barnet.`,
      },
    ],
  },
  {
    id: '2020-v-unge-og-sundhed',
    year: 2020,
    term: 'V',
    label: 'C',
    title: `Unge og sundhed`,
    questions: [
      {
        kind: 'main',
        q: `Nogle unge ryger, selvom de ved, det er usundt. Hvorfor?`,
        a: `Det er helt klart det sociale, der driver det. Mange begynder at ryge til fester eller i pauserne for at være en del af gruppen. Det ser "sejt" eller voksent ud. Når man først er begyndt, bliver man afhængig af nikotinen, og så er det svært at stoppe, selvom man ved, det er farligt.`,
      },
      {
        kind: 'main',
        q: `Nogle unge går meget op i fitness og kost. Hvorfor?`,
        a: `Det handler om kropsidealer og identitet. På sociale medier ser de billeder af trænede kroppe, og de vil gerne ligne dem for at få anerkendelse. For mange giver træning også et frirum og en følelse af kontrol og velvære. Det er blevet en livsstil at være sund og stærk.`,
      },
      {
        kind: 'obligatory',
        q: `Samfundet bør påvirke unges livsstil ved at sætte prisen op på cigaretter/alkohol. Fordele og ulemper?`,
        a: `Fordelen er, at unge er meget prisfølsomme. Hvis det bliver rigtig dyrt, har de simpelthen ikke råd til at købe det, og så lever de sundere. Det virker. Ulempen er, at det kan ramme socialt skævt. Voksne med lave indkomster bliver også straffet økonomisk, og det kan skabe mere ulighed, hvis de er afhængige.`,
      },
    ],
  },
];

/**
 * The two most recent official sessions, transcribed from the actual exam
 * prompt sheets (Undervisningsministeriet, Niels Roland illustrations).
 *
 * These sheets carry no printed Q&A — each Emne is two photographed scenes
 * the examiner builds questions around live — so `questions` is empty and the
 * value here is purely "this title was asked, on this date". That is still
 * exactly what the search screen needs: proof of what is currently in
 * rotation, most recent first.
 */
export interface OfficialSession {
  year: number;
  term: Term;
  /** The two photographed prompts under each Emne, as printed on the sheet. */
  emner: { label: string; title: string; scenes: [string, string] }[];
}

export const OFFICIAL_SESSIONS: OfficialSession[] = [
  {
    year: 2023,
    term: 'V',
    emner: [
      {
        label: 'A',
        title: 'At søge læge',
        scenes: ['Mænd venter med at gå til læge', 'Videokonsultation med lægen'],
      },
      {
        label: 'B',
        title: 'Arbejde og alder',
        scenes: ['Ældre på arbejdsmarkedet', 'Unge på arbejdsmarkedet'],
      },
      {
        label: 'C',
        title: 'Klima og livsstil',
        scenes: ['Klima og madvaner', 'Klima og ferievaner'],
      },
    ],
  },
  {
    year: 2023,
    term: 'S',
    emner: [
      {
        label: 'A',
        title: 'Brug af sociale medier',
        scenes: ['Køb og salg via sociale medier', 'Personlige billeder på sociale medier'],
      },
      {
        label: 'B',
        title: 'Studerende og økonomi',
        scenes: ['Studiejob', 'Studielån'],
      },
      {
        label: 'C',
        title: 'Jobsøgning og ledighed',
        scenes: ['Jobsøgning og alder', 'At søge job langt væk'],
      },
    ],
  },
];

/**
 * Practice topics written to the exam's actual question pattern — Årsag,
 * Konsekvens, Fordele/Ulemper, Holdning/Vurdering — for subjects not yet drawn
 * in the 2011–2023 archive above (politics, inequality, immigration, parental
 * leave...). Labelled `practice` everywhere in the UI: real exam candidates
 * should never mistake these for a topic that has actually been set.
 */
export interface PracticeTopic {
  id: string;
  title: string;
  /** The two picture prompts a real Emne would show. */
  scenario: [string, string];
  questions: {
    kind: 'first-a' | 'first-a-follow' | 'first-b' | 'first-b-follow' | 'second' | 'second-follow';
    q: string;
    a: string;
  }[];
}

export const PRACTICE_TOPICS: PracticeTopic[] = [
  {
    id: 'practice-toejforbrug',
    title: 'Klima og Tøjforbrug',
    scenario: [
      'En person køber mange billige T-shirts (fast fashion).',
      'En person reparerer et par jeans eller sælger tøj på en genbrugsapp.',
    ],
    questions: [
      {
        kind: 'first-a',
        q: 'Mange danskere køber billigt tøj, selvom de ved, at det belaster klimaet. Hvorfor tror du, de gør det?',
        a: 'Jeg tror, mange gør det, fordi fast fashion er økonomisk tilgængeligt og opfylder et hurtigt behov for fornyelse. Det er let at retfærdiggøre et køb, når prisen er lav. På den anden side er det et resultat af en aggressiv markedsføring fra tøjproducenter, der opfordrer til konstant udskiftning. Jeg mener, dette er et strukturelt problem, der kræver mere end individuel handling.',
      },
      {
        kind: 'first-a-follow',
        q: 'Mener du, der kan være nogen problemer ved, at det er så let og billigt at købe nyt tøj?',
        a: 'Jeg tror, mange gør det, fordi fast fashion er økonomisk tilgængeligt og opfylder et hurtigt behov for fornyelse. Det er let at retfærdiggøre et køb, når prisen er lav. På den anden side er det et resultat af en aggressiv markedsføring fra tøjproducenter, der opfordrer til konstant udskiftning. Jeg mener, dette er et strukturelt problem, der kræver mere end individuel handling.',
      },
      {
        kind: 'first-b',
        q: 'Flere og flere bruger apps som Trendsales og Vinted til at sælge og købe brugt tøj. Hvorfor tror du, de gør det?',
        a: 'Jeg tror, det skyldes en voksende klimabevidsthed hos forbrugerne, der ønsker at handle mere cirkulært. Samtidig er det en nem måde at tjene penge på og spare penge ved at købe billigere. Jeg tror, de digitale platforme har gjort genbrug socialt accepteret og let tilgængeligt.',
      },
      {
        kind: 'first-b-follow',
        q: 'Hvad tror du, det betyder for butikker og tøjproducenter, at genbrug bliver så populært?',
        a: 'Jeg tror, det skyldes en voksende klimabevidsthed hos forbrugerne, der ønsker at handle mere cirkulært. Samtidig er det en nem måde at tjene penge på og spare penge ved at købe billigere. Jeg tror, de digitale platforme har gjort genbrug socialt accepteret og let tilgængeligt.',
      },
      {
        kind: 'second',
        q: 'Tøjforbrug er i Danmark vurderet som et af de største klimaproblemer, men kun ca. 6% af tøjet genanvendes. Hvilke fordele og ulemper mener du, der kan være ved at indføre strengere politiske krav til tøjbranchen?',
        a: 'Fordele er, at politiske krav kan tvinge branchen til at bruge bæredygtige materialer og designe tøj til længere holdbarhed, hvilket reducerer affald. Ulemperne kan være, at det fører til højere priser for forbrugerne og kan udkonkurrere danske virksomheder, hvis reglerne bliver for strikse.',
      },
      {
        kind: 'second-follow',
        q: 'Hvad tror du, der skal til for at få danskerne til at reparere og genanvende mere tøj?',
        a: 'Fordele er, at politiske krav kan tvinge branchen til at bruge bæredygtige materialer og designe tøj til længere holdbarhed, hvilket reducerer affald. Ulemperne kan være, at det fører til højere priser for forbrugerne og kan udkonkurrere danske virksomheder, hvis reglerne bliver for strikse.',
      },
    ],
  },
  {
    id: 'practice-valgdeltagelse',
    title: 'Politik og Valgdeltagelse',
    scenario: [
      'En fyldt stemmeboks på valgdagen (høj valgdeltagelse).',
      'En person ignorerer en politisk plakat (sofavælger / lav interesse).',
    ],
    questions: [
      {
        kind: 'first-a',
        q: 'I Danmark er der en meget høj valgdeltagelse på omkring 86% ved folketingsvalg. Hvorfor tror du, der er så mange, der stemmer?',
        a: 'Jeg tror, det skyldes en stærk demokratisk tradition og en udbredt følelse af borgerpligt. Mange danskere ser det som en måde at sikre velfærdsstaten og den sociale lighed på. På den anden side betyder den høje valgdeltagelse, at resultatet er mere repræsentativt for hele befolkningen end i lande med lav deltagelse.',
      },
      {
        kind: 'first-a-follow',
        q: 'Hvad tror du, det betyder for demokratiet i et land, hvis kun halvdelen af borgerne stemmer?',
        a: 'Jeg tror, det skyldes en stærk demokratisk tradition og en udbredt følelse af borgerpligt. Mange danskere ser det som en måde at sikre velfærdsstaten og den sociale lighed på. På den anden side betyder den høje valgdeltagelse, at resultatet er mere repræsentativt for hele befolkningen end i lande med lav deltagelse.',
      },
      {
        kind: 'first-b',
        q: "Nogle mennesker vælger at være 'sofavælgere', fordi de ikke synes, de kan finde et parti, de er 100% enige med. Hvorfor tror du, de gør det?",
        a: 'Jeg tror, det skyldes politikerlede og en følelse af, at partiernes politik ligger for tæt på hinanden. Mange føler, at deres stemme ikke gør en forskel, eller at politikken er for kompliceret at sætte sig ind i. På den anden side kan sofavælgere også være udtryk for, at man generelt er tilfreds med samfundet.',
      },
      {
        kind: 'first-b-follow',
        q: 'Mener du, det er et problem for demokratiet, hvis vælgerne skifter parti fra valg til valg (partihoppere)?',
        a: 'Jeg tror, det skyldes politikerlede og en følelse af, at partiernes politik ligger for tæt på hinanden. Mange føler, at deres stemme ikke gør en forskel, eller at politikken er for kompliceret at sætte sig ind i. På den anden side kan sofavælgere også være udtryk for, at man generelt er tilfreds med samfundet.',
      },
      {
        kind: 'second',
        q: 'Partierne i Folketinget skal ofte samarbejde hen over midten for at få et flertal for deres politik. Hvilke fordele og ulemper mener du, der kan være ved den danske tradition for at indgå brede politiske kompromiser?',
        a: 'Fordele er, at brede kompromiser skaber stabile og langtidsholdbare løsninger, som ikke ændres ved næste valg. Ulemperne er på den anden side, at det kan føre til langsomme beslutningsprocesser og mindre gennemsigtighed for vælgerne. Jeg mener, kompromiser er nødvendige for at styre landet, men de skal være ærlige.',
      },
      {
        kind: 'second-follow',
        q: 'Hvad tror du, det betyder for vælgernes tillid, at partierne ofte indgår kompromiser, der går imod deres valgløfter?',
        a: 'Fordele er, at brede kompromiser skaber stabile og langtidsholdbare løsninger, som ikke ændres ved næste valg. Ulemperne er på den anden side, at det kan føre til langsomme beslutningsprocesser og mindre gennemsigtighed for vælgerne. Jeg mener, kompromiser er nødvendige for at styre landet, men de skal være ærlige.',
      },
    ],
  },
  {
    id: 'practice-ulighed',
    title: 'Økonomi og Ulighed',
    scenario: [
      'En rig person i et stort hus / på luksusferie (høj indkomst).',
      'En person på jobcenter / kontanthjælp (lav indkomst).',
    ],
    questions: [
      {
        kind: 'first-a',
        q: 'Nogle mener, at ulighed er nødvendig i samfundet, fordi det får folk til at stræbe efter mere og arbejde hårdere. Hvorfor tror du, de mener det?',
        a: 'Jeg tror, de mener, at incitamentet til at stræbe efter succes er afgørende for økonomisk vækst og innovation. Hvis der ikke er en stor belønning for hårdt arbejde, kan folk blive demotiverede. På den anden side kan for stor ulighed føre til social uro og mistillid i samfundet, hvilket kan skade solidariteten.',
      },
      {
        kind: 'first-a-follow',
        q: 'Hvad tror du, det betyder for et samfund, hvis de rigeste bliver rigere, mens de fattigste står stille (økonomisk ulighed)?',
        a: 'Jeg tror, de mener, at incitamentet til at stræbe efter succes er afgørende for økonomisk vækst og innovation. Hvis der ikke er en stor belønning for hårdt arbejde, kan folk blive demotiverede. På den anden side kan for stor ulighed føre til social uro og mistillid i samfundet, hvilket kan skade solidariteten.',
      },
      {
        kind: 'first-b',
        q: 'Selvom Danmark har en høj dagpengesats og kontanthjælp, føler nogle sig utrygge ved at miste jobbet. Hvorfor tror du, de føler det?',
        a: 'Jeg tror, det skyldes, at de sociale ydelser ofte ikke dækker alle udgifter i et dyrt land som Danmark. Der er en frygt for at miste status og en følelse af, at samfundet stigmatiserer modtagere af offentlig støtte. Desuden betyder kontanthjælpsloftet og andre stramninger, at ydelserne er lavere end tidligere.',
      },
      {
        kind: 'first-b-follow',
        q: 'Hvilken rolle tror du, at sociale medier spiller for folks opfattelse af deres egen økonomiske situation?',
        a: 'Jeg tror, det skyldes, at de sociale ydelser ofte ikke dækker alle udgifter i et dyrt land som Danmark. Der er en frygt for at miste status og en følelse af, at samfundet stigmatiserer modtagere af offentlig støtte. Desuden betyder kontanthjælpsloftet og andre stramninger, at ydelserne er lavere end tidligere.',
      },
      {
        kind: 'second',
        q: 'Den danske model (flexicurity) giver virksomheder stor fleksibilitet til at fyre ansatte, men giver samtidig en høj social sikkerhed. Hvilke fordele og ulemper mener du, der kan være ved den model for de ansatte?',
        a: 'Fordele er, at ansatte har en høj tryghed via A-kasser og dagpenge, hvilket gør dem mere åbne over for forandringer og nye job. Ulemper er på den anden side, at usikkerheden er højere, da man lettere kan miste jobbet. Jeg tror dog, den høje sikkerhed opvejer den øgede fleksibilitet og er vigtig for at bevare tilliden på arbejdsmarkedet.',
      },
      {
        kind: 'second-follow',
        q: 'Mener du, at Danmark bør sænke skatten for de højeste indkomster for at fremme vækst?',
        a: 'Fordele er, at ansatte har en høj tryghed via A-kasser og dagpenge, hvilket gør dem mere åbne over for forandringer og nye job. Ulemper er på den anden side, at usikkerheden er højere, da man lettere kan miste jobbet. Jeg tror dog, den høje sikkerhed opvejer den øgede fleksibilitet og er vigtig for at bevare tilliden på arbejdsmarkedet.',
      },
    ],
  },
  {
    id: 'practice-frisind',
    title: 'Frisind og Kulturmøde',
    scenario: [
      'En multikulturel arbejdsplads med god stemning (tolerance/mangfoldighed).',
      'En demonstration med stærkt kritiske ytringer (ytringsfrihedens grænser).',
    ],
    questions: [
      {
        kind: 'first-a',
        q: 'Danmark er kendt for sit frisind og sin høje tolerance over for forskellige livsformer, f.eks. i forhold til homoseksuelle. Hvorfor tror du, det er sådan?',
        a: 'Jeg tror, det skyldes en stærk sekulær tradition og en historisk vægt på lighed og individuel frihed i Norden. Den høje tillid i samfundet har på den anden side gjort det lettere at acceptere forskelle. Jeg mener, frisind er en kulturel grundværdi, som aktivt understøttes i skoler og lovgivning.',
      },
      {
        kind: 'first-a-follow',
        q: 'Hvad tror du, det betyder for et samfunds sammenhængskraft, at der er stor tolerance over for forskellige minoriteter?',
        a: 'Jeg tror, det skyldes en stærk sekulær tradition og en historisk vægt på lighed og individuel frihed i Norden. Den høje tillid i samfundet har på den anden side gjort det lettere at acceptere forskelle. Jeg mener, frisind er en kulturel grundværdi, som aktivt understøttes i skoler og lovgivning.',
      },
      {
        kind: 'first-b',
        q: 'Danmark har en meget stærk tradition for ytringsfrihed, der tillader stærkt kritiske ytringer mod religioner og minoriteter. Hvorfor tror du, man tillader det?',
        a: 'Jeg tror, man tillader det, fordi ytringsfrihed anses for at være en fundamental søjle i demokratiet og et værn mod magtmisbrug. Den stærke tradition bygger på princippet om, at alle holdninger skal kunne debatteres. På den anden side er der en lov mod hadprædiken, der sætter en grænse for, hvad der er tilladt.',
      },
      {
        kind: 'first-b-follow',
        q: 'Mener du, at Danmark bør sætte en klarere juridisk grænse for ytringsfriheden, hvis den krænker religiøse minoriteter?',
        a: 'Jeg tror, man tillader det, fordi ytringsfrihed anses for at være en fundamental søjle i demokratiet og et værn mod magtmisbrug. Den stærke tradition bygger på princippet om, at alle holdninger skal kunne debatteres. På den anden side er der en lov mod hadprædiken, der sætter en grænse for, hvad der er tilladt.',
      },
      {
        kind: 'second',
        q: 'Flere virksomheder i Danmark vælger at ansætte medarbejdere med forskellig kulturel baggrund (mangfoldighed). Hvilke fordele og ulemper mener du, der kan være ved at skabe multikulturelle arbejdspladser?',
        a: 'Fordele er, at mangfoldighed bringer nye perspektiver og innovation til virksomheden. Ulemper kan være kulturelle misforståelser og vanskeligheder med kommunikation. Jeg mener, at for at det skal fungere godt, er det vigtigt at investere i inklusionsstrategier og sikre, at alle føler sig hørt og værdsat.',
      },
      {
        kind: 'second-follow',
        q: 'Hvad tror du, der skal til for at få en multikulturel arbejdsplads til at fungere godt?',
        a: 'Fordele er, at mangfoldighed bringer nye perspektiver og innovation til virksomheden. Ulemper kan være kulturelle misforståelser og vanskeligheder med kommunikation. Jeg mener, at for at det skal fungere godt, er det vigtigt at investere i inklusionsstrategier og sikre, at alle føler sig hørt og værdsat.',
      },
    ],
  },
  {
    id: 'practice-velfaerd',
    title: 'Velfærd og Offentlig/Privat',
    scenario: [
      'Lang ventetid på et offentligt hospital.',
      'Hurtig betalt service på et privathospital.',
    ],
    questions: [
      {
        kind: 'first-a',
        q: 'Nogle danskere vælger at betale for behandling på et privathospital, selvom de har adgang til gratis behandling i det offentlige. Hvorfor tror du, de gør det?',
        a: 'Jeg tror, de gør det primært for at undgå lange ventetider i det offentlige system og få hurtigere adgang til specialister. Nogle værdsætter også den ekstra service og komfort i det private sundhedsvæsen. Jeg mener, det er et udtryk for, at det offentlige system er under pres.',
      },
      {
        kind: 'first-a-follow',
        q: 'Hvilke problemer tror du, det skaber i sundhedsvæsenet, at de rigeste kan springe køen over i det private?',
        a: 'Jeg tror, de gør det primært for at undgå lange ventetider i det offentlige system og få hurtigere adgang til specialister. Nogle værdsætter også den ekstra service og komfort i det private sundhedsvæsen. Jeg mener, det er et udtryk for, at det offentlige system er under pres.',
      },
      {
        kind: 'first-b',
        q: 'Nogle mener, at det offentlige sundhedsvæsen bør indføre en form for brugerbetaling (gebyr) for at gå til lægen. Hvorfor tror du, de mener det?',
        a: 'Jeg tror, de mener, at brugerbetaling kan reducere antallet af unødvendige lægebesøg og dermed spare ressourcer. På den anden side vil et gebyr sikre, at brugerne er mere bevidste om at udnytte sundhedssystemet. Jeg mener dog, at dette vil skabe stor ulighed for de lavtlønnede.',
      },
      {
        kind: 'first-b-follow',
        q: 'Mener du, at adgangen til læge og hospitaler skal være helt gratis for alle borgere i Danmark?',
        a: 'Jeg tror, de mener, at brugerbetaling kan reducere antallet af unødvendige lægebesøg og dermed spare ressourcer. På den anden side vil et gebyr sikre, at brugerne er mere bevidste om at udnytte sundhedssystemet. Jeg mener dog, at dette vil skabe stor ulighed for de lavtlønnede.',
      },
      {
        kind: 'second',
        q: 'Den danske velfærdsmodel finansieres gennem et af verdens højeste skattetryk. Hvilke fordele og ulemper mener du, der kan være ved, at velfærdssystemet finansieres af et højt skattetryk?',
        a: 'Fordele er, at det sikrer social lighed og universel adgang til essentielle ydelser som sundhed og uddannelse. Ulemper er på den anden side, at det kan svække vækstincitamenter for de højestlønnede. Jeg mener, de sociale fordele, der skabes af den høje lighed, opvejer ulemperne ved det høje skattetryk.',
      },
      {
        kind: 'second-follow',
        q: 'Hvad tror du, det betyder for ligheden i et samfund, at alle har adgang til gratis velfærdsydelser?',
        a: 'Fordele er, at det sikrer social lighed og universel adgang til essentielle ydelser som sundhed og uddannelse. Ulemper er på den anden side, at det kan svække vækstincitamenter for de højestlønnede. Jeg mener, de sociale fordele, der skabes af den høje lighed, opvejer ulemperne ved det høje skattetryk.',
      },
    ],
  },
  {
    id: 'practice-foraeldreskab',
    title: 'Køn og Forældreskab',
    scenario: [
      'En far er hjemme på barsel og leger med sit barn.',
      'En mor er tilbage på en travl arbejdsplads efter kort orlov.',
    ],
    questions: [
      {
        kind: 'first-a',
        q: 'I Danmark er der flere mænd, der tager længere barsel end tidligere. Hvorfor tror du, det er blevet mere almindeligt?',
        a: 'Jeg tror, det er blevet mere almindeligt på grund af lovgivning om øremærket barsel, som tvinger fædre til at tage orlov, samt et øget fokus på ligestilling i familien. Samtidig ønsker mange mænd at opbygge et tæt bånd til deres barn tidligt i livet.',
      },
      {
        kind: 'first-a-follow',
        q: 'Hvad tror du, det betyder for barnet, at faderen tager en lang del af barslen?',
        a: 'Jeg tror, det er blevet mere almindeligt på grund af lovgivning om øremærket barsel, som tvinger fædre til at tage orlov, samt et øget fokus på ligestilling i familien. Samtidig ønsker mange mænd at opbygge et tæt bånd til deres barn tidligt i livet.',
      },
      {
        kind: 'first-b',
        q: 'Mange kvinder vender hurtigt tilbage til arbejdsmarkedet efter fødslen. Hvorfor tror du, de vælger at holde en kort barsel?',
        a: 'Jeg tror, nogle kvinder vælger det for at undgå at miste karrieremomentum i et konkurrencepræget erhvervsliv. Det kan også være et økonomisk valg, hvor familien har brug for begge indkomster. På den anden side har mange kvinder et stærkt ønske om at arbejde og kan finde tilfredsstillelse i deres professionelle liv.',
      },
      {
        kind: 'first-b-follow',
        q: 'Hvilke konsekvenser tror du, det har for kvindens karriere at tage en lang barselsorlov?',
        a: 'Jeg tror, nogle kvinder vælger det for at undgå at miste karrieremomentum i et konkurrencepræget erhvervsliv. Det kan også være et økonomisk valg, hvor familien har brug for begge indkomster. På den anden side har mange kvinder et stærkt ønske om at arbejde og kan finde tilfredsstillelse i deres professionelle liv.',
      },
      {
        kind: 'second',
        q: 'I mange mandedominerede fag (f.eks. IT eller ingeniørfag) er det sjældent, at mænd tager lang barsel. Hvilke fordele og ulemper mener du, der kan være ved at indføre øremærket barsel til mænd (lovkrav)?',
        a: 'Fordele er, at øremærket barsel øger ligestillingen på arbejdsmarkedet og normaliserer mænds omsorgsrolle. Ulemper er på den anden side, at det begrænser familiens frihed til at planlægge barslen efter deres eget behov. Jeg mener, det er et nødvendigt skridt for at bryde de traditionelle kønsrollemønstre.',
      },
      {
        kind: 'second-follow',
        q: 'Hvad tror du, det betyder for ligestillingen i samfundet, at kvinder stadig holder den største del af barselsorloven?',
        a: 'Fordele er, at øremærket barsel øger ligestillingen på arbejdsmarkedet og normaliserer mænds omsorgsrolle. Ulemper er på den anden side, at det begrænser familiens frihed til at planlægge barslen efter deres eget behov. Jeg mener, det er et nødvendigt skridt for at bryde de traditionelle kønsrollemønstre.',
      },
    ],
  },
];

export function topicById(id: string | undefined): Topic | undefined {
  return TOPICS.find((t) => t.id === id);
}

export function practiceTopicById(id: string | undefined): PracticeTopic | undefined {
  return PRACTICE_TOPICS.find((t) => t.id === id);
}

/** Every year a session appears, across both the archive and official sheets. */
export function allYears(): number[] {
  const ys = new Set<number>();
  for (const t of TOPICS) ys.add(t.year);
  for (const s of OFFICIAL_SESSIONS) ys.add(s.year);
  return [...ys].sort((a, b) => b - a);
}
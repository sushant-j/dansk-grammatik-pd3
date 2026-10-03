import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../src/ui/Screen';
import { RULES } from '../src/grammar/rules';
import { activeProvider } from '../src/feedback/claudeCoach';
import type { WritingFeedback, WritingTask } from '../src/feedback/types';
import { Button, Card, Divider, Label, Txt, s } from '../src/ui/primitives';
import { useTheme } from '../src/ui/theme';

/**
 * Writing studio.
 *
 * PD3's written paper is a letter plus a topic piece, and no consumer app
 * touches it. The offline checker below is deliberately narrow — it only flags
 * what it can explain by rule — and it says so. The Claude-backed coach slots
 * in behind the same interface once the proxy exists; the UI does not change,
 * only the provider label.
 */

const OFFICIAL_2022 = 'Official PD3 paper, May–June 2022 (danskogproever.dk)';

const TASKS: { name: string; task: WritingTask }[] = [
  {
    name: 'PD3 e-mail',
    task: {
      kind: 'letter',
      register: 'uformel',
      source: `${OFFICIAL_2022} · Delprøve 1`,
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
    task: {
      kind: 'essay',
      minWords: 200,
      source: `${OFFICIAL_2022} · Delprøve 2A`,
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
    task: {
      kind: 'essay',
      minWords: 200,
      source: `${OFFICIAL_2022} · Delprøve 2B`,
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
    name: 'Formal letter',
    task: {
      kind: 'letter',
      register: 'formel',
      prompt:
        'Skriv en e-mail til din kommune. Du har fået et brev om, at du skal møde til en samtale den 3. marts, men du kan ikke komme. Forklar hvorfor, og foreslå en anden dato.',
    },
  },
  {
    name: 'Informal note',
    task: {
      kind: 'letter',
      register: 'uformel',
      prompt:
        'Skriv en besked til en ven, der har inviteret dig til fødselsdag. Sig tak, forklar at du kommer lidt senere, og fortæl hvorfor.',
    },
  },
  {
    name: 'Practice essay',
    task: {
      kind: 'essay',
      minWords: 200,
      prompt:
        'Mange flytter fra landet til de store byer. Skriv om fordele og ulemper ved at bo i en storby, og giv din egen mening.',
    },
  },
];

export default function Write() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [taskIdx, setTaskIdx] = useState(0);
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);
  const [busy, setBusy] = useState(false);

  const task = TASKS[taskIdx].task;
  const provider = activeProvider();
  const words = text.trim().split(/\s+/).filter(Boolean).length;

  const review = useCallback(async () => {
    setBusy(true);
    try {
      const fb = await provider.review(text, task);
      setFeedback(fb);
    } finally {
      setBusy(false);
    }
  }, [provider, task, text]);

  return (
    <Screen
      contentContainerStyle={{
        padding: t.space(4),
        paddingBottom: insets.bottom + t.space(10),
        gap: t.space(4),
      }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Task picker */}
      <View style={[s.row, { gap: t.space(2), flexWrap: 'wrap' }]}>
        {TASKS.map((tk, i) => (
          <Button
            key={i}
            tone={i === taskIdx ? 'primary' : 'ghost'}
            label={tk.name}
            onPress={() => {
              setTaskIdx(i);
              setFeedback(null);
            }}
            style={{ flexGrow: 1, flexBasis: '30%', paddingHorizontal: t.space(2) }}
          />
        ))}
      </View>

      <Card tone="sunken">
        <Label>
          {task.kind === 'essay'
            ? `Essay · min. ${task.minWords} words`
            : `${task.source ? 'E-mail' : 'Letter'} · ${task.register === 'formel' ? 'formal' : 'informal'}${task.source ? ' · no length requirement' : ''}`}
        </Label>
        {task.source ? (
          <Txt variant="label" color={t.c.accent} style={{ marginTop: t.space(1.5) }}>
            {task.source.toUpperCase()}
          </Txt>
        ) : null}
        <Txt variant="body" style={{ marginTop: t.space(2), lineHeight: 23 }}>
          {task.prompt}
        </Txt>
        {task.focus ? (
          <View style={{ marginTop: t.space(3), gap: t.space(1.5) }}>
            <Label>Opgave</Label>
            {task.focus.map((f, i) => (
              <Txt key={i} variant="body" color={t.c.textMuted} style={{ lineHeight: 22 }}>
                • {f}
              </Txt>
            ))}
          </View>
        ) : null}
      </Card>

      {/* Editor */}
      <View>
        <View style={s.rowBetween}>
          <Label>Your text</Label>
          <Txt variant="label" color={words ? t.c.textMuted : t.c.textFaint}>
            {words} WORDS
          </Txt>
        </View>
        <TextInput
          multiline
          value={text}
          onChangeText={(v) => {
            setText(v);
            setFeedback(null);
          }}
          placeholder="Write here…"
          placeholderTextColor={t.c.textFaint}
          textAlignVertical="top"
          style={{
            marginTop: t.space(2),
            minHeight: 200,
            backgroundColor: t.c.surface,
            borderWidth: 1,
            borderColor: t.c.border,
            borderRadius: t.radius.md,
            padding: t.space(3.5),
            color: t.c.text,
            fontSize: 16,
            lineHeight: 24,
          }}
        />
      </View>

      <Button
        label={busy ? 'Checking…' : 'Check my Danish'}
        loading={busy}
        disabled={!text.trim()}
        onPress={review}
      />

      {/* Feedback */}
      {feedback ? (
        <View style={{ gap: t.space(3) }}>
          <Divider />
          <View style={s.rowBetween}>
            <Label>
              {feedback.corrections.length
                ? `${feedback.corrections.length} thing${feedback.corrections.length === 1 ? '' : 's'} to fix`
                : 'Nothing flagged'}
            </Label>
            <Txt variant="label" color={t.c.textFaint}>
              {provider.label.toUpperCase()}
            </Txt>
          </View>

          {feedback.corrections.map((c, i) => (
            <Card key={i}>
              <View style={[s.row, { gap: t.space(2), flexWrap: 'wrap' }]}>
                <Txt
                  variant="body"
                  color={t.c.accent}
                  style={{ textDecorationLine: 'line-through' }}
                >
                  {c.original}
                </Txt>
                <Txt variant="body" color={t.c.textFaint}>
                  →
                </Txt>
                <Txt variant="heading" color={t.c.success}>
                  {c.suggestion}
                </Txt>
              </View>
              <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(2.5) }}>
                {c.explanation}
              </Txt>
              {c.ruleId ? (
                <Button
                  tone="ghost"
                  label={`Rule: ${RULES[c.ruleId].da}`}
                  onPress={() => router.push(`/rule/${c.ruleId}` as never)}
                  style={{ marginTop: t.space(3) }}
                />
              ) : null}
            </Card>
          ))}

          {feedback.notes.map((n, i) => (
            <Card key={`n${i}`} tone="sunken">
              <Txt variant="body" color={t.c.textMuted}>
                {n}
              </Txt>
            </Card>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { changePassword, signOut, useSession } from '../src/auth/session';
import type { Exam } from '../src/grammar/rules';
import { recordReset } from '../src/sync/bus';
import { useLog } from '../src/sync/log';
import { useSyncStatus } from '../src/sync/sync';
import {
  EXAM_DESCRIPTIONS,
  EXAM_LABELS,
  daysUntil,
  formatExamDate,
  shiftIso,
  todayIso,
  useSettings,
  type ThemeMode,
} from '../src/profile/settings';
import { ALL_LEVELS, LEVELS } from '../src/content/levels';
import { DOMAIN_LABELS, LEVEL_DOMAINS, useCurrentLevel, useLevels, type LevelDomain } from '../src/profile/levelStore';
import { ExamDatePicker } from '../src/ui/ExamDatePicker';
import { Button, Card, Label, Txt, s } from '../src/ui/primitives';
import { Screen } from '../src/ui/Screen';
import { useTheme } from '../src/ui/theme';

const EXAMS: Exam[] = ['PD2', 'PD3', 'FVU'];

/** Preset "in N days from today" offsets for first-time date setting. */
const PRESETS: { label: string; days: number }[] = [
  { label: 'In 2 weeks', days: 14 },
  { label: 'In 1 month', days: 30 },
  { label: 'In 6 weeks', days: 42 },
  { label: 'In 3 months', days: 90 },
];

function Chip({ label, onPress }: { label: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderWidth: 1,
        borderColor: t.c.borderStrong,
        borderRadius: t.radius.md,
        paddingHorizontal: t.space(3),
        paddingVertical: t.space(2),
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Txt variant="label" color={t.c.text}>
        {label}
      </Txt>
    </Pressable>
  );
}

/** Who is signed in, whether their progress is uploaded, and the account actions. */
function AccountSection() {
  const t = useTheme();
  const email = useSession((st) => st.email);
  const sync = useSyncStatus();
  const pending = useLog((st) => st.outbox.length);
  const [panel, setPanel] = useState<'none' | 'password' | 'reset'>('none');
  const [password, setPassword] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const status =
    sync.state === 'syncing'
      ? 'Syncing…'
      : pending
        ? `${pending} ${pending === 1 ? 'answer' : 'answers'} waiting to upload${sync.state === 'offline' ? ' — offline, will retry' : ''}`
        : sync.lastSyncedAt
          ? 'All progress saved to your account'
          : sync.state === 'offline'
            ? 'Offline — progress is kept on this device until it can upload'
            : 'Saved to your account';

  return (
    <View style={{ gap: t.space(3) }}>
      <View>
        <Txt variant="display" style={{ fontSize: 26 }}>
          Account
        </Txt>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
          {email}
        </Txt>
        <Label color={pending || sync.state === 'offline' ? t.c.warning : t.c.success}>{status}</Label>
      </View>

      {panel === 'password' ? (
        <Card>
          <Label>New password</Label>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            placeholder="At least 6 characters"
            placeholderTextColor={t.c.textFaint}
            style={{
              marginTop: t.space(1.5),
              backgroundColor: t.c.surface,
              borderWidth: 1,
              borderColor: t.c.border,
              borderRadius: t.radius.md,
              paddingHorizontal: t.space(3.5),
              paddingVertical: t.space(3),
              color: t.c.text,
              fontSize: 16,
            }}
          />
          <View style={[s.row, { gap: t.space(2), marginTop: t.space(3) }]}>
            <Button
              label="Save password"
              loading={busy}
              disabled={password.length < 6}
              style={{ flex: 1 }}
              onPress={async () => {
                setBusy(true);
                const error = await changePassword(password);
                setBusy(false);
                setNote(error ?? 'Password changed.');
                if (!error) {
                  setPassword('');
                  setPanel('none');
                }
              }}
            />
            <Button label="Cancel" tone="ghost" onPress={() => setPanel('none')} />
          </View>
        </Card>
      ) : null}

      {panel === 'reset' ? (
        <Card tone="warning">
          <Label color={t.c.warning}>Start over?</Label>
          <Txt variant="body" style={{ marginTop: t.space(2), lineHeight: 22 }}>
            Every trainer goes back to not started, on all your devices. Your account stays.
          </Txt>
          <View style={[s.row, { gap: t.space(2), marginTop: t.space(3) }]}>
            <Button
              label="Reset all progress"
              style={{ flex: 1 }}
              onPress={() => {
                recordReset('all');
                setPanel('none');
                setNote('Progress reset.');
              }}
            />
            <Button label="Keep it" tone="ghost" onPress={() => setPanel('none')} />
          </View>
        </Card>
      ) : null}

      {note ? (
        <Txt variant="body" color={t.c.textMuted}>
          {note}
        </Txt>
      ) : null}

      {panel === 'none' ? (
        <View style={[s.wrap, { gap: t.space(2) }]}>
          <Chip label="Change password" onPress={() => { setNote(null); setPanel('password'); }} />
          <Chip label="Reset progress" onPress={() => { setNote(null); setPanel('reset'); }} />
          <Chip label="Sign out" onPress={() => void signOut()} />
        </View>
      ) : null}
    </View>
  );
}

/** Pick a trainer's niveau directly: 1 (Begynder) to 5 (PD3). */
function NiveauPicker({ domain }: { domain: LevelDomain }) {
  const t = useTheme();
  const current = useCurrentLevel(domain);
  const setLevel = useLevels((st) => st.setLevel);
  return (
    <View style={{ gap: t.space(2) }}>
      <View style={s.rowBetween}>
        <Txt variant="heading" style={{ fontSize: 15 }}>
          {DOMAIN_LABELS[domain]}
        </Txt>
        <Label>
          {LEVELS[current].name} · {LEVELS[current].cefr}
        </Label>
      </View>
      <View style={[s.row, { gap: t.space(1.5) }]}>
        {ALL_LEVELS.map((level) => {
          const active = level === current;
          return (
            <Pressable
              key={level}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${DOMAIN_LABELS[domain]}: niveau ${level}, ${LEVELS[level].name}`}
              onPress={() => setLevel(domain, level)}
              style={{ flex: 1 }}
            >
              <View
                style={{
                  borderWidth: 1.5,
                  borderColor: active ? t.c.accent : t.c.border,
                  backgroundColor: active ? t.c.accentSoft : t.c.surface,
                  borderRadius: t.radius.md,
                  paddingVertical: t.space(2),
                  alignItems: 'center',
                }}
              >
                <Txt variant="heading" color={active ? t.c.accent : t.c.text} style={{ fontSize: 15 }}>
                  {level}
                </Txt>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/**
 * The exam-target picker.
 *
 * Deliberately not framed as "which mode are you in" — nothing switches off.
 * Picking PD2 does not remove PD3-only rules from the map; it just sorts them
 * to the bottom and de-emphasises them in what the trainer serves next. The
 * screen says this explicitly, because the natural (wrong) assumption is that
 * this is a content filter.
 */
export default function Settings() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const targetExam = useSettings((st) => st.targetExam);
  const setTargetExam = useSettings((st) => st.setTargetExam);
  const examDate = useSettings((st) => st.examDate);
  const setExamDate = useSettings((st) => st.setExamDate);
  const themeMode = useSettings((st) => st.themeMode);
  const setThemeMode = useSettings((st) => st.setThemeMode);

  const THEME_OPTIONS: { mode: ThemeMode; label: string }[] = [
    { mode: 'system', label: 'System' },
    { mode: 'light', label: 'Light' },
    { mode: 'dark', label: 'Dark' },
  ];

  return (
    <Screen
      contentContainerStyle={{
        padding: t.space(4),
        paddingBottom: insets.bottom + t.space(8),
        gap: t.space(4),
      }}
    >
      <AccountSection />

      {/* ── Appearance ───────────────────────────────────────────────── */}
      <View>
        <Txt variant="display" style={{ fontSize: 26 }}>
          Appearance
        </Txt>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
          Light, dark, or follow your device.
        </Txt>
      </View>
      <View style={[s.row, { gap: t.space(2) }]}>
        {THEME_OPTIONS.map((o) => {
          const active = themeMode === o.mode;
          return (
            <Pressable key={o.mode} onPress={() => setThemeMode(o.mode)} style={{ flex: 1 }}>
              <View
                style={{
                  borderWidth: 1.5,
                  borderColor: active ? t.c.accent : t.c.border,
                  backgroundColor: active ? t.c.accentSoft : t.c.surface,
                  borderRadius: t.radius.md,
                  paddingVertical: t.space(3),
                  alignItems: 'center',
                }}
              >
                <Txt variant="heading" color={active ? t.c.accent : t.c.text} style={{ fontSize: 15 }}>
                  {o.label}
                </Txt>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={{ marginTop: t.space(2) }}>
        <Txt variant="display" style={{ fontSize: 26 }}>
          Your exam focus
        </Txt>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
          This does not hide anything. Every rule stays on the map regardless of what you pick —
          this only changes what gets sorted to the top and what the trainer leans toward next.
        </Txt>
      </View>

      <Pressable onPress={() => setTargetExam(null)}>
        <Card tone={targetExam === null ? 'accent' : 'surface'}>
          <View style={s.rowBetween}>
            <View style={{ flex: 1, paddingRight: t.space(3) }}>
              <Txt variant="heading">No focus</Txt>
              <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
                See everything in the order it naturally comes up. The default.
              </Txt>
            </View>
            {targetExam === null ? (
              <Txt variant="title" color={t.c.accent}>
                ✓
              </Txt>
            ) : null}
          </View>
        </Card>
      </Pressable>

      {EXAMS.map((exam) => (
        <Pressable key={exam} onPress={() => setTargetExam(exam)}>
          <Card tone={targetExam === exam ? 'accent' : 'surface'}>
            <View style={s.rowBetween}>
              <View style={{ flex: 1, paddingRight: t.space(3) }}>
                <Label color={targetExam === exam ? t.c.accent : t.c.textFaint}>
                  {EXAM_LABELS[exam]}
                </Label>
                <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
                  {EXAM_DESCRIPTIONS[exam]}
                </Txt>
              </View>
              {targetExam === exam ? (
                <Txt variant="title" color={t.c.accent}>
                  ✓
                </Txt>
              ) : null}
            </View>
          </Card>
        </Pressable>
      ))}

      <Card tone="sunken">
        <Label>What this actually changes</Label>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(2), lineHeight: 22 }}>
          The grammar map sorts rules tagged for your exam to the top. The sætningsskema trainer
          leans toward exercises tagged for your exam when it picks what to serve next — but it
          will still occasionally give you something outside that tag, because a rule you are
          shaky on is still worth practising.
        </Txt>
      </Card>

      {/* ── Niveau per trainer ───────────────────────────────────────── */}
      <View style={{ marginTop: t.space(2) }}>
        <Txt variant="display" style={{ fontSize: 22 }}>
          Your niveau
        </Txt>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
          Each trainer serves exercises up to your niveau there, and moves you up as you prove it.
          Already further along? Set it here. Changing it restarts the climb to the next niveau.
        </Txt>
      </View>
      <Card>
        <View style={{ gap: t.space(4) }}>
          {LEVEL_DOMAINS.map((domain) => (
            <NiveauPicker key={domain} domain={domain} />
          ))}
        </View>
      </Card>

      {/* ── Exam date → paced study plan ─────────────────────────────── */}
      <View style={{ marginTop: t.space(2) }}>
        <Txt variant="display" style={{ fontSize: 22 }}>
          Your exam date
        </Txt>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1) }}>
          Set when you sit the exam and the home screen paces what is still open. This tracks the
          grammar this app teaches — a readiness signal, not a guarantee of passing.
        </Txt>
      </View>

      {examDate ? (
        <Card tone="accent">
          <Label color={t.c.accent}>Exam</Label>
          <Txt variant="title" style={{ marginTop: t.space(1.5) }}>
            {formatExamDate(examDate)}
          </Txt>
          <Txt variant="body" color={t.c.textMuted} style={{ marginTop: 2 }}>
            {(() => {
              const d = daysUntil(examDate);
              if (d < 0) return `${-d} ${-d === 1 ? 'day' : 'days'} ago`;
              if (d === 0) return 'Today';
              return `${d} ${d === 1 ? 'day' : 'days'} away`;
            })()}
          </Txt>
          <View style={{ marginTop: t.space(3) }}>
            <ExamDatePicker value={examDate} onChange={setExamDate} />
          </View>
          <View style={[s.row, { gap: t.space(2), marginTop: t.space(3), flexWrap: 'wrap' }]}>
            <Chip label="−1 week" onPress={() => setExamDate(shiftIso(examDate, -7))} />
            <Chip label="−1 day" onPress={() => setExamDate(shiftIso(examDate, -1))} />
            <Chip label="+1 day" onPress={() => setExamDate(shiftIso(examDate, 1))} />
            <Chip label="+1 week" onPress={() => setExamDate(shiftIso(examDate, 7))} />
          </View>
          <Button
            tone="ghost"
            label="Clear date"
            onPress={() => setExamDate(null)}
            style={{ marginTop: t.space(3) }}
          />
        </Card>
      ) : (
        <Card>
          <Label>No date set</Label>
          <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1.5) }}>
            Pick the day you sit the exam. Not booked yet? Choose roughly when, and fine-tune it
            later.
          </Txt>
          <View style={{ marginTop: t.space(3) }}>
            <ExamDatePicker value={null} onChange={setExamDate} />
          </View>
          <View style={{ marginTop: t.space(4) }}>
            <Label>Or roughly</Label>
          </View>
          <View style={[s.wrap, { gap: t.space(2), marginTop: t.space(2) }]}>
            {PRESETS.map((p) => (
              <Chip
                key={p.days}
                label={p.label}
                onPress={() => setExamDate(shiftIso(todayIso(), p.days))}
              />
            ))}
          </View>
        </Card>
      )}
    </Screen>
  );
}

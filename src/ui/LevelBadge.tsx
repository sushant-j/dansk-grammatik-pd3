import React from 'react';
import { View } from 'react-native';
import { LEVELS, niveauLabel, type Level } from '../content/levels';
import { DOMAIN_LABELS, useLevels, type LevelDomain } from '../profile/levelStore';
import { Button, Card, Label, Txt } from './primitives';
import { useTheme } from './theme';

/**
 * The niveau an exercise sits at: "Niveau 3 · B1". Shown on every exercise
 * card so the learner always knows how hard the thing in front of them is
 * meant to be — and that it is getting harder as they climb.
 */
export function LevelBadge({ level }: { level: Level }) {
  const t = useTheme();
  return (
    <View
      accessibilityLabel={`${niveauLabel(level)}, ${LEVELS[level].name}`}
      style={{
        borderWidth: 1,
        borderColor: t.c.borderStrong,
        borderRadius: t.radius.sm,
        paddingHorizontal: t.space(2),
        paddingVertical: t.space(0.5),
      }}
    >
      <Label color={t.c.text}>{niveauLabel(level)}</Label>
    </View>
  );
}

/**
 * Shown once, at the top of a trainer, right after an answer unlocks the next
 * niveau in that domain. Dismissing it is the acknowledgement; it never
 * blocks the exercise underneath.
 */
export function LevelUpNotice({ domain }: { domain: LevelDomain }) {
  const t = useTheme();
  const unlocked = useLevels((s) => s.justUnlocked);
  const dismiss = useLevels((s) => s.dismissUnlock);
  if (!unlocked || unlocked.domain !== domain) return null;

  const info = LEVELS[unlocked.level];
  return (
    <Card tone="success">
      <Label color={t.c.success}>Niveau {unlocked.level} låst op</Label>
      <Txt variant="body" style={{ marginTop: t.space(2), lineHeight: 22 }}>
        {DOMAIN_LABELS[domain]} now serves {info.name} material ({info.cefr}
        {info.exam ? `, ${info.exam}` : ''}), mixed with review from the niveaus below.
      </Txt>
      <Button label="Fortsæt" tone="ghost" onPress={dismiss} style={{ marginTop: t.space(3) }} />
    </Card>
  );
}

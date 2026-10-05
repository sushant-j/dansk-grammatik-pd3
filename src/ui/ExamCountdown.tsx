import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable } from 'react-native';
import type { Exam } from '../grammar/rules';
import { formatExamDate } from '../profile/settings';
import type { Readiness, StudyPlan } from '../profile/studyplan';
import type { Theme } from '../theme';
import { Button, Card, Txt } from './primitives';
import { useTheme } from './theme';

/** Size of the day count — the one number Today leads with. */
const HERO = 76;

/**
 * The exam countdown at the top of Today: a big day count, how the pace
 * looks, and the plan's one-line advice. Tapping it opens Settings to change
 * the date. With no date yet it asks for one instead.
 */
export function ExamCountdown({
  plan,
  examDate,
  targetExam,
}: {
  plan: StudyPlan;
  examDate: string | null;
  targetExam: Exam | null;
}) {
  const t = useTheme();
  const router = useRouter();
  const openSettings = () => router.push('/settings');

  if (plan.readiness === 'no-date' || !examDate) {
    return (
      <Card tone="accent" style={{ padding: t.space(5) }}>
        <Txt variant="title">
          {targetExam ? `When is your ${targetExam} exam?` : 'When is your exam?'}
        </Txt>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1.5), maxWidth: 560 }}>
          Add the date and Today will count down to it and tell you what pace to keep.
        </Txt>
        <Button label="Set exam date" onPress={openSettings} style={{ marginTop: t.space(5) }} />
      </Card>
    );
  }

  const name = targetExam ?? 'your exam';
  const date = formatExamDate(examDate);
  const days = plan.daysLeft;
  const past = plan.readiness === 'past';
  const caption = past
    ? `${capitalise(name)} date has passed`
    : days === 0
      ? `${targetExam ?? 'Your'} exam day`
      : `${days === 1 ? 'day' : 'days'} until ${name}`;
  const status = readinessLabel(plan.readiness);
  const spoken = past ? caption : days === 0 ? `Today is ${caption}` : `${days} ${caption}`;

  return (
    <Pressable
      onPress={openSettings}
      accessibilityRole="button"
      accessibilityLabel={`${spoken}, ${date}. ${status ? `${status}. ` : ''}Change exam date`}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <Card tone="accent" style={{ padding: t.space(5) }}>
        {past ? (
          <Txt variant="title">{caption}</Txt>
        ) : (
          <>
            <Txt
              variant="display"
              color={t.c.accent}
              style={{ fontSize: HERO, lineHeight: Math.round(HERO * 1.05), letterSpacing: -2.5 }}
            >
              {days === 0 ? 'Today' : days}
            </Txt>
            <Txt variant="heading">{caption}</Txt>
          </>
        )}
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: 2 }}>
          {date}
        </Txt>
        {status ? (
          <Txt variant="heading" color={readinessColor(plan.readiness, t)} style={{ marginTop: t.space(4) }}>
            {status}
          </Txt>
        ) : null}
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(1), maxWidth: 560 }}>
          {plan.message}
        </Txt>
      </Card>
    </Pressable>
  );
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function readinessLabel(r: Readiness): string {
  switch (r) {
    case 'ready':
      return 'Ready';
    case 'on-track':
      return 'On track';
    case 'tight':
      return 'Tight, but doable';
    case 'behind':
      return 'Behind pace';
    default:
      return '';
  }
}

function readinessColor(r: Readiness, t: Theme): string {
  switch (r) {
    case 'ready':
    case 'on-track':
      return t.c.success;
    case 'tight':
      return t.c.warning;
    case 'behind':
      return t.c.accent;
    default:
      return t.c.textFaint;
  }
}

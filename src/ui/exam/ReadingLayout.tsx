import React from 'react';
import { ScrollView, useWindowDimensions, View, type ViewStyle } from 'react-native';
import { Segmented } from '../Segmented';
import { useTheme } from '../theme';

/** At this width there is room for the text and the questions side by side, as on an exam desk. */
export const SPLIT_MIN_WIDTH = 768;
const MAX_WIDTH = 1400;

export type Pane = 'text' | 'questions';

export function useIsWide(): boolean {
  return useWindowDimensions().width >= SPLIT_MIN_WIDTH;
}

/**
 * The reading desk: the passage on the left, the questions on the right, each
 * scrolling on its own so looking something up never loses your place in the
 * other. On a phone there is room for one at a time, so a Tekst | Opgaver
 * switch flips between them — both stay mounted, so neither forgets its
 * scroll position or a half-typed answer.
 */
export function ReadingLayout({
  top,
  passage,
  questions,
  passageRef,
  questionsRef,
  pane,
  onPaneChange,
  questionsBadge,
  cover,
}: {
  /** Sticky bar above both panes: title, timer, submit. */
  top: React.ReactNode;
  passage: React.ReactNode;
  questions: React.ReactNode;
  passageRef?: React.RefObject<ScrollView | null>;
  questionsRef?: React.RefObject<ScrollView | null>;
  /** Phone only: which pane is showing. */
  pane: Pane;
  onPaneChange: (p: Pane) => void;
  /** e.g. "7/15", shown on the Opgaver switch. */
  questionsBadge?: string;
  /**
   * Shown in place of both panes (e.g. while the exam is paused). The panes
   * stay mounted underneath, so scroll positions survive.
   */
  cover?: React.ReactNode;
}) {
  const t = useTheme();
  const wide = useIsWide();

  const paneContent: ViewStyle = { padding: t.space(wide ? 6 : 4), paddingBottom: t.space(16) };

  const passagePane = (
    <ScrollView
      ref={passageRef}
      style={{ flex: wide ? 1.35 : 1, display: wide || pane === 'text' ? 'flex' : 'none' }}
      contentContainerStyle={[paneContent, { maxWidth: 760, width: '100%', alignSelf: 'center' }]}
    >
      {passage}
    </ScrollView>
  );

  const questionsPane = (
    <ScrollView
      ref={questionsRef}
      keyboardShouldPersistTaps="handled"
      style={{
        flex: 1,
        display: wide || pane === 'questions' ? 'flex' : 'none',
        backgroundColor: wide ? t.c.surfaceSunken : t.c.bg,
      }}
      contentContainerStyle={paneContent}
    >
      {questions}
    </ScrollView>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg }}>
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: t.c.border,
          paddingHorizontal: t.space(4),
          paddingVertical: t.space(2.5),
          gap: t.space(2.5),
        }}
      >
        <View style={{ width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' }}>{top}</View>
        {wide || cover ? null : (
          <Segmented
            compact
            options={[
              { key: 'text', label: 'Tekst' },
              { key: 'questions', label: 'Opgaver', badge: questionsBadge },
            ]}
            value={pane}
            onChange={onPaneChange}
          />
        )}
      </View>
      {cover ? <View style={{ flex: 1 }}>{cover}</View> : null}
      <View
        style={{
          flex: 1,
          display: cover ? 'none' : 'flex',
          flexDirection: wide ? 'row' : 'column',
          width: '100%',
          maxWidth: MAX_WIDTH,
          alignSelf: 'center',
        }}
      >
        {passagePane}
        {wide ? <View style={{ width: 1, backgroundColor: t.c.border }} /> : null}
        {questionsPane}
      </View>
    </View>
  );
}

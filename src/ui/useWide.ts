import { useCallback, useState } from 'react';
import { Dimensions, type LayoutChangeEvent } from 'react-native';
import { resolveAnswerMode, useSettings } from '../profile/settings';

/**
 * Width at which an exercise spreads out sideways: the schema board as the
 * textbook's columns, a question beside its feedback. Below it, everything
 * stacks as on a phone.
 *
 * Measured on the exercise's own container, not the window, because the
 * rules pane takes 380px of a wide window and a narrow desktop window is
 * just a tall phone. Until the first layout, the window gives a guess, so a
 * desktop doesn't open on the phone layout (or tap mode) for a frame.
 */
export const WIDE_MIN = 860;

function guessWidth(): number {
  const w = Dimensions.get('window').width;
  return w >= 1100 ? Math.min(w - 380, 1400) - 32 : w - 32;
}

export function useWide(min = WIDE_MIN): { wide: boolean; onLayout: (e: LayoutChangeEvent) => void } {
  const [width, setWidth] = useState(guessWidth);
  const onLayout = useCallback((e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width), []);
  return { wide: width >= min, onLayout };
}

/**
 * Tap or type for an exercise with this layout, and a switch to the other
 * one. The switch pins an explicit preference, the same one Settings sets.
 */
export function useAnswerMode(wide: boolean): { mode: 'tap' | 'type'; switchMode: () => void } {
  const pref = useSettings((st) => st.answerMode);
  const setAnswerMode = useSettings((st) => st.setAnswerMode);
  const mode = resolveAnswerMode(pref, wide);
  const switchMode = useCallback(() => setAnswerMode(mode === 'tap' ? 'type' : 'tap'), [mode, setAnswerMode]);
  return { mode, switchMode };
}

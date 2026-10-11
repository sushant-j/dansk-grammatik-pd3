import React from 'react';
import { Pressable } from 'react-native';
import { Txt } from './primitives';
import { useTheme } from './theme';

/** "Tap instead" / "Type instead": flips how exercises are answered, from now on (also in Settings). */
export function ModeSwitch({ mode, onSwitch }: { mode: 'tap' | 'type'; onSwitch: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onSwitch} accessibilityRole="button" hitSlop={8} style={{ alignSelf: 'flex-start' }}>
      <Txt variant="label" color={t.c.textMuted} style={{ textDecorationLine: 'underline' }}>
        {mode === 'tap' ? 'Type the answer instead' : 'Tap to answer instead'}
      </Txt>
    </Pressable>
  );
}

import React, { useEffect } from 'react';
import { Platform, Pressable, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Txt, s } from './primitives';
import { useTheme } from './theme';

/** How long a snackbar stays up: long enough to read it and reach Undo. */
const SHOW_MS = 4000;

/**
 * A short confirmation along the bottom of the screen, with one optional
 * action (Undo). It sits over the content and goes away by itself. Place it
 * last inside a screen-filling View (anywhere, on the web).
 */
export function Snackbar({
  message,
  action,
  onAction,
  onHide,
}: {
  /** Nothing is shown while this is null. A new message restarts the timer. */
  message: string | null;
  action?: string;
  onAction?: () => void;
  onHide: () => void;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!message) return;
    const id = setTimeout(onHide, SHOW_MS);
    return () => clearTimeout(id);
  }, [message, onHide]);

  if (!message) return null;
  return (
    <View
      pointerEvents="box-none"
      style={{
        // On the web, fixed to the window, so it shows wherever it is placed (e.g. inside a scrolling pane).
        position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as ViewStyle['position'],
        left: 0,
        right: 0,
        bottom: insets.bottom + t.space(4),
        alignItems: 'center',
        paddingHorizontal: t.space(4),
        zIndex: 30,
      }}
    >
      <View
        accessibilityRole="alert"
        style={[
          s.row,
          {
            gap: t.space(4),
            maxWidth: 480,
            width: '100%',
            paddingHorizontal: t.space(4),
            paddingVertical: t.space(3),
            borderRadius: t.radius.md,
            backgroundColor: t.c.text,
            shadowColor: '#000',
            shadowOpacity: 0.18,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 3 },
            elevation: 4,
          },
        ]}
      >
        <Txt variant="body" color={t.c.bg} style={{ flex: 1, fontSize: 15 }}>
          {message}
        </Txt>
        {action && onAction ? (
          <Pressable
            onPress={() => {
              onAction();
              onHide();
            }}
            accessibilityRole="button"
            hitSlop={8}
          >
            <Txt variant="chip" color={t.c.accentSoft} style={{ fontSize: 15, fontWeight: '700' }}>
              {action}
            </Txt>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

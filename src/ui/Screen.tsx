import React from 'react';
import { ScrollView, View, type ScrollViewProps, type ViewStyle } from 'react-native';
import { useTheme } from './theme';

/**
 * Constrains a screen's content to a comfortable reading width on wide
 * viewports, while doing nothing at all on a phone.
 *
 * Every screen so far was built and tested at phone width, where full-bleed
 * content is correct. Opened in a desktop browser at 1400px, the same layout
 * stretches the schema board and text into an unreadable single line across
 * the window — a phone layout scaled up is not a web app. `maxWidth` plus
 * `alignSelf: 'center'` is a no-op below the cap and simply centers a
 * fixed-width column above it, so this needs no viewport detection: it is
 * correct at 375px and at 1440px from the same numbers.
 */
const MAX_WIDTH = 760;

export function Screen({
  children,
  style,
  contentContainerStyle,
  ...rest
}: ScrollViewProps) {
  const t = useTheme();
  return (
    <ScrollView
      style={[{ flex: 1, backgroundColor: t.c.bg }, style]}
      contentContainerStyle={[
        { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' } as ViewStyle,
        contentContainerStyle,
      ]}
      {...rest}
    >
      {children}
    </ScrollView>
  );
}

/** Same width constraint for non-scrolling screens (e.g. a FlatList screen). */
export function ScreenColumn({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[{ width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', flex: 1 }, style]}>
      {children}
    </View>
  );
}

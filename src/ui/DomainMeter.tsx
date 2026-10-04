import React from 'react';
import { View } from 'react-native';
import type { DomainReview } from '../profile/overview';
import type { Theme } from '../theme';
import { StrengthBar, Txt, s } from './primitives';
import { useTheme } from './theme';

/** Status words for a trainer, shared by the Practise and Progress tabs. */
export function domainStatus(d: DomainReview, t: Theme): { text: string; color: string } {
  if (!d.started) return { text: 'Not started', color: t.c.textFaint };
  if (d.attention > 0) return { text: `${d.attention} to review`, color: t.c.warning };
  return { text: 'All solid', color: t.c.success };
}

/** Solid-out-of-total bar for one trainer. */
export function DomainMeter({ d }: { d: DomainReview }) {
  const t = useTheme();
  const frac = d.total ? d.solid / d.total : 0;
  const color = frac >= 0.7 ? t.c.success : frac >= 0.4 ? t.c.warning : t.c.accent;
  return (
    <View style={[s.row, { gap: t.space(3) }]}>
      <View style={{ flex: 1 }}>
        <StrengthBar value={d.started ? frac : 0} color={color} />
      </View>
      <Txt variant="label" color={t.c.textFaint}>
        {d.solid}/{d.total} solid
      </Txt>
    </View>
  );
}

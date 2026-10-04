import React from 'react';
import { Text, View, type TextStyle } from 'react-native';
import type { Block, Inline } from '../../content/exams/types';
import { Txt, withFont } from '../primitives';
import { useTheme } from '../theme';

/**
 * A reading text, rendered for reading: generous line height, a measure that
 * stays comfortable however wide the pane is, and the booklet's own headings,
 * lists, tables and small print. Gaps are drawn by the caller, so the same
 * text works for cloze gaps (inline), removed paragraphs (block) and review.
 */
export function PassageBlocks({
  blocks,
  renderGap,
  renderBlockGap,
}: {
  blocks: Block[];
  /** An inline gap; must render Text (it sits inside a paragraph). */
  renderGap?: (n: number) => React.ReactNode;
  renderBlockGap?: (n: number) => React.ReactNode;
}) {
  const t = useTheme();
  const body = withFont([t.font.body as TextStyle, { color: t.c.text, fontSize: 17, lineHeight: 28 }]);

  const inline = (r: Inline, i: number) => {
    if (typeof r === 'string') return r;
    if ('gap' in r) return <React.Fragment key={i}>{renderGap ? renderGap(r.gap) : ' ____ '}</React.Fragment>;
    if ('em' in r)
      return (
        <Text key={i} style={withFont({ fontStyle: 'italic' })}>
          {r.em}
        </Text>
      );
    return (
      <Text key={i} style={withFont({ fontWeight: '700' })}>
        {r.strong}
      </Text>
    );
  };

  return (
    <View style={{ gap: t.space(3.5) }}>
      {blocks.map((b, i) => {
        switch (b.t) {
          case 'h':
            return (
              <Txt
                key={i}
                variant="heading"
                style={
                  b.level === 3
                    ? { fontSize: 16, lineHeight: 22, marginTop: i ? t.space(1) : 0, marginBottom: -t.space(2) }
                    : { fontSize: 19, lineHeight: 25, marginTop: i ? t.space(3) : 0 }
                }
              >
                {b.text}
              </Txt>
            );
          case 'p':
            return (
              <Text key={i} style={body}>
                {b.runs.map(inline)}
              </Text>
            );
          case 'list':
            return (
              <View key={i} style={{ gap: t.space(1.5) }}>
                {b.items.map((it, j) => (
                  <View key={j} style={{ flexDirection: 'row', gap: t.space(2) }}>
                    <Text style={body}>•</Text>
                    <Text style={[body, { flex: 1 }]}>{it}</Text>
                  </View>
                ))}
              </View>
            );
          case 'table':
            return (
              <View
                key={i}
                style={{ borderWidth: 1, borderColor: t.c.border, borderRadius: t.radius.sm, overflow: 'hidden' }}
              >
                {b.rows.map((row, j) => (
                  <View
                    key={j}
                    style={{
                      flexDirection: 'row',
                      borderTopWidth: j ? 1 : 0,
                      borderTopColor: t.c.border,
                      backgroundColor: b.header && j === 0 ? t.c.surfaceSunken : 'transparent',
                    }}
                  >
                    {row.map((cell, k) => (
                      <Text
                        key={k}
                        style={[
                          body,
                          {
                            flex: 1,
                            fontSize: 15,
                            lineHeight: 22,
                            paddingHorizontal: t.space(2),
                            paddingVertical: t.space(1.5),
                          },
                          b.header && j === 0 ? withFont({ fontWeight: '700' }) : null,
                        ]}
                      >
                        {cell}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            );
          case 'small':
            return (
              <Txt key={i} variant="body" color={t.c.textMuted} style={{ fontSize: 14, lineHeight: 21 }}>
                {b.text}
              </Txt>
            );
          case 'gap':
            return <React.Fragment key={i}>{renderBlockGap ? renderBlockGap(b.n) : null}</React.Fragment>;
        }
      })}
    </View>
  );
}

/** The article's title above its blocks. */
export function PassageTitle({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <Txt variant="title" style={{ fontSize: 24, lineHeight: 30, marginBottom: t.space(3) }}>
      {children}
    </Txt>
  );
}

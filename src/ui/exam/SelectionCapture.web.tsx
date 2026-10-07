import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Pressable, View, type ViewStyle } from 'react-native';
import { isPickable, sentenceAt, tidy } from '../../vocabSets/match';
import { removeItem } from '../../vocabSets/store';
import type { SetItem, SetSource } from '../../vocabSets/types';
import { Txt } from '../primitives';
import { Snackbar } from '../Snackbar';
import { useTheme } from '../theme';
import { AddToSetSheet, type Picked } from '../vocab/AddToSetSheet';

/** Marks an inline element (a cloze gap) so it reads as "…" in a picked-out sentence. */
export const GAP_MARK = { dataSet: { gap: 'true' } };

/**
 * Select a word or phrase in the text and an "Add to set" pill appears just
 * above it (below it on a touch screen, where the system's own callout sits
 * above); the pill opens the sheet that files it into a vocabulary set,
 * together with the sentence it came from. The browser's own selection and
 * right-click menu are left alone, so copying still works as usual.
 *
 * The pill and the snackbar are portalled to the document body: the passage
 * is inside a ScrollView, which react-native-web gives a transform, and a
 * transform turns `position: fixed` into "fixed to the ScrollView".
 */
export function SelectionCapture({ source, children }: { source: SetSource; children: React.ReactNode }) {
  const t = useTheme();
  const box = useRef<View>(null);
  const pillRef = useRef<View>(null);
  const [pill, setPill] = useState<{ x: number; y: number; below: boolean; picked: Picked; ok: boolean } | null>(null);
  const [sheet, setSheet] = useState<Picked | null>(null);
  const [toast, setToast] = useState<{ message: string; item: SetItem } | null>(null);

  useEffect(() => {
    const container = box.current as unknown as HTMLElement | null;
    if (!container) return;
    const inPill = (n: EventTarget | null) => !!n && ((pillRef.current as unknown as HTMLElement | null)?.contains(n as Node) ?? false);

    const touch = window.matchMedia?.('(pointer: coarse)').matches ?? false;

    /**
     * Show the pill for the current selection. `hideIfNone`: a mouse or key
     * selection that ends empty, or outside the text, takes the pill away;
     * the touch and selectionchange paths only ever show or move it, so the
     * selection collapsing as the pill is tapped can't unmount it first.
     */
    const read = (hideIfNone: boolean) => {
      const none = () => {
        if (hideIfNone) setPill(null);
      };
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) return none();
      const range = sel.getRangeAt(0);
      if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) return none();
      const raw = sel.toString();
      const text = tidy(raw);
      if (!text) return none();
      const rect = range.getBoundingClientRect();
      setPill({
        x: rect.left + rect.width / 2,
        y: touch ? rect.bottom : rect.top,
        below: touch,
        picked: { text, context: sentenceAround(range, raw), source },
        ok: isPickable(text),
      });
    };
    const onUp = (e: Event) => {
      if (!inPill(e.target)) read(true);
    };
    let settle: ReturnType<typeof setTimeout> | null = null;
    // Long-press and handle-drag on a phone don't reliably end in a mouseup.
    const onSelectionChange = () => {
      if (settle) clearTimeout(settle);
      settle = setTimeout(() => read(false), 250);
    };
    const onTouchEnd = (e: Event) => {
      if (!inPill(e.target)) setTimeout(() => read(false), 0);
    };
    const dismiss = (e: Event) => {
      if (!inPill(e.target)) setPill(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPill(null);
      else if (!inPill(e.target)) read(true);
    };

    document.addEventListener('mouseup', onUp);
    document.addEventListener('keyup', onKey);
    document.addEventListener('touchend', onTouchEnd);
    document.addEventListener('selectionchange', onSelectionChange);
    document.addEventListener('mousedown', dismiss);
    // Any scroll moves the text away from the pill; the selection is still there to come back to.
    document.addEventListener('scroll', dismiss, true);
    return () => {
      if (settle) clearTimeout(settle);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('keyup', onKey);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('selectionchange', onSelectionChange);
      document.removeEventListener('mousedown', dismiss);
      document.removeEventListener('scroll', dismiss, true);
    };
  }, [source]);

  const open = () => {
    if (!pill?.ok) return;
    setSheet(pill.picked);
    setPill(null);
  };

  const hideToast = useCallback(() => setToast(null), []);

  const pillView = pill ? (
    <View
      ref={pillRef}
      style={
        {
          position: 'fixed',
          left: pill.x,
          top: pill.below ? pill.y + 10 : Math.max(8, pill.y - 8),
          transform: [{ translateX: '-50%' }, { translateY: pill.below ? '0%' : '-100%' }],
          zIndex: 20,
        } as unknown as ViewStyle
      }
    >
      <Pressable
        onPress={open}
        disabled={!pill.ok}
        accessibilityRole="button"
        accessibilityLabel={pill.ok ? `Add “${pill.picked.text}” to a vocabulary set` : undefined}
        style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
          paddingHorizontal: t.space(3.5),
          paddingVertical: t.space(2),
          borderRadius: 999,
          backgroundColor: pill.ok ? t.c.accent : t.c.surface,
          opacity: pill.ok && (pressed || hovered) ? 0.85 : 1,
          borderWidth: pill.ok ? 0 : 1,
          borderColor: t.c.borderStrong,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
        })}
      >
        <Txt variant="chip" color={pill.ok ? '#fff' : t.c.textMuted} style={{ fontSize: 14, fontWeight: '700' }}>
          {pill.ok ? '＋ Add to set' : 'Select a shorter phrase'}
        </Txt>
      </Pressable>
    </View>
  ) : null;

  return (
    <View ref={box}>
      {children}
      {pillView ? createPortal(pillView, document.body) : null}
      <AddToSetSheet
        visible={!!sheet}
        picked={sheet}
        onClose={() => {
          setSheet(null);
          window.getSelection()?.removeAllRanges();
        }}
        onSaved={(item, setName) => setToast({ message: `Added “${item.text}” to ${setName}`, item })}
      />
      {createPortal(
        <Snackbar message={toast?.message ?? null} action="Undo" onAction={() => toast && removeItem(toast.item.id)} onHide={hideToast} />,
        document.body,
      )}
    </View>
  );
}

/**
 * The sentence a selection sits in, from the paragraph (or list item, or
 * table cell) that holds it. Cloze gaps read as "…", since the chip shows
 * the learner's own choice, not the text.
 */
function sentenceAround(range: Range, selected: string): string | null {
  const start = range.startContainer;
  const block = (start.nodeType === Node.TEXT_NODE ? start.parentElement : (start as Element))?.closest('div');
  if (!block) return null;

  let text = '';
  let at = -1;
  const walk = (n: Node) => {
    if (n instanceof HTMLElement && n.dataset.gap) {
      if (n.contains(start)) at = text.length;
      text += ' … ';
      return;
    }
    if (n.nodeType === Node.TEXT_NODE) {
      if (n === start) at = text.length + range.startOffset;
      text += n.nodeValue ?? '';
      return;
    }
    n.childNodes.forEach(walk);
  };
  walk(block);
  if (at < 0) at = Math.max(0, text.toLowerCase().indexOf(selected.trim().toLowerCase()));

  return sentenceAt(text, at, selected.length);
}

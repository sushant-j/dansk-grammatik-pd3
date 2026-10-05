import React, { useEffect, useState } from 'react';
import { isPlausibleExamIso, pickerMinIso } from '../profile/settings';
import { useTheme } from './theme';

/**
 * Web: the browser's own date input, which already speaks 'YYYY-MM-DD' — so
 * no Date conversion at all. react-native-web renders plain DOM elements in
 * .web files, so this is styled with the theme tokens as CSS directly.
 * `colorScheme` makes the calendar popup and its icon follow the app's
 * light/dark choice rather than the OS.
 */
export function ExamDatePicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (iso: string) => void;
}) {
  const t = useTheme();
  const min = pickerMinIso(value);
  // The field shows a local draft so half-typed years ("0002-06-01") are not
  // snapped back mid-keystroke; only plausible whole dates reach the store.
  // A change from outside (a preset chip, ±1 day) replaces the draft.
  const [draft, setDraft] = useState(value ?? '');
  useEffect(() => setDraft(value ?? ''), [value]);
  return (
    <input
      type="date"
      aria-label="Exam date"
      min={min}
      value={draft}
      onChange={(e) => {
        const iso = e.currentTarget.value;
        setDraft(iso);
        if (isPlausibleExamIso(iso, min)) onChange(iso);
      }}
      style={{
        colorScheme: t.mode,
        boxSizing: 'border-box',
        width: '100%',
        fontFamily: t.fontFamily.semibold,
        fontSize: t.font.body.fontSize,
        color: t.c.text,
        backgroundColor: t.c.surface,
        border: `1px solid ${t.c.borderStrong}`,
        borderRadius: t.radius.md,
        padding: `${t.space(3)}px ${t.space(3.5)}px`,
        accentColor: t.c.accent,
        outlineColor: t.c.accent,
      }}
    />
  );
}

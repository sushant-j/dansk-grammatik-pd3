import React from 'react';
import type { SetSource } from '../../vocabSets/types';

/**
 * Picking a word out of a reading text to add to a vocabulary set. Web only
 * for now (SelectionCapture.web.tsx): React Native text has no selection
 * events and no way to add to the system's selection menu, so on a phone the
 * text is shown as it is, and words are added from the set's own screen.
 */
export function SelectionCapture({ children }: { source: SetSource; children: React.ReactNode }) {
  return <>{children}</>;
}

/** Marks an inline element (a cloze gap) so it reads as "…" in a picked-out sentence. Web only. */
export const GAP_MARK = {};

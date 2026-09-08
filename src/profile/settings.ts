/**
 * The learner's target exam — a lightweight preference, not a mastery
 * domain of its own.
 *
 * Setting it never hides anything: every rule, rule card, and exercise stays
 * fully visible and practiceable regardless of level, matching the app's
 * refusal everywhere else to make content disappear on you (a decayed rule
 * "needs a refresh", it doesn't vanish from the map). What this preference
 * changes is emphasis — the grammar map sorts exam-relevant rules first, and
 * the schema trainer leans toward exercises tagged for that exam when
 * choosing what to serve next. `null` means no preference, and is the
 * default: existing behaviour for anyone who never opens this screen.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Exam } from '../grammar/rules';

interface SettingsState {
  targetExam: Exam | null;
  hydrated: boolean;
  setTargetExam: (exam: Exam | null) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      targetExam: null,
      hydrated: false,
      setTargetExam: (exam) => set({ targetExam: exam }),
    }),
    {
      name: 'skema-settings-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ targetExam: s.targetExam }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

export const EXAM_LABELS: Record<Exam, string> = {
  PD1: 'PD1',
  PD2: 'PD2',
  PD3: 'PD3',
  FVU: 'FVU',
};

export const EXAM_DESCRIPTIONS: Record<Exam, string> = {
  PD1: 'A1 — beginning literacy and everyday phrases.',
  PD2: 'A2–B1 — everyday and workplace Danish.',
  PD3: 'B1–B2 — the level this app was originally built around: argumentative writing, complex sentences.',
  FVU: 'Adult basic education — literacy for adults, including native speakers. Your main practice here is the Stavning (spelling) trainer; on the word-order map only the two most basic sentence rules are tagged FVU.',
};

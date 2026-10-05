import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import React from 'react';
import { Platform, View } from 'react-native';
import { dateFromIso, formatExamDate, isoFromDate, pickerMinIso } from '../profile/settings';
import { Button, Label } from './primitives';
import { useTheme } from './theme';

/**
 * Pick the exam day. iOS shows the system's compact date button inline;
 * Android opens the system calendar dialog from a button (the library's own
 * advice: the imperative dialog is more reliable there than a mounted
 * component). Web has its own file using the browser's date input.
 *
 * Dates cross the boundary as local 'YYYY-MM-DD' only — never via
 * toISOString, which would shift the day for anyone not on UTC.
 */
export function ExamDatePicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (iso: string) => void;
}) {
  const t = useTheme();
  const min = dateFromIso(pickerMinIso(value));
  const current = value ? dateFromIso(value) : min;

  if (Platform.OS === 'android') {
    return (
      <Button
        tone={value ? 'ghost' : 'primary'}
        label={value ? `Change date · ${formatExamDate(value)}` : 'Choose a date'}
        onPress={() =>
          DateTimePickerAndroid.open({
            value: current,
            mode: 'date',
            minimumDate: min,
            onValueChange: (_e, date) => onChange(isoFromDate(date)),
          })
        }
      />
    );
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Label>{value ? 'Exam day' : 'Choose a date'}</Label>
      <DateTimePicker
        value={current}
        mode="date"
        display="compact"
        minimumDate={min}
        themeVariant={t.mode}
        accentColor={t.c.accent}
        onValueChange={(_e, date) => onChange(isoFromDate(date))}
      />
    </View>
  );
}

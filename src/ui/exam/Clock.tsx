import { useEffect, useState } from 'react';
import { Txt } from '../primitives';
import { useTheme } from '../theme';

/** The current time, re-rendering every `ms` while `active`. */
export function useNow(active: boolean, ms = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [active, ms]);
  return now;
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function formatDuration(ms: number): string {
  const min = Math.round(ms / 60_000);
  return min < 1 ? 'under a minute' : `${min} min`;
}

/** Time left, turning to the warning colour in the last five minutes. */
export function Countdown({ remaining }: { remaining: number }) {
  const t = useTheme();
  const low = remaining < 5 * 60_000;
  return (
    <Txt
      variant="title"
      color={low ? t.c.warning : t.c.text}
      style={{ fontSize: 20, lineHeight: 24, fontVariant: ['tabular-nums'] }}
    >
      {formatClock(remaining)}
    </Txt>
  );
}

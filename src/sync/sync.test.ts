import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, describe, expect, it } from 'vitest';
import { useLevels } from '../profile/levelStore';
import { useNounProfile } from '../profile/nounStore';
import { useSettings } from '../profile/settings';
import { fakeRemote, type FakeRemote } from '../test/fakeRemote';
import { baselinesToUpload, legacyImportedBy, readLegacy } from './legacy';
import { derive, recordAnswerEvent, switchUser, useLog } from './log';
import { pullAll, pushOutbox, startSync, stopSync, syncNow } from './sync';
import type { AnswerEvent, Baseline } from './types';

const USER = 'user-1';
const T0 = Date.parse('2026-03-02T10:00:00Z');

const nounAnswer = (ok: boolean, at: number) =>
  recordAnswerEvent({ domain: 'nouns', itemId: 'n-bil', level: 1, outcomes: { 'en-et-gender': ok }, correct: ok }, at);

/** A second device: same account, nothing saved locally yet. */
async function freshDevice(userId = USER) {
  stopSync();
  await AsyncStorage.removeItem(`skema-log-${userId}`);
  await switchUser(null);
  await switchUser(userId);
}

let remote: FakeRemote;

beforeEach(async () => {
  await AsyncStorage.clear();
  stopSync();
  remote = fakeRemote();
  await switchUser(null);
  await switchUser(USER);
});

describe('recording', () => {
  it('records locally first and publishes to the trainer store at once', () => {
    nounAnswer(true, T0);
    // The answer, preceded by the domain's starting niveau.
    expect(useLog.getState().outbox).toHaveLength(2);
    expect(useNounProfile.getState().stats['en-et-gender'].attempts).toBe(1);
  });

  it('records nothing while signed out', async () => {
    await switchUser(null);
    nounAnswer(true, T0);
    expect(useLog.getState().events).toHaveLength(0);
  });
});

describe('uploading', () => {
  it('empties the outbox, and uploading twice never duplicates', async () => {
    nounAnswer(true, T0);
    nounAnswer(false, T0 + 1000);
    await pushOutbox(remote);
    expect(useLog.getState().outbox).toEqual([]);

    // A retry after a lost response re-sends the same ids.
    useLog.setState((s) => ({ outbox: s.events.map((e) => e.id) }));
    await pushOutbox(remote);
    expect(remote.rows).toHaveLength(3);
  });

  it('keeps everything queued while offline, and sends it once back online', async () => {
    await startSync(remote);
    remote.failNext(10);
    nounAnswer(true, T0);
    await syncNow();
    expect(useLog.getState().outbox).toHaveLength(2);
    expect(remote.rows).toHaveLength(0);

    remote.failNext(0);
    await syncNow();
    expect(useLog.getState().outbox).toEqual([]);
    expect(remote.rows).toHaveLength(2);
  });
});

describe('two devices', () => {
  it('a second device shows exactly the same progress', async () => {
    for (let i = 0; i < 7; i++) nounAnswer(i % 3 !== 0, T0 + i * 1000);
    await pushOutbox(remote);
    const onFirst = derive();

    await freshDevice();
    expect(useNounProfile.getState().stats['en-et-gender'].attempts).toBe(0);
    await pullAll(remote);
    expect(derive()).toEqual(onFirst);
    expect(useNounProfile.getState().stats['en-et-gender'].attempts).toBe(7);
  });

  it('answers made on both devices at once are all kept', async () => {
    nounAnswer(true, T0);
    await pushOutbox(remote);
    const firstDeviceLog = useLog.getState().events;

    await freshDevice();
    await pullAll(remote);
    nounAnswer(false, T0 + 2000); // device B
    await pushOutbox(remote);

    // Device A, offline meanwhile, answered too, then syncs.
    useLog.setState({ events: [...firstDeviceLog], outbox: [], cursor: null });
    nounAnswer(true, T0 + 1000);
    await pushOutbox(remote);
    await pullAll(remote);

    expect(remote.rows.filter((r) => r.event.kind === 'answer')).toHaveLength(3);
    expect(useNounProfile.getState().stats['en-et-gender'].attempts).toBe(3);
  });

  it('pages through more events than fit in one pull', async () => {
    for (let i = 0; i < 1203; i++) nounAnswer(i % 2 === 0, T0 + i);
    await pushOutbox(remote);
    await freshDevice();
    await pullAll(remote);
    expect(useLog.getState().events.filter((e) => e.kind === 'answer')).toHaveLength(1203);
  });
});

describe('a slow upload', () => {
  it('is still picked up by a device whose cursor already moved past its timestamp', async () => {
    nounAnswer(true, T0);
    await pushOutbox(remote);
    const slowStart = remote.now() - 30_000; // began before the rows above were stamped…
    await freshDevice();
    await pullAll(remote); // …this device's cursor is now past slowStart
    const late = { kind: 'answer' as const, id: 'late-1', at: T0 + 5000, domain: 'nouns' as const, itemId: 'n-hus',
      level: 1 as const, outcomes: { 'en-et-gender': false }, correct: false };
    await remote.pushEvents([late], slowStart); // …and only commits now.
    await pullAll(remote);
    expect(useLog.getState().events.some((e) => e.id === 'late-1')).toBe(true);
  });
});

describe('changing the exam focus', () => {
  it('never moves a niveau the learner already has', async () => {
    useSettings.setState({ targetExam: 'PD3' });
    for (let i = 0; i < 20; i++) {
      recordAnswerEvent({ domain: 'nouns', itemId: 'n-hus', level: 3, outcomes: { 'en-et-gender': true }, correct: true }, T0 + i);
    }
    expect(useLevels.getState().domains.nouns?.current).toBe(4);
    useSettings.setState({ targetExam: 'PD2' });
    expect(useLevels.getState().domains.nouns?.current).toBe(4);
    useSettings.setState({ targetExam: null });
  });
});

describe('two people on one device', () => {
  it('never mixes their progress', async () => {
    nounAnswer(true, T0);
    await switchUser('user-2');
    expect(useNounProfile.getState().stats['en-et-gender'].attempts).toBe(0);
    await switchUser(USER);
    expect(useNounProfile.getState().stats['en-et-gender'].attempts).toBe(1);
  });
});

describe('profile', () => {
  it('a new account keeps this device’s exam focus; an existing one brings its own', async () => {
    useSettings.setState({ targetExam: 'PD2', onboarded: true });
    await startSync(remote);
    expect(remote.profile).toEqual({ targetExam: 'PD2', examDate: null, onboarded: true });

    stopSync();
    useSettings.setState({ targetExam: null, onboarded: false });
    await startSync(remote);
    expect(useSettings.getState().targetExam).toBe('PD2');
    expect(useSettings.getState().onboarded).toBe(true);
  });
});

// ── Progress from before accounts ──────────────────────────────────────────

const stat = (attempts: number, lastSeen: number) => ({ attempts, correct: attempts, recent: [true], lastSeen, raw: 0.6 });

async function seedLegacy() {
  await AsyncStorage.setItem(
    'skema-nouns-v1',
    JSON.stringify({ state: { stats: { 'en-et-gender': stat(5, T0), 'definite-suffix': stat(0, 0) } }, version: 0 }),
  );
  await AsyncStorage.setItem(
    'skema-profile-v1',
    JSON.stringify({ state: { stats: { 'v2-inversion': stat(3, T0) }, seen: ['ex-igaar'], history: [] }, version: 1 }),
  );
  await AsyncStorage.setItem('skema-activity-v1', JSON.stringify({ state: { activeDays: ['2026-03-01'] }, version: 0 }));
}

describe('importing pre-account progress', () => {
  it('reads every old save as baselines, skipping untouched rules', async () => {
    await seedLegacy();
    const b = await readLegacy(AsyncStorage, T0 + 1);
    expect(b.map((x) => `${x.domain}/${x.key}`).sort()).toEqual([
      'activity/days',
      'grammar-seen/seen',
      'grammar/v2-inversion',
      'nouns/en-et-gender',
    ]);
  });

  it('moves it into the first account that signs in, once', async () => {
    await seedLegacy();
    await startSync(remote);
    expect(useNounProfile.getState().stats['en-et-gender'].attempts).toBe(5);
    expect(remote.baselines).toHaveLength(4);
    expect((await legacyImportedBy())?.userId).toBe(USER);

    // A second account on this device doesn't get it again.
    stopSync();
    const other = fakeRemote();
    await switchUser('user-2');
    await startSync(other);
    expect(other.baselines).toHaveLength(0);
    // And the old saves are still there.
    expect(await AsyncStorage.getItem('skema-nouns-v1')).not.toBeNull();
  });

  it('keeps the more recent practice when the account already has some', () => {
    const local: Baseline[] = [
      { domain: 'nouns', key: 'en-et-gender', value: stat(5, T0), asOf: T0 },
      { domain: 'nouns', key: 'definite-suffix', value: stat(2, T0 + 5000), asOf: T0 + 5000 },
      { domain: 'activity', key: 'days', value: ['2026-03-01'], asOf: T0 },
    ];
    const accountAnswer: AnswerEvent = {
      kind: 'answer', id: 'a', at: T0 + 1000, domain: 'nouns', itemId: 'n-bil', level: 1,
      outcomes: { 'en-et-gender': true, 'definite-suffix': true }, correct: true,
    };
    const upload = baselinesToUpload(local, {
      baselines: [{ domain: 'activity', key: 'days', value: ['2026-02-27'], asOf: T0 }],
      events: [accountAnswer],
    });
    // en-et-gender: the account practised it later → keep the account's.
    // definite-suffix: this device practised it later → upload.
    // activity: a union of both.
    expect(upload.map((b) => b.key).sort()).toEqual(['days', 'definite-suffix']);
    expect(upload.find((b) => b.key === 'days')?.value).toEqual(['2026-02-27', '2026-03-01']);
  });
});

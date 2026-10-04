import { describe, expect, it } from 'vitest';
import { evaluate } from '../grammar/analyze';
import { fromCompact } from './compact';
import { EXERCISES } from './exercises';

describe('fromCompact', () => {
  it('builds exactly the hand-written exercise it abbreviates', () => {
    const hand = EXERCISES.find((e) => e.id === 'ex-igaar')!;
    const built = fromCompact({
      id: hand.id,
      level: hand.level,
      exams: hand.exams,
      gloss: hand.gloss,
      sentence: 'F:i går | v:gik | n:jeg | a:ikke | A:på arbejde',
      alternatives: ['F:jeg | v:gik | a:ikke | A:i går | A:på arbejde'],
      targets: hand.targets,
      takeaway: hand.takeaway,
    });
    expect(built).toEqual(hand);
  });

  it('reads a konjunktional as a subordinate clause', () => {
    const ex = fromCompact({
      id: 't',
      level: 3,
      exams: ['PD3'],
      gloss: '…because I am not coming',
      sentence: 'k:fordi | n:jeg | a:ikke | v:kommer',
      targets: ['ikke-regel'],
      takeaway: '',
    });
    expect(ex.clause).toBe('ledsætning');
    expect(evaluate(ex, ex.solution).correct).toBe(true);
  });

  it('rejects an alternative that invents a constituent', () => {
    expect(() =>
      fromCompact({
        id: 't',
        level: 1,
        exams: ['PD2'],
        gloss: '',
        sentence: 'F:jeg | v:bor | A:her',
        alternatives: ['F:her | v:bor | n:jeg | a:ikke'],
        targets: ['v2-inversion'],
        takeaway: '',
      }),
    ).toThrow(/constituents|not a constituent/);
  });

  it('rejects a segment without a field tag', () => {
    expect(() =>
      fromCompact({ id: 't', level: 1, exams: [], gloss: '', sentence: 'jeg | v:bor', targets: [], takeaway: '' }),
    ).toThrow(/expected/);
  });
});

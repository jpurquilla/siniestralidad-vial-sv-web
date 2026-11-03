import { hoyEnElSalvador } from './fecha-el-salvador';

describe('hoyEnElSalvador', () => {
  it('usa la fecha de El Salvador (UTC-6) y no la de UTC', () => {
    // 2026-11-03 03:30 UTC = 2026-11-02 21:30 en El Salvador
    expect(hoyEnElSalvador(new Date('2026-11-03T03:30:00Z'))).toBe('2026-11-02');
  });

  it('coincide con UTC cuando ya es de día en El Salvador', () => {
    expect(hoyEnElSalvador(new Date('2026-11-03T15:00:00Z'))).toBe('2026-11-03');
  });

  it('devuelve el formato YYYY-MM-DD', () => {
    expect(hoyEnElSalvador()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

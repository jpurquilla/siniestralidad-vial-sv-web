import { hoyEnElSalvador, mesInicialCalendario } from './fecha-el-salvador';

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

describe('mesInicialCalendario', () => {
  it('usa el mes actual de El Salvador si la URL no indica otro', () => {
    expect(mesInicialCalendario(null, '2026-11-04')).toEqual(new Date(2026, 10, 1));
  });
  it('respeta el mes de la URL (YYYY-MM o YYYY-MM-DD)', () => {
    expect(mesInicialCalendario('2026-08', '2026-11-04')).toEqual(new Date(2026, 7, 1));
    expect(mesInicialCalendario('2026-03-15', '2026-11-04')).toEqual(new Date(2026, 2, 1));
  });
  it('ignora valores inválidos', () => {
    expect(mesInicialCalendario('2026-13', '2026-11-04')).toEqual(new Date(2026, 10, 1));
  });
});

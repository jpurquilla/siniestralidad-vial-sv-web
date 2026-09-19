import { construirGrillaCalendario } from './construir-grilla-calendario';

describe('construirGrillaCalendario', () => {
  it('devuelve 42 celdas (6 semanas de 7 días)', () => {
    const celdas = construirGrillaCalendario(2026, 7); // agosto 2026 (mes 0-indexado)
    expect(celdas.length).toBe(42);
  });

  it('rellena con null los días antes del 1º del mes', () => {
    // 1 de agosto de 2026 es sábado -> 6 celdas nulas antes (dom..vie)
    const celdas = construirGrillaCalendario(2026, 7);
    expect(celdas.slice(0, 6)).toEqual([null, null, null, null, null, null]);
    expect(celdas[6]).toBe('2026-08-01');
  });

  it('incluye todos los días del mes como fecha ISO yyyy-mm-dd', () => {
    const celdas = construirGrillaCalendario(2026, 7);
    const dias = celdas.filter((c): c is string => c !== null);
    expect(dias.length).toBe(31); // agosto tiene 31 días
    expect(dias[0]).toBe('2026-08-01');
    expect(dias[dias.length - 1]).toBe('2026-08-31');
  });

  it('rellena con null las celdas sobrantes después del último día', () => {
    const celdas = construirGrillaCalendario(2026, 7);
    expect(celdas[celdas.length - 1]).toBeNull();
  });

  it('funciona para febrero en año bisiesto (29 días)', () => {
    const celdas = construirGrillaCalendario(2028, 1);
    const dias = celdas.filter((c): c is string => c !== null);
    expect(dias.length).toBe(29);
    expect(dias[dias.length - 1]).toBe('2028-02-29');
  });
});

import { ticksRedondos } from './ticks-redondos';

describe('ticksRedondos', () => {
  it('redondea 253 y 506 a marcas de 100 y 200 en vez de valores raros', () => {
    expect(ticksRedondos(253).ticks).toEqual([0, 100, 200, 300]);
    expect(ticksRedondos(506).ticks).toEqual([0, 200, 400, 600]);
  });

  it('usa pasos 1, 2, 2.5 y 5 por una potencia de 10', () => {
    expect(ticksRedondos(5).ticks).toEqual([0, 1, 2, 3, 4, 5]);
    expect(ticksRedondos(9.4).paso).toBe(2);
    expect(ticksRedondos(12.5).ticks).toEqual([0, 2.5, 5, 7.5, 10, 12.5]);
    expect(ticksRedondos(120).ticks).toEqual([0, 25, 50, 75, 100, 125]);
    expect(ticksRedondos(2300).ticks).toEqual([0, 500, 1000, 1500, 2000, 2500]);
  });

  it('el tope cubre el máximo y las marcas empiezan en 0', () => {
    for (const m of [0.7, 3, 17, 67, 253, 506, 999, 1982, 8040, 123456]) {
      const eje = ticksRedondos(m);
      expect(eje.ticks[0]).toBe(0);
      expect(eje.tope).toBeGreaterThanOrEqual(m);
      expect(eje.tope).toBeLessThan(m * 2);
      expect(eje.ticks.length).toBeLessThanOrEqual(8);
    }
  });

  it('con entero nunca produce pasos fraccionarios', () => {
    expect(ticksRedondos(3, { entero: true }).ticks.every((t) => Number.isInteger(t))).toBe(true);
    expect(ticksRedondos(12.5, { entero: true }).ticks.every((t) => Number.isInteger(t))).toBe(true);
  });

  it('maneja cero, negativos y valores no finitos', () => {
    expect(ticksRedondos(0).ticks).toEqual([0, 1]);
    expect(ticksRedondos(-4).tope).toBe(1);
    expect(ticksRedondos(Number.NaN).tope).toBe(1);
  });

  it('valores pequeños dan marcas decimales limpias', () => {
    expect(ticksRedondos(0.7).ticks).toEqual([0, 0.2, 0.4, 0.6, 0.8]);
  });
});

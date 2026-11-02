import {
  formatearConteo,
  formatearDecimal,
  formatearFechaLarga,
  formatearMesAnio,
  formatearPorcentaje,
  formatearValorP,
} from './formato';

describe('formato', () => {
  it('formatea conteos sin decimales y con coma de miles', () => {
    expect(formatearConteo(11058)).toBe('11,058');
    expect(formatearConteo(11057.6)).toBe('11,058');
  });

  it('formatea porcentajes con un decimal', () => {
    expect(formatearPorcentaje(4)).toBe('4.0%');
    expect(formatearPorcentaje(0.23, { esFraccion: true })).toBe('23.0%');
    expect(formatearPorcentaje(8.2, { conSigno: true })).toBe('+8.2%');
  });

  it('devuelve «sin dato» para null, undefined y NaN', () => {
    expect(formatearConteo(null)).toBe('sin dato');
    expect(formatearPorcentaje(undefined)).toBe('sin dato');
    expect(formatearDecimal(NaN)).toBe('sin dato');
  });

  it('formatea fechas ISO en lenguaje natural sin correr el día por zona horaria', () => {
    expect(formatearFechaLarga('2026-09-15T00:18:28')).toBe('15 de septiembre de 2026');
    expect(formatearFechaLarga('2024-12-20')).toBe('20 de diciembre de 2024');
    expect(formatearFechaLarga(null)).toBe('sin dato');
  });

  it('escribe el mes con mayúscula inicial y «de» en minúscula', () => {
    expect(formatearMesAnio(2026, 7)).toBe('Agosto de 2026');
  });

  it('formatea el valor p', () => {
    expect(formatearValorP(0.0004)).toBe('p < 0.001');
    expect(formatearValorP(0.0234)).toBe('p = 0.023');
  });
});

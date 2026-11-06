import { crearEscalaContinua } from './escala-continua';

describe('crearEscalaContinua', () => {
  it('devuelve null sin valores', () => {
    expect(crearEscalaContinua([])).toBeNull();
  });

  it('calcula mínimo, máximo y promedio', () => {
    const e = crearEscalaContinua([10, 20, 30])!;
    expect([e.minimo, e.maximo, e.promedio]).toEqual([10, 30, 20]);
  });

  it('da colores distintos y continuos: el máximo es más oscuro que el mínimo', () => {
    const e = crearEscalaContinua([10, 20, 30])!;
    expect(e.colorPara(10)).not.toBe(e.colorPara(30));
    expect(e.colorPara(20)).not.toBe(e.colorPara(10));
  });

  it('usa texto oscuro sobre fondos claros y claro sobre fondos oscuros', () => {
    const e = crearEscalaContinua([10, 30])!;
    expect(e.textoPara(10)).toBe('#14212e');
    expect(e.textoPara(30)).toBe('#ffffff');
  });

  it('expresa la diferencia respecto del promedio en porcentaje', () => {
    const e = crearEscalaContinua([10, 20, 30])!;
    expect(e.diferenciaPct(30)).toBeCloseTo(50);
    expect(e.diferenciaPct(10)).toBeCloseTo(-50);
  });

  it('no divide por cero si todos los valores son iguales', () => {
    const e = crearEscalaContinua([5, 5, 5])!;
    expect(e.colorPara(5)).toMatch(/^rgb\(/);
    expect(e.diferenciaPct(5)).toBe(0);
  });
});

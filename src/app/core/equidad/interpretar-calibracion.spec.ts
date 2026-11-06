import { interpretarCalibracion } from './interpretar-calibracion';

describe('interpretarCalibracion', () => {
  it('> 1 sobreestima (predice más de lo observado)', () => {
    const r = interpretarCalibracion(1.2);
    expect(r.lectura).toBe('sobreestima');
    expect(r.desvioPct).toBeCloseTo(20);
  });

  it('< 1 subestima (predice menos de lo observado)', () => {
    const r = interpretarCalibracion(0.8);
    expect(r.lectura).toBe('subestima');
    expect(r.desvioPct).toBeCloseTo(-20);
  });

  it('cerca de 1.00 se considera calibrado', () => {
    expect(interpretarCalibracion(1.02).lectura).toBe('exacta');
    expect(interpretarCalibracion(0.97).lectura).toBe('exacta');
  });
});

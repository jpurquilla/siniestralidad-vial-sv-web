import { COLOR_SIN_DATO } from './escala-coropletica';
import { LIMITE_ESCALA_BRECHA_PCT, crearEscalaDivergente } from './escala-divergente';

describe('crearEscalaDivergente', () => {
  it('produce 5 clases y 4 cortes internos fijos', () => {
    const escala = crearEscalaDivergente();

    expect(escala.clases.length).toBe(5);
    expect(escala.cortes).toEqual([-30, -10, 10, 30]);
  });

  it('limita la escala a ±50% y lo dice en la leyenda', () => {
    const escala = crearEscalaDivergente();

    expect(LIMITE_ESCALA_BRECHA_PCT).toBe(50);
    expect(escala.clases[0].etiqueta).toContain('-50%');
    expect(escala.clases[4].etiqueta).toContain('+50%');
  });

  it('asigna colores distintos a un valor muy negativo (sobreestima) y uno muy positivo (subestima)', () => {
    const escala = crearEscalaDivergente();

    expect(escala.colorPara(-40)).not.toBe(escala.colorPara(45));
  });

  it('marca como fuera de escala solo lo que supera ±50% y usa el color extremo', () => {
    const escala = crearEscalaDivergente();

    expect(escala.fueraDeEscala(50)).toBe(false);
    expect(escala.fueraDeEscala(-50)).toBe(false);
    expect(escala.fueraDeEscala(120)).toBe(true);
    expect(escala.fueraDeEscala(-80)).toBe(true);
    expect(escala.fueraDeEscala(null)).toBe(false);
    expect(escala.colorPara(120)).toBe(escala.colorPara(50));
    expect(escala.colorPara(-80)).toBe(escala.colorPara(-50));
  });

  it('usa el color "sin dato" para valores null o undefined', () => {
    const escala = crearEscalaDivergente();

    expect(escala.colorPara(null)).toBe(COLOR_SIN_DATO);
    expect(escala.colorPara(undefined)).toBe(COLOR_SIN_DATO);
  });

  it('es monótona: a mayor valor, nunca un color de una clase anterior', () => {
    const escala = crearEscalaDivergente();
    const valores = [-90, -40, -20, -5, 0, 5, 10, 20, 30, 40, 70];
    const indices = valores.map((v) =>
      escala.clases.findIndex((clase) => clase.color === escala.colorPara(v)),
    );

    for (let i = 1; i < indices.length; i++) {
      expect(indices[i]).toBeGreaterThanOrEqual(indices[i - 1]);
    }
  });
});

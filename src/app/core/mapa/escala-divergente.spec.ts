import { COLOR_SIN_DATO } from './escala-coropletica';
import { crearEscalaDivergente } from './escala-divergente';

describe('crearEscalaDivergente', () => {
  it('produce 5 clases y 4 cortes internos', () => {
    const valores = [-40, -20, -5, 0, 5, 10, 20, 30, 40, 50];
    const escala = crearEscalaDivergente(valores);

    expect(escala.clases.length).toBe(5);
    expect(escala.cortes.length).toBe(4);
  });

  it('asigna colores distintos a un valor muy negativo (sobreestima) y uno muy positivo (subestima)', () => {
    const valores = [-40, -20, -5, 0, 5, 10, 20, 30, 40, 50];
    const escala = crearEscalaDivergente(valores);

    expect(escala.colorPara(-40)).not.toBe(escala.colorPara(50));
  });

  it('usa el color "sin dato" para valores null o undefined', () => {
    const escala = crearEscalaDivergente([-10, 0, 10]);

    expect(escala.colorPara(null)).toBe(COLOR_SIN_DATO);
    expect(escala.colorPara(undefined)).toBe(COLOR_SIN_DATO);
  });

  it('no lanza con un arreglo vacío y siempre devuelve el color "sin dato"', () => {
    const escala = crearEscalaDivergente([]);

    expect(escala.clases).toEqual([]);
    expect(escala.colorPara(5)).toBe(COLOR_SIN_DATO);
  });

  it('es monótona: a mayor valor, nunca un color de una clase anterior', () => {
    const valores = [-40, -20, -5, 0, 5, 10, 20, 30, 40, 50];
    const escala = crearEscalaDivergente(valores);
    const colores = valores.map((v) => escala.colorPara(v));
    const indices = colores.map((c) => escala.clases.findIndex((clase) => clase.color === c));

    for (let i = 1; i < indices.length; i++) {
      expect(indices[i]).toBeGreaterThanOrEqual(indices[i - 1]);
    }
  });
});

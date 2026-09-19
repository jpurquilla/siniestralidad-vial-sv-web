import { COLOR_SIN_DATO, crearEscalaCoropletica } from './escala-coropletica';

describe('crearEscalaCoropletica', () => {
  it('produce 5 clases y 4 cortes internos con valores distintos', () => {
    const valores = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const escala = crearEscalaCoropletica(valores);

    expect(escala.clases.length).toBe(5);
    expect(escala.cortes.length).toBe(4);
  });

  it('asigna colores distintos al valor más bajo y al más alto', () => {
    const valores = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const escala = crearEscalaCoropletica(valores);

    expect(escala.colorPara(1)).not.toBe(escala.colorPara(10));
  });

  it('es monótona: a mayor valor, nunca un color de una clase anterior', () => {
    const valores = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const escala = crearEscalaCoropletica(valores);
    const colores = valores.map((v) => escala.colorPara(v));
    const indices = colores.map((c) => escala.clases.findIndex((clase) => clase.color === c));

    for (let i = 1; i < indices.length; i++) {
      expect(indices[i]).toBeGreaterThanOrEqual(indices[i - 1]);
    }
  });

  it('usa el color "sin dato" para valores null o undefined', () => {
    const escala = crearEscalaCoropletica([1, 2, 3, 4, 5]);

    expect(escala.colorPara(null)).toBe(COLOR_SIN_DATO);
    expect(escala.colorPara(undefined)).toBe(COLOR_SIN_DATO);
  });

  it('el color "sin dato" no coincide con ninguna clase de la leyenda', () => {
    const escala = crearEscalaCoropletica([1, 2, 3, 4, 5]);

    for (const clase of escala.clases) {
      expect(clase.color).not.toBe(COLOR_SIN_DATO);
    }
  });

  it('no lanza con un arreglo vacío y siempre devuelve el color "sin dato"', () => {
    const escala = crearEscalaCoropletica([]);

    expect(escala.clases).toEqual([]);
    expect(escala.colorPara(5)).toBe(COLOR_SIN_DATO);
  });

  it('no lanza cuando todos los valores son iguales', () => {
    const escala = crearEscalaCoropletica([3, 3, 3, 3]);

    expect(() => escala.colorPara(3)).not.toThrow();
    expect(escala.clases.length).toBe(5);
  });

  it('con un único valor, todos los cortes son ese mismo valor', () => {
    const escala = crearEscalaCoropletica([7]);

    expect(escala.cortes).toEqual([7, 7, 7, 7]);
    expect(escala.colorPara(7)).not.toBe(COLOR_SIN_DATO);
  });

  it('cuando un cuantil cae exacto en un índice (sin interpolar), no lanza', () => {
    // Con 6 valores, el cuantil 0.2 cae en el índice 1 exacto (p*(n-1) = 1.0).
    const escala = crearEscalaCoropletica([10, 20, 30, 40, 50, 60]);

    expect(escala.cortes[0]).toBe(20);
  });
});

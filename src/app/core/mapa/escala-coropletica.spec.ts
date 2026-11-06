import { COLOR_SIN_DATO, crearEscalaCoropletica } from './escala-coropletica';

describe('crearEscalaCoropletica', () => {
  it('produce 6 clases y 5 cortes internos con valores distintos', () => {
    const valores = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const escala = crearEscalaCoropletica(valores);

    expect(escala.clases.length).toBe(6);
    expect(escala.cortes.length).toBe(5);
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
    expect(escala.clases.length).toBe(6);
  });

  it('con un único valor, todos los cortes son ese mismo valor', () => {
    const escala = crearEscalaCoropletica([7]);

    expect(escala.cortes).toEqual([7, 7, 7, 7, 7]);
    expect(escala.colorPara(7)).not.toBe(COLOR_SIN_DATO);
  });

  it('cuando un cuantil cae exacto en un índice (sin interpolar), no lanza', () => {
    // Con 6 valores, el cuantil 0.2 cae en el índice 1 exacto (p*(n-1) = 1.0).
    const escala = crearEscalaCoropletica([10, 20, 30, 40, 50, 60]);

    expect(escala.cortes[0]).toBe(20);
  });

  it('con 103 distritos reparte en cuatro quintiles, una clase 80-95 y una clase superior de ~5 distritos', () => {
    const valores = Array.from({ length: 103 }, (_, i) => (i + 1) ** 1.5);
    const escala = crearEscalaCoropletica(valores);
    const porColor = new Map<string, number>();
    for (const v of valores) {
      porColor.set(escala.colorPara(v), (porColor.get(escala.colorPara(v)) ?? 0) + 1);
    }
    const porClase = escala.clases.map((c) => porColor.get(c.color) ?? 0);

    expect(porClase.length).toBe(6);
    for (const cantidad of porClase.slice(0, 4)) {
      expect(cantidad).toBeGreaterThanOrEqual(20);
      expect(cantidad).toBeLessThanOrEqual(22);
    }
    expect(porClase[4]).toBeGreaterThanOrEqual(14);
    expect(porClase[4]).toBeLessThanOrEqual(17);
    expect(porClase[5]).toBeGreaterThanOrEqual(5);
    expect(porClase[5]).toBeLessThanOrEqual(6);
  });

  it('la clase superior empieza en el percentil 95 y aísla a los valores más altos', () => {
    const valores = [...Array.from({ length: 98 }, (_, i) => 0.1 + i * 0.005), 1.5, 1.8, 2.0, 2.2, 2.55];
    const escala = crearEscalaCoropletica(valores);
    const superior = escala.clases[5].color;

    expect(escala.colorPara(2.55)).toBe(superior);
    expect(escala.colorPara(1.5)).toBe(superior);
    expect(escala.colorPara(0.5)).not.toBe(superior);
  });

  it('redondea los cortes a dos decimales y la leyenda usa esos mismos cortes', () => {
    const valores = Array.from({ length: 103 }, (_, i) => (i + 1) / 41);
    const escala = crearEscalaCoropletica(valores);

    for (const corte of escala.cortes) {
      expect(Math.round(corte * 100) / 100).toBe(corte);
    }
    expect(escala.clases[0].etiqueta).toContain(escala.cortes[0].toFixed(2));
  });
});

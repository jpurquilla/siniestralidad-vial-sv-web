import { COLOR_SIN_DATO } from './escala-coropletica';
import { crearEscalaLogaritmica } from './escala-logaritmica';

describe('crearEscalaLogaritmica', () => {
  const valores = [1, 1, 2, 3, 5, 8, 20, 60, 150, 400, 1200, 10877];

  it('crea 6 clases con cortes enteros que crecen geométricamente', () => {
    const escala = crearEscalaLogaritmica(valores);
    expect(escala.clases.length).toBe(6);
    expect(escala.cortes).toEqual([5, 23, 105, 491, 2311]) // ceil(10877^(i/6));
    const razones = escala.cortes.slice(1).map((c, i) => c / escala.cortes[i]);
    for (const r of razones) {
      expect(r).toBeGreaterThan(4);
      expect(r).toBeLessThan(6);
    }
  });

  it('etiqueta las clases sin huecos ni solapes y termina en el máximo', () => {
    const escala = crearEscalaLogaritmica(valores);
    expect(escala.clases[0].etiqueta).toBe('1 – 5');
    expect(escala.clases[1].etiqueta).toBe('6 – 23');
    expect(escala.clases[5].etiqueta).toBe('2,312 – 10,877');
  });

  it('es monótona: más siniestros nunca baja de clase, y 1 y el máximo difieren', () => {
    const escala = crearEscalaLogaritmica(valores);
    const indices = [1, 5, 6, 23, 100, 600, 3000, 10877].map((v) =>
      escala.clases.findIndex((c) => c.color === escala.colorPara(v)),
    );
    for (let i = 1; i < indices.length; i++) {
      expect(indices[i]).toBeGreaterThanOrEqual(indices[i - 1]);
    }
    expect(escala.colorPara(1)).not.toBe(escala.colorPara(10877));
  });

  it('sin datos o con ceros devuelve el color «sin dato»', () => {
    expect(crearEscalaLogaritmica([]).colorPara(3)).toBe(COLOR_SIN_DATO);
    expect(crearEscalaLogaritmica([0, 0]).clases).toEqual([]);
    expect(crearEscalaLogaritmica(valores).colorPara(0)).toBe(COLOR_SIN_DATO);
  });

  it('con un máximo pequeño reduce el número de clases en vez de repetirlas', () => {
    const escala = crearEscalaLogaritmica([1, 2, 3]);
    expect(escala.clases.length).toBeLessThan(6);
    expect(new Set(escala.clases.map((c) => c.etiqueta)).size).toBe(escala.clases.length);
  });
});

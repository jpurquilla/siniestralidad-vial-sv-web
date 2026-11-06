import { COLOR_SIN_DATO } from './escala-coropletica';
import { COLOR_CERO, crearEscalaConCeros } from './escala-con-ceros';

describe('crearEscalaConCeros', () => {
  it('con muchos ceros, el cero es su clase y los cuantiles salen de los positivos', () => {
    const valores = [...Array(90).fill(0), 0.5, 1, 2, 3, 5, 8, 13, 21, 55, 101.7, 232.6, 40, 70];
    const escala = crearEscalaConCeros(valores);
    expect(escala.clases[0]).toEqual({ color: COLOR_CERO, etiqueta: '0' });
    expect(escala.colorPara(0)).toBe(COLOR_CERO);
    expect(escala.clases.length).toBeGreaterThan(2);
    expect(escala.colorPara(232.6)).not.toBe(escala.colorPara(0.5));
    for (const c of escala.clases) {
      expect(c.etiqueta).not.toMatch(/^(\d+\.\d+) – \1$/);
    }
  });

  it('nunca repite etiquetas, aunque haya pocos valores distintos', () => {
    const escala = crearEscalaConCeros([0, 0, 0, 3, 3, 7], 0);
    const etiquetas = escala.clases.map((c) => c.etiqueta);
    expect(new Set(etiquetas).size).toBe(etiquetas.length);
  });

  it('es monótona entre los positivos', () => {
    const escala = crearEscalaConCeros([0, 1, 2, 4, 8, 16, 32, 64, 128, 256]);
    const idx = [1, 2, 4, 8, 16, 32, 64, 128, 256].map((v) =>
      escala.clases.findIndex((c) => c.color === escala.colorPara(v)),
    );
    for (let i = 1; i < idx.length; i++) {
      expect(idx[i]).toBeGreaterThanOrEqual(idx[i - 1]);
    }
  });

  it('todo en cero: una sola clase «0»; null es «sin dato»', () => {
    const escala = crearEscalaConCeros([0, 0, 0]);
    expect(escala.clases).toEqual([{ color: COLOR_CERO, etiqueta: '0' }]);
    expect(escala.colorPara(null)).toBe(COLOR_SIN_DATO);
  });
});

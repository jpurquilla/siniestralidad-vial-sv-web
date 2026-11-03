import { formatearDecimal } from '../format/formato';
import { COLORES_SECUENCIALES, COLOR_SIN_DATO, EscalaCoropletica } from './escala-coropletica';

/** Color de «sin siniestros»: blanco, distinto del azul más claro de las clases con datos. */
export const COLOR_CERO = '#ffffff';

const PERCENTILES = [0.2, 0.4, 0.6, 0.8, 0.95];

function cuantil(ordenados: number[], p: number): number {
  const indice = p * (ordenados.length - 1);
  const i = Math.floor(indice);
  const j = Math.ceil(indice);
  return ordenados[i] + (ordenados[j] - ordenados[i]) * (indice - i);
}

/**
 * Escala por cuantiles para métricas con muchos ceros (siniestros por distrito con un filtro
 * restrictivo): el cero es su propia clase («0») y los cuantiles se calculan solo sobre los
 * valores positivos. Los cortes repetidos se funden, así que nunca hay clases «0.00 – 0.00».
 */
export function crearEscalaConCeros(valores: number[], decimales = 2): EscalaCoropletica {
  const positivos = valores.filter((v) => v > 0).sort((a, b) => a - b);
  const claseCero = { color: COLOR_CERO, etiqueta: '0' };
  if (positivos.length === 0) {
    return { cortes: [], clases: [claseCero], colorPara: (v) => (v === null || v === undefined ? COLOR_SIN_DATO : COLOR_CERO) };
  }

  const factor = 10 ** decimales;
  const redondear = (v: number) => Math.round(v * factor) / factor;
  const minimo = redondear(positivos[0]);
  const maximo = redondear(positivos[positivos.length - 1]);
  const cortes = [...new Set(PERCENTILES.map((p) => redondear(cuantil(positivos, p))))].filter(
    (c) => c > minimo && c < maximo,
  );

  const n = cortes.length + 1;
  const colores = Array.from({ length: n }, (_, i) =>
    COLORES_SECUENCIALES[n === 1 ? COLORES_SECUENCIALES.length - 1 : Math.round((i * (COLORES_SECUENCIALES.length - 1)) / (n - 1))],
  );
  const limites = [minimo, ...cortes, maximo];
  const clases = colores.map((color, i) => ({
    color,
    etiqueta:
      i === n - 1 && limites[i] === limites[i + 1]
        ? formatearDecimal(limites[i], decimales)
        : `${formatearDecimal(limites[i], decimales)} – ${formatearDecimal(limites[i + 1], decimales)}`,
  }));

  return {
    cortes,
    clases: [claseCero, ...clases],
    colorPara(valor) {
      if (valor === null || valor === undefined) {
        return COLOR_SIN_DATO;
      }
      if (valor <= 0) {
        return COLOR_CERO;
      }
      const i = cortes.findIndex((c) => redondear(valor) <= c);
      return colores[i === -1 ? n - 1 : i];
    },
  };
}

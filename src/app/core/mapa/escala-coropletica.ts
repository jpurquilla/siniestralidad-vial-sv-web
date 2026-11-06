import { formatearDecimal } from '../format/formato';
import { ClaseLeyenda } from '../../shared/components/leyenda-mapa/clase-leyenda.model';

/**
 * Azules de 6 clases (ColorBrewer "Blues"), secuencial y seguro para
 * daltonismo. Nunca arcoíris ni divergente: el riesgo va de menos a más.
 */
export const COLORES_SECUENCIALES = ['#eff3ff', '#c6dbef', '#9ecae1', '#6baed6', '#3182bd', '#08306b'];

/**
 * Percentiles de los cortes: cuatro quintiles y un corte aparte desde el
 * percentil 95, para que la clase superior aísle a los distritos más altos
 * (p. ej. San Salvador) en vez de mezclarlos con el resto del AMSS.
 */
const PERCENTILES_CORTE = [0.2, 0.4, 0.6, 0.8, 0.95];

/** Gris neutro, distinguible de la clase más baja de la escala. */
export const COLOR_SIN_DATO = '#bdbdbd';

export interface EscalaCoropletica {
  /** Los 5 cortes internos (percentiles 20/40/60/80/95 de los valores recibidos, redondeados a 2 decimales) que delimitan las 6 clases. */
  cortes: number[];
  /** Las 6 clases de la leyenda, en orden de menor a mayor riesgo. */
  clases: ClaseLeyenda[];
  /** Color de una clase para un valor dado, o el color "sin dato" si es null/undefined. */
  colorPara(valor: number | null | undefined): string;
}

function cuantil(valoresOrdenados: number[], p: number): number {
  if (valoresOrdenados.length === 1) {
    return valoresOrdenados[0];
  }
  const indice = p * (valoresOrdenados.length - 1);
  const inferior = Math.floor(indice);
  const superior = Math.ceil(indice);
  if (inferior === superior) {
    return valoresOrdenados[inferior];
  }
  const fraccion = indice - inferior;
  return (
    valoresOrdenados[inferior] +
    (valoresOrdenados[superior] - valoresOrdenados[inferior]) * fraccion
  );
}

/** `decimales`: de las etiquetas de la leyenda y del redondeo de los cortes (2 por defecto; 0 para conteos). */
export function crearEscalaCoropletica(valores: number[], decimales = 2): EscalaCoropletica {
  if (valores.length === 0) {
    return { cortes: [], clases: [], colorPara: () => COLOR_SIN_DATO };
  }

  const ordenados = [...valores].sort((a, b) => a - b);
  // Se redondea a 2 decimales para que la leyenda y el color de cada distrito usen exactamente los mismos cortes.
  const factor = 10 ** decimales;
  const redondear = (v: number) => Math.round(v * factor) / factor;
  const cortes = PERCENTILES_CORTE.map((p) => redondear(cuantil(ordenados, p)));
  const minimo = redondear(ordenados[0]);
  const maximo = redondear(ordenados[ordenados.length - 1]);
  const limites = [minimo, ...cortes, maximo];

  const clases: ClaseLeyenda[] = COLORES_SECUENCIALES.map((color, i) => ({
    color,
    etiqueta: `${formatearDecimal(limites[i], decimales)} – ${formatearDecimal(limites[i + 1], decimales)}`,
  }));

  function colorPara(valor: number | null | undefined): string {
    if (valor === null || valor === undefined) {
      return COLOR_SIN_DATO;
    }
    for (let i = 0; i < cortes.length; i++) {
      if (valor <= cortes[i]) {
        return COLORES_SECUENCIALES[i];
      }
    }
    return COLORES_SECUENCIALES[COLORES_SECUENCIALES.length - 1];
  }

  return { cortes, clases, colorPara };
}

import { formatearDecimal } from '../format/formato';
import { ClaseLeyenda } from '../../shared/components/leyenda-mapa/clase-leyenda.model';

/**
 * Azules de 5 clases (ColorBrewer "Blues"), secuencial y seguro para
 * daltonismo. Nunca arcoíris ni divergente: el riesgo va de menos a más.
 */
const COLORES_SECUENCIALES = ['#eff3ff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c'];

/** Gris neutro, distinguible de la clase más baja de la escala. */
export const COLOR_SIN_DATO = '#bdbdbd';

export interface EscalaCoropletica {
  /** Los 4 cortes internos que delimitan las 5 clases (cuantiles 20/40/60/80 de los valores recibidos: los 103 distritos). */
  cortes: number[];
  /** Las 5 clases de la leyenda, en orden de menor a mayor riesgo. */
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

export function crearEscalaCoropletica(valores: number[]): EscalaCoropletica {
  if (valores.length === 0) {
    return { cortes: [], clases: [], colorPara: () => COLOR_SIN_DATO };
  }

  const ordenados = [...valores].sort((a, b) => a - b);
  const cortes = [0.2, 0.4, 0.6, 0.8].map((p) => cuantil(ordenados, p));
  const minimo = ordenados[0];
  const maximo = ordenados[ordenados.length - 1];
  const limites = [minimo, ...cortes, maximo];

  const clases: ClaseLeyenda[] = COLORES_SECUENCIALES.map((color, i) => ({
    color,
    etiqueta: `${formatearDecimal(limites[i], 2)} – ${formatearDecimal(limites[i + 1], 2)}`,
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

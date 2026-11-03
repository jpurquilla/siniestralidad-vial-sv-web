import { ClaseLeyenda } from '../../shared/components/leyenda-mapa/clase-leyenda.model';
import { formatearConteo } from '../format/formato';
import { COLORES_SECUENCIALES, COLOR_SIN_DATO, EscalaCoropletica } from './escala-coropletica';

/**
 * Escala secuencial logarítmica para conteos: los cortes crecen en progresión
 * geométrica entre 1 y el máximo (cada clase abarca el mismo factor, no la misma
 * cantidad), de modo que unas pocas celdas muy altas no aplasten a las demás.
 * Mismos azules que el resto de los mapas (claro = pocos, oscuro = muchos).
 */
export function crearEscalaLogaritmica(
  valores: number[],
  nClases = COLORES_SECUENCIALES.length,
): EscalaCoropletica {
  const positivos = valores.filter((v) => v > 0);
  if (positivos.length === 0) {
    return { cortes: [], clases: [], colorPara: () => COLOR_SIN_DATO };
  }
  const maximo = Math.max(...positivos);

  // Límite superior (entero, inclusivo) de cada clase salvo la última.
  const cortes: number[] = [];
  for (let i = 1; i < nClases; i++) {
    const corte = Math.ceil(Math.pow(maximo, i / nClases));
    if (corte < maximo && (cortes.length === 0 || corte > cortes[cortes.length - 1])) {
      cortes.push(corte);
    }
  }

  const nReal = cortes.length + 1;
  // Si hay menos clases que colores, se toman colores repartidos de claro a oscuro.
  const colores = Array.from({ length: nReal }, (_, i) =>
    COLORES_SECUENCIALES[
      nReal === 1 ? COLORES_SECUENCIALES.length - 1 : Math.round((i * (COLORES_SECUENCIALES.length - 1)) / (nReal - 1))
    ],
  );

  const limitesSup = [...cortes, maximo];
  const clases: ClaseLeyenda[] = colores.map((color, i) => {
    const desde = i === 0 ? 1 : limitesSup[i - 1] + 1;
    const hasta = limitesSup[i];
    return {
      color,
      etiqueta: desde >= hasta ? formatearConteo(hasta) : `${formatearConteo(desde)} – ${formatearConteo(hasta)}`,
    };
  });

  return {
    cortes,
    clases,
    colorPara(valor) {
      if (valor === null || valor === undefined || valor <= 0) {
        return COLOR_SIN_DATO;
      }
      const i = cortes.findIndex((c) => valor <= c);
      return colores[i === -1 ? colores.length - 1 : i];
    },
  };
}

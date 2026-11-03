import { formatearDecimal, formatearPorcentaje } from '../format/formato';
import { CausaEsperada } from '../models/prediccion.model';
import { Franja } from '../models/franja.model';

export const CAUSA_EBRIEDAD = 'Estado de Ebriedad o Droga';
export const ETIQUETA_OTRAS_CAUSAS = 'Otras causas';
const CAUSAS_PRINCIPALES = 5;

export interface FilaCausa {
  causa: string;
  esperado: number;
  proporcion: number;
}

export interface CausasAgrupadas {
  /** Las 5 causas con más siniestros esperados, de mayor a menor. */
  principales: FilaCausa[];
  /** Suma del resto; null si no hay más de 5 causas. */
  otras: FilaCausa | null;
}

/** Las 5 causas principales y, agrupado, el resto. Conserva el total (esperado y proporción). */
export function agruparCausas(porCausa: CausaEsperada[]): CausasAgrupadas {
  const ordenadas = [...porCausa].sort((a, b) => b.esperado - a.esperado);
  const principales = ordenadas.slice(0, CAUSAS_PRINCIPALES);
  const resto = ordenadas.slice(CAUSAS_PRINCIPALES);
  return {
    principales,
    otras:
      resto.length > 0
        ? {
            causa: ETIQUETA_OTRAS_CAUSAS,
            esperado: resto.reduce((suma, c) => suma + c.esperado, 0),
            proporcion: resto.reduce((suma, c) => suma + c.proporcion, 0),
          }
        : null,
  };
}

const MOMENTO: Record<Franja, string> = {
  'Madrugada (00-05)': 'esta madrugada',
  'Manana (06-11)': 'esta mañana',
  'Tarde (12-17)': 'esta tarde',
  'Noche (18-23)': 'esta noche',
};

/** «Estado de Ebriedad o Droga» -> «ebriedad o droga»; el resto, en minúsculas («Invadir Carril» -> «invadir carril»). */
function nombreEnFrase(causa: string): string {
  return causa === CAUSA_EBRIEDAD ? 'ebriedad o droga' : causa.toLowerCase();
}

function mencion(c: FilaCausa): string {
  return `${formatearDecimal(c.esperado, 2)} se deberían a ${nombreEnFrase(c.causa)} (${formatearPorcentaje(c.proporcion, { esFraccion: true })})`;
}

/**
 * Frase con la causa principal y la de ebriedad. Si la ebriedad no está entre las 5
 * principales, solo se menciona la principal; si es la principal, se menciona una vez.
 */
export function fraseCausas(
  total: number,
  franja: Franja,
  { principales }: CausasAgrupadas,
): string | null {
  const principal = principales[0];
  if (!principal) {
    return null;
  }
  const ebriedad = principales.find((c) => c.causa === CAUSA_EBRIEDAD);
  const inicio = `En promedio, de los ${formatearDecimal(total, 2)} siniestros esperados ${MOMENTO[franja]}, `;
  if (!ebriedad || ebriedad === principal) {
    return `${inicio}${mencion(principal)}.`;
  }
  return `${inicio}${mencion(principal)} y ${mencion(ebriedad).replace('se deberían a', 'a')}.`;
}

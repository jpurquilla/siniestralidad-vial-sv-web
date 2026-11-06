import { ClaseLeyenda } from '../../shared/components/leyenda-mapa/clase-leyenda.model';
import { formatearPorcentaje } from '../format/formato';
import { COLOR_SIN_DATO, EscalaCoropletica } from './escala-coropletica';

/**
 * Rojo-azul divergente de 5 clases (ColorBrewer "RdBu"), para el mapa de
 * brecha: a diferencia del riesgo (siempre secuencial), la brecha
 * observado-vs-predicho tiene signo (subestima/sobreestima), así que acá sí
 * corresponde una escala divergente.
 *
 * La escala es FIJA en ±50%: una escala por cuantiles se estiraría para
 * acomodar unos pocos distritos extremos y escondería las diferencias del
 * resto. Los valores que se salen de ±50% se pintan con el color extremo y
 * se marcan como «fuera de escala».
 */
const COLORES_DIVERGENTES = ['#2166ac', '#92c5de', '#f7f7f7', '#f4a582', '#b2182b'];

/** Límite de la escala, en puntos porcentuales de brecha. */
export const LIMITE_ESCALA_BRECHA_PCT = 50;

const CORTES_BRECHA = [-30, -10, 10, 30];

export interface EscalaDivergente extends EscalaCoropletica {
  /** true si |valor| supera el límite de la escala (se pinta como extremo). */
  fueraDeEscala(valor: number | null | undefined): boolean;
}

export function crearEscalaDivergente(): EscalaDivergente {
  const limites = [-LIMITE_ESCALA_BRECHA_PCT, ...CORTES_BRECHA, LIMITE_ESCALA_BRECHA_PCT];

  const clases: ClaseLeyenda[] = COLORES_DIVERGENTES.map((color, i) => ({
    color,
    etiqueta: `${formatearPorcentaje(limites[i], { decimales: 0, conSigno: true })} a ${formatearPorcentaje(limites[i + 1], { decimales: 0, conSigno: true })}`,
  }));

  function colorPara(valor: number | null | undefined): string {
    if (valor === null || valor === undefined || !Number.isFinite(valor)) {
      return COLOR_SIN_DATO;
    }
    for (let i = 0; i < CORTES_BRECHA.length; i++) {
      if (valor <= CORTES_BRECHA[i]) {
        return COLORES_DIVERGENTES[i];
      }
    }
    return COLORES_DIVERGENTES[COLORES_DIVERGENTES.length - 1];
  }

  function fueraDeEscala(valor: number | null | undefined): boolean {
    return typeof valor === 'number' && Math.abs(valor) > LIMITE_ESCALA_BRECHA_PCT;
  }

  return { cortes: [...CORTES_BRECHA], clases, colorPara, fueraDeEscala };
}

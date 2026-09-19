import { ClaseLeyenda } from '../../shared/components/leyenda-mapa/clase-leyenda.model';
import { COLOR_SIN_DATO, EscalaCoropletica } from './escala-coropletica';

/**
 * Rojo-azul divergente de 5 clases (ColorBrewer "RdBu"), para el mapa de
 * brecha: a diferencia del riesgo (siempre secuencial), la brecha
 * observado-vs-predicho tiene signo (subestima/sobreestima), así que acá sí
 * corresponde una escala divergente.
 */
const COLORES_DIVERGENTES = ['#2166ac', '#92c5de', '#f7f7f7', '#f4a582', '#b2182b'];

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

function formatearValor(valor: number): string {
  return `${valor.toLocaleString('es-SV', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}%`;
}

export function crearEscalaDivergente(valores: number[]): EscalaCoropletica {
  if (valores.length === 0) {
    return { cortes: [], clases: [], colorPara: () => COLOR_SIN_DATO };
  }

  const ordenados = [...valores].sort((a, b) => a - b);
  const cortes = [0.2, 0.4, 0.6, 0.8].map((p) => cuantil(ordenados, p));
  const minimo = ordenados[0];
  const maximo = ordenados[ordenados.length - 1];
  const limites = [minimo, ...cortes, maximo];

  const clases: ClaseLeyenda[] = COLORES_DIVERGENTES.map((color, i) => ({
    color,
    etiqueta: `${formatearValor(limites[i])} – ${formatearValor(limites[i + 1])}`,
  }));

  function colorPara(valor: number | null | undefined): string {
    if (valor === null || valor === undefined) {
      return COLOR_SIN_DATO;
    }
    for (let i = 0; i < cortes.length; i++) {
      if (valor <= cortes[i]) {
        return COLORES_DIVERGENTES[i];
      }
    }
    return COLORES_DIVERGENTES[COLORES_DIVERGENTES.length - 1];
  }

  return { cortes, clases, colorPara };
}

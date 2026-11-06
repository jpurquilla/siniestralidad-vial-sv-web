import { Franja } from './franja.model';

export type FuentePrecipitacion = 'observada' | 'normal_climatologica' | 'escenario_relativo';

/** 'ultimo_disponible': la fecha no tiene dato de parque vehicular y se usa el más reciente. */
export type FuenteParque = 'observado' | 'ultimo_disponible';

export interface PrediccionRequest {
  distritos: string[];
  fecha_inicio: string;
  fecha_fin: string;
  franjas?: Franja[];
  /** mm de precipitación mensual para simular un escenario. Si se omite, se usa la normal climatológica. */
  prcp_mensual?: number | null;
  /**
   * Escenario relativo a la normal de cada distrito (-1 = sin lluvia, 0 = normal, 1 = el doble).
   * La API aplica normal_del_distrito × (1 + factor) limitada al rango del entrenamiento.
   * Excluyente con prcp_mensual.
   */
  factor_prcp?: number | null;
}

/** Siniestros esperados de una causa: predicción × proporción histórica (2022-2024) de la causa en la franja. */
export interface CausaEsperada {
  causa: string;
  esperado: number;
  proporcion: number;
}

export interface PrediccionCeldaOut {
  distrito_codigo: string;
  fecha: string;
  franja: Franja;
  siniestros_esperados: number;
  fuente_prcp: FuentePrecipitacion;
  fuente_parque: FuenteParque;
  /** mm de precipitación mensual usados en la celda (la normal climatológica si no hubo escenario). Opcional: solo si la API lo entrega. */
  prcp_mensual?: number | null;
  /** Reparto del esperado por causa, de mayor a menor; suma `siniestros_esperados`. La causa no es variable del modelo. */
  por_causa?: CausaEsperada[];
}

export interface PrediccionResponse {
  aviso: string;
  predicciones: PrediccionCeldaOut[];
}

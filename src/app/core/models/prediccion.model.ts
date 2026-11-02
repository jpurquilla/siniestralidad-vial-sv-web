import { Franja } from './franja.model';

export type FuentePrecipitacion = 'observada' | 'normal_climatologica';

/** 'ultimo_disponible': la fecha no tiene dato de parque vehicular y se usa el más reciente. */
export type FuenteParque = 'observado' | 'ultimo_disponible';

export interface PrediccionRequest {
  distritos: string[];
  fecha_inicio: string;
  fecha_fin: string;
  franjas?: Franja[];
  /** mm de precipitación mensual para simular un escenario. Si se omite, se usa la normal climatológica. */
  prcp_mensual?: number | null;
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
}

export interface PrediccionResponse {
  aviso: string;
  predicciones: PrediccionCeldaOut[];
}

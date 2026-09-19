import { Franja } from './franja.model';

export type FuentePrecipitacion = 'observada' | 'normal_climatologica';

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
}

export interface PrediccionResponse {
  aviso: string;
  predicciones: PrediccionCeldaOut[];
}

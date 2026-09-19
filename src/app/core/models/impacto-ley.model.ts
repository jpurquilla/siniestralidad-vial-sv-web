export interface ImpactoAnualOut {
  anio: string;
  siniestros: number;
  fallecidos: number;
  /** Fallecidos por cada 100 siniestros. */
  letalidad: number;
  cobertura: string;
}

export interface ImpactoResumenItemOut {
  metrica: string;
  periodo: string;
  variacion_interanual_pct: number | null;
  /** Nunca afirma causalidad: la ley coincide con el cambio, no lo causa. */
  lectura: string;
}

export interface ImpactoLeyResponse {
  aviso: string;
  fecha_aprobacion_ley: string;
  serie_anual: ImpactoAnualOut[];
  resumen: ImpactoResumenItemOut[];
  limitaciones: string[];
}

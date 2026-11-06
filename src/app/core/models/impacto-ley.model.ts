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

/**
 * Tasas por parque vehicular (dato real del registro ONASEVI, no sintético).
 * 2026 es un año parcial: siniestros y fallecidos cubren solo ene-jun.
 */
export interface TasaPorVehiculoOut {
  anio: string;
  /** Vehículos registrados en la fecha de corte. */
  parque_vehicular: number;
  /** Fecha ISO (YYYY-MM-DD) del corte del parque. */
  fecha_corte_parque: string;
  /** Siniestros por cada 1,000 vehículos. */
  siniestros_por_1000_vehiculos: number;
  /** Fallecidos por cada 10,000 vehículos. */
  fallecidos_por_10000_vehiculos: number;
  parcial: boolean;
  parque_es_dato_real: boolean;
}

export interface ImpactoLeyResponse {
  aviso: string;
  fecha_aprobacion_ley: string;
  serie_anual: ImpactoAnualOut[];
  resumen: ImpactoResumenItemOut[];
  /** Dato real por parque vehicular. */
  tasas_por_vehiculo: TasaPorVehiculoOut[];
  limitaciones: string[];
}

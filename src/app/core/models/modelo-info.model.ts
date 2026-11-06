/** Métricas de evaluación del modelo (periodo 2025-2026, no visto al entrenar). */
export interface MetricasModelo {
  MAE: number;
  RMSE: number;
  media_predicha: number;
  /** PREDICHO / OBSERVADO: > 1 sobreestima, < 1 subestima, 1 es exacto. */
  calibracion: number;
  spearman_global: number;
  spearman_tercil_alto: number;
  /** Valor observado de referencia (la API lo entrega; el front no lo interpreta). */
  objetivo?: number | string | null;
}

export interface PruebaTPareadaMensual {
  n_meses: number;
  t: number;
  p: number;
  meses_que_mejora: number;
}

export interface PruebaDieboldMariano {
  DM: number;
  p: number;
  dias: number;
}

export interface PruebasSignificancia {
  t_pareada_mensual: PruebaTPareadaMensual;
  diebold_mariano: PruebaDieboldMariano;
}

export interface ImportanciaShapOut {
  variable: string;
  valor: number;
}

export interface CalibracionFranjaOut {
  franja: string;
  /** PREDICHO / OBSERVADO en esa franja. */
  calibracion: number;
}

export interface ModeloInfoResponse {
  nombre: string;
  /** Nombre del archivo del modelo; solo informativo, no se muestra tal cual. */
  version_modelo: string;
  fecha_entrenamiento: string;
  variables: string[];
  offset: string;
  metricas: MetricasModelo;
  /** Métricas del modelo anterior, solo como referencia comparativa. */
  metricas_referencia_nb07: MetricasModelo;
  pruebas_significancia: PruebasSignificancia;
  importancia_shap: ImportanciaShapOut[];
  calibracion_por_franja: CalibracionFranjaOut[];
  limitaciones: string[];
}

export type Tercil = 'alto' | 'medio' | 'bajo';

export interface RankingItemOut {
  distrito_codigo: string;
  nombre: string;
  siniestros_esperados: number;
  tercil: Tercil;
  /**
   * Spearman de ordenamiento de ESE tercil en el periodo de evaluación
   * (2025-2026). Dato descriptivo: el orden dentro de un tercil es aproximado.
   */
  confiabilidad_spearman: number;
}

export interface RankingResponse {
  aviso: string;
  fecha_inicio: string;
  fecha_fin: string;
  ranking: RankingItemOut[];
}

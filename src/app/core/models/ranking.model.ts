export type Tercil = 'alto' | 'medio' | 'bajo';

export interface RankingItemOut {
  distrito_codigo: string;
  nombre: string;
  siniestros_esperados: number;
  tercil: Tercil;
  /**
   * Spearman de ordenamiento de ESE tercil en la evaluación de NB07
   * (test 2025-2026). El tercil medio ordena mal (~0.65): es una limitación
   * documentada del modelo, no un defecto de este endpoint.
   */
  confiabilidad_spearman: number;
}

export interface RankingResponse {
  aviso: string;
  fecha_inicio: string;
  fecha_fin: string;
  ranking: RankingItemOut[];
}

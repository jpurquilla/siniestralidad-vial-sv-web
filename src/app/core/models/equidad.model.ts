export interface GrupoEquidadOut {
  grupo: string;
  /** sum(observado)/sum(predicho) del grupo. 1.0 = calibración perfecta. */
  calibracion: number;
  /** Correlación de Spearman entre predicho y observado dentro del grupo. */
  spearman: number;
  n_distritos: number;
}

export interface EquidadResponse {
  aviso: string;
  urbano_rural: GrupoEquidadOut[];
  densidad_poblacional: GrupoEquidadOut[];
}

export interface GrupoEquidadOut {
  grupo: string;
  /** sum(predicho)/sum(observado) del grupo. > 1 sobreestima, < 1 subestima, 1.0 = exacto. */
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

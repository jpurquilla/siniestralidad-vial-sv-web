export interface ComparacionDistritoOut {
  distrito_codigo: string;
  nombre: string;
  observado: number;
  predicho: number;
  /** (1 - predicho/observado) * 100. Positivo = el modelo subestima. */
  brecha_pct: number;
}

export interface ComparacionHistoricaResponse {
  aviso: string;
  distritos: ComparacionDistritoOut[];
}

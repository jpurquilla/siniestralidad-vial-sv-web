export interface DistritoOut {
  codigo: string;
  nombre: string;
  departamento: string;
  pct_urbano: number;
  poblacion: number;
  poblacion_baja: boolean;
}

export interface DistritosResponse {
  total: number;
  distritos: DistritoOut[];
}

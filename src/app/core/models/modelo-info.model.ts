export interface ModeloInfoResponse {
  nombre: string;
  fecha_entrenamiento: string;
  variables: string[];
  offset: string;
  metricas: Record<string, number>;
  limitaciones: string[];
}

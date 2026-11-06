import { Franja } from './franja.model';

export interface SiniestroPuntoOut {
  id_siniestro: string;
  fecha: string;
  hora: string;
  franja: Franja;
  latitud: number;
  longitud: number;
  departamento: string;
  distrito: string;
  tipo_siniestro: string;
  factor_causante: string;
  tipo_vehiculo: string;
  fallecidos: number;
  lesionados: number;
}

export interface SiniestrosPuntosResponse {
  aviso: string;
  total: number;
  puntos: SiniestroPuntoOut[];
}

export interface OpcionesFiltroSiniestrosResponse {
  tipos_siniestro: string[];
  tipos_vehiculo: string[];
  factores_causantes: string[];
  departamentos: string[];
}

export interface FiltroSiniestros {
  fechaInicio?: string;
  fechaFin?: string;
  tipoSiniestro?: string;
  tipoVehiculo?: string;
  factorCausante?: string;
  horaInicio?: string;
  horaFin?: string;
  departamento?: string;
  distrito?: string;
}

/**
 * El 413 ("demasiados puntos, acotá con más filtros") es un estado esperado
 * de este endpoint, no un error genérico — se modela como dato, igual que
 * el 503 de /api/v1/distritos/geojson.
 */
export type SiniestrosPuntosResultado =
  | { estado: 'ok'; datos: SiniestrosPuntosResponse }
  | { estado: 'demasiados_puntos'; mensaje: string };

/** Hexágono de la grilla de 2 km de lado, con su conteo (agregacion=hex). */
export interface HexagonoOut {
  id: string;
  conteo: number;
  /** Distritos de los siniestros que caen en el hexágono. */
  distritos: string[];
  /** [latitud, longitud] */
  centro: [number, number];
  /** 6 vértices [latitud, longitud]. */
  vertices: [number, number][];
}

export interface SiniestrosHexResponse {
  aviso: string;
  agregacion: 'hex';
  lado_km: number;
  total: number;
  hexagonos: HexagonoOut[];
}

/** Siniestros de un distrito, con su población y tasa (agregacion=distrito). */
export interface DistritoAgregadoOut {
  distrito_codigo: string;
  nombre: string;
  departamento: string;
  siniestros: number;
  poblacion: number;
  tasa_por_10mil: number;
}

export interface SiniestrosDistritoResponse {
  aviso: string;
  agregacion: 'distrito';
  total: number;
  distritos: DistritoAgregadoOut[];
}

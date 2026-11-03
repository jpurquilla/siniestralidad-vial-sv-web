import { Franja } from './franja.model';

/** Contrato de `POST /api/v1/informes/periodo` (y de los parámetros de `.pdf` / `.xlsx`). */
export interface FiltrosInforme {
  departamento: string | null;
  distritos: string[];
  franjas: Franja[];
  dias_semana: number[];
}

export interface ParametrosInforme {
  fecha_inicio: string;
  fecha_fin: string;
  filtros: FiltrosInforme;
}

export interface TotalInforme {
  esperado: number;
  ic90_inf: number;
  ic90_sup: number;
}

export interface DistritoInforme {
  codigo: string;
  distrito: string;
  departamento: string;
  esperado: number;
  ic90_inf: number;
  ic90_sup: number;
  tercil: 'alto' | 'medio' | 'bajo';
  tasa_10mil_hab: number;
}

export interface FranjaInforme {
  franja: Franja;
  esperado: number;
}

export interface DiaSemanaInforme {
  dia: string;
  /** Promedio por día: `suma / veces`. */
  esperado: number;
  /** Veces que ese día de la semana aparece en el periodo (0 si el filtro lo excluye). */
  veces: number;
  /** Total esperado de ese día en el periodo. */
  suma: number;
}

export interface DistritoPorFranjaInforme {
  codigo: string;
  distrito: string;
  franjas: Partial<Record<Franja, number>>;
}

export interface CausaInforme {
  causa: string;
  esperado: number;
  ic90_inf: number;
  ic90_sup: number;
  /** 0-100. */
  porcentaje: number;
}

export interface ProporcionCausa {
  causa: string;
  /** 0-1. */
  proporcion: number;
}

export interface CausasFranjaInforme {
  franja: Franja;
  causas: ProporcionCausa[];
}

export interface PrioridadInforme {
  distrito: string;
  franja: Franja;
  dia_semana: string;
  /** Promedio por día de la combinación distrito + franja + día de la semana. */
  esperado: number;
  /** Veces que ese día de la semana aparece en el periodo. */
  veces: number;
}

export interface VehiculoInforme {
  tipo: string;
  porcentaje: number;
}

export interface SupuestosInforme {
  dias_con_lluvia_normal: number;
  dias_con_ultimo_parque: number;
  composicion_vehiculos: VehiculoInforme[];
}

export interface FilaResumen {
  etiqueta: string;
  valor: string;
}

/** Resumen generado por la API (fuente única de las cifras del texto y de la Tabla 1). */
export interface ResumenInforme {
  texto: string;
  filas: FilaResumen[];
}

export interface InformePeriodo {
  parametros: ParametrosInforme;
  generado: string;
  resumen: ResumenInforme;
  total: TotalInforme;
  por_distrito: DistritoInforme[];
  por_franja: FranjaInforme[];
  por_dia_semana: DiaSemanaInforme[];
  distrito_x_franja: DistritoPorFranjaInforme[];
  por_causa: CausaInforme[];
  causas_por_franja: CausasFranjaInforme[];
  prioridades: PrioridadInforme[];
  /** Fuente única de colores por causa (incluye «Otras causas»). */
  colores_causas: Record<string, string>;
  supuestos: SupuestosInforme;
  limitaciones: string[];
}

/** Parámetros del formulario (estado de la página y de la URL). */
export interface SolicitudInforme {
  fecha_inicio: string;
  fecha_fin: string;
  departamento: string | null;
  distritos: string[];
  franjas: Franja[];
  dias_semana: number[];
}

import { ParamMap } from '@angular/router';

import { FRANJAS, Franja } from '../models/franja.model';
import { SolicitudInforme } from '../models/informe-periodo.model';

export const MAXIMO_DIAS_INFORME = 92;
export const DIAS_POR_DEFECTO = 30;
export const NOMBRES_DIAS_CORTOS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
export const NOMBRES_DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const MS_DIA = 86_400_000;
const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

function aUtc(iso: string): number {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return Date.UTC(anio, mes - 1, dia);
}

/** Suma días a una fecha ISO (YYYY-MM-DD) sin depender de la zona horaria. */
export function sumarDias(iso: string, dias: number): string {
  return new Date(aUtc(iso) + dias * MS_DIA).toISOString().slice(0, 10);
}

/** Número de días del rango, ambos extremos incluidos (NaN si alguna fecha no es válida). */
export function diasInclusivos(inicio: string, fin: string): number {
  if (!FECHA_ISO.test(inicio) || !FECHA_ISO.test(fin)) {
    return Number.NaN;
  }
  return Math.round((aUtc(fin) - aUtc(inicio)) / MS_DIA) + 1;
}

/** Rango por defecto: de hoy a hoy + 30 días. */
export function solicitudPorDefecto(hoy: string): SolicitudInforme {
  return {
    fecha_inicio: hoy,
    fecha_fin: sumarDias(hoy, DIAS_POR_DEFECTO),
    departamento: null,
    distritos: [],
    franjas: [],
    dias_semana: [],
  };
}

/** Mensaje de validación visible; null si la solicitud es válida. */
export function validarSolicitud(s: SolicitudInforme): string | null {
  if (!FECHA_ISO.test(s.fecha_inicio) || !FECHA_ISO.test(s.fecha_fin)) {
    return 'Indique la fecha inicial y la fecha final.';
  }
  const dias = diasInclusivos(s.fecha_inicio, s.fecha_fin);
  if (dias < 1) {
    return 'La fecha final no puede ser anterior a la fecha inicial.';
  }
  if (dias > MAXIMO_DIAS_INFORME) {
    return `El periodo es de ${dias} días; el máximo es ${MAXIMO_DIAS_INFORME} días.`;
  }
  return null;
}

/** Solicitud leída de la URL; lo ausente o inválido toma el valor por defecto. */
export function solicitudDesdeParams(params: ParamMap, hoy: string): SolicitudInforme {
  const base = solicitudPorDefecto(hoy);
  const inicio = params.get('fecha_inicio');
  const fin = params.get('fecha_fin');
  const franjas = params.getAll('franjas').filter((f): f is Franja => (FRANJAS as readonly string[]).includes(f));
  const dias = params
    .getAll('dias_semana')
    .map(Number)
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  return {
    fecha_inicio: inicio && FECHA_ISO.test(inicio) ? inicio : base.fecha_inicio,
    fecha_fin: fin && FECHA_ISO.test(fin) ? fin : inicio && FECHA_ISO.test(inicio) ? sumarDias(inicio, DIAS_POR_DEFECTO) : base.fecha_fin,
    departamento: params.get('departamento') || null,
    distritos: [...new Set(params.getAll('distritos').filter(Boolean))],
    franjas: [...new Set(franjas)],
    dias_semana: [...new Set(dias)].sort((a, b) => a - b),
  };
}

/** Parámetros de URL (mismos nombres que la API; listas repetidas). Solo lo que tiene valor. */
export function paramsDeSolicitud(s: SolicitudInforme): Record<string, string | string[]> {
  const params: Record<string, string | string[]> = {
    fecha_inicio: s.fecha_inicio,
    fecha_fin: s.fecha_fin,
  };
  if (s.departamento) params['departamento'] = s.departamento;
  if (s.distritos.length) params['distritos'] = s.distritos;
  if (s.franjas.length) params['franjas'] = s.franjas;
  if (s.dias_semana.length) params['dias_semana'] = s.dias_semana.map(String);
  return params;
}

export function nombreArchivoInforme(s: SolicitudInforme, extension: 'pdf' | 'xlsx'): string {
  return `informe-siniestros-${s.fecha_inicio}_${s.fecha_fin}.${extension}`;
}

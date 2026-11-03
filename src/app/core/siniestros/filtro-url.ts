import { ParamMap } from '@angular/router';

import { FiltroSiniestros } from '../models/siniestro-punto.model';

/** Nombre en la URL (igual que el de la API) de cada campo del filtro. */
const CLAVES: Record<keyof FiltroSiniestros, string> = {
  fechaInicio: 'fecha_inicio',
  fechaFin: 'fecha_fin',
  tipoSiniestro: 'tipo_siniestro',
  tipoVehiculo: 'tipo_vehiculo',
  factorCausante: 'factor_causante',
  horaInicio: 'hora_inicio',
  horaFin: 'hora_fin',
  departamento: 'departamento',
  distrito: 'distrito',
};

/** Filtro leído de los parámetros de la URL; los campos ausentes quedan fuera. */
export function filtroDesdeParams(params: ParamMap): FiltroSiniestros {
  const filtro: FiltroSiniestros = {};
  for (const [campo, clave] of Object.entries(CLAVES) as [keyof FiltroSiniestros, string][]) {
    const valor = params.get(clave);
    if (valor) {
      filtro[campo] = valor;
    }
  }
  return filtro;
}

/** Parámetros de URL de un filtro (solo los campos con valor). */
export function paramsDeFiltro(filtro: FiltroSiniestros): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [campo, clave] of Object.entries(CLAVES) as [keyof FiltroSiniestros, string][]) {
    const valor = filtro[campo];
    if (valor) {
      params[clave] = valor;
    }
  }
  return params;
}

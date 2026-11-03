import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';

import { API_BASE_URL } from '../config/api-base-url.token';
import {
  FiltroSiniestros,
  SiniestrosDistritoResponse,
  SiniestrosHexResponse,
  OpcionesFiltroSiniestrosResponse,
  SiniestrosPuntosResponse,
  SiniestrosPuntosResultado,
} from '../models/siniestro-punto.model';

function paramsHttp(filtro: FiltroSiniestros, agregacion?: 'hex' | 'distrito'): HttpParams {
  let params = new HttpParams();
  if (filtro.fechaInicio) params = params.set('fecha_inicio', filtro.fechaInicio);
  if (filtro.fechaFin) params = params.set('fecha_fin', filtro.fechaFin);
  if (filtro.tipoSiniestro) params = params.set('tipo_siniestro', filtro.tipoSiniestro);
  if (filtro.tipoVehiculo) params = params.set('tipo_vehiculo', filtro.tipoVehiculo);
  if (filtro.factorCausante) params = params.set('factor_causante', filtro.factorCausante);
  if (filtro.horaInicio) params = params.set('hora_inicio', filtro.horaInicio);
  if (filtro.horaFin) params = params.set('hora_fin', filtro.horaFin);
  if (filtro.departamento) params = params.set('departamento', filtro.departamento);
  if (filtro.distrito) params = params.set('distrito', filtro.distrito);
  if (agregacion) params = params.set('agregacion', agregacion);
  return params;
}

@Injectable({ providedIn: 'root' })
export class SiniestrosService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  /**
   * El 413 ("demasiados puntos, acotá con más filtros") es un estado
   * esperado de este endpoint (ver api/README.md §5): se modela como dato,
   * no se propaga como error genérico.
   */
  puntos(filtro: FiltroSiniestros): Observable<SiniestrosPuntosResultado> {
    const params = paramsHttp(filtro);

    return this.http
      .get<SiniestrosPuntosResponse>(`${this.apiBaseUrl}/api/v1/siniestros/puntos`, { params })
      .pipe(
        map((datos): SiniestrosPuntosResultado => ({ estado: 'ok', datos })),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 413) {
            const detalle = error.error as { detail?: unknown } | null;
            const mensaje =
              typeof detalle?.detail === 'string'
                ? detalle.detail
                : 'La consulta devuelve demasiados puntos. Acotá con más filtros.';
            return of<SiniestrosPuntosResultado>({ estado: 'demasiados_puntos', mensaje });
          }
          return throwError(() => error);
        }),
      );
  }

  /** Siniestros agregados en hexágonos de 2 km de lado (sin tope de respuesta). */
  hexagonos(filtro: FiltroSiniestros): Observable<SiniestrosHexResponse> {
    return this.http.get<SiniestrosHexResponse>(`${this.apiBaseUrl}/api/v1/siniestros/puntos`, {
      params: paramsHttp(filtro, 'hex'),
    });
  }

  /** Siniestros, población y tasa por 10,000 habitantes de cada distrito. */
  porDistrito(filtro: FiltroSiniestros): Observable<SiniestrosDistritoResponse> {
    return this.http.get<SiniestrosDistritoResponse>(`${this.apiBaseUrl}/api/v1/siniestros/puntos`, {
      params: paramsHttp(filtro, 'distrito'),
    });
  }

  opcionesFiltro(): Observable<OpcionesFiltroSiniestrosResponse> {
    return this.http.get<OpcionesFiltroSiniestrosResponse>(
      `${this.apiBaseUrl}/api/v1/siniestros/opciones-filtro`,
    );
  }
}

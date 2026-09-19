import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';

import { API_BASE_URL } from '../config/api-base-url.token';
import {
  FiltroSiniestros,
  OpcionesFiltroSiniestrosResponse,
  SiniestrosPuntosResponse,
  SiniestrosPuntosResultado,
} from '../models/siniestro-punto.model';

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

  opcionesFiltro(): Observable<OpcionesFiltroSiniestrosResponse> {
    return this.http.get<OpcionesFiltroSiniestrosResponse>(
      `${this.apiBaseUrl}/api/v1/siniestros/opciones-filtro`,
    );
  }
}

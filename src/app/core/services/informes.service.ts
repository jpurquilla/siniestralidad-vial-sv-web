import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, from, switchMap, throwError } from 'rxjs';

import { API_BASE_URL } from '../config/api-base-url.token';
import { InformePeriodo, SolicitudInforme } from '../models/informe-periodo.model';

export type FormatoInforme = 'pdf' | 'xlsx';

/** Cuerpo JSON: los filtros vacíos se omiten (son opcionales en la API). */
function cuerpo(s: SolicitudInforme): Record<string, unknown> {
  return {
    fecha_inicio: s.fecha_inicio,
    fecha_fin: s.fecha_fin,
    ...(s.departamento && { departamento: s.departamento }),
    ...(s.distritos.length && { distritos: s.distritos }),
    ...(s.franjas.length && { franjas: s.franjas }),
    ...(s.dias_semana.length && { dias_semana: s.dias_semana }),
  };
}

/** Query string equivalente: las listas se repiten (`distritos=a&distritos=b`). */
function paramsDescarga(s: SolicitudInforme): HttpParams {
  let params = new HttpParams().set('fecha_inicio', s.fecha_inicio).set('fecha_fin', s.fecha_fin);
  if (s.departamento) params = params.set('departamento', s.departamento);
  for (const d of s.distritos) params = params.append('distritos', d);
  for (const f of s.franjas) params = params.append('franjas', f);
  for (const d of s.dias_semana) params = params.append('dias_semana', String(d));
  return params;
}

@Injectable({ providedIn: 'root' })
export class InformesService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  periodo(solicitud: SolicitudInforme): Observable<InformePeriodo> {
    return this.http.post<InformePeriodo>(`${this.apiBaseUrl}/api/v1/informes/periodo`, cuerpo(solicitud));
  }

  /** Descarga el PDF o el Excel como Blob. Los errores llegan con el cuerpo JSON ya interpretado. */
  descargar(solicitud: SolicitudInforme, formato: FormatoInforme): Observable<Blob> {
    return this.http
      .get(`${this.apiBaseUrl}/api/v1/informes/periodo.${formato}`, {
        params: paramsDescarga(solicitud),
        responseType: 'blob',
      })
      .pipe(catchError((error: HttpErrorResponse) => this.errorConCuerpoJson(error)));
  }

  /** Con `responseType: 'blob'` el detalle del error llega como Blob: se vuelve a leer como JSON. */
  private errorConCuerpoJson(error: HttpErrorResponse): Observable<never> {
    if (!(error.error instanceof Blob)) {
      return throwError(() => error);
    }
    return from(error.error.text()).pipe(
      switchMap((texto) => {
        let detalle: unknown = null;
        try {
          detalle = JSON.parse(texto);
        } catch {
          detalle = null;
        }
        return throwError(
          () =>
            new HttpErrorResponse({
              error: detalle,
              status: error.status,
              statusText: error.statusText,
              url: error.url ?? undefined,
            }),
        );
      }),
    );
  }
}

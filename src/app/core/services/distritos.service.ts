import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';

import { API_BASE_URL } from '../config/api-base-url.token';
import { DistritosResponse } from '../models/distrito.model';
import {
  DistritoFeatureCollection,
  DistritoGeoJsonResultado,
} from '../models/distrito-geojson.model';

@Injectable({ providedIn: 'root' })
export class DistritosService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  listar(): Observable<DistritosResponse> {
    return this.http.get<DistritosResponse>(`${this.apiBaseUrl}/api/v1/distritos`);
  }

  /**
   * El 503 es un estado esperado cuando todavía no se cargó el GeoJSON de
   * distritos en el servidor (ver api/README.md §7): se modela como dato,
   * no se propaga como error genérico.
   */
  geojson(): Observable<DistritoGeoJsonResultado> {
    return this.http
      .get<DistritoFeatureCollection>(`${this.apiBaseUrl}/api/v1/distritos/geojson`)
      .pipe(
        map((datos): DistritoGeoJsonResultado => ({ estado: 'ok', datos })),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 503) {
            const detalle = error.error as { detail?: unknown } | null;
            const mensaje =
              typeof detalle?.detail === 'string'
                ? detalle.detail
                : 'Las geometrías de distritos todavía no están disponibles en el servidor.';
            return of<DistritoGeoJsonResultado>({ estado: 'no_disponible', mensaje });
          }
          return throwError(() => error);
        }),
      );
  }
}

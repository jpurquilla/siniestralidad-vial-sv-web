import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api-base-url.token';
import { Franja } from '../models/franja.model';
import { RankingResponse } from '../models/ranking.model';

@Injectable({ providedIn: 'root' })
export class RankingService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  obtener(fechaInicio: string, fechaFin: string, franjas?: Franja[]): Observable<RankingResponse> {
    let params = new HttpParams().set('fecha_inicio', fechaInicio).set('fecha_fin', fechaFin);
    for (const franja of franjas ?? []) {
      params = params.append('franjas', franja);
    }

    return this.http.get<RankingResponse>(`${this.apiBaseUrl}/api/v1/ranking`, { params });
  }
}

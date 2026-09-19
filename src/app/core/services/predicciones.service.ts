import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api-base-url.token';
import { PrediccionRequest, PrediccionResponse } from '../models/prediccion.model';

@Injectable({ providedIn: 'root' })
export class PrediccionesService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  predecir(pedido: PrediccionRequest): Observable<PrediccionResponse> {
    return this.http.post<PrediccionResponse>(`${this.apiBaseUrl}/api/v1/predicciones`, pedido);
  }
}

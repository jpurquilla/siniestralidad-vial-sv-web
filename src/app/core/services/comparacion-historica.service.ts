import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api-base-url.token';
import { ComparacionHistoricaResponse } from '../models/comparacion-historica.model';

@Injectable({ providedIn: 'root' })
export class ComparacionHistoricaService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  obtener(): Observable<ComparacionHistoricaResponse> {
    return this.http.get<ComparacionHistoricaResponse>(
      `${this.apiBaseUrl}/api/v1/comparacion-historica`,
    );
  }
}

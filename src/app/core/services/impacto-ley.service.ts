import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api-base-url.token';
import { ImpactoLeyResponse } from '../models/impacto-ley.model';

@Injectable({ providedIn: 'root' })
export class ImpactoLeyService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  obtener(): Observable<ImpactoLeyResponse> {
    return this.http.get<ImpactoLeyResponse>(`${this.apiBaseUrl}/api/v1/impacto-ley-cero-tolerancia`);
  }
}

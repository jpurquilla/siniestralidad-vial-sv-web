import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api-base-url.token';
import { EquidadResponse } from '../models/equidad.model';

@Injectable({ providedIn: 'root' })
export class EquidadService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  obtener(): Observable<EquidadResponse> {
    return this.http.get<EquidadResponse>(`${this.apiBaseUrl}/api/v1/equidad`);
  }
}

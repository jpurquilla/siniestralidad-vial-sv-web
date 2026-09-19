import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api-base-url.token';
import { ModeloInfoResponse } from '../models/modelo-info.model';

@Injectable({ providedIn: 'root' })
export class ModeloInfoService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  obtener(): Observable<ModeloInfoResponse> {
    return this.http.get<ModeloInfoResponse>(`${this.apiBaseUrl}/api/v1/modelo/info`);
  }
}

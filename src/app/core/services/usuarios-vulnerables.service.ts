import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api-base-url.token';
import { UsuariosVulnerablesResponse } from '../models/usuarios-vulnerables.model';

@Injectable({ providedIn: 'root' })
export class UsuariosVulnerablesService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  obtener(): Observable<UsuariosVulnerablesResponse> {
    return this.http.get<UsuariosVulnerablesResponse>(`${this.apiBaseUrl}/api/v1/usuarios-vulnerables`);
  }
}

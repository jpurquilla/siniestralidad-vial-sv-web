import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { API_BASE_URL } from '../config/api-base-url.token';
import { UsuariosVulnerablesService } from './usuarios-vulnerables.service';
import { UsuariosVulnerablesResponse } from '../models/usuarios-vulnerables.model';

const API_BASE_URL_DE_PRUEBA = 'http://api.prueba.test';

describe('UsuariosVulnerablesService', () => {
  let service: UsuariosVulnerablesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: API_BASE_URL_DE_PRUEBA },
      ],
    });
    service = TestBed.inject(UsuariosVulnerablesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('trae usuarios vulnerables sin parámetros', () => {
    const respuestaEsperada: UsuariosVulnerablesResponse = {
      aviso: 'retrospectivo',
      reparto_por_tipo: [{ tipo: 'Peaton', pct_fatales: 42.47, letalidad_por_siniestro: 0.2294 }],
      letalidad_por_edad: [{ rango_etario: '71+', victimas: 100, letalidad: 0.2982 }],
    };

    let resultado: UsuariosVulnerablesResponse | undefined;
    service.obtener().subscribe((datos) => (resultado = datos));

    const peticion = httpMock.expectOne(`${API_BASE_URL_DE_PRUEBA}/api/v1/usuarios-vulnerables`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush(respuestaEsperada);

    expect(resultado).toEqual(respuestaEsperada);
  });

  it('propaga el error cuando /api/v1/usuarios-vulnerables falla', () => {
    let errorRecibido: unknown;
    service.obtener().subscribe({
      next: () => {
        throw new Error('no debería emitir un valor');
      },
      error: (error: unknown) => (errorRecibido = error),
    });

    const peticion = httpMock.expectOne(`${API_BASE_URL_DE_PRUEBA}/api/v1/usuarios-vulnerables`);
    peticion.flush('error interno', { status: 500, statusText: 'Internal Server Error' });

    expect(errorRecibido).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { API_BASE_URL } from '../config/api-base-url.token';
import { EquidadService } from './equidad.service';
import { EquidadResponse } from '../models/equidad.model';

const API_BASE_URL_DE_PRUEBA = 'http://api.prueba.test';

describe('EquidadService', () => {
  let service: EquidadService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: API_BASE_URL_DE_PRUEBA },
      ],
    });
    service = TestBed.inject(EquidadService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('trae la equidad sin parámetros', () => {
    const respuestaEsperada: EquidadResponse = {
      aviso: 'diagnóstico, no predicción',
      urbano_rural: [{ grupo: 'Urbano', calibracion: 0.98, spearman: 0.9, n_distritos: 80 }],
      densidad_poblacional: [{ grupo: 'Alta densidad', calibracion: 1.02, spearman: 0.85, n_distritos: 60 }],
    };

    let resultado: EquidadResponse | undefined;
    service.obtener().subscribe((datos) => (resultado = datos));

    const peticion = httpMock.expectOne(`${API_BASE_URL_DE_PRUEBA}/api/v1/equidad`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush(respuestaEsperada);

    expect(resultado).toEqual(respuestaEsperada);
  });

  it('propaga el error cuando /api/v1/equidad falla', () => {
    let errorRecibido: unknown;
    service.obtener().subscribe({
      next: () => {
        throw new Error('no debería emitir un valor');
      },
      error: (error: unknown) => (errorRecibido = error),
    });

    const peticion = httpMock.expectOne(`${API_BASE_URL_DE_PRUEBA}/api/v1/equidad`);
    peticion.flush('error interno', { status: 500, statusText: 'Internal Server Error' });

    expect(errorRecibido).toBeTruthy();
  });
});

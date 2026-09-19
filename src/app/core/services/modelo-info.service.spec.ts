import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { API_BASE_URL } from '../config/api-base-url.token';
import { ModeloInfoService } from './modelo-info.service';
import { ModeloInfoResponse } from '../models/modelo-info.model';

const API_BASE_URL_DE_PRUEBA = 'http://api.prueba.test';

describe('ModeloInfoService', () => {
  let service: ModeloInfoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: API_BASE_URL_DE_PRUEBA },
      ],
    });
    service = TestBed.inject(ModeloInfoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('trae la información del modelo', () => {
    const respuestaEsperada: ModeloInfoResponse = {
      nombre: 'frecuencia_xgboost_offset_v2 (NB07)',
      fecha_entrenamiento: '2026-09-15T00:18:28',
      variables: ['es_lluviosa', 'pct_urbano'],
      offset: 'log_exposicion_v2 + log_tasa_base',
      metricas: { calibracion: 0.966979, RMSE: 0.412055 },
      limitaciones: ['El tercil medio ordena mal (Spearman ~0.65).'],
    };

    let resultado: ModeloInfoResponse | undefined;
    service.obtener().subscribe((datos) => (resultado = datos));

    const peticion = httpMock.expectOne(`${API_BASE_URL_DE_PRUEBA}/api/v1/modelo/info`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush(respuestaEsperada);

    expect(resultado).toEqual(respuestaEsperada);
  });

  it('propaga el error cuando /api/v1/modelo/info falla', () => {
    let errorRecibido: unknown;
    service.obtener().subscribe({
      next: () => {
        throw new Error('no debería emitir un valor');
      },
      error: (error: unknown) => (errorRecibido = error),
    });

    const peticion = httpMock.expectOne(`${API_BASE_URL_DE_PRUEBA}/api/v1/modelo/info`);
    peticion.flush('error interno', { status: 500, statusText: 'Internal Server Error' });

    expect(errorRecibido).toBeTruthy();
  });
});

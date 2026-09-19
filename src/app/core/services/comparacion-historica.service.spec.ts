import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { API_BASE_URL } from '../config/api-base-url.token';
import { ComparacionHistoricaService } from './comparacion-historica.service';
import { ComparacionHistoricaResponse } from '../models/comparacion-historica.model';

const API_BASE_URL_DE_PRUEBA = 'http://api.prueba.test';

describe('ComparacionHistoricaService', () => {
  let service: ComparacionHistoricaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: API_BASE_URL_DE_PRUEBA },
      ],
    });
    service = TestBed.inject(ComparacionHistoricaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('trae la comparación histórica sin parámetros', () => {
    const respuestaEsperada: ComparacionHistoricaResponse = {
      aviso: 'diagnóstico, no predicción',
      distritos: [
        { distrito_codigo: '01-01', nombre: 'San Salvador Centro', observado: 10, predicho: 9, brecha_pct: 10 },
      ],
    };

    let resultado: ComparacionHistoricaResponse | undefined;
    service.obtener().subscribe((datos) => (resultado = datos));

    const peticion = httpMock.expectOne(`${API_BASE_URL_DE_PRUEBA}/api/v1/comparacion-historica`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush(respuestaEsperada);

    expect(resultado).toEqual(respuestaEsperada);
  });

  it('propaga el error cuando /api/v1/comparacion-historica falla', () => {
    let errorRecibido: unknown;
    service.obtener().subscribe({
      next: () => {
        throw new Error('no debería emitir un valor');
      },
      error: (error: unknown) => (errorRecibido = error),
    });

    const peticion = httpMock.expectOne(`${API_BASE_URL_DE_PRUEBA}/api/v1/comparacion-historica`);
    peticion.flush('error interno', { status: 500, statusText: 'Internal Server Error' });

    expect(errorRecibido).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { API_BASE_URL } from '../config/api-base-url.token';
import { ImpactoLeyService } from './impacto-ley.service';
import { ImpactoLeyResponse } from '../models/impacto-ley.model';

const API_BASE_URL_DE_PRUEBA = 'http://api.prueba.test';

describe('ImpactoLeyService', () => {
  let service: ImpactoLeyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: API_BASE_URL_DE_PRUEBA },
      ],
    });
    service = TestBed.inject(ImpactoLeyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('trae el impacto de la ley sin parámetros', () => {
    const respuestaEsperada: ImpactoLeyResponse = {
      aviso: 'retrospectivo',
      fecha_aprobacion_ley: '2024-12-20',
      serie_anual: [
        { anio: '2025', siniestros: 22265, fallecidos: 1238, letalidad: 5.56, cobertura: 'completa' },
      ],
      resumen: [
        {
          metrica: 'siniestros',
          periodo: '2025',
          variacion_interanual_pct: 9.67,
          lectura: 'la ley coincide con el cambio, no lo causa',
        },
      ],
      limitaciones: ['no hay grupo de control'],
    };

    let resultado: ImpactoLeyResponse | undefined;
    service.obtener().subscribe((datos) => (resultado = datos));

    const peticion = httpMock.expectOne(`${API_BASE_URL_DE_PRUEBA}/api/v1/impacto-ley-cero-tolerancia`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush(respuestaEsperada);

    expect(resultado).toEqual(respuestaEsperada);
  });

  it('propaga el error cuando /api/v1/impacto-ley-cero-tolerancia falla', () => {
    let errorRecibido: unknown;
    service.obtener().subscribe({
      next: () => {
        throw new Error('no debería emitir un valor');
      },
      error: (error: unknown) => (errorRecibido = error),
    });

    const peticion = httpMock.expectOne(`${API_BASE_URL_DE_PRUEBA}/api/v1/impacto-ley-cero-tolerancia`);
    peticion.flush('error interno', { status: 500, statusText: 'Internal Server Error' });

    expect(errorRecibido).toBeTruthy();
  });
});

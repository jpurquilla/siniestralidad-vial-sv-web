import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { API_BASE_URL } from '../config/api-base-url.token';
import { PrediccionesService } from './predicciones.service';
import { PrediccionRequest, PrediccionResponse } from '../models/prediccion.model';

const API_BASE_URL_DE_PRUEBA = 'http://api.prueba.test';

describe('PrediccionesService', () => {
  let service: PrediccionesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: API_BASE_URL_DE_PRUEBA },
      ],
    });
    service = TestBed.inject(PrediccionesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('hace POST al endpoint de predicciones con el body recibido', () => {
    const pedido: PrediccionRequest = {
      distritos: ['01-01'],
      fecha_inicio: '2024-06-15',
      fecha_fin: '2024-06-16',
      franjas: ['Tarde (12-17)'],
    };
    const respuestaEsperada: PrediccionResponse = {
      aviso: 'dato sintético',
      predicciones: [
        {
          distrito_codigo: '01-01',
          fecha: '2024-06-15',
          franja: 'Tarde (12-17)',
          siniestros_esperados: 1.23,
          fuente_prcp: 'normal_climatologica',
        },
      ],
    };

    let resultado: PrediccionResponse | undefined;
    service.predecir(pedido).subscribe((datos) => (resultado = datos));

    const peticion = httpMock.expectOne(`${API_BASE_URL_DE_PRUEBA}/api/v1/predicciones`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual(pedido);
    peticion.flush(respuestaEsperada);

    expect(resultado).toEqual(respuestaEsperada);
  });

  it('propaga el error de validación (422) con el detalle del servidor', () => {
    const pedido: PrediccionRequest = {
      distritos: ['distrito-inexistente'],
      fecha_inicio: '2024-06-15',
      fecha_fin: '2024-06-16',
    };

    let errorRecibido: unknown;
    service.predecir(pedido).subscribe({
      next: () => {
        throw new Error('no debería emitir un valor');
      },
      error: (error: unknown) => (errorRecibido = error),
    });

    const peticion = httpMock.expectOne(`${API_BASE_URL_DE_PRUEBA}/api/v1/predicciones`);
    peticion.flush(
      {
        detail: [{ loc: ['body', 'distritos'], msg: 'distrito inexistente', type: 'value_error' }],
      },
      { status: 422, statusText: 'Unprocessable Entity' },
    );

    expect(errorRecibido).toBeTruthy();
  });
});

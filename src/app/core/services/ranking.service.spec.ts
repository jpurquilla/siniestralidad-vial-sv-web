import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { API_BASE_URL } from '../config/api-base-url.token';
import { RankingService } from './ranking.service';
import { RankingResponse } from '../models/ranking.model';

const API_BASE_URL_DE_PRUEBA = 'http://api.prueba.test';

describe('RankingService', () => {
  let service: RankingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: API_BASE_URL_DE_PRUEBA },
      ],
    });
    service = TestBed.inject(RankingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('pide el ranking con fecha_inicio y fecha_fin como query params', () => {
    const respuestaEsperada: RankingResponse = {
      aviso: 'dato sintético',
      fecha_inicio: '2024-06-15',
      fecha_fin: '2024-06-16',
      ranking: [
        {
          distrito_codigo: '01-01',
          nombre: 'San Salvador Centro',
          siniestros_esperados: 4.5,
          tercil: 'alto',
          confiabilidad_spearman: 0.9775,
        },
      ],
    };

    let resultado: RankingResponse | undefined;
    service.obtener('2024-06-15', '2024-06-16').subscribe((datos) => (resultado = datos));

    const peticion = httpMock.expectOne(
      (req) =>
        req.url === `${API_BASE_URL_DE_PRUEBA}/api/v1/ranking` &&
        req.params.get('fecha_inicio') === '2024-06-15' &&
        req.params.get('fecha_fin') === '2024-06-16',
    );
    expect(peticion.request.method).toBe('GET');
    peticion.flush(respuestaEsperada);

    expect(resultado).toEqual(respuestaEsperada);
  });

  it('agrega franjas como query params repetidos cuando se pasan', () => {
    service.obtener('2024-06-15', '2024-06-16', ['Tarde (12-17)', 'Noche (18-23)']).subscribe();

    const peticion = httpMock.expectOne(
      (req) => req.url === `${API_BASE_URL_DE_PRUEBA}/api/v1/ranking`,
    );
    expect(peticion.request.params.getAll('franjas')).toEqual(['Tarde (12-17)', 'Noche (18-23)']);
    peticion.flush({ aviso: '', fecha_inicio: '', fecha_fin: '', ranking: [] });
  });

  it('propaga el error cuando /api/v1/ranking falla', () => {
    let errorRecibido: unknown;
    service.obtener('2024-06-15', '2024-06-16').subscribe({
      next: () => {
        throw new Error('no debería emitir un valor');
      },
      error: (error: unknown) => (errorRecibido = error),
    });

    const peticion = httpMock.expectOne(
      (req) => req.url === `${API_BASE_URL_DE_PRUEBA}/api/v1/ranking`,
    );
    peticion.flush('error interno', { status: 500, statusText: 'Internal Server Error' });

    expect(errorRecibido).toBeTruthy();
  });
});

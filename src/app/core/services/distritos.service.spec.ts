import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { API_BASE_URL } from '../config/api-base-url.token';
import { DistritosService } from './distritos.service';
import { DistritosResponse } from '../models/distrito.model';
import { DistritoFeatureCollection } from '../models/distrito-geojson.model';

const API_BASE_URL_DE_PRUEBA = 'http://api.prueba.test';

describe('DistritosService', () => {
  let service: DistritosService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: API_BASE_URL_DE_PRUEBA },
      ],
    });
    service = TestBed.inject(DistritosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lista los distritos contra la URL base inyectada', () => {
    const respuestaEsperada: DistritosResponse = {
      total: 1,
      distritos: [
        {
          codigo: '01-01',
          nombre: 'San Salvador Centro',
          departamento: 'San Salvador',
          pct_urbano: 0.98,
          poblacion: 120000,
          poblacion_baja: false,
        },
      ],
    };

    let resultado: DistritosResponse | undefined;
    service.listar().subscribe((datos) => (resultado = datos));

    const peticion = httpMock.expectOne(`${API_BASE_URL_DE_PRUEBA}/api/v1/distritos`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush(respuestaEsperada);

    expect(resultado).toEqual(respuestaEsperada);
  });

  it('propaga el error cuando /api/v1/distritos falla', () => {
    let errorRecibido: unknown;
    service.listar().subscribe({
      next: () => {
        throw new Error('no debería emitir un valor');
      },
      error: (error: unknown) => (errorRecibido = error),
    });

    const peticion = httpMock.expectOne(`${API_BASE_URL_DE_PRUEBA}/api/v1/distritos`);
    peticion.flush('error interno', { status: 500, statusText: 'Internal Server Error' });

    expect(errorRecibido).toBeTruthy();
  });

  it('devuelve estado "ok" con las geometrías cuando el GeoJSON está disponible', () => {
    const geojson: DistritoFeatureCollection = { type: 'FeatureCollection', features: [] };

    let resultado: unknown;
    service.geojson().subscribe((r) => (resultado = r));

    const peticion = httpMock.expectOne(`${API_BASE_URL_DE_PRUEBA}/api/v1/distritos/geojson`);
    peticion.flush(geojson);

    expect(resultado).toEqual({ estado: 'ok', datos: geojson });
  });

  it('devuelve estado "no_disponible" (no un error) cuando la API responde 503', () => {
    let resultado: { estado: string; mensaje?: string } | undefined;
    service.geojson().subscribe((r) => (resultado = r as { estado: string; mensaje?: string }));

    const peticion = httpMock.expectOne(`${API_BASE_URL_DE_PRUEBA}/api/v1/distritos/geojson`);
    peticion.flush(
      { detail: 'No hay geometrías de distritos disponibles.' },
      { status: 503, statusText: 'Service Unavailable' },
    );

    expect(resultado?.estado).toBe('no_disponible');
    expect(resultado?.mensaje).toContain('No hay geometrías');
  });

  it('propaga como error real un fallo de geojson que no sea 503', () => {
    let errorRecibido: unknown;
    service.geojson().subscribe({
      next: () => {
        throw new Error('no debería emitir un valor');
      },
      error: (error: unknown) => (errorRecibido = error),
    });

    const peticion = httpMock.expectOne(`${API_BASE_URL_DE_PRUEBA}/api/v1/distritos/geojson`);
    peticion.flush('falló', { status: 500, statusText: 'Internal Server Error' });

    expect(errorRecibido).toBeTruthy();
  });
});

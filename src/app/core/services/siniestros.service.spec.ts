import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { API_BASE_URL } from '../config/api-base-url.token';
import { SiniestrosService } from './siniestros.service';
import {
  OpcionesFiltroSiniestrosResponse,
  SiniestrosPuntosResponse,
  SiniestrosPuntosResultado,
} from '../models/siniestro-punto.model';

const API_BASE_URL_DE_PRUEBA = 'http://api.prueba.test';

describe('SiniestrosService', () => {
  let service: SiniestrosService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: API_BASE_URL_DE_PRUEBA },
      ],
    });
    service = TestBed.inject(SiniestrosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('pide puntos sin filtros cuando el filtro está vacío', () => {
    let resultado: SiniestrosPuntosResultado | undefined;
    service.puntos({}).subscribe((r) => (resultado = r));

    const peticion = httpMock.expectOne(
      (req) => req.url === `${API_BASE_URL_DE_PRUEBA}/api/v1/siniestros/puntos`,
    );
    expect(peticion.request.params.keys().length).toBe(0);
    const respuesta: SiniestrosPuntosResponse = { aviso: 'sintético', total: 0, puntos: [] };
    peticion.flush(respuesta);

    expect(resultado).toEqual({ estado: 'ok', datos: respuesta });
  });

  it('traduce los campos del filtro a los query params reales de la API', () => {
    service
      .puntos({
        fechaInicio: '2022-01-01',
        fechaFin: '2022-01-31',
        tipoSiniestro: 'Volcamiento',
        tipoVehiculo: 'Motocicleta',
        factorCausante: 'Velocidad Excesiva',
        horaInicio: '00:00',
        horaFin: '05:59',
        departamento: 'San Salvador',
        distrito: 'San Salvador',
      })
      .subscribe();

    const peticion = httpMock.expectOne(
      (req) => req.url === `${API_BASE_URL_DE_PRUEBA}/api/v1/siniestros/puntos`,
    );
    expect(peticion.request.params.get('fecha_inicio')).toBe('2022-01-01');
    expect(peticion.request.params.get('fecha_fin')).toBe('2022-01-31');
    expect(peticion.request.params.get('tipo_siniestro')).toBe('Volcamiento');
    expect(peticion.request.params.get('tipo_vehiculo')).toBe('Motocicleta');
    expect(peticion.request.params.get('factor_causante')).toBe('Velocidad Excesiva');
    expect(peticion.request.params.get('hora_inicio')).toBe('00:00');
    expect(peticion.request.params.get('hora_fin')).toBe('05:59');
    expect(peticion.request.params.get('departamento')).toBe('San Salvador');
    expect(peticion.request.params.get('distrito')).toBe('San Salvador');
    peticion.flush({ aviso: '', total: 0, puntos: [] });
  });

  it('modela el 413 como un resultado "demasiados_puntos", no como error', () => {
    let resultado: SiniestrosPuntosResultado | undefined;
    service.puntos({}).subscribe((r) => (resultado = r));

    const peticion = httpMock.expectOne(
      (req) => req.url === `${API_BASE_URL_DE_PRUEBA}/api/v1/siniestros/puntos`,
    );
    peticion.flush(
      { detail: 'La consulta devuelve 89946 puntos; acotá con más filtros.' },
      { status: 413, statusText: 'Payload Too Large' },
    );

    expect(resultado).toEqual({
      estado: 'demasiados_puntos',
      mensaje: 'La consulta devuelve 89946 puntos; acotá con más filtros.',
    });
  });

  it('propaga otros errores (no 413)', () => {
    let errorRecibido: unknown;
    service.puntos({}).subscribe({
      next: () => {
        throw new Error('no debería emitir un valor');
      },
      error: (error: unknown) => (errorRecibido = error),
    });

    const peticion = httpMock.expectOne(
      (req) => req.url === `${API_BASE_URL_DE_PRUEBA}/api/v1/siniestros/puntos`,
    );
    peticion.flush('error interno', { status: 500, statusText: 'Internal Server Error' });

    expect(errorRecibido).toBeTruthy();
  });

  it('trae las opciones de filtro', () => {
    const respuestaEsperada: OpcionesFiltroSiniestrosResponse = {
      tipos_siniestro: ['Volcamiento'],
      tipos_vehiculo: ['Motocicleta'],
      factores_causantes: ['Velocidad Excesiva'],
      departamentos: ['San Salvador'],
    };

    let resultado: OpcionesFiltroSiniestrosResponse | undefined;
    service.opcionesFiltro().subscribe((datos) => (resultado = datos));

    const peticion = httpMock.expectOne(`${API_BASE_URL_DE_PRUEBA}/api/v1/siniestros/opciones-filtro`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush(respuestaEsperada);

    expect(resultado).toEqual(respuestaEsperada);
  });
});

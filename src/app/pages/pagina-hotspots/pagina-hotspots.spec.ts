import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../core/config/api-base-url.token';
import { OpcionesFiltroSiniestrosResponse, SiniestrosPuntosResponse } from '../../core/models/siniestro-punto.model';
import { PaginaHotspots } from './pagina-hotspots';

const API = 'http://api.prueba.test';

const OPCIONES: OpcionesFiltroSiniestrosResponse = {
  tipos_siniestro: ['Volcamiento'],
  tipos_vehiculo: ['Motocicleta'],
  factores_causantes: ['Velocidad Excesiva'],
  departamentos: ['San Salvador'],
};

describe('PaginaHotspots', () => {
  let fixture: ComponentFixture<PaginaHotspots>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: API },
      ],
    });
    fixture = TestBed.createComponent(PaginaHotspots);
    fixture.detectChanges();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  async function flushInicial(): Promise<void> {
    httpMock.expectOne(`${API}/api/v1/siniestros/opciones-filtro`).flush(OPCIONES);
    await new Promise((resolve) => setTimeout(resolve, 300)); // debounce de 250ms
    const respuesta: SiniestrosPuntosResponse = {
      aviso: 'Aviso de la API que no se muestra tal cual.',
      total: 1,
      puntos: [
        {
          id_siniestro: 'SV-2022-000001',
          fecha: '2022-01-01',
          hora: '20:08',
          franja: 'Noche (18-23)',
          latitud: 14.037415,
          longitud: -89.572557,
          departamento: 'Santa Ana',
          distrito: 'Santa Ana',
          tipo_siniestro: 'Volcamiento',
          factor_causante: 'Distracción del Conductor',
          tipo_vehiculo: 'Motocicleta',
          fallecidos: 0,
          lesionados: 1,
        },
      ],
    };
    httpMock.expectOne((req) => req.url === `${API}/api/v1/siniestros/puntos`).flush(respuesta);
  }

  it('pide las opciones de filtro y los puntos al iniciar, con el aviso de agrupamientos', async () => {
    await flushInicial();
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain(
      'Los agrupamientos reflejan cómo se repartieron los siniestros al generar el conjunto de datos; no son concentraciones viales verificadas.',
    );
    expect(texto).not.toMatch(/NB\d+/);
    expect(texto).toContain('1 siniestros encontrados');
  });

  it('arranca con el filtro de un solo año y lo refleja en los campos de fecha', async () => {
    httpMock.expectOne(`${API}/api/v1/siniestros/opciones-filtro`).flush(OPCIONES);
    await new Promise((resolve) => setTimeout(resolve, 300));
    const peticion = httpMock.expectOne((req) => req.url === `${API}/api/v1/siniestros/puntos`);
    const desde = peticion.request.params.get('fecha_inicio') ?? '';
    const hasta = peticion.request.params.get('fecha_fin') ?? '';
    expect(desde.slice(0, 4)).toBe(hasta.slice(0, 4));
    peticion.flush({ aviso: '', total: 0, puntos: [] });
    fixture.detectChanges();

    const campo = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="fecha-inicio"]',
    ) as HTMLInputElement;
    expect(campo.value).toBe(desde);
  });

  it('vuelve a pedir los puntos cuando el filtro cambia', async () => {
    await flushInicial();
    fixture.detectChanges();

    fixture.componentInstance.onFiltroChange({ tipoSiniestro: 'Volcamiento' });
    await new Promise((resolve) => setTimeout(resolve, 300)); // debounce de 250ms

    const peticion = httpMock.expectOne(
      (req) =>
        req.url === `${API}/api/v1/siniestros/puntos` &&
        req.params.get('tipo_siniestro') === 'Volcamiento',
    );
    peticion.flush({ aviso: '', total: 0, puntos: [] });
    fixture.detectChanges();
  });

  it('muestra un mensaje (no el mapa) cuando la API devuelve 413 por demasiados puntos', async () => {
    httpMock.expectOne(`${API}/api/v1/siniestros/opciones-filtro`).flush(OPCIONES);
    await new Promise((resolve) => setTimeout(resolve, 300)); // debounce de 250ms
    httpMock
      .expectOne((req) => req.url === `${API}/api/v1/siniestros/puntos`)
      .flush(
        { detail: 'La consulta devuelve 89946 puntos; acotá con más filtros.' },
        { status: 413, statusText: 'Payload Too Large' },
      );
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('acotá con más filtros');
  });
});

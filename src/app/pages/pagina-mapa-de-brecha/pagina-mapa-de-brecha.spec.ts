import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../core/config/api-base-url.token';
import { ComparacionHistoricaResponse } from '../../core/models/comparacion-historica.model';
import { PaginaMapaDeBrecha } from './pagina-mapa-de-brecha';

const API = 'http://api.prueba.test';

describe('PaginaMapaDeBrecha', () => {
  let fixture: ComponentFixture<PaginaMapaDeBrecha>;
  let httpMock: HttpTestingController;

  const respuestaComparacion: ComparacionHistoricaResponse = {
    aviso: 'Diagnóstico, no predicción.',
    distritos: [
      { distrito_codigo: '01-01', nombre: 'San Salvador Centro', observado: 20, predicho: 18, brecha_pct: 10 },
      { distrito_codigo: '02-01', nombre: 'Santa Ana Centro', observado: 5, predicho: 6, brecha_pct: -20 },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: API },
      ],
    });
    fixture = TestBed.createComponent(PaginaMapaDeBrecha);
    fixture.detectChanges();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('pide la comparación histórica y el geojson al iniciar, y muestra el aviso de la API', () => {
    const peticionComparacion = httpMock.expectOne(`${API}/api/v1/comparacion-historica`);
    peticionComparacion.flush(respuestaComparacion);

    const peticionGeojson = httpMock.expectOne(`${API}/api/v1/distritos/geojson`);
    peticionGeojson.flush({ type: 'FeatureCollection', features: [] });

    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Diagnóstico, no predicción.');
  });

  it('muestra un mensaje de error si la comparación histórica falla', () => {
    const peticionComparacion = httpMock.expectOne(`${API}/api/v1/comparacion-historica`);
    peticionComparacion.flush('error interno', { status: 500, statusText: 'Internal Server Error' });

    const peticionGeojson = httpMock.expectOne(`${API}/api/v1/distritos/geojson`);
    peticionGeojson.flush({ type: 'FeatureCollection', features: [] });

    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto.toLowerCase()).toContain('error');
  });

  it('encabeza con el periodo de evaluación y explica la escala de ±50%', () => {
    httpMock.expectOne(`${API}/api/v1/comparacion-historica`).flush(respuestaComparacion);
    httpMock
      .expectOne(`${API}/api/v1/distritos/geojson`)
      .flush({ type: 'FeatureCollection', features: [] });
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Observado (2025-2026, periodo de evaluación)');
    expect(texto).toContain('±50%');
    expect(texto).toContain('Fuera de escala');
    expect(texto).toContain('Fuera del alcance del estudio');
    expect(texto).not.toContain('esas mismas filas');
  });

  it('el tooltip muestra observado, predicho y marca los extremos fuera de escala', () => {
    httpMock.expectOne(`${API}/api/v1/comparacion-historica`).flush(respuestaComparacion);
    httpMock
      .expectOne(`${API}/api/v1/distritos/geojson`)
      .flush({ type: 'FeatureCollection', features: [] });

    const pagina = fixture.componentInstance as unknown as {
      formatoTooltip: (d: unknown) => string;
    };
    const html = pagina.formatoTooltip({
      nombre: 'Distrito extremo',
      valorEsperado: 80,
      tercil: null,
      observado: 11058,
      predicho: 2000,
      fueraDeEscala: true,
    });
    expect(html).toContain('Observado: 11,058');
    expect(html).toContain('Predicho: 2,000');
    expect(html).toContain('+80.0%');
    expect(html).toContain('el modelo subestima');
    expect(html).toContain('Fuera de escala');
  });
});

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../core/config/api-base-url.token';
import { ModeloInfoResponse } from '../../core/models/modelo-info.model';
import { PaginaAcercaDelModelo } from './pagina-acerca-del-modelo';

const API = 'http://api.prueba.test';

const INFO_DE_PRUEBA: ModeloInfoResponse = {
  nombre: 'frecuencia_xgboost_offset_v2 (NB07)',
  fecha_entrenamiento: '2026-09-15T00:18:28',
  variables: ['es_lluviosa', 'pct_urbano'],
  offset: 'log_exposicion_v2 + log_tasa_base',
  metricas: { calibracion: 0.966979, RMSE: 0.412055, spearman_tercil_alto: 0.977519 },
  limitaciones: [
    'El tercil medio de distritos ordena mal (Spearman ~0.65).',
    'El conjunto de datos es sintético, calibrado sobre agregados de ONASEVI/FONAT (NB01).',
    'El submodelo de severidad (NB09) no se expone en esta API.',
  ],
};

describe('PaginaAcercaDelModelo', () => {
  let fixture: ComponentFixture<PaginaAcercaDelModelo>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: API },
      ],
    });
    fixture = TestBed.createComponent(PaginaAcercaDelModelo);
    fixture.detectChanges();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('muestra un estado de carga antes de que responda la API', () => {
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto.toLowerCase()).toContain('cargando');
    httpMock.expectOne(`${API}/api/v1/modelo/info`).flush(INFO_DE_PRUEBA);
  });

  it('muestra las métricas, variables y limitaciones completas cuando la API responde', () => {
    httpMock.expectOne(`${API}/api/v1/modelo/info`).flush(INFO_DE_PRUEBA);
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('0.966979');
    expect(texto).toContain('0.412055');
    expect(texto).toContain('es_lluviosa');
    for (const limitacion of INFO_DE_PRUEBA.limitaciones) {
      expect(texto).toContain(limitacion);
    }
  });

  it('avisa que la API todavía no expone la importancia SHAP, en vez de omitirlo en silencio', () => {
    httpMock.expectOne(`${API}/api/v1/modelo/info`).flush(INFO_DE_PRUEBA);
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('SHAP');
  });

  it('muestra un mensaje de error real si la API falla', () => {
    httpMock
      .expectOne(`${API}/api/v1/modelo/info`)
      .flush('falló', { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('error interno');
  });
});

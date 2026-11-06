import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../core/config/api-base-url.token';
import { ModeloInfoResponse } from '../../core/models/modelo-info.model';
import { PaginaAcercaDelModelo } from './pagina-acerca-del-modelo';

const API = 'http://api.prueba.test';

const METRICAS_FINAL = {
  MAE: 0.2,
  RMSE: 0.412055,
  media_predicha: 0.31,
  calibracion: 0.966979,
  spearman_global: 0.91,
  spearman_tercil_alto: 0.977519,
  objetivo: 0.3,
};

const INFO_DE_PRUEBA: ModeloInfoResponse = {
  nombre: 'frecuencia_xgboost_offset_v3',
  version_modelo: 'frecuencia_xgboost_offset_v3.pkl',
  fecha_entrenamiento: '2026-09-15T00:18:28',
  variables: ['es_lluviosa', 'pct_urbano'],
  offset: 'log_exposicion_v2 + log_tasa_base',
  metricas: METRICAS_FINAL,
  metricas_referencia_nb07: { ...METRICAS_FINAL, RMSE: 0.5, calibracion: 0.8 },
  pruebas_significancia: {
    t_pareada_mensual: { n_meses: 20, t: 3.1, p: 0.006, meses_que_mejora: 17 },
    diebold_mariano: { DM: -4.2, p: 0.0001, dias: 600 },
  },
  importancia_shap: [
    { variable: 'pct_urbano', valor: 0.2 },
    { variable: 'franja_cod', valor: 0.8 },
    { variable: 'pct_hogares_auto', valor: 0.5 },
  ],
  calibracion_por_franja: [
    { franja: 'Madrugada (00-05)', calibracion: 1.1 },
    { franja: 'Manana (06-11)', calibracion: 0.9 },
  ],
  limitaciones: [
    'El conjunto de datos es sintético, calibrado sobre agregados de ONASEVI/FONAT.',
    'El submodelo de severidad no se expone en esta API.',
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

  function cargar(): string {
    httpMock.expectOne(`${API}/api/v1/modelo/info`).flush(INFO_DE_PRUEBA);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  it('muestra métricas con etiquetas legibles y el nombre del modelo sin nombre de archivo', () => {
    const texto = cargar();
    expect(texto).toContain('Métricas del modelo final');
    expect(texto).toContain('Error absoluto medio');
    expect(texto).toContain('0.967');
    expect(texto).toContain('0.412');
    expect(texto).toContain('15 de septiembre de 2026');
    expect(texto).not.toContain('.pkl');
    expect(texto).not.toContain('NB');
    for (const limitacion of INFO_DE_PRUEBA.limitaciones) {
      expect(texto).toContain(limitacion);
    }
  });

  it('compara el modelo final con el anterior', () => {
    const texto = cargar();
    expect(texto).toContain('Modelo anterior');
    const filas = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '[data-seccion="comparacion"] tbody tr',
    );
    expect(filas.length).toBe(5);
    expect(filas[0].textContent).toContain('0.412');
    expect(filas[0].textContent).toContain('0.500');
  });

  it('muestra las pruebas de significancia', () => {
    const texto = cargar();
    expect(texto).toContain('17 de 20 meses');
    expect(texto).toContain('p = 0.006');
    expect(texto).toContain('p < 0.001');
  });

  it('dibuja el gráfico SHAP ordenado de mayor a menor con etiquetas legibles', () => {
    cargar();
    const el = fixture.nativeElement as HTMLElement;
    const etiquetas = Array.from(
      el.querySelectorAll('[data-grafico="shap"] .barra-etiqueta'),
    ).map((e) => e.textContent?.trim());
    expect(etiquetas).toEqual([
      'Franja horaria',
      '% de hogares con automóvil',
      '% de población urbana',
    ]);
    const anchos = Array.from(el.querySelectorAll<HTMLElement>('[data-barra-shap]')).map((b) =>
      parseFloat(b.style.width),
    );
    expect(anchos[0]).toBeCloseTo(100);
    expect(anchos[0]).toBeGreaterThan(anchos[1]);
    expect(anchos[1]).toBeGreaterThan(anchos[2]);
    expect(el.textContent).not.toContain('no la expone');
  });

  it('muestra la calibración por franja con línea de referencia en 1.0', () => {
    cargar();
    const el = fixture.nativeElement as HTMLElement;
    const referencias = el.querySelectorAll('[data-grafico="calibracion"] .referencia');
    expect(referencias.length).toBe(2);
    expect(el.textContent).toContain('Mañana (06-11)');
    expect(el.textContent).toContain('1.10');
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

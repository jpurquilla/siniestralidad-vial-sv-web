import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { API_BASE_URL } from '../config/api-base-url.token';
import { ModeloInfoService } from './modelo-info.service';
import { ModeloInfoResponse } from '../models/modelo-info.model';

const API_BASE_URL_DE_PRUEBA = 'http://api.prueba.test';

describe('ModeloInfoService', () => {
  let service: ModeloInfoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: API_BASE_URL_DE_PRUEBA },
      ],
    });
    service = TestBed.inject(ModeloInfoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('trae la información del modelo', () => {
    const metricas = {
      MAE: 0.2,
      RMSE: 0.412055,
      media_predicha: 0.3,
      calibracion: 0.966979,
      spearman_global: 0.9,
      spearman_tercil_alto: 0.97,
    };
    const respuestaEsperada: ModeloInfoResponse = {
      nombre: 'Modelo de frecuencia XGBoost',
      version_modelo: 'frecuencia_xgboost_offset_v3.pkl',
      fecha_entrenamiento: '2026-09-15T00:18:28',
      variables: ['es_lluviosa', 'pct_urbano'],
      offset: 'log_exposicion_v2 + log_tasa_base',
      metricas,
      metricas_referencia_nb07: metricas,
      pruebas_significancia: {
        t_pareada_mensual: { n_meses: 20, t: 3, p: 0.01, meses_que_mejora: 16 },
        diebold_mariano: { DM: -3, p: 0.002, dias: 500 },
      },
      importancia_shap: [{ variable: 'franja_cod', valor: 0.5 }],
      calibracion_por_franja: [{ franja: 'Tarde (12-17)', calibracion: 1.02 }],
      limitaciones: ['El conjunto de datos es sintético.'],
    };

    let resultado: ModeloInfoResponse | undefined;
    service.obtener().subscribe((datos) => (resultado = datos));

    const peticion = httpMock.expectOne(`${API_BASE_URL_DE_PRUEBA}/api/v1/modelo/info`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush(respuestaEsperada);

    expect(resultado).toEqual(respuestaEsperada);
  });

  it('propaga el error cuando /api/v1/modelo/info falla', () => {
    let errorRecibido: unknown;
    service.obtener().subscribe({
      next: () => {
        throw new Error('no debería emitir un valor');
      },
      error: (error: unknown) => (errorRecibido = error),
    });

    const peticion = httpMock.expectOne(`${API_BASE_URL_DE_PRUEBA}/api/v1/modelo/info`);
    peticion.flush('error interno', { status: 500, statusText: 'Internal Server Error' });

    expect(errorRecibido).toBeTruthy();
  });
});

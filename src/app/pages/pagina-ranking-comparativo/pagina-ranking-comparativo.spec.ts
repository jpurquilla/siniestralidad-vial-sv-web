import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../core/config/api-base-url.token';
import { ComparacionHistoricaResponse } from '../../core/models/comparacion-historica.model';
import { PaginaRankingComparativo } from './pagina-ranking-comparativo';

const API = 'http://api.prueba.test';

describe('PaginaRankingComparativo', () => {
  let fixture: ComponentFixture<PaginaRankingComparativo>;
  let httpMock: HttpTestingController;

  const respuesta: ComparacionHistoricaResponse = {
    aviso: 'Comparación diagnóstica, no predictiva.',
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
    fixture = TestBed.createComponent(PaginaRankingComparativo);
    fixture.detectChanges();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('pide la comparación histórica al iniciar y muestra el aviso de la API', () => {
    const peticion = httpMock.expectOne(`${API}/api/v1/comparacion-historica`);
    peticion.flush(respuesta);
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Comparación diagnóstica, no predictiva.');
    expect(texto).toContain('San Salvador Centro');
    expect(texto).toContain('Santa Ana Centro');
  });

  it('muestra un mensaje de error si la petición falla', () => {
    const peticion = httpMock.expectOne(`${API}/api/v1/comparacion-historica`);
    peticion.flush('error interno', { status: 500, statusText: 'Internal Server Error' });
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto.toLowerCase()).toContain('error');
  });
});

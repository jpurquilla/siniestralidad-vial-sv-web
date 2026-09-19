import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../core/config/api-base-url.token';
import { ImpactoLeyResponse } from '../../core/models/impacto-ley.model';
import { PaginaLeyCeroTolerancia } from './pagina-ley-cero-tolerancia';

const API = 'http://api.prueba.test';

describe('PaginaLeyCeroTolerancia', () => {
  let fixture: ComponentFixture<PaginaLeyCeroTolerancia>;
  let httpMock: HttpTestingController;

  const respuesta: ImpactoLeyResponse = {
    aviso: 'Esta pantalla es retrospectiva.',
    fecha_aprobacion_ley: '2024-12-20',
    serie_anual: [
      { anio: '2024', siniestros: 20300, fallecidos: 1300, letalidad: 6.4, cobertura: 'completa' },
      { anio: '2025', siniestros: 22265, fallecidos: 1238, letalidad: 5.56, cobertura: 'completa' },
    ],
    resumen: [
      {
        metrica: 'fallecidos',
        periodo: '2025',
        variacion_interanual_pct: -4.77,
        lectura: 'La ley coincide con la baja, no se puede afirmar causalidad.',
      },
    ],
    limitaciones: ['No hay grupo de control para aislar el efecto de la ley.'],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: API },
      ],
    });
    fixture = TestBed.createComponent(PaginaLeyCeroTolerancia);
    fixture.detectChanges();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('pide el impacto de la ley al iniciar y muestra la serie anual, el resumen y las limitaciones', () => {
    const peticion = httpMock.expectOne(`${API}/api/v1/impacto-ley-cero-tolerancia`);
    peticion.flush(respuesta);
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Esta pantalla es retrospectiva.');
    expect(texto).toContain('2024-12-20');
    expect(texto).toContain('22,265');
    expect(texto).toContain('La ley coincide con la baja');
    expect(texto).toContain('No hay grupo de control');
  });

  it('muestra un mensaje de error si la petición falla', () => {
    const peticion = httpMock.expectOne(`${API}/api/v1/impacto-ley-cero-tolerancia`);
    peticion.flush('error interno', { status: 500, statusText: 'Internal Server Error' });
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto.toLowerCase()).toContain('error');
  });
});

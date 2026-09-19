import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../core/config/api-base-url.token';
import { EquidadResponse } from '../../core/models/equidad.model';
import { PaginaEquidad } from './pagina-equidad';

const API = 'http://api.prueba.test';

describe('PaginaEquidad', () => {
  let fixture: ComponentFixture<PaginaEquidad>;
  let httpMock: HttpTestingController;

  const respuesta: EquidadResponse = {
    aviso: 'Comparación diagnóstica entre grupos.',
    urbano_rural: [
      { grupo: 'Urbano', calibracion: 0.98, spearman: 0.9, n_distritos: 84 },
      { grupo: 'Rural', calibracion: 1.15, spearman: 0.6, n_distritos: 19 },
    ],
    densidad_poblacional: [
      { grupo: 'Alta densidad', calibracion: 1.0, spearman: 0.88, n_distritos: 60 },
      { grupo: 'Baja densidad', calibracion: 1.1, spearman: 0.7, n_distritos: 43 },
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
    fixture = TestBed.createComponent(PaginaEquidad);
    fixture.detectChanges();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('pide la equidad al iniciar y muestra los dos cortes con su aviso', () => {
    const peticion = httpMock.expectOne(`${API}/api/v1/equidad`);
    peticion.flush(respuesta);
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Comparación diagnóstica entre grupos.');
    expect(texto).toContain('Urbano');
    expect(texto).toContain('Rural');
    expect(texto).toContain('Alta densidad');
    expect(texto).toContain('Baja densidad');
  });

  it('muestra un mensaje de error si la petición falla', () => {
    const peticion = httpMock.expectOne(`${API}/api/v1/equidad`);
    peticion.flush('error interno', { status: 500, statusText: 'Internal Server Error' });
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto.toLowerCase()).toContain('error');
  });
});

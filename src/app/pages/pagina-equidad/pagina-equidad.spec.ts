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

  it('interpreta la calibración como predicho/observado: > 1 sobreestima, < 1 subestima', () => {
    httpMock.expectOne(`${API}/api/v1/equidad`).flush({
      ...respuesta,
      urbano_rural: [
        { grupo: 'Urbano', calibracion: 0.8, spearman: 0.9, n_distritos: 84 },
        { grupo: 'Rural', calibracion: 1.2, spearman: 0.6, n_distritos: 19 },
      ],
    });
    fixture.detectChanges();

    const tarjetas = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '[data-tarjeta-grupo]',
    );
    expect(tarjetas[0].textContent).toContain('Subestima');
    expect(tarjetas[0].classList.contains('lectura-subestima')).toBe(true);
    expect(tarjetas[1].textContent).toContain('Sobreestima');
    expect(tarjetas[1].classList.contains('lectura-sobreestima')).toBe(true);
    expect(tarjetas[2].textContent).toContain('Calibrado');
  });

  it('explica la calibración y el periodo de evaluación sin jerga ni referencias internas', () => {
    httpMock.expectOne(`${API}/api/v1/equidad`).flush(respuesta);
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Calibración = siniestros predichos / observados. 1.00 es exacto.');
    expect(texto).toContain('Observado (2025-2026, periodo de evaluación)');
    expect(texto).toContain('El modelo no vio estos datos al entrenar');
    expect(texto).not.toMatch(/NB\d+|pct_urbano|sobre esas mismas filas/);
  });

  it('muestra un mensaje de error si la petición falla', () => {
    const peticion = httpMock.expectOne(`${API}/api/v1/equidad`);
    peticion.flush('error interno', { status: 500, statusText: 'Internal Server Error' });
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto.toLowerCase()).toContain('error');
  });

  it('muestra la nota de cautela en ambas secciones', () => {
    httpMock.expectOne(`${API}/api/v1/equidad`).flush(respuesta);
    fixture.detectChanges();
    const notas = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.nota-corte'),
    ).map((n) => n.textContent?.trim());
    expect(notas).toEqual([
      'Los grupos rural y de baja densidad tienen pocos distritos: leer su Spearman con cautela.',
      'Los grupos rural y de baja densidad tienen pocos distritos: leer su Spearman con cautela.',
    ]);
  });

  it('describe los grupos Urbano y Rural por su porcentaje de población urbana', () => {
    httpMock.expectOne(`${API}/api/v1/equidad`).flush(respuesta);
    fixture.detectChanges();
    const textos = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('[data-descripcion-grupo]'),
    ).map((n) => n.textContent?.trim());
    expect(textos).toEqual(['30% o más de población urbana', 'menos de 30% de población urbana']);
  });

  it('la leyenda indica el rango de «Calibrado» derivado de la tolerancia', () => {
    httpMock.expectOne(`${API}/api/v1/equidad`).flush(respuesta);
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-rango-calibrado]')?.textContent,
    ).toContain('Calibrado: entre 0.95 y 1.05');
  });
});

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { API_BASE_URL } from '../../core/config/api-base-url.token';
import { PaginaCalendario } from './pagina-calendario';

const API = 'http://api.prueba.test';

describe('PaginaCalendario', () => {
  let fixture: ComponentFixture<PaginaCalendario>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: API },
      ],
    });
    fixture = TestBed.createComponent(PaginaCalendario);
    fixture.detectChanges();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function flushDistritosYPredicciones(): void {
    httpMock.expectOne(`${API}/api/v1/distritos`).flush({
      total: 1,
      distritos: [
        {
          codigo: '01-01',
          nombre: 'Distrito uno',
          departamento: 'X',
          pct_urbano: 0.9,
          poblacion: 1000,
          poblacion_baja: false,
        },
      ],
    });
    fixture.detectChanges();

    const peticion = httpMock.expectOne(`${API}/api/v1/predicciones`);
    peticion.flush({
      aviso: '',
      predicciones: [
        {
          distrito_codigo: '01-01',
          fecha: '2026-08-15',
          franja: 'Tarde (12-17)',
          siniestros_esperados: 3,
          fuente_prcp: 'normal_climatologica',
          fuente_parque: 'observado',
        },
        {
          distrito_codigo: '01-01',
          fecha: '2026-08-16',
          franja: 'Tarde (12-17)',
          siniestros_esperados: 0.5,
          fuente_prcp: 'normal_climatologica',
          fuente_parque: 'observado',
        },
      ],
    });
  }

  it('pide predicciones para todo el mes (1 al 31 de agosto 2026)', () => {
    const peticionDistritos = httpMock.expectOne(`${API}/api/v1/distritos`);
    peticionDistritos.flush({
      total: 1,
      distritos: [
        {
          codigo: '01-01',
          nombre: 'Distrito uno',
          departamento: 'X',
          pct_urbano: 0.9,
          poblacion: 1000,
          poblacion_baja: false,
        },
      ],
    });
    fixture.detectChanges();

    const peticion = httpMock.expectOne(`${API}/api/v1/predicciones`);
    expect(peticion.request.body.fecha_inicio).toBe('2026-08-01');
    expect(peticion.request.body.fecha_fin).toBe('2026-08-31');
    peticion.flush({ aviso: '', predicciones: [] });
  });

  it('colorea los días con datos y navega al mapa con la fecha al hacer click', () => {
    flushDistritosYPredicciones();
    fixture.detectChanges();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const celdas = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.celda-dia:not(.vacia)',
    );
    const celdaDia15 = Array.from(celdas).find((c) => c.textContent?.trim() === '15') as
      | HTMLButtonElement
      | undefined;
    expect(celdaDia15).toBeTruthy();

    celdaDia15?.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/'], { queryParams: { fecha: '2026-08-15' } });
  });

  it('muestra un indicador y una grilla de carga mientras llegan las predicciones', () => {
    httpMock.expectOne(`${API}/api/v1/distritos`).flush({
      total: 1,
      distritos: [
        {
          codigo: '01-01',
          nombre: 'Distrito uno',
          departamento: 'X',
          pct_urbano: 0.9,
          poblacion: 1000,
          poblacion_baja: false,
        },
      ],
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role="progressbar"]')).toBeTruthy();
    expect(el.querySelectorAll('[data-grilla-carga] .esqueleto').length).toBe(42);

    httpMock.expectOne(`${API}/api/v1/predicciones`).flush({ aviso: '', predicciones: [] });
    fixture.detectChanges();
    expect(el.querySelector('[role="progressbar"]')).toBeNull();
  });

  it('escribe el mes como «Agosto de 2026» y muestra valor y diferencia respecto del promedio', () => {
    flushDistritosYPredicciones();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="etiqueta-mes"]')?.textContent?.trim()).toBe(
      'Agosto de 2026',
    );
    const celda = Array.from(el.querySelectorAll<HTMLButtonElement>('.celda-dia')).find(
      (c) => c.textContent?.trim() === '15',
    )!;
    expect(celda.title).toContain('15 de agosto de 2026');
    expect(celda.title).toContain('3.0 siniestros esperados en el país en el día');
    expect(celda.title).toContain('respecto del promedio del mes');

    celda.dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();
    expect(el.querySelector('[data-testid="lectura-dia"]')?.textContent).toContain('3.0');
    expect(el.querySelector('[data-leyenda-continua]')?.textContent).toContain(
      'respecto del promedio',
    );
  });

  it('usa texto oscuro sobre la celda más clara y claro sobre la más oscura', () => {
    flushDistritosYPredicciones();
    fixture.detectChanges();

    const celdas = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.celda-dia'),
    );
    const d15 = celdas.find((c) => c.textContent?.trim() === '15')!;
    const d16 = celdas.find((c) => c.textContent?.trim() === '16')!;
    expect(d15.style.color).toContain('255');
    expect(d16.style.color).not.toBe(d15.style.color);
  });

  it('muestra un mensaje de error real si fallan las predicciones del mes', () => {
    httpMock.expectOne(`${API}/api/v1/distritos`).flush({
      total: 1,
      distritos: [
        {
          codigo: '01-01',
          nombre: 'Distrito uno',
          departamento: 'X',
          pct_urbano: 0.9,
          poblacion: 1000,
          poblacion_baja: false,
        },
      ],
    });
    fixture.detectChanges();
    httpMock
      .expectOne(`${API}/api/v1/predicciones`)
      .flush('falló', { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    const error = (fixture.nativeElement as HTMLElement).querySelector('[data-error="calendario"]');
    expect(error?.textContent ?? '').toContain('error interno');
  });
});

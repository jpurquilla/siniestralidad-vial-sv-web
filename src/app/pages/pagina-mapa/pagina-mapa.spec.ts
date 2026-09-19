import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { API_BASE_URL } from '../../core/config/api-base-url.token';
import { RankingResponse } from '../../core/models/ranking.model';
import { SeleccionDistritoService } from '../../core/state/seleccion-distrito.service';
import { MapaDistritos } from '../../shared/components/mapa-distritos/mapa-distritos';
import { PaginaMapa } from './pagina-mapa';

const API = 'http://api.prueba.test';

const RANKING_DE_PRUEBA: RankingResponse = {
  aviso: '',
  fecha_inicio: '2024-06-15',
  fecha_fin: '2024-06-15',
  ranking: [
    {
      distrito_codigo: '01-01',
      nombre: 'Distrito uno',
      siniestros_esperados: 8,
      tercil: 'alto',
      confiabilidad_spearman: 0.9775,
    },
    {
      distrito_codigo: '02-02',
      nombre: 'Distrito dos',
      siniestros_esperados: 1,
      tercil: 'bajo',
      confiabilidad_spearman: 0.8003,
    },
  ],
};

describe('PaginaMapa', () => {
  let fixture: ComponentFixture<PaginaMapa>;
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
    fixture = TestBed.createComponent(PaginaMapa);
    fixture.detectChanges();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function flushArranqueBasico(): void {
    httpMock.expectOne(`${API}/api/v1/distritos`).flush({ total: 0, distritos: [] });
    httpMock
      .expectOne(`${API}/api/v1/distritos/geojson`)
      .flush({ type: 'FeatureCollection', features: [] });
    httpMock.expectOne((req) => req.url === `${API}/api/v1/ranking`).flush(RANKING_DE_PRUEBA);
  }

  function flushArranqueConDistritos(): void {
    httpMock.expectOne(`${API}/api/v1/distritos`).flush({
      total: 2,
      distritos: [
        {
          codigo: '01-01',
          nombre: 'Distrito uno',
          departamento: 'X',
          pct_urbano: 0.9,
          poblacion: 1000,
          poblacion_baja: false,
        },
        {
          codigo: '02-02',
          nombre: 'Distrito dos',
          departamento: 'X',
          pct_urbano: 0.5,
          poblacion: 2000,
          poblacion_baja: false,
        },
      ],
    });
    httpMock
      .expectOne(`${API}/api/v1/distritos/geojson`)
      .flush({ type: 'FeatureCollection', features: [] });
    httpMock.expectOne((req) => req.url === `${API}/api/v1/ranking`).flush(RANKING_DE_PRUEBA);
  }

  function esperar(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function flushDetalle(): Promise<void> {
    await esperar(300); // el pedido de detalle tiene debounce de 250ms
    httpMock.expectOne(`${API}/api/v1/predicciones`).flush({ aviso: '', predicciones: [] });
  }

  it('muestra el mensaje de error de distritos cuando la API falla', () => {
    httpMock
      .expectOne(`${API}/api/v1/distritos`)
      .flush('falló', { status: 500, statusText: 'Error' });
    httpMock
      .expectOne(`${API}/api/v1/distritos/geojson`)
      .flush({ type: 'FeatureCollection', features: [] });
    httpMock.expectOne((req) => req.url === `${API}/api/v1/ranking`).flush(RANKING_DE_PRUEBA);
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('error interno');
  });

  it('sincroniza la selección del ranking hacia el mapa', async () => {
    flushArranqueBasico();
    fixture.detectChanges();

    const primeraFila = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-fila]',
    ) as HTMLElement;
    primeraFila.click();
    fixture.detectChanges();

    await flushDetalle();
    fixture.detectChanges();

    const seleccion = TestBed.inject(SeleccionDistritoService);
    expect(seleccion.distritoSeleccionado()).toBe('01-01');
    const mapa = fixture.debugElement.query(By.directive(MapaDistritos))
      .componentInstance as MapaDistritos;
    expect(mapa.distritoSeleccionado()).toBe('01-01');
  });

  it('sincroniza la selección del mapa hacia el ranking', async () => {
    flushArranqueBasico();
    fixture.detectChanges();

    const mapa = fixture.debugElement.query(By.directive(MapaDistritos))
      .componentInstance as MapaDistritos;
    mapa.seleccionar.emit('02-02');
    fixture.detectChanges();

    await flushDetalle();
    fixture.detectChanges();

    const filaSeleccionada = (fixture.nativeElement as HTMLElement).querySelector(
      'li.seleccionado',
    ) as HTMLElement;
    expect(filaSeleccionada.textContent ?? '').toContain('Distrito dos');
  });

  it('muestra el mensaje de error del ranking cuando ese endpoint falla', () => {
    httpMock.expectOne(`${API}/api/v1/distritos`).flush({ total: 0, distritos: [] });
    httpMock
      .expectOne(`${API}/api/v1/distritos/geojson`)
      .flush({ type: 'FeatureCollection', features: [] });
    httpMock
      .expectOne((req) => req.url === `${API}/api/v1/ranking`)
      .flush('falló', { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    const error = (fixture.nativeElement as HTMLElement).querySelector('[data-error="ranking"]');
    expect(error?.textContent ?? '').toContain('error interno');
  });

  it('colorea el mapa con las predicciones de todos los distritos cuando llegan', async () => {
    flushArranqueConDistritos();
    fixture.detectChanges();

    await esperar(300); // debounce de 250ms del pedido de predicciones

    const peticion = httpMock.expectOne(`${API}/api/v1/predicciones`);
    expect(peticion.request.body.distritos).toEqual(['01-01', '02-02']);
    peticion.flush({
      aviso: '',
      predicciones: [
        {
          distrito_codigo: '01-01',
          fecha: '2024-06-15',
          franja: 'Tarde (12-17)',
          siniestros_esperados: 5,
          fuente_prcp: 'normal_climatologica',
        },
        {
          distrito_codigo: '02-02',
          fecha: '2024-06-15',
          franja: 'Tarde (12-17)',
          siniestros_esperados: 1,
          fuente_prcp: 'normal_climatologica',
        },
      ],
    });
    fixture.detectChanges();

    const mapa = fixture.debugElement.query(By.directive(MapaDistritos))
      .componentInstance as MapaDistritos;
    expect(mapa.datosPorDistrito().get('01-01')?.valorEsperado).toBe(5);
    expect(mapa.escala().clases.length).toBe(5);
  });

  it('muestra un error específico si fallan las predicciones que colorean el mapa', async () => {
    flushArranqueConDistritos();
    fixture.detectChanges();

    await esperar(300);

    httpMock
      .expectOne(`${API}/api/v1/predicciones`)
      .flush('falló', { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    const error = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-error="predicciones"]',
    );
    expect(error?.textContent ?? '').toContain('error interno');
  });

  it('cerrar el detalle limpia la selección compartida', async () => {
    // Con distritos reales, para que distritoDetalle() encuentre '01-01' y la
    // tarjeta (con el botón de cerrar) se renderice de verdad.
    flushArranqueConDistritos();
    fixture.detectChanges();

    const primeraFila = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-fila]',
    ) as HTMLElement;
    primeraFila.click();
    fixture.detectChanges();

    await esperar(300);
    for (const peticion of httpMock.match(`${API}/api/v1/predicciones`)) {
      peticion.flush({ aviso: '', predicciones: [] });
    }
    fixture.detectChanges();

    const seleccion = TestBed.inject(SeleccionDistritoService);
    expect(seleccion.distritoSeleccionado()).toBe('01-01');

    const botonCerrar = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-cerrar]',
    ) as HTMLElement;
    botonCerrar.click();
    fixture.detectChanges();

    expect(seleccion.distritoSeleccionado()).toBeNull();
  });
});

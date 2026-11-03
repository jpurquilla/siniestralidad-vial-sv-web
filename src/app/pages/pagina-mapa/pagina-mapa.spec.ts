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
    expect(mapa.escala().clases.length).toBe(6);
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

  function celda(codigo: string, franja: string, valor: number, extras: object = {}): object {
    return {
      distrito_codigo: codigo,
      fecha: '2024-06-15',
      franja,
      siniestros_esperados: valor,
      fuente_prcp: 'normal_climatologica',
      fuente_parque: 'observado',
      ...extras,
    };
  }

  it('al cambiar la franja vuelve a pedir la predicción y el ranking con la franja elegida', async () => {
    flushArranqueConDistritos();
    fixture.detectChanges();
    await esperar(300);
    httpMock
      .expectOne(`${API}/api/v1/predicciones`)
      .flush({ aviso: '', predicciones: [celda('01-01', 'Tarde (12-17)', 5)] });
    fixture.detectChanges();

    const select = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="franja"]',
    ) as HTMLSelectElement;
    select.value = 'Noche (18-23)';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await esperar(300);

    const prediccion = httpMock.expectOne(`${API}/api/v1/predicciones`);
    expect(prediccion.request.body.franjas).toEqual(['Noche (18-23)']);
    prediccion.flush({ aviso: '', predicciones: [celda('01-01', 'Noche (18-23)', 9)] });
    const ranking = httpMock.expectOne((req) => req.url === `${API}/api/v1/ranking`);
    expect(ranking.request.urlWithParams).toContain('Noche');
    ranking.flush(RANKING_DE_PRUEBA);
    fixture.detectChanges();

    const mapa = fixture.debugElement.query(By.directive(MapaDistritos))
      .componentInstance as MapaDistritos;
    expect(mapa.datosPorDistrito().get('01-01')?.valorEsperado).toBe(9);
  });

  it('avisa con discreción cuando la fecha usa el último parque vehicular disponible', async () => {
    flushArranqueConDistritos();
    fixture.detectChanges();
    await esperar(300);
    httpMock.expectOne(`${API}/api/v1/predicciones`).flush({
      aviso: '',
      predicciones: [celda('01-01', 'Tarde (12-17)', 5, { fuente_parque: 'ultimo_disponible' })],
    });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Para esta fecha se usa el último dato disponible de parque vehicular.',
    );
  });

  it('al hacer clic en un distrito del mapa se abre la tarjeta con nombre, población, % urbano y predicción por franja', async () => {
    flushArranqueConDistritos();
    fixture.detectChanges();

    const mapa = fixture.debugElement.query(By.directive(MapaDistritos))
      .componentInstance as MapaDistritos;
    mapa.seleccionar.emit('01-01');
    fixture.detectChanges();
    await esperar(300);

    for (const peticion of httpMock.match(`${API}/api/v1/predicciones`)) {
      const franjas = peticion.request.body.franjas as string[];
      peticion.flush({
        aviso: '',
        predicciones: franjas.map((f, i) => celda('01-01', f, i + 1)),
      });
    }
    fixture.detectChanges();

    const tarjeta = (fixture.nativeElement as HTMLElement).querySelector(
      'app-tarjeta-detalle-distrito',
    );
    const texto = tarjeta?.textContent ?? '';
    expect(texto).toContain('Distrito uno');
    expect(texto).toContain('1,000');
    expect(texto).toContain('90.0%');
    expect(texto).toContain('Mañana');
    expect(texto).toContain('06:00 a 11:59');
    expect(texto).toContain('Noche');
  });

  describe('escenario de precipitación relativo a la normal', () => {
    async function conLineaBase(): Promise<void> {
      flushArranqueConDistritos();
      fixture.detectChanges();
      await esperar(300);
      httpMock.expectOne(`${API}/api/v1/predicciones`).flush({
        aviso: '',
        predicciones: [celda('01-01', 'Tarde (12-17)', 4), celda('02-02', 'Tarde (12-17)', 6)],
      });
      fixture.detectChanges();
    }

    function moverDeslizador(pct: number): void {
      const range = (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="prcp"]',
      ) as HTMLInputElement;
      range.value = String(pct);
      range.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }

    it('inicia en 0% («Lluvia normal») y sin indicador de efecto ni cambios en el ranking', async () => {
      await conLineaBase();
      const el = fixture.nativeElement as HTMLElement;
      expect((el.querySelector('[data-testid="prcp"]') as HTMLInputElement).value).toBe('0');
      expect(el.querySelector('[data-testid="prcp-texto"]')?.textContent).toContain(
        'Lluvia normal',
      );
      expect(el.querySelector('[data-testid="prcp-efecto"]')).toBeNull();
      expect(
        Array.from(el.querySelectorAll('[data-diferencia]')).every((c) => c.textContent?.trim() === '–'),
      ).toBe(true);
    });

    it('envía factor_prcp (no prcp_mensual) en una sola petición para todos los distritos', async () => {
      await conLineaBase();
      moverDeslizador(50);
      await esperar(300);

      const escenario = httpMock.expectOne(`${API}/api/v1/predicciones`);
      expect(escenario.request.body.factor_prcp).toBe(0.5);
      expect(escenario.request.body.prcp_mensual).toBeUndefined();
      expect(escenario.request.body.distritos).toEqual(['01-01', '02-02']);
      escenario.flush({ aviso: '', predicciones: [] });
    });

    it('compara contra la normal: muestra el efecto en el total y el cambio % por distrito', async () => {
      await conLineaBase();
      moverDeslizador(50);
      await esperar(300);

      httpMock.expectOne(`${API}/api/v1/predicciones`).flush({
        aviso: '',
        predicciones: [
          celda('01-01', 'Tarde (12-17)', 5, { fuente_prcp: 'escenario_relativo' }),
          celda('02-02', 'Tarde (12-17)', 6, { fuente_prcp: 'escenario_relativo' }),
        ],
      });
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="prcp-texto"]')?.textContent).toContain(
        'Lluvia 50% mayor que lo normal',
      );
      // total normal 10 -> escenario 11
      expect(el.querySelector('[data-testid="prcp-efecto"]')?.textContent).toContain(
        '+10.0% de siniestros esperados',
      );
      const cambios = Array.from(el.querySelectorAll('[data-diferencia]')).map((d) =>
        d.textContent?.trim(),
      );
      expect(cambios).toEqual(['+25.0%', '–']);
      const mapa = fixture.debugElement.query(By.directive(MapaDistritos))
        .componentInstance as MapaDistritos;
      expect(mapa.datosPorDistrito().get('01-01')?.valorEsperado).toBe(5);
    });
  });

  describe('pestañas de la columna derecha', () => {
    const pestana = (id: 'tabla' | 'detalle') =>
      (fixture.nativeElement as HTMLElement).querySelector(`[data-pestana="${id}"]`) as HTMLButtonElement;
    const panel = (id: string) =>
      (fixture.nativeElement as HTMLElement).querySelector(`#panel-${id}`) as HTMLElement;

    async function seleccionarEnMapa(): Promise<void> {
      const mapa = fixture.debugElement.query(By.directive(MapaDistritos))
        .componentInstance as MapaDistritos;
      mapa.seleccionar.emit('01-01');
      fixture.detectChanges();
      await esperar(300);
      for (const peticion of httpMock.match(`${API}/api/v1/predicciones`)) {
        peticion.flush({ aviso: '', predicciones: [] });
      }
      fixture.detectChanges();
    }

    it('sin distrito seleccionado muestra solo la tabla y deshabilita la pestaña de la tarjeta', () => {
      flushArranqueConDistritos();
      fixture.detectChanges();
      expect(panel('tabla').hidden).toBe(false);
      expect(panel('detalle').hidden).toBe(true);
      expect(pestana('detalle').disabled).toBe(true);
    });

    it('un clic en el mapa activa la pestaña de la tarjeta y cerrar con la X vuelve a la tabla', async () => {
      flushArranqueConDistritos();
      fixture.detectChanges();
      await seleccionarEnMapa();

      expect(panel('detalle').hidden).toBe(false);
      expect(panel('tabla').hidden).toBe(true);
      expect(pestana('detalle').getAttribute('aria-selected')).toBe('true');

      ((fixture.nativeElement as HTMLElement).querySelector('[data-cerrar]') as HTMLElement).click();
      fixture.detectChanges();

      expect(panel('tabla').hidden).toBe(false);
      expect(panel('detalle').hidden).toBe(true);
    });

    it('seleccionar desde una fila abre la tarjeta y «Volver» regresa a la tabla con el distrito resaltado', async () => {
      flushArranqueConDistritos();
      fixture.detectChanges();
      ((fixture.nativeElement as HTMLElement).querySelector('[data-fila]') as HTMLElement).click();
      fixture.detectChanges();
      await esperar(300);
      for (const peticion of httpMock.match(`${API}/api/v1/predicciones`)) {
        peticion.flush({ aviso: '', predicciones: [] });
      }
      fixture.detectChanges();

      expect(panel('detalle').hidden).toBe(false);
      expect(panel('tabla').hidden).toBe(true);

      ((fixture.nativeElement as HTMLElement).querySelector('[data-volver]') as HTMLElement).click();
      fixture.detectChanges();

      expect(panel('tabla').hidden).toBe(false);
      expect(
        (fixture.nativeElement as HTMLElement).querySelector('li.seleccionado')?.textContent,
      ).toContain('Distrito uno');
      expect(TestBed.inject(SeleccionDistritoService).distritoSeleccionado()).toBe('01-01');
    });

    it('la X de la tarjeta deselecciona el distrito', async () => {
      flushArranqueConDistritos();
      fixture.detectChanges();
      await seleccionarEnMapa();
      ((fixture.nativeElement as HTMLElement).querySelector('[data-cerrar]') as HTMLElement).click();
      fixture.detectChanges();
      expect(TestBed.inject(SeleccionDistritoService).distritoSeleccionado()).toBeNull();
    });

    it('elegir un distrito en el buscador lo selecciona y abre su tarjeta', async () => {
      flushArranqueConDistritos();
      fixture.detectChanges();
      const input = (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="buscador"]',
      ) as HTMLInputElement;
      input.value = 'DOS';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      ((fixture.nativeElement as HTMLElement).querySelector('[data-sugerencia]') as HTMLElement).dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true, cancelable: true }),
      );
      fixture.detectChanges();
      await esperar(300);
      for (const peticion of httpMock.match(`${API}/api/v1/predicciones`)) {
        peticion.flush({ aviso: '', predicciones: [] });
      }
      fixture.detectChanges();

      expect(TestBed.inject(SeleccionDistritoService).distritoSeleccionado()).toBe('02-02');
      expect(panel('detalle').hidden).toBe(false);
    });

    it('la columna «Cambio por lluvia» solo aparece cuando el escenario deja de ser normal', async () => {
      flushArranqueConDistritos();
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-cabecera-cambio]')).toBeNull();
      const range = el.querySelector('[data-testid="prcp"]') as HTMLInputElement;
      range.value = '50';
      range.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(el.querySelector('[data-cabecera-cambio]')).not.toBeNull();
      await esperar(300);
      for (const peticion of httpMock.match(`${API}/api/v1/predicciones`)) {
        peticion.flush({ aviso: '', predicciones: [] });
      }
    });
  });

  it('la sección por causa sale de la respuesta del distrito y se actualiza al cambiar la franja', async () => {
    flushArranqueConDistritos();
    fixture.detectChanges();
    await esperar(300);
    httpMock.expectOne(`${API}/api/v1/predicciones`).flush({ aviso: '', predicciones: [] });

    const mapa = fixture.debugElement.query(By.directive(MapaDistritos)).componentInstance as MapaDistritos;
    mapa.seleccionar.emit('01-01');
    fixture.detectChanges();
    await esperar(300);

    const causas = (principal: string) => [
      { causa: principal, esperado: 0.5, proporcion: 0.5 },
      { causa: 'Otros', esperado: 0.5, proporcion: 0.5 },
    ];
    for (const peticion of httpMock.match(`${API}/api/v1/predicciones`)) {
      const franjas = peticion.request.body.franjas as string[];
      peticion.flush({
        aviso: '',
        predicciones: franjas.map((f) =>
          celda('01-01', f, 1, { por_causa: causas(f === 'Noche (18-23)' ? 'Velocidad Excesiva' : 'Invadir Carril') }),
        ),
      });
    }
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const frase = () => el.querySelector('[data-frase-causas]')?.textContent ?? '';
    expect(frase()).toContain('esta tarde');
    expect(frase()).toContain('invadir carril');

    const select = el.querySelector('[data-testid="franja"]') as HTMLSelectElement;
    select.value = 'Noche (18-23)';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(frase()).toContain('esta noche');
    expect(frase()).toContain('velocidad excesiva');
    await esperar(300);
    for (const peticion of httpMock.match(`${API}/api/v1/predicciones`)) {
      peticion.flush({ aviso: '', predicciones: [] });
    }
    for (const peticion of httpMock.match((r) => r.url === `${API}/api/v1/ranking`)) {
      peticion.flush(RANKING_DE_PRUEBA);
    }
  });
});

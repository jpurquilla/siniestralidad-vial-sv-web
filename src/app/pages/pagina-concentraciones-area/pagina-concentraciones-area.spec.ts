import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { API_BASE_URL } from '../../core/config/api-base-url.token';
import { App } from '../../app';
import { routes } from '../../app.routes';
import { PaginaConcentracionesArea } from './pagina-concentraciones-area';
import { PaginaConcentracionesDistrito } from '../pagina-concentraciones-distrito/pagina-concentraciones-distrito';

const API = 'http://api.prueba.test';
const OPCIONES = {
  tipos_siniestro: ['Colisión', 'Atropello'],
  tipos_vehiculo: ['Motocicleta'],
  factores_causantes: ['Distracción del Conductor'],
  departamentos: ['San Salvador', 'Cabañas'],
};
const HEX = {
  aviso: '',
  agregacion: 'hex',
  lado_km: 2,
  total: 12,
  hexagonos: [
    { id: '0_0', conteo: 10, distritos: ['San Salvador', 'Soyapango'], centro: [13.7, -89.2], vertices: [] },
    { id: '1_0', conteo: 2, distritos: ['Apopa'], centro: [13.8, -89.2], vertices: [] },
  ],
};
const DISTRITOS = {
  aviso: '',
  agregacion: 'distrito',
  total: 12,
  distritos: [
    { distrito_codigo: 'san salvador', nombre: 'San Salvador', departamento: 'San Salvador', siniestros: 10, poblacion: 100000, tasa_por_10mil: 1 },
    { distrito_codigo: 'apopa', nombre: 'Apopa', departamento: 'San Salvador', siniestros: 2, poblacion: 20000, tasa_por_10mil: 1 },
  ],
};

function esperar(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

describe('Páginas de concentraciones', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(routes),
        { provide: API_BASE_URL, useValue: API },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const agregadas = (url: string) =>
    url === `${API}/api/v1/siniestros/puntos`;

  async function abrirArea(url: string) {
    const harness = await RouterTestingHarness.create();
    const componente = await harness.navigateByUrl(url, PaginaConcentracionesArea);
    http.expectOne(`${API}/api/v1/siniestros/opciones-filtro`).flush(OPCIONES);
    await esperar(300);
    return { harness, componente };
  }

  it('A: pide los hexágonos con los filtros de la URL y agregacion=hex', async () => {
    const { harness } = await abrirArea(
      '/concentraciones-area?fecha_inicio=2025-01-01&tipo_siniestro=Colisi%C3%B3n&hora_inicio=06:00',
    );
    const peticion = http.expectOne((r) => agregadas(r.url));
    expect(peticion.request.params.get('agregacion')).toBe('hex');
    expect(peticion.request.params.get('fecha_inicio')).toBe('2025-01-01');
    expect(peticion.request.params.get('tipo_siniestro')).toBe('Colisión');
    expect(peticion.request.params.get('hora_inicio')).toBe('06:00');
    peticion.flush(HEX);
    harness.detectChanges();

    const el = harness.routeNativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="total"]')?.textContent).toContain('12 siniestros en 2 áreas');
    expect(el.textContent).toContain(
      'Las ubicaciones del conjunto de datos son simuladas y no tienen precisión por debajo de un kilómetro. Por eso el mapa muestra los siniestros agregados en áreas de 2 km. La forma circular de las concentraciones refleja el modo en que se simularon las ubicaciones.',
    );
    expect(el.querySelectorAll('[data-clase]').length).toBeGreaterThan(1);
  });

  it('A: los campos de filtro muestran los valores que vienen en la URL', async () => {
    const { harness } = await abrirArea(
      '/concentraciones-area?hora_inicio=06:00&departamento=Caba%C3%B1as&fecha_fin=2025-06-30',
    );
    http.expectOne((r) => agregadas(r.url)).flush(HEX);
    harness.detectChanges();
    const el = harness.routeNativeElement as HTMLElement;
    expect((el.querySelector('[data-testid="hora-inicio"]') as HTMLInputElement).value).toBe('06:00');
    expect((el.querySelector('[data-testid="fecha-fin"]') as HTMLInputElement).value).toBe('2025-06-30');
    expect((el.querySelector('[data-testid="departamento"]') as HTMLSelectElement).value).toBe('Cabañas');
  });

  it('A: cambiar un filtro actualiza la URL y vuelve a pedir los datos', async () => {
    const { harness } = await abrirArea('/concentraciones-area');
    http.expectOne((r) => agregadas(r.url)).flush(HEX);
    harness.detectChanges();

    const select = (harness.routeNativeElement as HTMLElement).querySelector(
      '[data-testid="tipo-siniestro"]',
    ) as HTMLSelectElement;
    select.value = 'Atropello';
    select.dispatchEvent(new Event('change'));
    await esperar(300);

    const nueva = http.expectOne((r) => agregadas(r.url));
    expect(nueva.request.params.get('tipo_siniestro')).toBe('Atropello');
    nueva.flush(HEX);
    expect(TestBed.inject(Router).url).toBe('/concentraciones-area?tipo_siniestro=Atropello');
  });

  it('«Ver la otra versión» lleva a la página B con los mismos filtros, que se usan en su pedido', async () => {
    const { harness } = await abrirArea(
      '/concentraciones-area?fecha_inicio=2024-03-01&departamento=San%20Salvador&tipo_vehiculo=Motocicleta',
    );
    http.expectOne((r) => agregadas(r.url)).flush(HEX);
    harness.detectChanges();

    const enlace = (harness.routeNativeElement as HTMLElement).querySelector(
      '[data-testid="otra-version"]',
    ) as HTMLAnchorElement;
    expect(enlace.getAttribute('href')).toContain('/concentraciones-distrito?');
    enlace.click();
    await harness.fixture.whenStable();
    await esperar(300);

    http.expectOne(`${API}/api/v1/siniestros/opciones-filtro`).flush(OPCIONES);
    http.expectOne(`${API}/api/v1/distritos/geojson`).flush({ type: 'FeatureCollection', features: [] });
    const peticion = http.expectOne((r) => agregadas(r.url));
    expect(peticion.request.params.get('agregacion')).toBe('distrito');
    expect(peticion.request.params.get('fecha_inicio')).toBe('2024-03-01');
    expect(peticion.request.params.get('departamento')).toBe('San Salvador');
    expect(peticion.request.params.get('tipo_vehiculo')).toBe('Motocicleta');
    peticion.flush(DISTRITOS);
  });

  it('desde B, «Ver la otra versión» vuelve a A con los mismos filtros', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(
      '/concentraciones-distrito?departamento=Caba%C3%B1as&hora_fin=11:59',
      PaginaConcentracionesDistrito,
    );
    http.expectOne(`${API}/api/v1/siniestros/opciones-filtro`).flush(OPCIONES);
    http.expectOne(`${API}/api/v1/distritos/geojson`).flush({ type: 'FeatureCollection', features: [] });
    await esperar(300);
    http.expectOne((r) => agregadas(r.url)).flush(DISTRITOS);
    harness.detectChanges();

    ((harness.routeNativeElement as HTMLElement).querySelector('[data-testid="otra-version"]') as HTMLElement).click();
    await harness.fixture.whenStable();
    await esperar(300);

    http.expectOne(`${API}/api/v1/siniestros/opciones-filtro`).flush(OPCIONES);
    const peticion = http.expectOne((r) => agregadas(r.url));
    expect(peticion.request.params.get('agregacion')).toBe('hex');
    expect(peticion.request.params.get('departamento')).toBe('Cabañas');
    expect(peticion.request.params.get('hora_fin')).toBe('11:59');
    peticion.flush(HEX);
  });

  it('el menú conserva los filtros al cambiar entre las dos páginas, pero no al ir a otras', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/concentraciones-area?tipo_siniestro=Atropello&fecha_inicio=2025-01-01');
    http.expectOne(`${API}/api/v1/siniestros/opciones-filtro`).flush(OPCIONES);
    await esperar(300);
    http.expectOne((r) => agregadas(r.url)).flush(HEX);

    const app = TestBed.createComponent(App);
    app.detectChanges();
    await app.whenStable();
    const enlaces = Array.from((app.nativeElement as HTMLElement).querySelectorAll('a.nav-item')) as HTMLAnchorElement[];
    const hacia = (ruta: string) => enlaces.find((a) => a.getAttribute('href')?.startsWith(ruta));

    expect(hacia('/concentraciones-distrito')?.getAttribute('href')).toBe(
      '/concentraciones-distrito?tipo_siniestro=Atropello&fecha_inicio=2025-01-01',
    );
    expect(hacia('/concentraciones-area')).toBeDefined();
    expect(hacia('/equidad')?.getAttribute('href')).toBe('/equidad');
    // El App monta otra vez la página actual en su <router-outlet>.
    for (const r of http.match(`${API}/api/v1/siniestros/opciones-filtro`)) {
      r.flush(OPCIONES);
    }
  });
});

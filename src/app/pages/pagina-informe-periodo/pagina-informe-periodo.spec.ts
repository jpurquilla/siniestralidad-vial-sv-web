import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { API_BASE_URL } from '../../core/config/api-base-url.token';
import { crearInformeFixture } from '../../core/informes/informe-periodo.fixture';
import { DescargaArchivo } from '../../core/informes/descargar-archivo';
import { routes } from '../../app.routes';
import { PaginaInformePeriodo } from './pagina-informe-periodo';

const API = 'http://api.prueba.test';
const DISTRITOS = {
  total: 2,
  distritos: [
    { codigo: 'san salvador', nombre: 'San Salvador', departamento: 'San Salvador', pct_urbano: 99, poblacion: 100000, poblacion_baja: false },
    { codigo: 'apopa', nombre: 'Apopa', departamento: 'San Salvador', pct_urbano: 90, poblacion: 50000, poblacion_baja: false },
  ],
};
const OPCIONES = { tipos_siniestro: [], tipos_vehiculo: [], factores_causantes: [], departamentos: ['San Salvador', 'Cabañas'] };

describe('PaginaInformePeriodo', () => {
  let http: HttpTestingController;

  const guardar = vi.fn();

  beforeEach(() => {
    guardar.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(routes),
        { provide: API_BASE_URL, useValue: API },
        { provide: DescargaArchivo, useValue: { guardar } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function abrir(url: string): Promise<{ harness: RouterTestingHarness; el: HTMLElement; informe: TestRequest }> {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url, PaginaInformePeriodo);
    http.expectOne(`${API}/api/v1/distritos`).flush(DISTRITOS);
    http.expectOne(`${API}/api/v1/siniestros/opciones-filtro`).flush(OPCIONES);
    const informe = http.expectOne(`${API}/api/v1/informes/periodo`);
    return { harness, el: harness.routeNativeElement as HTMLElement, informe };
  }

  const q = (el: HTMLElement, sel: string) => el.querySelector(sel) as HTMLElement;

  it('al abrir pide el informe con los parámetros de la URL y muestra el estado de carga', async () => {
    const { harness, el, informe } = await abrir(
      '/informe-periodo?fecha_inicio=2026-11-03&fecha_fin=2026-12-02&distritos=apopa&distritos=san%20salvador&franjas=Noche%20(18-23)&dias_semana=0&dias_semana=4&departamento=San%20Salvador',
    );
    expect(informe.request.method).toBe('POST');
    expect(informe.request.body).toEqual({
      fecha_inicio: '2026-11-03',
      fecha_fin: '2026-12-02',
      departamento: 'San Salvador',
      distritos: ['apopa', 'san salvador'],
      franjas: ['Noche (18-23)'],
      dias_semana: [0, 4],
    });
    expect(q(el, '[data-testid="cargando"]')).toBeTruthy();
    expect(q(el, '[data-testid="generar"]').hasAttribute('disabled')).toBe(true);
    informe.flush(crearInformeFixture());
    harness.detectChanges();
    expect(q(el, '[data-testid="cargando"]')).toBeNull();
    // chips con el nombre del catálogo
    expect(Array.from(el.querySelectorAll('[data-chip]')).map((c) => c.textContent)).toEqual([
      expect.stringContaining('Apopa'),
      expect.stringContaining('San Salvador'),
    ]);
  });

  async function conInforme(modificar?: (i: ReturnType<typeof crearInformeFixture>) => void) {
    const r = await abrir('/informe-periodo?fecha_inicio=2026-11-02&fecha_fin=2026-12-02');
    const datos = crearInformeFixture();
    modificar?.(datos);
    r.informe.flush(datos);
    r.harness.detectChanges();
    return { ...r, datos };
  }

  const texto = (e: Element) => e.textContent!.replace(/\s+/g, ' ').trim();

  it('muestra el texto del resumen y la Tabla 1 de 4 filas que vienen de la API', async () => {
    const { el, datos } = await conInforme();
    expect(texto(q(el, '[data-testid="resumen-texto"]'))).toBe(datos.resumen.texto);
    expect(texto(q(el, '[data-testid="resumen-texto"]'))).toContain('unos 1,982 siniestros en el país');
    const filas = Array.from(el.querySelectorAll('[data-fila-resumen]'));
    expect(filas.map((f) => texto(f.querySelector('th')!))).toEqual([
      'Total esperado',
      'Franja de mayor riesgo',
      'Día de mayor riesgo (promedio)',
      'Distrito con más siniestros esperados',
    ]);
    expect(filas.map((f) => texto(f.querySelector('td')!))).toEqual(datos.resumen.filas.map((f) => f.valor));
    // ya no hay tarjetas ni derivaciones locales del resumen
    expect(el.querySelector('[data-testid="resumen-total"]')).toBeNull();
    expect(el.querySelector('[data-testid="resumen-dia"]')).toBeNull();
  });

  it('renderiza las 10 prioridades con la columna «Esperado por día» y las veces', async () => {
    const { el, datos } = await conInforme();
    expect(el.querySelectorAll('[data-prioridad]').length).toBe(10);
    const cabeceras = Array.from(q(el, '[data-testid="prioridades"]').querySelectorAll('thead th')).map(texto);
    expect(cabeceras).toEqual(['#', 'Distrito', 'Día', 'Franja', 'Esperado por día', 'Veces en el periodo']);
    const primera = Array.from(el.querySelector('[data-prioridad]')!.children).map(texto);
    expect(primera[4]).toBe('4.2');
    expect(primera[5]).toBe(String(datos.prioridades[0].veces));
  });

  it('solo hay dos gráficos de causas: ya no existe el de distritos principales ni su dato', async () => {
    const { el, datos } = await conInforme();
    expect(q(el, 'app-grafico-causas-barras')).toBeTruthy();
    expect(q(el, 'app-grafico-causas-franja')).toBeTruthy();
    expect(el.querySelectorAll('[data-testid="causas"] figure').length).toBe(2);
    expect(el.querySelector('app-grafico-causas-distritos')).toBeNull();
    expect(el.textContent).not.toContain('distritos principales');
    expect(Object.keys(datos)).not.toContain('causas_por_franja_distritos');
    expect(q(el, 'app-grafico-dias-semana svg')).toBeTruthy();
    expect(el.querySelectorAll('[data-fila-calor]').length).toBe(20);
    expect(el.querySelectorAll('[data-fila-distrito]').length).toBe(103);
  });

  it('numera figuras y tablas con el orden fijo y pone «Fuente» bajo cada figura', async () => {
    const { el } = await conInforme();
    expect(Array.from(el.querySelectorAll('figcaption')).map(texto)).toEqual([
      'Figura 1. Siniestros esperados por causa en el periodo',
      'Figura 2. Composición de causas por franja horaria',
      'Figura 3. Siniestros esperados por día de la semana (promedio por día)',
      'Figura 4. Siniestros esperados por distrito y franja horaria',
    ]);
    const fuentes = Array.from(el.querySelectorAll('figure .fuente')).map(texto);
    expect(fuentes.length).toBe(4);
    for (const f of fuentes) {
      expect(f).toBe('Fuente: Radar Vial SV, modelo de frecuencia (NB12), con datos sintéticos calibrados a ONASEVI/FONAT.');
    }
    expect(texto(q(el, '#h-resumen'))).toBe('Tabla 1. Resumen');
    expect(texto(q(el, '#h-prioridades'))).toBe('Tabla 2. Dónde y cuándo concentrar los controles');
    expect(texto(q(el, '#h-tabla'))).toBe('Tabla 3. Siniestros esperados por distrito (todos)');
  });

  it('el aviso de datos sintéticos aparece una sola vez y no se repiten las notas bajo los gráficos', async () => {
    const { el } = await conInforme();
    expect(el.querySelectorAll('app-aviso-sintetico').length).toBe(1);
    expect(el.textContent).not.toContain('Son valores promedio: indican cómo suelen repartirse');
    const notas = Array.from(q(el, '[data-testid="causas"]').querySelectorAll('p')).map(texto);
    expect(notas.filter((n) => !n.startsWith('Fuente:')).length).toBeLessThanOrEqual(2);
  });

  it('títulos, encabezados y etiquetas en sentence case (sin mayúsculas sostenidas ni uppercase)', async () => {
    const { el } = await conInforme();
    const rotulos = Array.from(el.querySelectorAll('h2, h3, figcaption, th, legend, .etiqueta')).map(texto).filter((t) => /[a-záéíóú]/i.test(t));
    for (const t of rotulos) {
      expect(t, t).not.toBe(t.toUpperCase());
      expect(t, t).not.toMatch(/\b[A-ZÁÉÍÓÚ][a-záéíóú]+ [A-ZÁÉÍÓÚ][a-záéíóú]+ [A-ZÁÉÍÓÚ][a-záéíóú]+/); // «Título Con Cada Palabra»
    }
    for (const nombre of Array.from(el.querySelectorAll('[data-nombre-causa]')).map(texto)) {
      expect(nombre, nombre).toBe(nombre.charAt(0) + nombre.slice(1).toLowerCase());
    }
    for (const e of Array.from(el.querySelectorAll('h3, th, .etiqueta, figcaption')) as HTMLElement[]) {
      expect(getComputedStyle(e).textTransform, texto(e)).not.toBe('uppercase');
    }
  });

  it('los supuestos usan el texto breve de la lluvia, el del parque solo si aplica y no queda el texto viejo', async () => {
    const { el } = await conInforme();
    const supuestos = texto(q(el, '[data-testid="lista-supuestos"]'));
    expect(supuestos).toContain('La lluvia corresponde a la normal climatológica de cada mes.');
    expect(supuestos).toContain('En fechas sin dato de parque vehicular se usa el último dato disponible (31 de 31 días).');
    expect(supuestos).toContain('Los valores son promedios (esperados), no conteos observados.');
    expect(el.textContent).not.toContain('Precipitación: se usa la normal climatológica');
    expect(el.textContent).not.toContain('Días del periodo con la lluvia normal');
    expect(el.querySelectorAll('[data-limitacion]').length).toBe(6);
    expect(supuestos).toContain('Automóvil 49.2%');
  });

  it('sin días con último dato de parque no muestra esa línea', async () => {
    const { el } = await conInforme((d) => (d.supuestos.dias_con_ultimo_parque = 0));
    expect(el.querySelector('[data-supuesto="parque"]')).toBeNull();
    expect(el.querySelector('[data-supuesto="lluvia"]')).toBeTruthy();
  });

  it('los colores de las barras vienen de colores_causas de la respuesta', async () => {
    const { harness, el, informe } = await abrir('/informe-periodo');
    const datos = crearInformeFixture();
    datos.colores_causas['Distracción del conductor'] = '#abcdef';
    informe.flush(datos);
    harness.detectChanges();
    expect((q(el, '[data-barra-causa]') as HTMLElement).style.backgroundColor).toBe('rgb(171, 205, 239)');
  });

  it('sin parámetros usa hoy → +30 días y los escribe en la URL', async () => {
    const { harness, informe } = await abrir('/informe-periodo');
    informe.flush(crearInformeFixture());
    await harness.fixture.whenStable();
    const url = TestBed.inject(Router).url;
    expect(url).toMatch(/fecha_inicio=\d{4}-\d{2}-\d{2}&fecha_fin=\d{4}-\d{2}-\d{2}/);
  });

  it('cambiar el formulario actualiza la URL sin recalcular; «Generar informe» sí recalcula', async () => {
    const { harness, el, informe } = await abrir('/informe-periodo?fecha_inicio=2026-11-03&fecha_fin=2026-12-02');
    informe.flush(crearInformeFixture());
    harness.detectChanges();

    const noche = q(el, 'input[name="franjas"][value="Noche (18-23)"]') as HTMLInputElement;
    noche.checked = true;
    noche.dispatchEvent(new Event('change'));
    const viernes = q(el, 'input[name="dias_semana"][value="4"]') as HTMLInputElement;
    viernes.checked = true;
    viernes.dispatchEvent(new Event('change'));
    harness.detectChanges();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toContain('franjas=Noche%20(18-23)');
    expect(TestBed.inject(Router).url).toContain('dias_semana=4');
    http.expectNone(`${API}/api/v1/informes/periodo`);

    q(el, '[data-testid="generar"]').click();
    const nueva = http.expectOne(`${API}/api/v1/informes/periodo`);
    expect(nueva.request.body.franjas).toEqual(['Noche (18-23)']);
    expect(nueva.request.body.dias_semana).toEqual([4]);
    nueva.flush(crearInformeFixture());
  });

  it('agrega un distrito con el buscador, lo muestra como chip y se puede quitar', async () => {
    const { harness, el, informe } = await abrir('/informe-periodo?fecha_inicio=2026-11-03&fecha_fin=2026-12-02');
    informe.flush(crearInformeFixture());
    harness.detectChanges();
    const buscador = q(el, '[data-testid="buscador"]') as HTMLInputElement;
    buscador.value = 'apop';
    buscador.dispatchEvent(new Event('input'));
    harness.detectChanges();
    q(el, '[data-sugerencia]').dispatchEvent(new Event('mousedown'));
    harness.detectChanges();
    expect(el.querySelectorAll('[data-chip]').length).toBe(1);
    expect(buscador.value).toBe('');
    (q(el, '[data-chip] button') as HTMLButtonElement).click();
    harness.detectChanges();
    expect(el.querySelectorAll('[data-chip]').length).toBe(0);
  });

  it('muestra la validación de más de 92 días y bloquea el botón', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/informe-periodo?fecha_inicio=2026-01-01&fecha_fin=2026-12-31', PaginaInformePeriodo);
    http.expectOne(`${API}/api/v1/distritos`).flush(DISTRITOS);
    http.expectOne(`${API}/api/v1/siniestros/opciones-filtro`).flush(OPCIONES);
    http.expectNone(`${API}/api/v1/informes/periodo`);
    const el = harness.routeNativeElement as HTMLElement;
    harness.detectChanges();
    expect(q(el, '[data-testid="error-validacion"]').textContent).toContain('máximo es 92 días');
    expect(q(el, '[data-testid="generar"]').hasAttribute('disabled')).toBe(true);
  });

  it('muestra el mensaje de un 422 y de un 500', async () => {
    const { harness, el, informe } = await abrir('/informe-periodo?fecha_inicio=2026-11-03&fecha_fin=2026-12-02');
    informe.flush({ detail: 'El periodo no puede superar 92 días.' }, { status: 422, statusText: 'Unprocessable' });
    harness.detectChanges();
    expect(q(el, '[data-error="informe"]').textContent).toContain('El periodo no puede superar 92 días.');
    q(el, '[data-testid="generar"]').click();
    http.expectOne(`${API}/api/v1/informes/periodo`).flush('x', { status: 500, statusText: 'Error' });
    harness.detectChanges();
    expect(q(el, '[data-error="informe"]').textContent).toContain('error interno');
  });

  it('descarga el PDF: ruta y query correctas, botón en carga y archivo con el nombre del periodo', async () => {
    const { harness, el, informe } = await abrir(
      '/informe-periodo?fecha_inicio=2026-11-03&fecha_fin=2026-12-02&distritos=apopa&distritos=san%20salvador&dias_semana=4',
    );
    informe.flush(crearInformeFixture());
    harness.detectChanges();

    q(el, '[data-testid="descargar-pdf"]').click();
    harness.detectChanges();
    expect(q(el, '[data-testid="descargar-pdf"]').textContent).toContain('Generando PDF');
    expect(q(el, '[data-testid="descargar-pdf"]').hasAttribute('disabled')).toBe(true);
    expect(q(el, '[data-testid="descargar-xlsx"]').hasAttribute('disabled')).toBe(true);

    const req = http.expectOne((r) => r.url === `${API}/api/v1/informes/periodo.pdf`);
    expect(req.request.params.get('fecha_inicio')).toBe('2026-11-03');
    expect(req.request.params.get('fecha_fin')).toBe('2026-12-02');
    expect(req.request.params.getAll('distritos')).toEqual(['apopa', 'san salvador']);
    expect(req.request.params.getAll('dias_semana')).toEqual(['4']);
    req.flush(new Blob(['%PDF']));
    harness.detectChanges();

    expect(guardar).toHaveBeenCalledTimes(1);
    expect(guardar.mock.calls[0][1]).toBe('informe-siniestros-2026-11-03_2026-12-02.pdf');
    expect(q(el, '[data-testid="descargar-pdf"]').textContent).toContain('Descargar PDF');
  });

  it('descarga el Excel y muestra el error si falla', async () => {
    const { harness, el, informe } = await abrir('/informe-periodo?fecha_inicio=2026-11-03&fecha_fin=2026-12-02');
    informe.flush(crearInformeFixture());
    harness.detectChanges();
    q(el, '[data-testid="descargar-xlsx"]').click();
    http.expectOne((r) => r.url === `${API}/api/v1/informes/periodo.xlsx`).flush(new Blob(['x']), { status: 500, statusText: 'Error' });
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(guardar).not.toHaveBeenCalled();
    expect(q(el, '[data-error="descarga"]').textContent).toContain('No se pudo generar el Excel');
  });
});

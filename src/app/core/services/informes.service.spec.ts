import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../config/api-base-url.token';
import { crearInformeFixture } from '../informes/informe-periodo.fixture';
import { solicitudPorDefecto } from '../informes/solicitud-informe';
import { InformesService } from './informes.service';

const API = 'http://api.prueba.test';

describe('InformesService', () => {
  let servicio: InformesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: API }],
    });
    servicio = TestBed.inject(InformesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('POST con el cuerpo: omite los filtros vacíos', () => {
    let respuesta: unknown;
    servicio.periodo(solicitudPorDefecto('2026-11-02')).subscribe((r) => (respuesta = r));
    const req = http.expectOne(`${API}/api/v1/informes/periodo`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ fecha_inicio: '2026-11-02', fecha_fin: '2026-12-02' });
    req.flush(crearInformeFixture());
    expect(respuesta).toBeTruthy();
  });

  it('POST con filtros', () => {
    servicio
      .periodo({ ...solicitudPorDefecto('2026-11-02'), departamento: 'Cabañas', distritos: ['a'], franjas: ['Noche (18-23)'], dias_semana: [0, 6] })
      .subscribe();
    const req = http.expectOne(`${API}/api/v1/informes/periodo`);
    expect(req.request.body).toEqual({
      fecha_inicio: '2026-11-02',
      fecha_fin: '2026-12-02',
      departamento: 'Cabañas',
      distritos: ['a'],
      franjas: ['Noche (18-23)'],
      dias_semana: [0, 6],
    });
    req.flush(crearInformeFixture());
  });

  it('descarga por GET con la ruta del formato y las listas repetidas en la query', () => {
    let blob: Blob | undefined;
    servicio
      .descargar({ ...solicitudPorDefecto('2026-11-02'), distritos: ['a', 'b'], franjas: ['Noche (18-23)'], dias_semana: [0, 4], departamento: 'Cabañas' }, 'pdf')
      .subscribe((b) => (blob = b));
    const req = http.expectOne((r) => r.url === `${API}/api/v1/informes/periodo.pdf`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    expect(req.request.params.getAll('distritos')).toEqual(['a', 'b']);
    expect(req.request.params.getAll('dias_semana')).toEqual(['0', '4']);
    expect(req.request.params.get('fecha_inicio')).toBe('2026-11-02');
    expect(req.request.params.get('departamento')).toBe('Cabañas');
    req.flush(new Blob(['%PDF']));
    expect(blob?.size).toBe(4);
  });

  it('usa .xlsx para Excel', () => {
    servicio.descargar(solicitudPorDefecto('2026-11-02'), 'xlsx').subscribe();
    http.expectOne((r) => r.url === `${API}/api/v1/informes/periodo.xlsx`).flush(new Blob(['x']));
  });

  it('un error de descarga conserva el detalle JSON (el cuerpo llega como Blob)', async () => {
    const error = await new Promise<HttpErrorResponse>((resolve) => {
      servicio.descargar(solicitudPorDefecto('2026-11-02'), 'pdf').subscribe({ error: resolve });
      http
        .expectOne((r) => r.url.endsWith('.pdf'))
        .flush(new Blob([JSON.stringify({ detail: 'El periodo supera 92 días.' })]), { status: 422, statusText: 'Unprocessable' });
    });
    expect(error.status).toBe(422);
    expect((error.error as { detail: string }).detail).toBe('El periodo supera 92 días.');
  });
});

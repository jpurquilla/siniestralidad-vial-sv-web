import { TestBed } from '@angular/core/testing';
import * as L from 'leaflet';
import { MapaDistritos } from './mapa-distritos';
import { DistritoFeatureCollection } from '../../../core/models/distrito-geojson.model';
import { crearEscalaCoropletica } from '../../../core/mapa/escala-coropletica';

const GEOJSON_DE_PRUEBA: DistritoFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { codigo: '01-01' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-89.3, 13.6],
            [-89.2, 13.6],
            [-89.2, 13.7],
            [-89.3, 13.7],
            [-89.3, 13.6],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { codigo: '01-02' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-89.2, 13.6],
            [-89.1, 13.6],
            [-89.1, 13.7],
            [-89.2, 13.7],
            [-89.2, 13.6],
          ],
        ],
      },
    },
  ],
};

const escala = crearEscalaCoropletica([1, 5]);

function crear() {
  const fixture = TestBed.createComponent(MapaDistritos);
  fixture.componentRef.setInput('geojson', null);
  fixture.componentRef.setInput(
    'datosPorDistrito',
    new Map([
      ['01-01', { nombre: 'Distrito uno', valorEsperado: 1, tercil: 'bajo' as const }],
      ['01-02', { nombre: 'Distrito dos', valorEsperado: 5, tercil: 'alto' as const }],
    ]),
  );
  fixture.componentRef.setInput('escala', escala);
  fixture.componentRef.setInput('distritoSeleccionado', null);
  fixture.detectChanges();
  return fixture;
}

describe('MapaDistritos', () => {
  it('muestra un estado de carga cuando el geojson todavía es null', () => {
    const fixture = crear();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Cargando geometrías');
  });

  it('muestra el mensaje de "no disponible" en vez de un mapa vacío cuando la API responde 503', () => {
    const fixture = crear();
    fixture.componentRef.setInput('geojson', {
      estado: 'no_disponible',
      mensaje: 'Faltan las geometrías de distritos.',
    });
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Faltan las geometrías');
  });

  it('renderiza los polígonos y emite seleccionar al hacer click en uno', async () => {
    const fixture = crear();
    fixture.componentRef.setInput('geojson', { estado: 'ok', datos: GEOJSON_DE_PRUEBA });
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const emitidos: string[] = [];
    fixture.componentInstance.seleccionar.subscribe((v) => emitidos.push(v));

    const rutas = (fixture.nativeElement as HTMLElement).querySelectorAll('path');
    expect(rutas.length).toBe(2);

    (rutas[0] as unknown as SVGPathElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );

    expect(emitidos).toEqual(['01-01']);
  });

  it('no lanza si cambia la selección antes de que existan polígonos', () => {
    const fixture = crear();

    expect(() => {
      fixture.componentRef.setInput('distritoSeleccionado', '01-01');
      fixture.detectChanges();
    }).not.toThrow();
  });

  it('resalta con más grosor el polígono que coincide con distritoSeleccionado', async () => {
    const fixture = crear();
    fixture.componentRef.setInput('geojson', { estado: 'ok', datos: GEOJSON_DE_PRUEBA });
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => requestAnimationFrame(resolve));

    fixture.componentRef.setInput('distritoSeleccionado', '01-02');
    fixture.detectChanges();

    const rutas = (fixture.nativeElement as HTMLElement).querySelectorAll('path');
    expect(rutas[0].getAttribute('stroke-width')).toBe('1');
    expect(rutas[1].getAttribute('stroke-width')).toBe('3');
  });

  it('usa formatoTooltip cuando se lo pasan, en vez del texto por defecto de "siniestros esperados"', async () => {
    const fixture = crear();
    const formatoTooltip = vi.fn((dato: { nombre: string }) => `Brecha de ${dato.nombre}`);
    fixture.componentRef.setInput('formatoTooltip', formatoTooltip);
    fixture.componentRef.setInput('geojson', { estado: 'ok', datos: GEOJSON_DE_PRUEBA });
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(formatoTooltip).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Distrito uno' }),
    );
  });

  it('dibuja solo con contorno y rotula «Fuera del alcance del estudio» a los polígonos sin datos', async () => {
    const fixture = crear();
    const fuera = {
      type: 'Feature' as const,
      properties: { nombre_gadm: 'Apaneca' },
      geometry: GEOJSON_DE_PRUEBA.features[0].geometry,
    };
    fixture.componentRef.setInput('geojson', {
      estado: 'ok',
      datos: { ...GEOJSON_DE_PRUEBA, features: [...GEOJSON_DE_PRUEBA.features, fuera] },
    });
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const emitidos: string[] = [];
    fixture.componentInstance.seleccionar.subscribe((v) => emitidos.push(v));
    const rutas = (fixture.nativeElement as HTMLElement).querySelectorAll('path');
    expect(rutas.length).toBe(3);
    expect(rutas[2].getAttribute('fill-opacity')).toBe('0');
    expect(rutas[2].getAttribute('stroke-dasharray')).toBe('3 3');
    expect(rutas[0].getAttribute('fill-opacity')).not.toBe('0');

    (rutas[2] as unknown as SVGPathElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    expect(emitidos).toEqual([]);

    const capa = (fixture.componentInstance as unknown as { capaDistritos: L.GeoJSON })
      .capaDistritos;
    const tooltips: string[] = [];
    capa.eachLayer((l) => tooltips.push(String(l.getTooltip()?.getContent())));
    expect(tooltips[2]).toContain('Apaneca');
    expect(tooltips[2]).toContain('Fuera del alcance del estudio');
    expect(tooltips[2]).not.toContain('Sin dato');
  });

  it('marca con borde discontinuo grueso los distritos fuera de escala', async () => {
    const fixture = crear();
    fixture.componentRef.setInput(
      'datosPorDistrito',
      new Map([
        ['01-01', { nombre: 'Distrito uno', valorEsperado: 90, tercil: null, fueraDeEscala: true }],
        ['01-02', { nombre: 'Distrito dos', valorEsperado: 5, tercil: null }],
      ]),
    );
    fixture.componentRef.setInput('geojson', { estado: 'ok', datos: GEOJSON_DE_PRUEBA });
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const rutas = (fixture.nativeElement as HTMLElement).querySelectorAll('path');
    expect(rutas[0].getAttribute('stroke-dasharray')).toBe('5 3');
    expect(rutas[0].getAttribute('stroke-width')).toBe('2.5');
    expect(rutas[1].getAttribute('stroke-dasharray')).toBeNull();
  });
});

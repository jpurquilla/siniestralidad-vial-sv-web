import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as L from 'leaflet';

import { MapaHotspots } from './mapa-hotspots';
import { SiniestroPuntoOut } from '../../../core/models/siniestro-punto.model';

const PUNTOS: SiniestroPuntoOut[] = [
  {
    id_siniestro: 'SV-2022-000001',
    fecha: '2022-01-01',
    hora: '20:08',
    franja: 'Noche (18-23)',
    latitud: 14.037415,
    longitud: -89.572557,
    departamento: 'Santa Ana',
    distrito: 'Santa Ana',
    tipo_siniestro: 'Volcamiento',
    factor_causante: 'Distracción del Conductor',
    tipo_vehiculo: 'Motocicleta',
    fallecidos: 0,
    lesionados: 1,
  },
  {
    id_siniestro: 'SV-2022-000002',
    fecha: '2022-01-02',
    hora: '08:00',
    franja: 'Manana (06-11)',
    latitud: 13.7,
    longitud: -89.2,
    departamento: 'San Salvador',
    distrito: 'San Salvador',
    tipo_siniestro: 'Atropello',
    factor_causante: 'Imprudencia del Peatón',
    tipo_vehiculo: 'Automóvil',
    fallecidos: 1,
    lesionados: 0,
  },
];

function crear(): ComponentFixture<MapaHotspots> {
  const fixture = TestBed.createComponent(MapaHotspots);
  fixture.componentRef.setInput('puntos', []);
  fixture.detectChanges();
  return fixture;
}

describe('MapaHotspots', () => {
  it('no lanza al renderizar sin puntos', () => {
    expect(() => crear()).not.toThrow();
  });

  it('no lanza al recibir puntos reales con coordenadas de El Salvador', async () => {
    const fixture = crear();

    expect(() => {
      fixture.componentRef.setInput('puntos', PUNTOS);
      fixture.detectChanges();
    }).not.toThrow();

    await fixture.whenStable();
    await new Promise((resolve) => requestAnimationFrame(resolve));
  });

  it('no lanza al reemplazar una lista de puntos por otra más chica', async () => {
    const fixture = crear();
    fixture.componentRef.setInput('puntos', PUNTOS);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(() => {
      fixture.componentRef.setInput('puntos', [PUNTOS[0]]);
      fixture.detectChanges();
    }).not.toThrow();

    await fixture.whenStable();
    await new Promise((resolve) => requestAnimationFrame(resolve));
  });

  it('la capa de clusters queda agregada al mapa y con los datos reales, aunque el contenedor mida 0×0 (jsdom)', async () => {
    // jsdom nunca calcula layout real, así que no podemos comprobar íconos
    // en el DOM (el área "visible" del mapa siempre da 0×0 ahí — eso no es
    // un bug). Lo que sí es un bug real y comprobable: que la capa de
    // clusters quede huérfana del mapa para siempre porque el primer
    // pintado leyó tamaño 0 (ver comentario en mapa-hotspots.ts).
    const fixture = crear();
    fixture.componentRef.setInput('puntos', PUNTOS);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const instancia = fixture.componentInstance as unknown as {
      mapa?: L.Map;
      capaClusters?: L.MarkerClusterGroup;
    };
    expect(instancia.capaClusters).toBeDefined();
    expect(instancia.mapa?.hasLayer(instancia.capaClusters!)).toBe(true);
    expect(instancia.capaClusters!.getLayers().length).toBe(PUNTOS.length);
  });

  it('vuelve a medir el mapa con invalidateSize después de renderizar los puntos', async () => {
    const espia = vi.spyOn(L.Map.prototype, 'invalidateSize');
    const fixture = crear();
    fixture.componentRef.setInput('puntos', PUNTOS);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(espia).toHaveBeenCalled();
    espia.mockRestore();
  });

  it('configura el ícono por defecto con rutas propias, en vez de las rutas relativas rotas de Leaflet bajo Angular', () => {
    crear();

    const opciones = L.Icon.Default.prototype.options as L.IconOptions;
    expect(opciones.iconUrl).toBe('leaflet/marker-icon.png');
    expect(opciones.iconRetinaUrl).toBe('leaflet/marker-icon-2x.png');
    expect(opciones.shadowUrl).toBe('leaflet/marker-shadow.png');
  });
});

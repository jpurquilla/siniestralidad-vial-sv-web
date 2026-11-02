import { AfterViewInit, Component, ElementRef, OnDestroy, effect, input, viewChild } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet.markercluster';

import { formatearFechaLarga } from '../../../core/format/formato';
import { etiquetaFranja } from '../../../core/modelo/etiquetas-modelo';
import { SiniestroPuntoOut } from '../../../core/models/siniestro-punto.model';

const CENTRO_EL_SALVADOR: L.LatLngTuple = [13.7942, -88.8965];
const ZOOM_INICIAL = 9;

/**
 * El ícono por defecto de Leaflet resuelve sus 3 imágenes con rutas
 * relativas al CSS (`images/marker-icon.png`, etc.), que el bundler de
 * Angular no reescribe — el marcador se ve roto ("no se encuentra la
 * imagen") en cuanto un cluster se abre y expone un marcador individual.
 * Se resuelve apuntando a copias de esas mismas imágenes servidas desde
 * `public/leaflet/` (ver angular.json → assets).
 */
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'leaflet/marker-icon-2x.png',
  iconUrl: 'leaflet/marker-icon.png',
  shadowUrl: 'leaflet/marker-shadow.png',
});

/**
 * Mapa base real (OpenStreetMap) + clustering de marcadores, réplica de
 * observatoriovial.fonat.gob.sv — la única pantalla de la app con puntos en
 * vez de coropletas, autorizada explícitamente para esto (el aviso que la
 * acompaña aclara que los agrupamientos no son concentraciones viales
 * verificadas).
 */
@Component({
  selector: 'app-mapa-hotspots',
  imports: [],
  templateUrl: './mapa-hotspots.html',
  styleUrl: './mapa-hotspots.css',
})
export class MapaHotspots implements AfterViewInit, OnDestroy {
  readonly puntos = input.required<SiniestroPuntoOut[]>();

  private readonly contenedor = viewChild.required<ElementRef<HTMLDivElement>>('contenedor');

  private mapa?: L.Map;
  private capaClusters?: L.MarkerClusterGroup;
  private observador?: ResizeObserver;

  constructor() {
    effect(() => {
      const puntos = this.puntos();
      if (this.mapa) {
        this.pintarMarcadoresCuandoElContenedorSeVea(puntos);
      }
    });
  }

  ngAfterViewInit(): void {
    // maxZoom explícito en el mapa (no solo en la capa de tiles): sin esto,
    // el cálculo interno de bounds de leaflet.markercluster puede correr
    // antes de que la capa de tiles termine de registrar su maxZoom y
    // lanzar "Map has no maxZoom specified".
    this.mapa = L.map(this.contenedor().nativeElement, { maxZoom: 18 }).setView(
      CENTRO_EL_SALVADOR,
      ZOOM_INICIAL,
    );
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; colaboradores de OpenStreetMap',
      maxZoom: 18,
    }).addTo(this.mapa);

    this.capaClusters = L.markerClusterGroup();
    try {
      // En jsdom (tests) el contenedor mide 0×0: el cálculo interno de
      // bounds de leaflet.markercluster (_getExpandedVisibleBounds, en
      // onAdd) lee la posición del pane del mapa y explota con un
      // contenedor sin layout real. En un navegador real esto siempre
      // funciona. onAdd corre UNA sola vez acá — pintarMarcadores() nunca
      // vuelve a agregar/quitar esta capa, solo actualiza su contenido con
      // clearLayers()/addLayers(), así que ningún cambio de filtro futuro
      // puede volver a pisar este intento inicial.
      this.mapa.addLayer(this.capaClusters);
    } catch {
      // Silenciado a propósito: ver comentario arriba.
    }

    // Las teselas solo llenan el contenedor si Leaflet conoce su tamaño real:
    // se vuelve a medir cuando el layout termina y cada vez que el contenedor
    // cambia de tamaño (ventana, menú lateral, aspect-ratio del envoltorio).
    if (typeof ResizeObserver !== 'undefined') {
      this.observador = new ResizeObserver(() => this.mapa?.invalidateSize());
      this.observador.observe(this.contenedor().nativeElement);
    }

    this.pintarMarcadoresCuandoElContenedorSeVea(this.puntos());
  }

  ngOnDestroy(): void {
    this.observador?.disconnect();
    this.mapa?.remove();
  }

  private pintarMarcadoresCuandoElContenedorSeVea(puntos: SiniestroPuntoOut[]): void {
    requestAnimationFrame(() => {
      this.mapa?.invalidateSize();
      this.pintarMarcadores(puntos);
    });
  }

  private pintarMarcadores(puntos: SiniestroPuntoOut[]): void {
    if (!this.mapa || !this.capaClusters) {
      return;
    }

    // clearLayers()/addLayers() actualizan el contenido de la capa ya
    // agregada al mapa (ver ngAfterViewInit) sin volver a llamar a onAdd —
    // a diferencia de remove()+addLayer(), esto nunca puede volver a
    // disparar el problema de _getExpandedVisibleBounds en jsdom.
    this.capaClusters.clearLayers();

    const marcadores = puntos.map((p) => {
      const marcador = L.marker([p.latitud, p.longitud]);
      marcador.bindPopup(
        `<strong>${p.tipo_siniestro}</strong><br>` +
          `${formatearFechaLarga(p.fecha)} · ${p.hora} (${etiquetaFranja(p.franja)})<br>` +
          `${p.distrito}, ${p.departamento}<br>` +
          `Vehículo: ${p.tipo_vehiculo} · Causa: ${p.factor_causante}<br>` +
          `Fallecidos: ${p.fallecidos} · Lesionados: ${p.lesionados}`,
      );
      return marcador;
    });
    this.capaClusters.addLayers(marcadores);
  }
}

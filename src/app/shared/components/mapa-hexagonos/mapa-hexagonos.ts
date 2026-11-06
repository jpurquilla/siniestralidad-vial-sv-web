import { AfterViewInit, Component, ElementRef, OnDestroy, effect, input, viewChild } from '@angular/core';
import * as L from 'leaflet';

import { formatearConteo } from '../../../core/format/formato';
import { escaparHtml } from '../../../core/format/html';
import { LIMITES_EL_SALVADOR, ZOOM_MAXIMO_CONCENTRACIONES } from '../../../core/mapa/limites-el-salvador';
import { EscalaCoropletica } from '../../../core/mapa/escala-coropletica';
import { HexagonoOut } from '../../../core/models/siniestro-punto.model';

const CENTRO_EL_SALVADOR: L.LatLngTuple = [13.7942, -88.8965];
const MAXIMO_DISTRITOS_EN_TOOLTIP = 4;

function textoDistritos(distritos: string[]): string {
  const mostrados = distritos.slice(0, MAXIMO_DISTRITOS_EN_TOOLTIP).map(escaparHtml).join(', ');
  const resto = distritos.length - MAXIMO_DISTRITOS_EN_TOOLTIP;
  return resto > 0 ? `${mostrados} y ${resto} más` : mostrados;
}

/** Contenido del tooltip de un hexágono: número de siniestros y distritos que abarca. */
export function tooltipHexagono(h: HexagonoOut): string {
  const etiqueta = h.conteo === 1 ? 'siniestro' : 'siniestros';
  return (
    `<strong>${formatearConteo(h.conteo)} ${etiqueta}</strong><br>` +
    `${h.distritos.length === 1 ? 'Distrito' : 'Distritos'}: ${textoDistritos(h.distritos)}`
  );
}

/**
 * Hexágonos de la grilla (2 km de lado) sobre el mapa base, coloreados por conteo.
 * Zoom máximo de nivel ciudad y navegación limitada a El Salvador.
 */
@Component({
  selector: 'app-mapa-hexagonos',
  imports: [],
  template: '<div #contenedor class="mapa"></div>',
  styles: [
    ':host { display: block; width: 100%; height: 100%; } .mapa { width: 100%; height: 100%; min-height: 240px; }',
  ],
})
export class MapaHexagonos implements AfterViewInit, OnDestroy {
  readonly hexagonos = input.required<HexagonoOut[]>();
  readonly escala = input.required<EscalaCoropletica>();

  private readonly contenedor = viewChild.required<ElementRef<HTMLDivElement>>('contenedor');

  private mapa?: L.Map;
  private capa?: L.FeatureGroup;
  private observador?: ResizeObserver;
  private interactuado = false;

  constructor() {
    effect(() => {
      const hexagonos = this.hexagonos();
      const escala = this.escala();
      if (this.mapa) {
        this.pintarCuandoElContenedorSeVea(hexagonos, escala);
      }
    });
  }

  ngAfterViewInit(): void {
    const el = this.contenedor().nativeElement;
    this.mapa = L.map(el, {
      maxZoom: ZOOM_MAXIMO_CONCENTRACIONES,
      maxBounds: LIMITES_EL_SALVADOR,
      maxBoundsViscosity: 1,
      zoomSnap: 0.1,
    }).setView(CENTRO_EL_SALVADOR, 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; colaboradores de OpenStreetMap',
      maxZoom: ZOOM_MAXIMO_CONCENTRACIONES,
    }).addTo(this.mapa);
    this.capa = L.featureGroup().addTo(this.mapa);

    const marcarInteraccion = () => (this.interactuado = true);
    el.addEventListener('wheel', marcarInteraccion, { passive: true });
    el.addEventListener('pointerdown', marcarInteraccion);

    if (typeof ResizeObserver !== 'undefined') {
      this.observador = new ResizeObserver(() => {
        if (!this.mapa || el.clientWidth === 0 || el.clientHeight === 0) {
          return;
        }
        this.mapa.invalidateSize();
        if (!this.interactuado) {
          this.encuadrar();
        }
      });
      this.observador.observe(el);
    }

    this.pintarCuandoElContenedorSeVea(this.hexagonos(), this.escala());
  }

  ngOnDestroy(): void {
    this.observador?.disconnect();
    this.mapa?.remove();
  }

  private encuadrar(): void {
    const tamano = this.mapa?.getSize();
    if (this.mapa && tamano && tamano.x > 0 && tamano.y > 0) {
      // En jsdom el contenedor mide 0×0 y fitBounds produce NaN; en un navegador real no.
      this.mapa.fitBounds(LIMITES_EL_SALVADOR, { animate: false });
    }
  }

  private pintarCuandoElContenedorSeVea(hexagonos: HexagonoOut[], escala: EscalaCoropletica): void {
    requestAnimationFrame(() => {
      this.mapa?.invalidateSize();
      this.pintar(hexagonos, escala);
    });
  }

  private pintar(hexagonos: HexagonoOut[], escala: EscalaCoropletica): void {
    if (!this.mapa || !this.capa) {
      return;
    }
    this.capa.clearLayers();
    for (const h of hexagonos) {
      L.polygon(h.vertices, {
        fillColor: escala.colorPara(h.conteo),
        fillOpacity: 0.72,
        color: '#ffffff',
        weight: 0.6,
      })
        .bindTooltip(tooltipHexagono(h), { sticky: true, direction: 'top', offset: [0, -10] })
        .addTo(this.capa);
    }
    if (!this.interactuado) {
      this.encuadrar();
    }
  }
}

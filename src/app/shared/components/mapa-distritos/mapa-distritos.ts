import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import * as L from 'leaflet';

import { codigoDeFeature, nombreDeFeature } from '../../../core/mapa/distrito-feature';
import { EscalaCoropletica } from '../../../core/mapa/escala-coropletica';
import {
  DistritoFeature,
  DistritoGeoJsonResultado,
} from '../../../core/models/distrito-geojson.model';
import { formatearDecimal } from '../../../core/format/formato';
import { escaparHtml } from '../../../core/format/html';
import { Tercil } from '../../../core/models/ranking.model';

export interface DatoDistritoMapa {
  nombre: string;
  valorEsperado: number;
  tercil: Tercil | null;
  /** Valores de apoyo para el tooltip del mapa de brecha. */
  observado?: number;
  predicho?: number;
  /** HTML (ya escapado) del tooltip; lo usa `formatoTooltip` en mapas con tooltip propio. */
  detalleTooltip?: string;
  /** El valor excede la escala del mapa: se pinta el color extremo y se marca el borde. */
  fueraDeEscala?: boolean;
}

export const TEXTO_FUERA_DEL_ALCANCE = 'Fuera del alcance del estudio';

/** Sticky: el tooltip sigue al cursor. Por defecto va arriba del cursor, para no tapar el distrito. */
const OPCIONES_TOOLTIP: L.TooltipOptions = { sticky: true, direction: 'top', offset: [0, -12] };
const COLOR_SELECCION = '#D62828';
const COLOR_HOVER = '#333333';
const ALTO_TOOLTIP_PX = 90;
const ANCHO_TOOLTIP_PX = 210;

const CENTRO_EL_SALVADOR: L.LatLngTuple = [13.7942, -88.8965];
const ZOOM_INICIAL = 8;

@Component({
  selector: 'app-mapa-distritos',
  imports: [],
  templateUrl: './mapa-distritos.html',
  styleUrl: './mapa-distritos.css',
})
export class MapaDistritos implements AfterViewInit, OnDestroy {
  readonly geojson = input.required<DistritoGeoJsonResultado | null>();
  readonly datosPorDistrito = input.required<Map<string, DatoDistritoMapa>>();
  readonly escala = input.required<EscalaCoropletica>();
  readonly distritoSeleccionado = input<string | null>(null);
  readonly formatoTooltip = input<(dato: DatoDistritoMapa) => string>(
    (dato) =>
      `<strong>${escaparHtml(dato.nombre)}</strong><br>${formatearDecimal(dato.valorEsperado, 2)} siniestros esperados en la franja seleccionada` +
      (dato.tercil ? `<br>Tercil ${dato.tercil}` : ''),
  );

  /** Zoom máximo y límites de navegación; sin valor, Leaflet no los acota. */
  readonly zoomMaximo = input<number | null>(null);
  readonly limites = input<L.LatLngBoundsExpression | null>(null);

  readonly seleccionar = output<string>();

  protected readonly estadoGeojson = computed(() => this.geojson()?.estado ?? 'cargando');
  protected readonly mensajeNoDisponible = computed(() => {
    const resultado = this.geojson();
    return resultado?.estado === 'no_disponible' ? resultado.mensaje : '';
  });

  private readonly contenedor = viewChild.required<ElementRef<HTMLDivElement>>('contenedor');

  private mapa?: L.Map;
  private capaDistritos?: L.GeoJSON;
  private vistaInicialAjustada = false;
  private codigoSeleccionado: string | null = null;
  private readonly capaPorFeature = new Map<DistritoFeature, L.Path>();
  private interactuado = false;
  private observador?: ResizeObserver;

  constructor() {
    effect(() => {
      const resultado = this.geojson();
      const datos = this.datosPorDistrito();
      const escala = this.escala();
      if (this.mapa && resultado?.estado === 'ok') {
        this.pintarCapaCuandoElContenedorSeVea(resultado.datos.features, datos, escala);
      }
    });

    effect(() => {
      const seleccionado = this.distritoSeleccionado();
      this.resaltarSeleccion(seleccionado);
    });
  }

  ngAfterViewInit(): void {
    const el = this.contenedor().nativeElement;
    // zoomSnap fraccionario: con el valor por defecto (1) fitBounds redondea el zoom
    // hacia abajo y deja el país flotando en un recuadro mucho más grande.
    this.mapa = L.map(el, {
      attributionControl: false,
      zoomSnap: 0.1,
      ...(this.zoomMaximo() !== null && { maxZoom: this.zoomMaximo() as number }),
      ...(this.limites() && { maxBounds: this.limites() as L.LatLngBoundsExpression, maxBoundsViscosity: 1 }),
    }).setView(
      CENTRO_EL_SALVADOR,
      ZOOM_INICIAL,
    );

    // Si el usuario ya movió o acercó el mapa, no se vuelve a encuadrar solo.
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
          this.encuadrarPais();
        }
      });
      this.observador.observe(el);
    }

    const resultado = this.geojson();
    if (resultado?.estado === 'ok') {
      this.pintarCapaCuandoElContenedorSeVea(
        resultado.datos.features,
        this.datosPorDistrito(),
        this.escala(),
      );
    }
  }

  ngOnDestroy(): void {
    this.observador?.disconnect();
    this.mapa?.remove();
  }

  /**
   * El contenedor estuvo `[hidden]` mientras el geojson cargaba, así que
   * Leaflet lo midió en 0×0 y cachea ese tamaño. Angular todavía no aplicó el
   * cambio de `[hidden]` al DOM real en el mismo tick en que corre este
   * efecto, así que `invalidateSize()` debe esperar al siguiente frame
   * pintado — llamarlo ya mismo repite la medición en 0×0 y los polígonos
   * quedan colapsados a un punto para siempre (nada dispara un repintado).
   */
  private pintarCapaCuandoElContenedorSeVea(
    features: DistritoFeature[],
    datos: Map<string, DatoDistritoMapa>,
    escala: EscalaCoropletica,
  ): void {
    requestAnimationFrame(() => {
      this.mapa?.invalidateSize();
      this.pintarCapa(features, datos, escala);
    });
  }

  private pintarCapa(
    features: DistritoFeature[],
    datos: Map<string, DatoDistritoMapa>,
    escala: EscalaCoropletica,
  ): void {
    if (!this.mapa) {
      return;
    }

    this.capaDistritos?.remove();
    this.capaPorFeature.clear();

    this.capaDistritos = L.geoJSON(
      { type: 'FeatureCollection', features } as GeoJSON.FeatureCollection,
      {
        style: (feature) => {
          const codigo = feature
            ? codigoDeFeature(feature as unknown as DistritoFeature)
            : undefined;
          const dato = codigo ? datos.get(codigo) : undefined;
          if (!dato) {
            // Fuera del alcance del estudio: solo contorno, sin relleno.
            return {
              fillColor: 'transparent',
              fillOpacity: 0,
              color: '#8a8a8a',
              weight: 0.8,
              dashArray: '3 3',
            };
          }
          if (codigo === this.codigoSeleccionado) {
            // Borde rojo y relleno de riesgo original, algo más claro (no se reemplaza).
            return {
              fillColor: escala.colorPara(dato.valorEsperado),
              fillOpacity: 0.6,
              color: COLOR_SELECCION,
              weight: 3,
            };
          }
          return {
            fillColor: escala.colorPara(dato.valorEsperado),
            fillOpacity: 0.85,
            color: dato.fueraDeEscala ? '#000000' : '#4d4d4d',
            weight: dato.fueraDeEscala ? 2.5 : 1,
            dashArray: dato.fueraDeEscala ? '5 3' : undefined,
          };
        },
        onEachFeature: (feature, capa) => {
          const f = feature as unknown as DistritoFeature;
          const codigo = codigoDeFeature(f);
          const dato = codigo ? datos.get(codigo) : undefined;
          this.capaPorFeature.set(f, capa as L.Path);
          // Debe registrarse ANTES de bindTooltip: Leaflet posiciona el tooltip en el
          // mismo evento y así la dirección ya viene corregida.
          capa.on('mouseover mousemove', (e) => this.orientarTooltip(capa, e as L.LeafletMouseEvent));
          if (!codigo || !dato) {
            capa.bindTooltip(
              `<strong>${escaparHtml(nombreDeFeature(f))}</strong><br>${TEXTO_FUERA_DEL_ALCANCE}`,
              OPCIONES_TOOLTIP,
            );
            return;
          }
          capa.bindTooltip(this.formatoTooltip()(dato), OPCIONES_TOOLTIP);
          capa.on('click', () => this.seleccionar.emit(codigo));
          const trazo = capa as L.Path;
          // Hover: borde gris oscuro de 2 px, distinto del rojo de la selección.
          capa.on('mouseover', () => {
            if (codigo !== this.codigoSeleccionado) {
              trazo.setStyle({ color: COLOR_HOVER, weight: 2, dashArray: undefined });
              trazo.bringToFront();
            }
          });
          capa.on('mouseout', () => {
            this.capaDistritos?.resetStyle(trazo);
            this.traerSeleccionAlFrente();
          });
        },
      },
    ).addTo(this.mapa);

    if (!this.vistaInicialAjustada && features.length > 0) {
      this.encuadrarPais();
      this.vistaInicialAjustada = true;
    }
    this.traerSeleccionAlFrente();
  }

  /**
   * Centra y acerca el mapa a un distrito (también a los que están fuera del
   * alcance del estudio). Desde ahí el encuadre del país ya no se reaplica solo.
   */
  enfocar(feature: DistritoFeature): void {
    const capa = this.capaPorFeature.get(feature) as L.Polygon | undefined;
    if (!this.mapa || !capa) {
      return;
    }
    this.interactuado = true;
    this.mapa.fitBounds(capa.getBounds(), { padding: [40, 40], maxZoom: 11 });
  }

  /** Ajusta la vista a los límites de El Salvador (fitBounds sobre la capa de distritos). */
  private encuadrarPais(): void {
    if (!this.mapa || !this.capaDistritos) {
      return;
    }
    const limites = this.capaDistritos.getBounds();
    if (!limites.isValid()) {
      return;
    }
    const tamano = this.mapa.getSize();
    // En jsdom (tests) el contenedor mide 0×0: con padding, el cálculo interno de
    // zoom de Leaflet produce NaN. En un navegador real el tamaño siempre es > 0.
    if (tamano.x > 0 && tamano.y > 0) {
      this.mapa.fitBounds(limites, { padding: [4, 4], animate: false });
    } else {
      this.mapa.fitBounds(limites);
    }
  }

  /**
   * Arriba del cursor si cabe; si no (cursor cerca del borde superior) al costado,
   * hacia el lado con más espacio.
   */
  private orientarTooltip(capa: L.Layer, evento: L.LeafletMouseEvent): void {
    const tooltip = capa.getTooltip();
    const tamano = this.mapa?.getSize();
    if (!tooltip || !tamano) {
      return;
    }
    const { x, y } = evento.containerPoint;
    const cabeArriba =
      y >= ALTO_TOOLTIP_PX &&
      x >= ANCHO_TOOLTIP_PX / 2 &&
      x <= tamano.x - ANCHO_TOOLTIP_PX / 2;
    const direccion = cabeArriba ? 'top' : x > tamano.x / 2 ? 'left' : 'right';
    tooltip.options.direction = direccion;
    tooltip.options.offset = cabeArriba ? L.point(0, -12) : L.point(direccion === 'left' ? -12 : 12, 0);
  }

  private resaltarSeleccion(codigoSeleccionado: string | null): void {
    this.codigoSeleccionado = codigoSeleccionado;
    if (!this.capaDistritos) {
      return;
    }
    // El estilo de la selección sale de la función `style`, así que basta restablecer.
    this.capaDistritos.eachLayer((capa) => this.capaDistritos?.resetStyle(capa as L.Path));
    this.traerSeleccionAlFrente();
  }

  /** El borde rojo debe quedar por encima de los vecinos, que comparten frontera. */
  private traerSeleccionAlFrente(): void {
    if (!this.capaDistritos || this.codigoSeleccionado === null) {
      return;
    }
    this.capaDistritos.eachLayer((capa) => {
      const path = capa as L.Path & { feature?: DistritoFeature };
      if (path.feature && codigoDeFeature(path.feature) === this.codigoSeleccionado) {
        path.bringToFront();
      }
    });
  }
}

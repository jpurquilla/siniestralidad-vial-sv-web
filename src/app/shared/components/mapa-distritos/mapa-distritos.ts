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

import { codigoDeFeature } from '../../../core/mapa/distrito-feature';
import { EscalaCoropletica } from '../../../core/mapa/escala-coropletica';
import {
  DistritoFeature,
  DistritoGeoJsonResultado,
} from '../../../core/models/distrito-geojson.model';
import { formatearDecimal } from '../../../core/format/formato';
import { Tercil } from '../../../core/models/ranking.model';

export interface DatoDistritoMapa {
  nombre: string;
  valorEsperado: number;
  tercil: Tercil | null;
  /** Valores de apoyo para el tooltip del mapa de brecha. */
  observado?: number;
  predicho?: number;
  /** El valor excede la escala del mapa: se pinta el color extremo y se marca el borde. */
  fueraDeEscala?: boolean;
}

export const TEXTO_FUERA_DEL_ALCANCE = 'Fuera del alcance del estudio';

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function nombreDeFeature(feature: DistritoFeature): string {
  const p = feature.properties;
  for (const clave of ['nombre', 'nombre_gadm', 'Dis_min']) {
    if (typeof p[clave] === 'string' && p[clave]) {
      return p[clave] as string;
    }
  }
  return 'Distrito';
}

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
    this.mapa = L.map(this.contenedor().nativeElement, { attributionControl: false }).setView(
      CENTRO_EL_SALVADOR,
      ZOOM_INICIAL,
    );

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
          if (!codigo || !dato) {
            capa.bindTooltip(
              `<strong>${escaparHtml(nombreDeFeature(f))}</strong><br>${TEXTO_FUERA_DEL_ALCANCE}`,
            );
            return;
          }
          capa.bindTooltip(this.formatoTooltip()(dato));
          capa.on('click', () => this.seleccionar.emit(codigo));
        },
      },
    ).addTo(this.mapa);

    if (!this.vistaInicialAjustada && features.length > 0) {
      const limites = this.capaDistritos.getBounds();
      const tamanoContenedor = this.mapa.getSize();
      // En jsdom (tests) el contenedor mide 0×0: con padding, el cálculo
      // interno de zoom de Leaflet produce NaN y rompe cualquier evento
      // posterior. En un navegador real el tamaño siempre es > 0.
      if (tamanoContenedor.x > 0 && tamanoContenedor.y > 0) {
        this.mapa.fitBounds(limites, { padding: [12, 12] });
      } else {
        this.mapa.fitBounds(limites);
      }
      this.vistaInicialAjustada = true;
    }
  }

  private resaltarSeleccion(codigoSeleccionado: string | null): void {
    if (!this.capaDistritos) {
      return;
    }
    this.capaDistritos.eachLayer((capa) => {
      const path = capa as L.Path & { feature?: DistritoFeature };
      const codigo = path.feature ? codigoDeFeature(path.feature) : undefined;
      this.capaDistritos?.resetStyle(path);
      if (codigo !== undefined && codigo === codigoSeleccionado) {
        path.setStyle({ weight: 3 });
      }
    });
  }
}

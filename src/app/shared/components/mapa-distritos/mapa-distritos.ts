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
import { Tercil } from '../../../core/models/ranking.model';

export interface DatoDistritoMapa {
  nombre: string;
  valorEsperado: number;
  tercil: Tercil | null;
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
      `<strong>${dato.nombre}</strong><br>${dato.valorEsperado} siniestros esperados<br>tercil ${dato.tercil ?? 'sin dato'}`,
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
          return {
            fillColor: escala.colorPara(dato?.valorEsperado),
            fillOpacity: 0.85,
            color: '#4d4d4d',
            weight: 1,
          };
        },
        onEachFeature: (feature, capa) => {
          const codigo = codigoDeFeature(feature as unknown as DistritoFeature);
          if (!codigo) {
            return;
          }
          const dato = datos.get(codigo);
          if (dato) {
            capa.bindTooltip(this.formatoTooltip()(dato));
          }
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
      path.setStyle({ weight: codigo === codigoSeleccionado ? 3 : 1 });
    });
  }
}

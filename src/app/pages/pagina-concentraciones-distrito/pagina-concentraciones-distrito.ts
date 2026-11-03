import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, debounceTime, of, switchMap } from 'rxjs';

import { mensajeErrorHttp } from '../../core/errores/mensaje-error-http';
import { formatearConteo, formatearDecimal } from '../../core/format/formato';
import { ConteoPipe } from '../../core/format/formato.pipes';
import { escaparHtml } from '../../core/format/html';
import { crearEscalaConCeros } from '../../core/mapa/escala-con-ceros';
import { LIMITES_EL_SALVADOR, ZOOM_MAXIMO_CONCENTRACIONES } from '../../core/mapa/limites-el-salvador';
import { DistritoGeoJsonResultado } from '../../core/models/distrito-geojson.model';
import {
  DistritoAgregadoOut,
  FiltroSiniestros,
  OpcionesFiltroSiniestrosResponse,
} from '../../core/models/siniestro-punto.model';
import { DistritosService } from '../../core/services/distritos.service';
import { SiniestrosService } from '../../core/services/siniestros.service';
import { filtroDesdeParams, paramsDeFiltro } from '../../core/siniestros/filtro-url';
import { AvisoApi } from '../../shared/components/aviso-api/aviso-api';
import { BarraConcentraciones } from '../../shared/components/barra-concentraciones/barra-concentraciones';
import { LeyendaMapa } from '../../shared/components/leyenda-mapa/leyenda-mapa';
import {
  DatoDistritoMapa,
  MapaDistritos,
} from '../../shared/components/mapa-distritos/mapa-distritos';

export const AVISO_DISTRITO =
  'Las ubicaciones del conjunto de datos son simuladas y no tienen precisión por debajo de un kilómetro. Por eso el mapa muestra los siniestros agregados por distrito.';

export type Metrica = 'tasa' | 'numero';

@Component({
  selector: 'app-pagina-concentraciones-distrito',
  imports: [AvisoApi, BarraConcentraciones, ConteoPipe, LeyendaMapa, MapaDistritos],
  templateUrl: './pagina-concentraciones-distrito.html',
  styleUrl: '../concentraciones.css',
})
export class PaginaConcentracionesDistrito {
  private readonly siniestros = inject(SiniestrosService);
  private readonly distritosService = inject(DistritosService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  protected readonly aviso = AVISO_DISTRITO;
  protected readonly limites = LIMITES_EL_SALVADOR;
  protected readonly zoomMaximo = ZOOM_MAXIMO_CONCENTRACIONES;

  protected readonly filtroInicial = filtroDesdeParams(this.ruta.snapshot.queryParamMap);
  protected readonly filtro = signal<FiltroSiniestros>(this.filtroInicial);
  protected readonly metrica = signal<Metrica>(
    this.ruta.snapshot.queryParamMap.get('metrica') === 'numero' ? 'numero' : 'tasa',
  );
  protected readonly queryParams = computed(() => paramsDeFiltro(this.filtro()));

  protected readonly opciones = signal<OpcionesFiltroSiniestrosResponse | null>(null);
  protected readonly opcionesError = signal<string | null>(null);
  protected readonly geojson = signal<DistritoGeoJsonResultado | null>(null);
  protected readonly geojsonError = signal<string | null>(null);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly total = signal(0);
  protected readonly distritos = signal<DistritoAgregadoOut[]>([]);

  private readonly valor = (d: DistritoAgregadoOut) =>
    this.metrica() === 'tasa' ? d.tasa_por_10mil : d.siniestros;

  protected readonly datosPorDistrito = computed<Map<string, DatoDistritoMapa>>(() => {
    const datos = new Map<string, DatoDistritoMapa>();
    for (const d of this.distritos()) {
      datos.set(d.distrito_codigo, {
        nombre: d.nombre,
        valorEsperado: this.valor(d),
        tercil: null,
        detalleTooltip:
          `<strong>${escaparHtml(d.nombre)}</strong>, ${escaparHtml(d.departamento)}<br>` +
          `${formatearConteo(d.siniestros)} siniestros<br>` +
          `${formatearDecimal(d.tasa_por_10mil, 2)} por 10,000 habitantes`,
      });
    }
    return datos;
  });

  protected readonly escala = computed(() =>
    crearEscalaConCeros(
      this.distritos().map((d) => this.valor(d)),
      this.metrica() === 'tasa' ? 2 : 0,
    ),
  );

  protected readonly tituloLeyenda = computed(() =>
    this.metrica() === 'tasa'
      ? 'Siniestros por cada 10,000 habitantes'
      : 'Número de siniestros por distrito',
  );

  protected readonly formatoTooltip = (dato: DatoDistritoMapa): string => dato.detalleTooltip ?? '';

  constructor() {
    this.siniestros.opcionesFiltro().subscribe({
      next: (respuesta) => this.opciones.set(respuesta),
      error: (error: HttpErrorResponse) => this.opcionesError.set(mensajeErrorHttp(error)),
    });
    this.distritosService.geojson().subscribe({
      next: (resultado) => this.geojson.set(resultado),
      error: (error: HttpErrorResponse) => this.geojsonError.set(mensajeErrorHttp(error)),
    });

    toObservable(this.filtro)
      .pipe(
        debounceTime(250),
        switchMap((filtro) => {
          this.cargando.set(true);
          this.error.set(null);
          return this.siniestros.porDistrito(filtro).pipe(
            catchError((error: HttpErrorResponse) => {
              this.error.set(mensajeErrorHttp(error));
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((respuesta) => {
        this.cargando.set(false);
        if (respuesta) {
          this.total.set(respuesta.total);
          this.distritos.set(respuesta.distritos);
        }
      });
  }

  onFiltroChange(filtro: FiltroSiniestros): void {
    this.filtro.set(filtro);
    this.actualizarUrl();
  }

  protected onMetricaChange(evento: Event): void {
    this.metrica.set((evento.target as HTMLSelectElement).value === 'numero' ? 'numero' : 'tasa');
    this.actualizarUrl();
  }

  private actualizarUrl(): void {
    void this.router.navigate([], {
      relativeTo: this.ruta,
      queryParams: {
        ...paramsDeFiltro(this.filtro()),
        ...(this.metrica() === 'numero' && { metrica: 'numero' }),
      },
      replaceUrl: true,
    });
  }
}

import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, filter, of, switchMap } from 'rxjs';

import { mensajeErrorHttp } from '../../core/errores/mensaje-error-http';
import { crearEscalaCoropletica } from '../../core/mapa/escala-coropletica';
import { DistritoOut } from '../../core/models/distrito.model';
import { DistritoGeoJsonResultado } from '../../core/models/distrito-geojson.model';
import { FRANJAS, Franja } from '../../core/models/franja.model';
import { RankingItemOut } from '../../core/models/ranking.model';
import { DistritosService } from '../../core/services/distritos.service';
import { PrediccionesService } from '../../core/services/predicciones.service';
import { RankingService } from '../../core/services/ranking.service';
import { SeleccionDistritoService } from '../../core/state/seleccion-distrito.service';
import { AvisoSintetico } from '../../shared/components/aviso-sintetico/aviso-sintetico';
import { ControlesPrediccion } from '../../shared/components/controles-prediccion/controles-prediccion';
import { LeyendaMapa } from '../../shared/components/leyenda-mapa/leyenda-mapa';
import {
  DatoDistritoMapa,
  MapaDistritos,
} from '../../shared/components/mapa-distritos/mapa-distritos';
import { RankingPanel } from '../../shared/components/ranking-panel/ranking-panel';
import {
  PuntoSerieHoraria,
  TarjetaDetalleDistrito,
} from '../../shared/components/tarjeta-detalle-distrito/tarjeta-detalle-distrito';

const FECHA_INICIAL = '2024-06-15';
const FRANJA_INICIAL: Franja = 'Tarde (12-17)';

@Component({
  selector: 'app-pagina-mapa',
  imports: [
    AvisoSintetico,
    ControlesPrediccion,
    LeyendaMapa,
    MapaDistritos,
    RankingPanel,
    TarjetaDetalleDistrito,
  ],
  templateUrl: './pagina-mapa.html',
  styleUrl: './pagina-mapa.css',
})
export class PaginaMapa {
  private readonly distritosService = inject(DistritosService);
  private readonly prediccionesService = inject(PrediccionesService);
  private readonly rankingService = inject(RankingService);
  private readonly seleccion = inject(SeleccionDistritoService);
  private readonly ruta = inject(ActivatedRoute);

  protected readonly fecha = signal(
    this.ruta.snapshot.queryParamMap.get('fecha') ?? FECHA_INICIAL,
  );
  protected readonly franja = signal<Franja>(FRANJA_INICIAL);
  protected readonly prcpMensual = signal<number | null>(null);

  protected readonly distritoSeleccionado = this.seleccion.distritoSeleccionado;

  protected readonly distritos = signal<DistritoOut[]>([]);
  protected readonly distritosCargando = signal(true);
  protected readonly distritosError = signal<string | null>(null);

  protected readonly geojson = signal<DistritoGeoJsonResultado | null>(null);
  protected readonly geojsonError = signal<string | null>(null);

  protected readonly valoresPorDistrito = signal<Map<string, number>>(new Map());
  /** Normal climatológica (mm) por distrito para el mes consultado, según la API. */
  protected readonly prcpNormalPorDistrito = signal<Map<string, number>>(new Map());
  protected readonly usaUltimoParque = signal(false);
  protected readonly prediccionesCargando = signal(false);
  protected readonly prediccionesError = signal<string | null>(null);

  protected readonly ranking = signal<RankingItemOut[]>([]);
  protected readonly rankingCargando = signal(true);
  protected readonly rankingError = signal<string | null>(null);

  protected readonly serieHorariaDetalle = signal<PuntoSerieHoraria[]>([]);
  protected readonly detalleCargando = signal(false);
  protected readonly detalleError = signal<string | null>(null);

  /** Normal climatológica del distrito seleccionado o, sin selección, la mediana de los distritos. */
  protected readonly prcpNormal = computed<number | null>(() => {
    const normales = this.prcpNormalPorDistrito();
    const codigo = this.distritoSeleccionado();
    if (codigo && normales.has(codigo)) {
      return normales.get(codigo) ?? null;
    }
    const ordenados = [...normales.values()].sort((a, b) => a - b);
    if (ordenados.length === 0) {
      return null;
    }
    const medio = Math.floor(ordenados.length / 2);
    return ordenados.length % 2 === 1 ? ordenados[medio] : (ordenados[medio - 1] + ordenados[medio]) / 2;
  });

  protected readonly escala = computed(() =>
    crearEscalaCoropletica([...this.valoresPorDistrito().values()]),
  );

  protected readonly datosPorDistrito = computed<Map<string, DatoDistritoMapa>>(() => {
    const terciles = new Map(this.ranking().map((r) => [r.distrito_codigo, r.tercil]));
    const valores = this.valoresPorDistrito();
    const resultado = new Map<string, DatoDistritoMapa>();
    for (const d of this.distritos()) {
      resultado.set(d.codigo, {
        nombre: d.nombre,
        valorEsperado: valores.get(d.codigo) ?? 0,
        tercil: terciles.get(d.codigo) ?? null,
      });
    }
    return resultado;
  });

  protected readonly distritoDetalle = computed<DistritoOut | null>(() => {
    const codigo = this.distritoSeleccionado();
    return codigo ? (this.distritos().find((d) => d.codigo === codigo) ?? null) : null;
  });

  protected readonly tercilDetalle = computed(() => {
    const codigo = this.distritoSeleccionado();
    return codigo
      ? (this.ranking().find((r) => r.distrito_codigo === codigo)?.tercil ?? null)
      : null;
  });

  protected readonly valorEsperadoDetalle = computed<number | null>(() => {
    const punto = this.serieHorariaDetalle().find((p) => p.franja === this.franja());
    return punto?.valor ?? null;
  });

  constructor() {
    this.distritosService.listar().subscribe({
      next: (respuesta) => {
        this.distritos.set(respuesta.distritos);
        this.distritosCargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.distritosError.set(mensajeErrorHttp(error));
        this.distritosCargando.set(false);
      },
    });

    this.distritosService.geojson().subscribe({
      next: (resultado) => this.geojson.set(resultado),
      error: (error: HttpErrorResponse) => this.geojsonError.set(mensajeErrorHttp(error)),
    });

    toObservable(
      computed(() => ({
        fecha: this.fecha(),
        franja: this.franja(),
        prcpMensual: this.prcpMensual(),
        codigos: this.distritos().map((d) => d.codigo),
      })),
    )
      .pipe(
        debounceTime(250),
        filter((p) => p.codigos.length > 0),
        switchMap((p) => {
          this.prediccionesCargando.set(true);
          this.prediccionesError.set(null);
          return this.prediccionesService
            .predecir({
              distritos: p.codigos,
              fecha_inicio: p.fecha,
              fecha_fin: p.fecha,
              franjas: [p.franja],
              prcp_mensual: p.prcpMensual,
            })
            .pipe(
              catchError((error: HttpErrorResponse) => {
                this.prediccionesError.set(mensajeErrorHttp(error));
                return of(null);
              }),
            );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((respuesta) => {
        this.prediccionesCargando.set(false);
        if (respuesta) {
          this.valoresPorDistrito.set(
            new Map(respuesta.predicciones.map((p) => [p.distrito_codigo, p.siniestros_esperados])),
          );
          this.usaUltimoParque.set(
            respuesta.predicciones.some((p) => p.fuente_parque === 'ultimo_disponible'),
          );
          const normales = respuesta.predicciones.filter(
            (p) => p.fuente_prcp === 'normal_climatologica' && typeof p.prcp_mensual === 'number',
          );
          if (normales.length > 0) {
            this.prcpNormalPorDistrito.set(
              new Map(normales.map((p) => [p.distrito_codigo, p.prcp_mensual as number])),
            );
          }
        }
      });

    toObservable(computed(() => ({ fecha: this.fecha(), franja: this.franja() })))
      .pipe(
        distinctUntilChanged((a, b) => a.fecha === b.fecha && a.franja === b.franja),
        switchMap((p) => {
          this.rankingCargando.set(true);
          this.rankingError.set(null);
          return this.rankingService.obtener(p.fecha, p.fecha, [p.franja]).pipe(
            catchError((error: HttpErrorResponse) => {
              this.rankingError.set(mensajeErrorHttp(error));
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((respuesta) => {
        this.rankingCargando.set(false);
        if (respuesta) {
          this.ranking.set(respuesta.ranking);
        }
      });

    toObservable(
      computed(() => ({
        codigo: this.distritoSeleccionado(),
        fecha: this.fecha(),
        prcpMensual: this.prcpMensual(),
      })),
    )
      .pipe(
        debounceTime(250),
        switchMap((p) => {
          if (!p.codigo) {
            return of(null);
          }
          this.detalleCargando.set(true);
          this.detalleError.set(null);
          return this.prediccionesService
            .predecir({
              distritos: [p.codigo],
              fecha_inicio: p.fecha,
              fecha_fin: p.fecha,
              franjas: [...FRANJAS],
              prcp_mensual: p.prcpMensual,
            })
            .pipe(
              catchError((error: HttpErrorResponse) => {
                this.detalleError.set(mensajeErrorHttp(error));
                return of(null);
              }),
            );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((respuesta) => {
        this.detalleCargando.set(false);
        this.serieHorariaDetalle.set(
          respuesta
            ? respuesta.predicciones.map((p) => ({
                franja: p.franja,
                valor: p.siniestros_esperados,
              }))
            : [],
        );
      });
  }

  protected seleccionar(codigo: string): void {
    this.seleccion.seleccionar(codigo);
  }

  protected cerrarDetalle(): void {
    this.seleccion.seleccionar(null);
  }
}

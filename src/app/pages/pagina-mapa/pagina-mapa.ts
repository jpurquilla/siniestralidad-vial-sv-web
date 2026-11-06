import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, filter, of, switchMap } from 'rxjs';

import { mensajeErrorHttp } from '../../core/errores/mensaje-error-http';
import { hoyEnElSalvador } from '../../core/format/fecha-el-salvador';
import { codigoDeFeature, departamentoDeFeature, nombreDeFeature } from '../../core/mapa/distrito-feature';
import { crearEscalaCoropletica } from '../../core/mapa/escala-coropletica';
import { DistritoOut } from '../../core/models/distrito.model';
import { DistritoFeature, DistritoGeoJsonResultado } from '../../core/models/distrito-geojson.model';
import { FRANJAS, Franja } from '../../core/models/franja.model';
import { PrediccionResponse } from '../../core/models/prediccion.model';
import { CausaEsperada } from '../../core/models/prediccion.model';
import { RankingItemOut } from '../../core/models/ranking.model';
import { DistritosService } from '../../core/services/distritos.service';
import { PrediccionesService } from '../../core/services/predicciones.service';
import { RankingService } from '../../core/services/ranking.service';
import { SeleccionDistritoService } from '../../core/state/seleccion-distrito.service';
import {
  BuscadorDistrito,
  OpcionBusqueda,
} from '../../shared/components/buscador-distrito/buscador-distrito';
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

interface OpcionDistrito {
  codigo: string | null;
  feature: DistritoFeature | null;
}

const FRANJA_INICIAL: Franja = 'Tarde (12-17)';

@Component({
  selector: 'app-pagina-mapa',
  imports: [
    AvisoSintetico,
    BuscadorDistrito,
    ControlesPrediccion,
    LeyendaMapa,
    MapaDistritos,
    RankingPanel,
    TarjetaDetalleDistrito,
  ],
  host: { '(window:scroll)': 'alDesplazarPagina()' },
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
    this.ruta.snapshot.queryParamMap.get('fecha') ?? hoyEnElSalvador(),
  );
  protected readonly franja = signal<Franja>(FRANJA_INICIAL);
  /** Escenario de lluvia relativo a la normal de cada distrito, en % (-100 a +100); 0 = lluvia normal. */
  protected readonly escenarioPct = signal(0);

  protected readonly distritoSeleccionado = this.seleccion.distritoSeleccionado;

  private readonly mapa = viewChild(MapaDistritos);
  /** Scroll de la página con la tabla a la vista; en pantallas angostas la tabla scrollea con la página. */
  private scrollPaginaConTabla = 0;

  /** Un solo bloque a la vez en la columna derecha. */
  protected readonly pestana = signal<'tabla' | 'detalle'>('tabla');
  /** Sin distrito seleccionado la pestaña de la tarjeta no existe: se muestra la tabla. */
  protected readonly pestanaActiva = computed(() =>
    this.distritoSeleccionado() ? this.pestana() : 'tabla',
  );

  protected readonly distritos = signal<DistritoOut[]>([]);
  protected readonly distritosCargando = signal(true);
  protected readonly distritosError = signal<string | null>(null);

  protected readonly geojson = signal<DistritoGeoJsonResultado | null>(null);
  protected readonly geojsonError = signal<string | null>(null);

  /** Predicción con la normal climatológica (sin escenario): línea base del escenario. */
  protected readonly valoresNormalPorDistrito = signal<Map<string, number>>(new Map());
  /** Predicción con la precipitación elegida; vacío mientras no hay escenario. */
  private readonly valoresEscenarioPorDistrito = signal<Map<string, number>>(new Map());

  protected readonly valoresPorDistrito = computed(() =>
    this.escenarioPct() === 0 ? this.valoresNormalPorDistrito() : this.valoresEscenarioPorDistrito(),
  );

  /** Cambio porcentual por distrito (escenario frente a normal); null sin escenario. */
  protected readonly cambioPctPorDistrito = computed<Map<string, number> | null>(() => {
    if (this.escenarioPct() === 0) {
      return null;
    }
    const normal = this.valoresNormalPorDistrito();
    const escenario = this.valoresEscenarioPorDistrito();
    const resultado = new Map<string, number>();
    for (const [codigo, valor] of escenario) {
      const base = normal.get(codigo);
      if (base !== undefined && base > 0) {
        resultado.set(codigo, (valor / base - 1) * 100);
      }
    }
    return resultado.size > 0 ? resultado : null;
  });

  /** Variación (%) del total nacional esperado frente a la normal; null sin escenario o sin datos. */
  protected readonly variacionTotalPct = computed<number | null>(() => {
    const normal = this.valoresNormalPorDistrito();
    const escenario = this.valoresEscenarioPorDistrito();
    if (this.escenarioPct() === 0 || normal.size === 0 || escenario.size === 0) {
      return null;
    }
    const total = (m: Map<string, number>) => [...m.values()].reduce((a, b) => a + b, 0);
    const base = total(normal);
    return base > 0 ? (total(escenario) / base - 1) * 100 : null;
  });
  protected readonly usaUltimoParque = signal(false);
  protected readonly prediccionesCargando = signal(false);
  protected readonly prediccionesError = signal<string | null>(null);

  protected readonly ranking = signal<RankingItemOut[]>([]);
  protected readonly rankingCargando = signal(true);
  protected readonly rankingError = signal<string | null>(null);

  protected readonly serieHorariaDetalle = signal<PuntoSerieHoraria[]>([]);
  /** Reparto por causa de cada franja del distrito seleccionado (misma respuesta que la serie horaria). */
  private readonly porCausaDetalle = signal<Map<Franja, CausaEsperada[]>>(new Map());
  protected readonly porCausaFranja = computed(() => this.porCausaDetalle().get(this.franja()) ?? []);
  protected readonly detalleCargando = signal(false);
  protected readonly detalleError = signal<string | null>(null);

  /**
   * Opciones del buscador: los distritos del estudio (nombre y departamento de la API) más los
   * del GeoJSON que quedan fuera del alcance. Se identifican por id porque los nombres se repiten.
   */
  protected readonly opcionesBusqueda = computed<OpcionBusqueda<OpcionDistrito>[]>(() => {
    const porCodigo = new Map(this.distritos().map((d) => [d.codigo, d]));
    const resultado: OpcionBusqueda<OpcionDistrito>[] = [];
    const vistos = new Set<string>();
    const geo = this.geojson();
    const features = geo?.estado === 'ok' ? geo.datos.features : [];
    features.forEach((feature, indice) => {
      const codigo = codigoDeFeature(feature);
      const distrito = codigo ? porCodigo.get(codigo) : undefined;
      if (distrito) {
        vistos.add(distrito.codigo);
        resultado.push({
          id: distrito.codigo,
          nombre: distrito.nombre,
          departamento: distrito.departamento,
          enAlcance: true,
          referencia: { codigo: distrito.codigo, feature },
        });
      } else {
        resultado.push({
          id: `fuera-${indice}`,
          nombre: nombreDeFeature(feature),
          departamento: departamentoDeFeature(feature),
          enAlcance: false,
          referencia: { codigo: null, feature },
        });
      }
    });
    for (const d of this.distritos()) {
      if (!vistos.has(d.codigo)) {
        resultado.push({
          id: d.codigo,
          nombre: d.nombre,
          departamento: d.departamento,
          enAlcance: true,
          referencia: { codigo: d.codigo, feature: null },
        });
      }
    }
    return resultado;
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
    // Seleccionar un distrito (mapa, tabla o buscador) abre la pestaña de su tarjeta.
    effect(() => {
      if (this.distritoSeleccionado()) {
        this.pestana.set('detalle');
      }
    });

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

    // Línea base: normal climatológica (prcp_mensual = null). No depende del control de lluvia.
    toObservable(
      computed(() => ({
        fecha: this.fecha(),
        franja: this.franja(),
        codigos: this.distritos().map((d) => d.codigo),
      })),
    )
      .pipe(
        debounceTime(250),
        filter((p) => p.codigos.length > 0),
        switchMap((p) => {
          this.prediccionesCargando.set(true);
          this.prediccionesError.set(null);
          return this.pedirPrediccionesMapa(p.codigos, p.fecha, p.franja, null);
        }),
        takeUntilDestroyed(),
      )
      .subscribe((respuesta) => {
        this.prediccionesCargando.set(false);
        if (respuesta) {
          this.valoresNormalPorDistrito.set(this.aMapaDeValores(respuesta));
          this.usaUltimoParque.set(
            respuesta.predicciones.some((p) => p.fuente_parque === 'ultimo_disponible'),
          );
        }
      });

    // Escenario: predicción con la precipitación elegida. Sin escenario se vacía.
    toObservable(
      computed(() => ({
        fecha: this.fecha(),
        franja: this.franja(),
        escenarioPct: this.escenarioPct(),
        codigos: this.distritos().map((d) => d.codigo),
      })),
    )
      .pipe(
        debounceTime(250),
        filter((p) => p.codigos.length > 0),
        switchMap((p) => {
          if (p.escenarioPct === 0) {
            return of(null);
          }
          this.prediccionesCargando.set(true);
          this.prediccionesError.set(null);
          return this.pedirPrediccionesMapa(p.codigos, p.fecha, p.franja, p.escenarioPct / 100);
        }),
        takeUntilDestroyed(),
      )
      .subscribe((respuesta) => {
        if (this.escenarioPct() !== 0) {
          this.prediccionesCargando.set(false);
        }
        this.valoresEscenarioPorDistrito.set(respuesta ? this.aMapaDeValores(respuesta) : new Map());
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
        escenarioPct: this.escenarioPct(),
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
              factor_prcp: p.escenarioPct === 0 ? null : p.escenarioPct / 100,
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
        this.porCausaDetalle.set(
          new Map((respuesta?.predicciones ?? []).map((p) => [p.franja, p.por_causa ?? []])),
        );
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

  private pedirPrediccionesMapa(
    codigos: string[],
    fecha: string,
    franja: Franja,
    factorPrcp: number | null,
  ) {
    return this.prediccionesService
      .predecir({
        distritos: codigos,
        fecha_inicio: fecha,
        fecha_fin: fecha,
        franjas: [franja],
        factor_prcp: factorPrcp,
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.prediccionesError.set(mensajeErrorHttp(error));
          return of(null);
        }),
      );
  }

  private aMapaDeValores(respuesta: PrediccionResponse): Map<string, number> {
    return new Map(respuesta.predicciones.map((p) => [p.distrito_codigo, p.siniestros_esperados]));
  }

  protected seleccionar(codigo: string): void {
    this.seleccion.seleccionar(codigo);
  }

  /** Elegir en el buscador: selecciona, centra el mapa y abre la tarjeta (si está en el estudio). */
  protected elegirDeBuscador(opcion: OpcionBusqueda): void {
    const { codigo, feature } = opcion.referencia as OpcionDistrito;
    if (feature) {
      this.mapa()?.enfocar(feature);
    }
    if (opcion.enAlcance && codigo) {
      this.seleccion.seleccionar(codigo);
    }
  }

  /** Vuelve a la tabla conservando el distrito seleccionado (queda resaltado en su fila). */
  protected volverATabla(): void {
    this.pestana.set('tabla');
    requestAnimationFrame(() => window.scrollTo({ top: this.scrollPaginaConTabla }));
  }

  protected alDesplazarPagina(): void {
    if (this.pestanaActiva() === 'tabla') {
      this.scrollPaginaConTabla = window.scrollY;
    }
  }

  /** La X de la tarjeta también deselecciona el distrito del mapa. */
  protected cerrarDetalle(): void {
    this.seleccion.seleccionar(null);
    this.pestana.set('tabla');
  }
}

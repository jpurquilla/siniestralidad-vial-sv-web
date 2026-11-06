import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, debounceTime, of, switchMap } from 'rxjs';

import { mensajeErrorHttp } from '../../core/errores/mensaje-error-http';
import { ConteoPipe } from '../../core/format/formato.pipes';
import { crearEscalaLogaritmica } from '../../core/mapa/escala-logaritmica';
import {
  FiltroSiniestros,
  HexagonoOut,
  OpcionesFiltroSiniestrosResponse,
} from '../../core/models/siniestro-punto.model';
import { SiniestrosService } from '../../core/services/siniestros.service';
import { filtroDesdeParams, paramsDeFiltro } from '../../core/siniestros/filtro-url';
import { AvisoApi } from '../../shared/components/aviso-api/aviso-api';
import { BarraConcentraciones } from '../../shared/components/barra-concentraciones/barra-concentraciones';
import { LeyendaMapa } from '../../shared/components/leyenda-mapa/leyenda-mapa';
import { MapaHexagonos } from '../../shared/components/mapa-hexagonos/mapa-hexagonos';

export const AVISO_AREA =
  'Las ubicaciones del conjunto de datos son simuladas y no tienen precisión por debajo de un kilómetro. Por eso el mapa muestra los siniestros agregados en áreas de 2 km. La forma circular de las concentraciones refleja el modo en que se simularon las ubicaciones.';

@Component({
  selector: 'app-pagina-concentraciones-area',
  imports: [AvisoApi, BarraConcentraciones, ConteoPipe, LeyendaMapa, MapaHexagonos],
  templateUrl: './pagina-concentraciones-area.html',
  styleUrl: '../concentraciones.css',
})
export class PaginaConcentracionesArea {
  private readonly siniestros = inject(SiniestrosService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  protected readonly aviso = AVISO_AREA;
  /** Los filtros viven en la URL: al abrir la página (o llegar desde la otra versión) se leen de ahí. */
  protected readonly filtroInicial = filtroDesdeParams(this.ruta.snapshot.queryParamMap);
  protected readonly filtro = signal<FiltroSiniestros>(this.filtroInicial);
  protected readonly queryParams = computed(() => paramsDeFiltro(this.filtro()));

  protected readonly opciones = signal<OpcionesFiltroSiniestrosResponse | null>(null);
  protected readonly opcionesError = signal<string | null>(null);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly total = signal(0);
  protected readonly hexagonos = signal<HexagonoOut[]>([]);

  protected readonly escala = computed(() => crearEscalaLogaritmica(this.hexagonos().map((h) => h.conteo)));

  constructor() {
    this.siniestros.opcionesFiltro().subscribe({
      next: (respuesta) => this.opciones.set(respuesta),
      error: (error: HttpErrorResponse) => this.opcionesError.set(mensajeErrorHttp(error)),
    });

    toObservable(this.filtro)
      .pipe(
        debounceTime(250),
        switchMap((filtro) => {
          this.cargando.set(true);
          this.error.set(null);
          return this.siniestros.hexagonos(filtro).pipe(
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
          this.hexagonos.set(respuesta.hexagonos);
        }
      });
  }

  onFiltroChange(filtro: FiltroSiniestros): void {
    this.filtro.set(filtro);
    // replaceUrl: el filtro cambia con cada campo; no se llena el historial.
    void this.router.navigate([], {
      relativeTo: this.ruta,
      queryParams: paramsDeFiltro(filtro),
      replaceUrl: true,
    });
  }
}

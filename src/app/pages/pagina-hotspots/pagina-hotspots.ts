import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, of, switchMap } from 'rxjs';

import { mensajeErrorHttp } from '../../core/errores/mensaje-error-http';
import { FiltroSiniestros, OpcionesFiltroSiniestrosResponse, SiniestroPuntoOut } from '../../core/models/siniestro-punto.model';
import { SiniestrosService } from '../../core/services/siniestros.service';
import { AvisoApi } from '../../shared/components/aviso-api/aviso-api';
import { FiltrosHotspots } from '../../shared/components/filtros-hotspots/filtros-hotspots';
import { MapaHotspots } from '../../shared/components/mapa-hotspots/mapa-hotspots';

@Component({
  selector: 'app-pagina-hotspots',
  imports: [AvisoApi, DecimalPipe, FiltrosHotspots, MapaHotspots],
  templateUrl: './pagina-hotspots.html',
  styleUrl: './pagina-hotspots.css',
})
export class PaginaHotspots {
  private readonly siniestrosService = inject(SiniestrosService);

  protected readonly opciones = signal<OpcionesFiltroSiniestrosResponse | null>(null);
  protected readonly opcionesError = signal<string | null>(null);

  protected readonly filtro = signal<FiltroSiniestros>({});

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);
  protected readonly total = signal(0);
  protected readonly puntos = signal<SiniestroPuntoOut[]>([]);
  protected readonly demasiadosPuntos = signal<string | null>(null);

  protected readonly hayResultados = computed(() => !this.demasiadosPuntos() && !this.error());

  constructor() {
    this.siniestrosService.opcionesFiltro().subscribe({
      next: (respuesta) => this.opciones.set(respuesta),
      error: (error: HttpErrorResponse) => this.opcionesError.set(mensajeErrorHttp(error)),
    });

    toObservable(this.filtro)
      .pipe(
        debounceTime(250),
        switchMap((filtro) => {
          this.cargando.set(true);
          this.error.set(null);
          this.demasiadosPuntos.set(null);
          return this.siniestrosService.puntos(filtro).pipe(
            catchError((error: HttpErrorResponse) => {
              this.error.set(mensajeErrorHttp(error));
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((resultado) => {
        this.cargando.set(false);
        if (!resultado) {
          return;
        }
        if (resultado.estado === 'demasiados_puntos') {
          this.demasiadosPuntos.set(resultado.mensaje);
          this.puntos.set([]);
          this.total.set(0);
          return;
        }
        this.aviso.set(resultado.datos.aviso);
        this.total.set(resultado.datos.total);
        this.puntos.set(resultado.datos.puntos);
      });
  }

  onFiltroChange(filtro: FiltroSiniestros): void {
    this.filtro.set(filtro);
  }
}

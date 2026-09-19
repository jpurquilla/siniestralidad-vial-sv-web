import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, filter, of, switchMap } from 'rxjs';

import { construirGrillaCalendario } from '../../core/calendario/construir-grilla-calendario';
import { mensajeErrorHttp } from '../../core/errores/mensaje-error-http';
import { crearEscalaCoropletica } from '../../core/mapa/escala-coropletica';
import { FRANJAS } from '../../core/models/franja.model';
import { DistritosService } from '../../core/services/distritos.service';
import { PrediccionesService } from '../../core/services/predicciones.service';
import { AvisoSintetico } from '../../shared/components/aviso-sintetico/aviso-sintetico';
import { LeyendaMapa } from '../../shared/components/leyenda-mapa/leyenda-mapa';

export interface DiaCalendario {
  fecha: string | null;
  dia: number | null;
  color: string;
  seleccionable: boolean;
}

const ETIQUETAS_DIA_SEMANA = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

@Component({
  selector: 'app-pagina-calendario',
  imports: [AvisoSintetico, LeyendaMapa],
  templateUrl: './pagina-calendario.html',
  styleUrl: './pagina-calendario.css',
})
export class PaginaCalendario {
  private readonly distritosService = inject(DistritosService);
  private readonly prediccionesService = inject(PrediccionesService);
  private readonly router = inject(Router);

  protected readonly mesActual = signal(new Date(2026, 7, 1));
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly totalesPorDia = signal<Map<string, number>>(new Map());

  private readonly codigosDistritos = signal<string[]>([]);

  protected readonly etiquetasDiaSemana = ETIQUETAS_DIA_SEMANA;

  protected readonly etiquetaMes = computed(() =>
    this.mesActual().toLocaleDateString('es-SV', { month: 'long', year: 'numeric' }),
  );

  protected readonly escala = computed(() =>
    crearEscalaCoropletica([...this.totalesPorDia().values()]),
  );

  protected readonly diasGrilla = computed<DiaCalendario[]>(() => {
    const mes = this.mesActual();
    const totales = this.totalesPorDia();
    const escala = this.escala();

    return construirGrillaCalendario(mes.getFullYear(), mes.getMonth()).map((fecha) => {
      if (fecha === null) {
        return { fecha: null, dia: null, color: 'transparent', seleccionable: false };
      }
      const dia = Number(fecha.slice(-2));
      return {
        fecha,
        dia,
        color: escala.colorPara(totales.get(fecha) ?? null),
        seleccionable: totales.has(fecha),
      };
    });
  });

  constructor() {
    this.distritosService.listar().subscribe({
      next: (respuesta) => this.codigosDistritos.set(respuesta.distritos.map((d) => d.codigo)),
      error: (error: HttpErrorResponse) => this.error.set(mensajeErrorHttp(error)),
    });

    toObservable(computed(() => ({ mes: this.mesActual(), codigos: this.codigosDistritos() })))
      .pipe(
        filter((p) => p.codigos.length > 0),
        switchMap((p) => {
          this.cargando.set(true);
          this.error.set(null);
          const fechasDelMes = construirGrillaCalendario(
            p.mes.getFullYear(),
            p.mes.getMonth(),
          ).filter((f): f is string => f !== null);
          return this.prediccionesService
            .predecir({
              distritos: p.codigos,
              fecha_inicio: fechasDelMes[0],
              fecha_fin: fechasDelMes[fechasDelMes.length - 1],
              franjas: [...FRANJAS],
            })
            .pipe(
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
        if (!respuesta) {
          return;
        }
        const totales = new Map<string, number>();
        for (const p of respuesta.predicciones) {
          totales.set(p.fecha, (totales.get(p.fecha) ?? 0) + p.siniestros_esperados);
        }
        this.totalesPorDia.set(totales);
      });
  }

  protected mesAnterior(): void {
    this.mesActual.update((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  protected mesSiguiente(): void {
    this.mesActual.update((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  protected irAlMapa(fecha: string | null): void {
    if (!fecha) {
      return;
    }
    this.router.navigate(['/'], { queryParams: { fecha } });
  }
}

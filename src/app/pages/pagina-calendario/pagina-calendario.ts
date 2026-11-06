import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, filter, of, switchMap } from 'rxjs';

import { construirGrillaCalendario } from '../../core/calendario/construir-grilla-calendario';
import { mensajeErrorHttp } from '../../core/errores/mensaje-error-http';
import { mesInicialCalendario } from '../../core/format/fecha-el-salvador';
import {
  formatearDecimal,
  formatearFechaLarga,
  formatearMesAnio,
  formatearPorcentaje,
} from '../../core/format/formato';
import { GRADIENTE_CONTINUO, crearEscalaContinua } from '../../core/mapa/escala-continua';
import { FRANJAS } from '../../core/models/franja.model';
import { DistritosService } from '../../core/services/distritos.service';
import { PrediccionesService } from '../../core/services/predicciones.service';
import { AvisoSintetico } from '../../shared/components/aviso-sintetico/aviso-sintetico';

export interface DiaCalendario {
  fecha: string | null;
  dia: number | null;
  color: string;
  colorTexto: string;
  seleccionable: boolean;
  /** Texto para el cursor/lector de pantalla: fecha, total y diferencia respecto del promedio. */
  detalle: string;
}

/** Cantidad de celdas esqueleto mientras carga el mes (6 semanas × 7 días). */
const CELDAS_ESQUELETO = Array.from({ length: 42 }, (_, i) => i);

const ETIQUETAS_DIA_SEMANA = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

@Component({
  selector: 'app-pagina-calendario',
  imports: [AvisoSintetico],
  templateUrl: './pagina-calendario.html',
  styleUrl: './pagina-calendario.css',
})
export class PaginaCalendario {
  private readonly distritosService = inject(DistritosService);
  private readonly prediccionesService = inject(PrediccionesService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  protected readonly mesActual = signal(
    mesInicialCalendario(
      this.ruta.snapshot.queryParamMap.get('mes') ?? this.ruta.snapshot.queryParamMap.get('fecha'),
    ),
  );
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly totalesPorDia = signal<Map<string, number>>(new Map());

  private readonly codigosDistritos = signal<string[]>([]);

  protected readonly etiquetasDiaSemana = ETIQUETAS_DIA_SEMANA;

  protected readonly celdasEsqueleto = CELDAS_ESQUELETO;
  protected readonly gradiente = GRADIENTE_CONTINUO;
  /** Texto de la celda sobre la que está el cursor (o el foco), para lectura inmediata. */
  protected readonly detalleActivo = signal<string | null>(null);

  protected readonly etiquetaMes = computed(() => {
    const mes = this.mesActual();
    return formatearMesAnio(mes.getFullYear(), mes.getMonth());
  });

  protected readonly escala = computed(() => crearEscalaContinua([...this.totalesPorDia().values()]));

  /** Extremos de la leyenda: valor y diferencia respecto del promedio del mes. */
  protected readonly leyenda = computed(() => {
    const e = this.escala();
    if (!e) {
      return null;
    }
    return {
      minimo: formatearDecimal(e.minimo, 1),
      maximo: formatearDecimal(e.maximo, 1),
      promedio: formatearDecimal(e.promedio, 1),
      difMinimo: formatearPorcentaje(e.diferenciaPct(e.minimo), { conSigno: true }),
      difMaximo: formatearPorcentaje(e.diferenciaPct(e.maximo), { conSigno: true }),
    };
  });

  protected readonly diasGrilla = computed<DiaCalendario[]>(() => {
    const mes = this.mesActual();
    const totales = this.totalesPorDia();
    const escala = this.escala();

    return construirGrillaCalendario(mes.getFullYear(), mes.getMonth()).map((fecha) => {
      if (fecha === null) {
        return {
          fecha: null,
          dia: null,
          color: 'transparent',
          colorTexto: 'inherit',
          seleccionable: false,
          detalle: '',
        };
      }
      const dia = Number(fecha.slice(-2));
      const total = totales.get(fecha);
      if (total === undefined || !escala) {
        return {
          fecha,
          dia,
          color: 'transparent',
          colorTexto: 'inherit',
          seleccionable: false,
          detalle: '',
        };
      }
      return {
        fecha,
        dia,
        color: escala.colorPara(total),
        colorTexto: escala.textoPara(total),
        seleccionable: true,
        detalle:
          `${formatearFechaLarga(fecha)}: ${formatearDecimal(total, 1)} siniestros esperados en el país en el día ` +
          `(${formatearPorcentaje(escala.diferenciaPct(total), { conSigno: true })} respecto del promedio del mes)`,
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
          this.totalesPorDia.set(new Map());
          this.detalleActivo.set(null);
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

  protected mostrarDetalle(celda: DiaCalendario | null): void {
    this.detalleActivo.set(celda && celda.seleccionable ? celda.detalle : null);
  }

  protected irAlMapa(fecha: string | null): void {
    if (!fecha) {
      return;
    }
    this.router.navigate(['/'], { queryParams: { fecha } });
  }
}

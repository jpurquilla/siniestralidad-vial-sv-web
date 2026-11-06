import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';

import { mensajeErrorHttp } from '../../core/errores/mensaje-error-http';
import { formatearDecimal, formatearFechaLarga } from '../../core/format/formato';
import { ValorPPipe } from '../../core/format/formato.pipes';
import {
  etiquetaFranja,
  etiquetaMetrica,
  etiquetaVariable,
  nombreLegibleModelo,
} from '../../core/modelo/etiquetas-modelo';
import { MetricasModelo, ModeloInfoResponse } from '../../core/models/modelo-info.model';
import { ModeloInfoService } from '../../core/services/modelo-info.service';

/** Orden de las métricas en la comparación entre el modelo final y el anterior. */
const METRICAS_COMPARADAS: readonly (keyof MetricasModelo)[] = [
  'RMSE',
  'MAE',
  'calibracion',
  'spearman_global',
  'spearman_tercil_alto',
];

export interface FilaComparacion {
  clave: string;
  etiqueta: string;
  final: string;
  anterior: string;
}

export interface BarraDato {
  etiqueta: string;
  valor: number;
  texto: string;
  porcentaje: number;
}

export interface BarraCalibracion extends BarraDato {
  /** Posición del 1.0 de referencia dentro de la escala, en %. */
  referencia: number;
}

function numeroONull(valor: unknown): number | null {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : null;
}

@Component({
  selector: 'app-pagina-acerca-del-modelo',
  imports: [ValorPPipe],
  templateUrl: './pagina-acerca-del-modelo.html',
  styleUrl: './pagina-acerca-del-modelo.css',
})
export class PaginaAcercaDelModelo {
  private readonly modeloInfoService = inject(ModeloInfoService);

  protected readonly info = signal<ModeloInfoResponse | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly nombreModelo = computed(() => nombreLegibleModelo(this.info()?.nombre ?? ''));

  protected readonly comparacion = computed<FilaComparacion[]>(() => {
    const m = this.info();
    if (!m) {
      return [];
    }
    return METRICAS_COMPARADAS.map((clave) => ({
      clave,
      etiqueta: etiquetaMetrica(clave),
      final: formatearDecimal(numeroONull(m.metricas?.[clave]), 3),
      anterior: formatearDecimal(numeroONull(m.metricas_referencia_nb07?.[clave]), 3),
    }));
  });

  /** Importancia SHAP ordenada de mayor a menor, con el ancho de barra relativo al máximo. */
  protected readonly barrasShap = computed<BarraDato[]>(() => {
    const datos = [...(this.info()?.importancia_shap ?? [])].sort((a, b) => b.valor - a.valor);
    const maximo = Math.max(1e-9, ...datos.map((d) => d.valor));
    return datos.map((d) => ({
      etiqueta: etiquetaVariable(d.variable),
      valor: d.valor,
      texto: formatearDecimal(d.valor, 3),
      porcentaje: (d.valor / maximo) * 100,
    }));
  });

  /** Calibración por franja en una escala 0..max(1.5, máximo) con referencia en 1.0. */
  protected readonly barrasCalibracion = computed<BarraCalibracion[]>(() => {
    const datos = this.info()?.calibracion_por_franja ?? [];
    const tope = Math.max(1.5, ...datos.map((d) => d.calibracion));
    return datos.map((d) => ({
      etiqueta: etiquetaFranja(d.franja),
      valor: d.calibracion,
      texto: formatearDecimal(d.calibracion, 2),
      porcentaje: (d.calibracion / tope) * 100,
      referencia: (1 / tope) * 100,
    }));
  });

  protected readonly variablesLegibles = computed(() =>
    (this.info()?.variables ?? []).map((v) => etiquetaVariable(v)),
  );

  protected readonly fechaEntrenamiento = computed(() =>
    formatearFechaLarga(this.info()?.fecha_entrenamiento),
  );

  constructor() {
    this.modeloInfoService.obtener().subscribe({
      next: (respuesta) => {
        this.info.set(respuesta);
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(mensajeErrorHttp(error));
        this.cargando.set(false);
      },
    });
  }
}

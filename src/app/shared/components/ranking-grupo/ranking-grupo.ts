import { DecimalPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { formatearPorcentaje } from '../../../core/format/formato';
import { RankingItemOut } from '../../../core/models/ranking.model';

@Component({
  selector: 'app-ranking-grupo',
  imports: [DecimalPipe],
  templateUrl: './ranking-grupo.html',
  styleUrl: './ranking-grupo.css',
})
export class RankingGrupo {
  readonly titulo = input.required<string>();
  readonly items = input.required<RankingItemOut[]>();
  /** Spearman del tercil en el periodo de evaluación; dato descriptivo. */
  readonly spearman = input<number | null>(null);
  readonly advertencia = input<string | null>(null);
  readonly distritoSeleccionado = input<string | null>(null);

  /** Cambio (%) de cada distrito frente a la normal; null = sin escenario de lluvia. */
  readonly cambios = input<ReadonlyMap<string, number> | null>(null);

  /** Muestra la columna «Cambio por lluvia». */
  readonly mostrarCambio = input(false);

  readonly seleccionar = output<string>();

  /** «+13.5%»; guion si no hay escenario o el cambio es menor que 0.5%. */
  protected cambioDe(codigo: string): string {
    const c = this.cambios()?.get(codigo);
    if (c === undefined || Math.abs(c) < 0.5) {
      return '–';
    }
    return formatearPorcentaje(c, { decimales: 1, conSigno: true });
  }
}

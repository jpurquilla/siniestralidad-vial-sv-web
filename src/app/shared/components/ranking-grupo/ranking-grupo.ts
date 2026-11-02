import { DecimalPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
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

  readonly seleccionar = output<string>();
}

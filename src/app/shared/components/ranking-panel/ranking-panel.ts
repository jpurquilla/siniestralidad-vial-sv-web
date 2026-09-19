import { Component, computed, input, output } from '@angular/core';
import { RankingGrupo } from '../ranking-grupo/ranking-grupo';
import { RankingItemOut } from '../../../core/models/ranking.model';

const ADVERTENCIA_TERCIL_MEDIO =
  'El ordenamiento dentro de este grupo es poco confiable (Spearman ~0.65 en la evaluación de NB07): no lo interpretes como un ranking preciso.';

@Component({
  selector: 'app-ranking-panel',
  imports: [RankingGrupo],
  templateUrl: './ranking-panel.html',
  styleUrl: './ranking-panel.css',
})
export class RankingPanel {
  readonly ranking = input.required<RankingItemOut[]>();
  readonly distritoSeleccionado = input<string | null>(null);

  readonly seleccionar = output<string>();

  protected readonly advertenciaTercilMedio = ADVERTENCIA_TERCIL_MEDIO;
  protected readonly alto = computed(() => this.ranking().filter((item) => item.tercil === 'alto'));
  protected readonly medio = computed(() =>
    this.ranking().filter((item) => item.tercil === 'medio'),
  );
  protected readonly bajo = computed(() => this.ranking().filter((item) => item.tercil === 'bajo'));
}

import { Component, computed, input, output } from '@angular/core';
import { RankingGrupo } from '../ranking-grupo/ranking-grupo';
import { RankingItemOut } from '../../../core/models/ranking.model';

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

  protected readonly alto = computed(() => this.ranking().filter((item) => item.tercil === 'alto'));
  protected readonly medio = computed(() =>
    this.ranking().filter((item) => item.tercil === 'medio'),
  );
  protected readonly bajo = computed(() => this.ranking().filter((item) => item.tercil === 'bajo'));

  protected readonly spearmanAlto = computed(() => this.spearmanDe(this.alto()));
  protected readonly spearmanMedio = computed(() => this.spearmanDe(this.medio()));
  protected readonly spearmanBajo = computed(() => this.spearmanDe(this.bajo()));

  /** El Spearman es por tercil: todos los distritos del grupo traen el mismo valor. */
  private spearmanDe(items: RankingItemOut[]): number | null {
    return items.length > 0 ? items[0].confiabilidad_spearman : null;
  }
}

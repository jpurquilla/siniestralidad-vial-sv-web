import { Component, ElementRef, computed, effect, input, output, viewChild } from '@angular/core';
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

  /** Cambio (%) de cada distrito frente a la normal; null = sin escenario de lluvia. */
  readonly cambios = input<ReadonlyMap<string, number> | null>(null);

  /** La columna «Cambio por lluvia» solo se muestra cuando el escenario de lluvia no es «normal». */
  readonly mostrarCambio = input(false);

  /**
   * false mientras la pestaña de la tabla está oculta. Al volver a verse se restaura el scroll:
   * el navegador lo reinicia cuando el contenedor pasa por display:none.
   */
  readonly visible = input(true);

  readonly seleccionar = output<string>();

  private readonly filas = viewChild<ElementRef<HTMLElement>>('filas');
  private scrollGuardado = 0;

  constructor() {
    effect(() => {
      if (this.visible()) {
        requestAnimationFrame(() => {
          const el = this.filas()?.nativeElement;
          if (el) {
            el.scrollTop = this.scrollGuardado;
          }
        });
      }
    });
  }

  protected alDesplazar(evento: Event): void {
    const el = evento.target as HTMLElement;
    // Con la pestaña oculta el scroll vale 0 y no debe pisar la posición guardada.
    if (el.clientHeight > 0) {
      this.scrollGuardado = el.scrollTop;
    }
  }

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

import { Component, input } from '@angular/core';

import { colorDeCausa } from '../../../core/informes/color-causa';

/**
 * Clave compacta de causas (muestra de color + nombre) pegada a la composición apilada; el color viene
 * siempre de `colores_causas`.
 */
@Component({
  selector: 'app-leyenda-causas',
  template: `
    <ul class="leyenda" aria-label="Clave de colores de las causas">
      @for (causa of causas(); track causa) {
        <li data-leyenda-causa>
          <span class="muestra" [style.background-color]="color(causa)" aria-hidden="true"></span>
          {{ causa }}
        </li>
      }
    </ul>
  `,
  styles: `
    .leyenda {
      display: flex;
      flex-wrap: wrap;
      gap: 2px var(--space-3);
      margin: var(--space-1) 0 0;
      padding: 0;
      list-style: none;
      font-size: 0.74rem;
      color: var(--color-text);
    }
    li {
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }
    .muestra {
      flex: none;
      width: 0.7rem;
      height: 0.7rem;
      border-radius: 2px;
      border: 1px solid rgba(0, 0, 0, 0.25);
    }
  `,
})
export class LeyendaCausas {
  readonly causas = input.required<string[]>();
  readonly colores = input.required<Record<string, string>>();

  protected color(causa: string): string {
    return colorDeCausa(this.colores(), causa);
  }
}

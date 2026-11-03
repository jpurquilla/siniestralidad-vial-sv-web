import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FiltroSiniestros, OpcionesFiltroSiniestrosResponse } from '../../../core/models/siniestro-punto.model';
import { FiltrosHotspots } from '../filtros-hotspots/filtros-hotspots';

/**
 * Filtros de siniestros + enlace «Ver la otra versión» (la página alternativa, con los
 * mismos filtros). Compartido por las dos páginas de concentraciones.
 */
@Component({
  selector: 'app-barra-concentraciones',
  imports: [FiltrosHotspots, RouterLink],
  template: `
    <!-- En pantallas angostas los filtros arrancan plegados para que el mapa y su leyenda
         queden a la vista; en escritorio siempre están abiertos y el título no se muestra. -->
    <details class="plegable" [open]="abiertoInicial">
      <summary>Filtros</summary>
      <app-filtros-hotspots
        [opciones]="opciones()"
        [filtroInicial]="filtroInicial()"
        (filtroChange)="filtroChange.emit($event)"
      />
    </details>
    <div class="acciones">
      <ng-content />
      <a
        class="otra-version"
        data-testid="otra-version"
        [routerLink]="rutaOtraVersion()"
        [queryParams]="queryParams()"
        >Ver la otra versión</a
      >
    </div>
  `,
  styles: [
    `
      .plegable > summary {
        display: none;
      }
      @media (max-width: 899.98px) {
        .plegable > summary {
          display: block;
          margin-bottom: var(--space-2);
          padding: var(--space-2) var(--space-3);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
        }
      }
      .acciones {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-4);
        margin: 0 0 var(--space-3);
      }
      .otra-version {
        margin-left: auto;
        font-size: 0.85rem;
        color: var(--color-brand);
        text-decoration: underline;
      }
    `,
  ],
})
export class BarraConcentraciones {
  protected readonly abiertoInicial =
    typeof matchMedia !== 'function' || matchMedia('(min-width: 900px)').matches;

  readonly opciones = input<OpcionesFiltroSiniestrosResponse | null>(null);
  readonly filtroInicial = input<FiltroSiniestros>({});
  /** Ruta de la página alternativa. */
  readonly rutaOtraVersion = input.required<string>();
  /** Parámetros de URL (los filtros vigentes) con los que se abre la otra versión. */
  readonly queryParams = input<Record<string, string>>({});
  readonly filtroChange = output<FiltroSiniestros>();
}

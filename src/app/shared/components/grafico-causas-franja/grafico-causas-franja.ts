import { Component, computed, input } from '@angular/core';

import { colorDeCausa, colorTextoSobre } from '../../../core/informes/color-causa';
import { formatearPorcentaje } from '../../../core/format/formato';
import { horarioFranja, nombreFranja } from '../../../core/modelo/etiquetas-modelo';
import { CausasFranjaInforme } from '../../../core/models/informe-periodo.model';
import { LeyendaCausas } from '../leyenda-causas/leyenda-causas';

/** El porcentaje se escribe dentro del segmento solo si este mide más de este valor (en %). */
export const MINIMO_ETIQUETA = 8;

interface Segmento {
  causa: string;
  color: string;
  colorTexto: string;
  ancho: number;
  etiqueta: string | null;
  titulo: string;
}

interface FilaFranja {
  nombre: string;
  segmentos: Segmento[];
  alt: string;
}

/**
 * Composición de causas por franja, barras apiladas al 100%. Para identificar las causas lleva una clave
 * compacta pegada al gráfico (parte del propio gráfico, no una leyenda separada). Presentación en HTML/CSS.
 */
@Component({
  selector: 'app-grafico-causas-franja',
  imports: [LeyendaCausas],
  template: `
    <div class="grafico" role="group" aria-label="Composición de causas por franja horaria: una barra al 100% por franja, dividida por causa" data-testid="grafico-causas-franja">
      @for (f of filas(); track f.nombre) {
        <div class="fila" data-fila-franja role="img" [attr.aria-label]="f.alt">
          <span class="nombre">{{ f.nombre }}</span>
          <div class="barra">
            @for (s of f.segmentos; track s.causa) {
              <span class="segmento" data-segmento [style.width.%]="s.ancho" [style.background-color]="s.color" [style.color]="s.colorTexto" [attr.title]="s.titulo">
                @if (s.etiqueta) {
                  <span class="porcentaje">{{ s.etiqueta }}</span>
                }
              </span>
            }
          </div>
        </div>
      }
      <div class="fila">
        <span class="nombre"></span>
        <app-leyenda-causas [causas]="causasClave()" [colores]="colores()" />
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      max-width: 44rem;
    }
    .grafico {
      font-size: 0.85rem;
    }
    .fila {
      display: grid;
      grid-template-columns: 11rem minmax(0, 1fr);
      column-gap: var(--space-3);
      align-items: center;
      margin-bottom: var(--space-2);
    }
    .nombre {
      line-height: 1.25;
    }
    .barra {
      display: flex;
      height: 2rem;
      overflow: hidden;
      border-radius: 3px;
    }
    .segmento {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 0;
      overflow: hidden;
      border-right: 1px solid var(--color-surface);
    }
    .segmento:last-child {
      border-right: 0;
    }
    .porcentaje {
      font-size: 0.75rem;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
    @media (max-width: 640px) {
      .fila {
        grid-template-columns: minmax(0, 1fr);
        row-gap: 2px;
      }
      .fila > .nombre:empty {
        display: none;
      }
    }
  `,
})
export class GraficoCausasFranja {
  readonly franjas = input.required<CausasFranjaInforme[]>();
  readonly colores = input.required<Record<string, string>>();

  protected readonly causasClave = computed(() => {
    const vistas = new Set<string>();
    for (const f of this.franjas()) {
      for (const c of f.causas) {
        if (c.proporcion > 0) vistas.add(c.causa);
      }
    }
    return [...vistas];
  });

  protected readonly filas = computed<FilaFranja[]>(() =>
    this.franjas().map((franja) => {
      const suma = franja.causas.reduce((a, c) => a + Math.max(0, c.proporcion), 0);
      const segmentos: Segmento[] = [];
      for (const c of franja.causas) {
        const fraccion = suma > 0 ? Math.max(0, c.proporcion) / suma : 0;
        if (fraccion <= 0) continue;
        const color = colorDeCausa(this.colores(), c.causa);
        segmentos.push({
          causa: c.causa,
          color,
          colorTexto: colorTextoSobre(color),
          ancho: fraccion * 100,
          etiqueta: fraccion * 100 > MINIMO_ETIQUETA ? `${Math.round(fraccion * 100)}%` : null,
          titulo: `${nombreFranja(franja.franja)}, ${c.causa}: ${formatearPorcentaje(fraccion, { esFraccion: true })}`,
        });
      }
      const horario = horarioFranja(franja.franja);
      const nombre = horario ? `${nombreFranja(franja.franja)} (${horario})` : nombreFranja(franja.franja);
      return {
        nombre,
        segmentos,
        alt: `${nombre}: ${segmentos.map((s) => `${s.causa} ${formatearPorcentaje(s.ancho / 100, { esFraccion: true })}`).join(', ')}`,
      };
    }),
  );
}

import { Component, ElementRef, computed, inject, input, signal } from '@angular/core';

import { colorDeCausa } from '../../../core/informes/color-causa';
import { ticksRedondos } from '../../../core/informes/ticks-redondos';
import { formatearConteo, formatearDecimal } from '../../../core/format/formato';
import { CausaInforme } from '../../../core/models/informe-periodo.model';

interface FilaCausa {
  causa: string;
  color: string;
  /** Posiciones en % de la escala (0 = inicio del eje). */
  anchoBarra: number;
  xInf: number;
  xSup: number;
  valor: string;
  rango: string;
  porcentaje: string;
  alt: string;
}

interface Marca {
  pos: number;
  texto: string;
}

interface TooltipCausa {
  fila: FilaCausa;
  x: number;
  y: number;
}

const ANCHO_TOOLTIP = 230;
const SEPARACION_TOOLTIP = 16;

/**
 * Siniestros esperados por causa con su rango del 90% (línea con extremos). Etiqueta directa al final de
 * cada barra (valor y rango); el nombre completo va a la izquierda (o encima de la barra en pantallas
 * estrechas) y se parte en líneas si no cabe. Componente de presentación en HTML/CSS.
 */
@Component({
  selector: 'app-grafico-causas-barras',
  template: `
    <div class="grafico" role="group" aria-label="Siniestros esperados por causa en el periodo, de mayor a menor, con su rango del 90%" data-testid="grafico-causas-barras">
      @for (f of filas(); track f.causa) {
        <div class="fila" data-fila-causa [attr.aria-label]="f.alt" role="img">
          <span class="nombre" data-nombre-causa>{{ f.causa }}</span>
          <div class="pista">
            <div class="escala">
              <span
                class="barra"
                data-barra-causa
                [style.width.%]="f.anchoBarra"
                [style.background-color]="f.color"
                (mouseenter)="mostrar($event, f)"
                (mousemove)="mostrar($event, f)"
                (mouseleave)="ocultar()"
              ></span>
              <span class="bigote" [style.left.%]="f.xInf" [style.width.%]="f.xSup - f.xInf">
                <span class="tapa tapa-inf"></span><span class="tapa tapa-sup"></span>
              </span>
              <span class="etiqueta" data-etiqueta-causa [style.left.%]="f.xSup">
                <strong>{{ f.valor }}</strong>&ngsp;<span class="rango">({{ f.rango }})</span>
              </span>
            </div>
          </div>
        </div>
      }
      <div class="fila fila-eje" aria-hidden="true">
        <span class="nombre"></span>
        <div class="pista">
          <div class="eje">
            @for (m of marcas(); track m.pos) {
              <span class="marca" [style.left.%]="m.pos">{{ m.texto }}</span>
            }
          </div>
        </div>
      </div>
    </div>
    <p class="clave">Línea: rango del 90%.</p>
    @if (tooltip(); as t) {
      <div class="tooltip" role="presentation" data-tooltip [style.left.px]="t.x" [style.top.px]="t.y">
        <strong>{{ t.fila.causa }}</strong>
        <span>Esperado: {{ t.fila.valor }} ({{ t.fila.porcentaje }})</span>
        <span>Rango del 90%: {{ t.fila.rango }}</span>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
      position: relative;
      max-width: 44rem;
    }
    .grafico {
      --reserva: 9.5rem;
      --nombres: 13rem;
      font-size: 0.85rem;
    }
    .fila {
      display: grid;
      grid-template-columns: var(--nombres) minmax(0, 1fr);
      column-gap: var(--space-3);
      align-items: center;
    }
    .nombre {
      line-height: 1.25;
      color: var(--color-text);
      overflow-wrap: anywhere;
    }
    .pista {
      padding-right: var(--reserva);
    }
    .escala {
      position: relative;
      height: 2.1rem;
      border-left: 1px solid var(--color-border);
    }
    .barra {
      position: absolute;
      left: 0;
      top: 0.5rem;
      height: 1.1rem;
      border-radius: 0 3px 3px 0;
      cursor: default;
      min-width: 1px;
    }
    .bigote {
      position: absolute;
      top: 1.05rem;
      height: 2px;
      margin-top: -1px;
      background: #111;
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.85);
      pointer-events: none;
    }
    .tapa {
      position: absolute;
      top: -4px;
      width: 2px;
      height: 10px;
      background: #111;
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.85);
    }
    .tapa-inf {
      left: 0;
    }
    .tapa-sup {
      right: 0;
    }
    .etiqueta {
      position: absolute;
      top: 1.05rem;
      transform: translateY(-50%);
      margin-left: 0.5rem;
      white-space: nowrap;
      pointer-events: none;
      color: var(--color-text);
    }
    .rango {
      color: var(--color-text-muted);
      font-size: 0.78rem;
    }
    .fila-eje .nombre {
      min-height: 1px;
    }
    .eje {
      position: relative;
      height: 1.3rem;
      border-left: 1px solid transparent;
    }
    .marca {
      position: absolute;
      top: 0;
      transform: translateX(-50%);
      padding-top: 5px;
      font-size: 0.74rem;
      color: var(--color-text-muted);
      font-variant-numeric: tabular-nums;
    }
    .marca::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      height: 4px;
      border-left: 1px solid var(--color-border);
    }
    .clave {
      margin: var(--space-2) 0 0;
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }
    .tooltip {
      position: absolute;
      z-index: 5;
      width: max-content;
      max-width: 14.5rem;
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: var(--space-2) var(--space-3);
      font-size: 0.8rem;
      line-height: 1.3;
      color: #fff;
      background: #1f2933;
      border-radius: var(--radius-sm);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
      pointer-events: none;
    }
    @media (max-width: 640px) {
      .grafico {
        --reserva: 8.6rem;
      }
      .fila {
        grid-template-columns: minmax(0, 1fr);
      }
      .fila:not(.fila-eje) {
        padding-top: 0.3rem;
      }
      .fila-eje .nombre {
        display: none;
      }
      .escala {
        height: 1.8rem;
      }
      .barra {
        top: 0.35rem;
      }
      .bigote,
      .etiqueta {
        top: 0.9rem;
      }
    }
  `,
})
export class GraficoCausasBarras {
  readonly causas = input.required<CausaInforme[]>();
  readonly colores = input.required<Record<string, string>>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly tooltip = signal<TooltipCausa | null>(null);

  private readonly eje = computed(() =>
    ticksRedondos(Math.max(0, ...this.causas().map((c) => Math.max(c.esperado, c.ic90_sup))), { entero: true }),
  );

  private pos(valor: number): number {
    return (Math.max(0, valor) / this.eje().tope) * 100;
  }

  protected readonly filas = computed<FilaCausa[]>(() =>
    this.causas().map((c) => {
      const rango = `${formatearConteo(c.ic90_inf)} a ${formatearConteo(c.ic90_sup)}`;
      const valor = formatearConteo(c.esperado);
      const porcentaje = `${formatearDecimal(c.porcentaje, 1)}%`;
      return {
        causa: c.causa,
        color: colorDeCausa(this.colores(), c.causa),
        anchoBarra: this.pos(c.esperado),
        xInf: this.pos(Math.min(c.ic90_inf, c.esperado)),
        xSup: this.pos(Math.max(c.ic90_sup, c.esperado)),
        valor,
        rango,
        porcentaje,
        alt: `${c.causa}: ${valor} esperados (${porcentaje}), rango del 90%: ${rango}`,
      };
    }),
  );

  protected readonly marcas = computed<Marca[]>(() =>
    this.eje().ticks.map((v) => ({ pos: this.pos(v), texto: formatearConteo(v) })),
  );

  /** El tooltip sigue al cursor, a su derecha y por debajo de la fila (no tapa la etiqueta de la barra). */
  protected mostrar(evento: MouseEvent, fila: FilaCausa): void {
    const caja = this.host.nativeElement.getBoundingClientRect();
    let x = evento.clientX - caja.left + SEPARACION_TOOLTIP;
    if (caja.width > 0 && x + ANCHO_TOOLTIP > caja.width) {
      x = Math.max(0, caja.width - ANCHO_TOOLTIP);
    }
    this.tooltip.set({ fila, x, y: evento.clientY - caja.top + 14 });
  }

  protected ocultar(): void {
    this.tooltip.set(null);
  }
}

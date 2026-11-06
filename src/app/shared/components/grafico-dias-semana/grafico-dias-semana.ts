import { Component, computed, input } from '@angular/core';

import { ticksRedondos } from '../../../core/informes/ticks-redondos';
import { formatearDecimal } from '../../../core/format/formato';
import { DiaSemanaInforme } from '../../../core/models/informe-periodo.model';

const ANCHO = 420;
const MARGEN_IZQ = 36;
const MARGEN_DER = 6;
const MARGEN_SUPERIOR = 22;
const ALTO_PLANO = 150;
const ALTO_ETIQUETAS = 24;

interface Columna {
  dia: string;
  corto: string;
  cx: number;
  x: number;
  y: number;
  ancho: number;
  alto: number;
  valor: string;
  titulo: string;
}

interface MarcaY {
  y: number;
  texto: string;
}

/**
 * Siniestros esperados por día de la semana: promedio por día (columnas). Bajo el gráfico se indica
 * cuántas veces aparece cada día en el periodo. Componente de presentación en SVG.
 */
@Component({
  selector: 'app-grafico-dias-semana',
  template: `
    <svg
      class="grafico"
      [attr.viewBox]="'0 0 ' + ancho + ' ' + alto"
      role="img"
      aria-labelledby="titulo-dias"
      data-testid="grafico-dias-semana"
    >
      <title id="titulo-dias">Siniestros esperados por día de la semana (promedio por día), de lunes a domingo</title>
      @for (m of marcasY(); track m.y) {
        <line class="marca" [attr.x1]="margenIzq - 4" [attr.x2]="margenIzq" [attr.y1]="m.y" [attr.y2]="m.y" />
        <text class="eje" [attr.x]="margenIzq - 8" [attr.y]="m.y + 4" text-anchor="end">{{ m.texto }}</text>
      }
      <line class="base" [attr.x1]="margenIzq" [attr.x2]="margenIzq" [attr.y1]="margenSuperior" [attr.y2]="yBase" />
      <line class="base" [attr.x1]="margenIzq" [attr.x2]="ancho - 6" [attr.y1]="yBase" [attr.y2]="yBase" />
      @for (c of columnas(); track c.dia) {
        <g data-columna-dia>
          <title>{{ c.titulo }}</title>
          <rect class="columna" [attr.x]="c.x" [attr.y]="c.y" [attr.width]="c.ancho" [attr.height]="c.alto" rx="2" />
          <text class="valor" data-valor-dia [attr.x]="c.cx" [attr.y]="c.y - 6" text-anchor="middle">{{ c.valor }}</text>
          <text class="etiqueta" [attr.x]="c.cx" [attr.y]="yBase + 16" text-anchor="middle">{{ c.corto }}</text>
        </g>
      }
    </svg>
    <p class="clave" data-testid="veces-dias">Veces que aparece cada día en el periodo: {{ textoVeces() }}.</p>
  `,
  styles: `
    :host {
      display: block;
    }
    .grafico {
      display: block;
      width: 100%;
      max-width: 36rem;
      height: auto;
      font-size: 12px;
    }
    .columna {
      fill: var(--color-brand);
    }
    .base,
    .marca {
      stroke: var(--color-border);
      stroke-width: 1.2;
    }
    .valor {
      fill: var(--color-text);
      font-weight: 700;
    }
    .etiqueta,
    .eje {
      fill: var(--color-text-muted);
    }
    .clave {
      margin: var(--space-2) 0 0;
      font-size: 0.78rem;
      color: var(--color-text-muted);
    }
  `,
})
export class GraficoDiasSemana {
  readonly dias = input.required<DiaSemanaInforme[]>();

  protected readonly ancho = ANCHO;
  protected readonly margenIzq = MARGEN_IZQ;
  protected readonly margenSuperior = MARGEN_SUPERIOR;
  protected readonly yBase = MARGEN_SUPERIOR + ALTO_PLANO;
  protected readonly alto = MARGEN_SUPERIOR + ALTO_PLANO + ALTO_ETIQUETAS;

  private readonly eje = computed(() => ticksRedondos(Math.max(0, ...this.dias().map((d) => d.esperado)), { objetivo: 4 }));
  private readonly decimales = computed(() => (this.eje().tope < 10 ? 1 : 0));

  private y(valor: number): number {
    return this.yBase - (Math.max(0, valor) / this.eje().tope) * ALTO_PLANO;
  }

  protected readonly marcasY = computed<MarcaY[]>(() =>
    this.eje().ticks.map((v) => ({ y: this.y(v), texto: formatearDecimal(v, Number.isInteger(v) ? 0 : 1) })),
  );

  protected readonly textoVeces = computed(() =>
    this.dias()
      .map((d) => `${d.dia.toLowerCase()} ${d.veces}`)
      .join(', '),
  );

  protected readonly columnas = computed<Columna[]>(() => {
    const dias = this.dias();
    const util = ANCHO - MARGEN_IZQ - MARGEN_DER;
    const ranura = util / Math.max(1, dias.length);
    const ancho = ranura * 0.58;
    return dias.map((d, i) => {
      const cx = MARGEN_IZQ + ranura * i + ranura / 2;
      const y = this.y(d.esperado);
      return {
        dia: d.dia,
        corto: d.dia.slice(0, 3),
        cx,
        x: cx - ancho / 2,
        y,
        ancho,
        alto: this.yBase - y,
        valor: formatearDecimal(d.esperado, this.decimales()),
        titulo: `${d.dia}: promedio de ${formatearDecimal(d.esperado, 1)} siniestros esperados por día (${d.veces} ${d.veces === 1 ? 'vez' : 'veces'} en el periodo, total ${formatearDecimal(d.suma, 1)})`,
      };
    });
  });
}

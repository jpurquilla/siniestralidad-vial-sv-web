import { Component, computed, input } from '@angular/core';

import { colorTextoSobre } from '../../../core/informes/color-causa';
import { ticksRedondos } from '../../../core/informes/ticks-redondos';
import { formatearDecimal } from '../../../core/format/formato';
import { FRANJAS, Franja } from '../../../core/models/franja.model';
import { horarioFranja, nombreFranja } from '../../../core/modelo/etiquetas-modelo';
import { DistritoPorFranjaInforme } from '../../../core/models/informe-periodo.model';

export const MAXIMO_DISTRITOS_MAPA_CALOR = 20;

const BLANCO = [255, 255, 255];
const AZUL = [31, 58, 95];

/** Color de la celda (azul institucional sobre blanco, de 8% a 100%) como hex opaco. */
function colorCalor(intensidad: number): string {
  const alfa = 0.08 + Math.min(1, Math.max(0, intensidad)) * 0.92;
  return (
    '#' +
    [0, 1, 2]
      .map((i) => Math.round(BLANCO[i] * (1 - alfa) + AZUL[i] * alfa).toString(16).padStart(2, '0'))
      .join('')
  );
}

interface Celda {
  franja: Franja;
  texto: string;
  fondo: string;
  texto_color: string;
  titulo: string;
}

interface FilaCalor {
  codigo: string;
  distrito: string;
  celdas: Celda[];
}

/** Mapa de calor distrito × franja (tabla con celdas sombreadas); muestra los primeros 20 distritos. */
@Component({
  selector: 'app-mapa-calor-franja',
  template: `
    <div class="envoltorio">
      <table class="calor" data-testid="mapa-calor">
        <caption class="solo-lectores">
          Siniestros esperados por distrito y franja horaria; cuanto más oscuro, más siniestros esperados.
        </caption>
        <thead>
          <tr>
            <th scope="col">Distrito</th>
            @for (f of franjas; track f) {
              <th scope="col" class="num">
                {{ nombre(f) }}<span class="horario">{{ horario(f) }}</span>
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @for (fila of filas(); track fila.codigo) {
            <tr data-fila-calor>
              <th scope="row">{{ fila.distrito }}</th>
              @for (c of fila.celdas; track c.franja) {
                <td class="num" [style.background-color]="c.fondo" [style.color]="c.texto_color" [attr.title]="c.titulo">
                  {{ c.texto }}
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>
    <div class="escala" data-testid="escala-calor" aria-hidden="true">
      <span class="degradado" [style.background]="gradiente()"></span>
      <div class="marcas">
        @for (m of marcas(); track m.pos) {
          <span class="marca" [style.left.%]="m.pos">{{ m.texto }}</span>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .envoltorio {
      overflow-x: auto;
    }
    .calor {
      width: 100%;
      border-collapse: separate;
      border-spacing: 2px;
      font-size: 0.8rem;
    }
    th {
      padding: var(--space-1) var(--space-2);
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--color-text-muted);
      text-align: left;
    }
    th[scope='row'] {
      font-size: 0.8rem;
      font-weight: 400;
      color: var(--color-text);
      white-space: nowrap;
    }
    .horario {
      display: block;
      font-weight: 400;
      font-size: 0.7rem;
    }
    td {
      padding: var(--space-1) var(--space-2);
      border-radius: 3px;
    }
    .num {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .escala {
      max-width: 22rem;
      margin-top: var(--space-3);
      font-size: 0.74rem;
      color: var(--color-text-muted);
    }
    .degradado {
      display: block;
      height: 0.7rem;
      border-radius: 3px;
      border: 1px solid var(--color-border);
    }
    .marcas {
      position: relative;
      height: 1.2rem;
    }
    .marca {
      position: absolute;
      top: 2px;
      transform: translateX(-50%);
      font-variant-numeric: tabular-nums;
    }
    @media (max-width: 640px) {
      .calor {
        border-spacing: 1px;
        font-size: 0.74rem;
      }
      th,
      td {
        padding: var(--space-1);
      }
      th[scope='row'] {
        font-size: 0.74rem;
        white-space: normal;
      }
      .horario {
        display: none;
      }
    }
    .solo-lectores {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
  `,
})
export class MapaCalorFranja {
  readonly distritos = input.required<DistritoPorFranjaInforme[]>();
  readonly franjas: readonly Franja[] = FRANJAS;

  protected nombre = nombreFranja;
  protected horario = horarioFranja;

  private readonly visibles = computed(() => this.distritos().slice(0, MAXIMO_DISTRITOS_MAPA_CALOR));
  /** La escala de color llega hasta el último número redondo que cubre el máximo (el mismo de la clave). */
  private readonly eje = computed(() =>
    ticksRedondos(Math.max(0, ...this.visibles().flatMap((d) => FRANJAS.map((f) => d.franjas[f] ?? 0)))),
  );

  protected readonly gradiente = computed(
    () => `linear-gradient(to right, ${colorCalor(0)}, ${colorCalor(1)})`,
  );

  protected readonly marcas = computed(() => {
    const { ticks, tope } = this.eje();
    return ticks.map((v) => ({ pos: (v / tope) * 100, texto: formatearDecimal(v, Number.isInteger(v) ? 0 : 1) }));
  });

  protected readonly filas = computed<FilaCalor[]>(() => {
    const visibles = this.visibles();
    const maximo = this.eje().tope;
    return visibles.map((d) => ({
      codigo: d.codigo,
      distrito: d.distrito,
      celdas: FRANJAS.map((franja): Celda => {
        const valor = d.franjas[franja] ?? 0;
        const intensidad = Math.min(1, Math.max(0, valor / maximo));
        const fondo = colorCalor(intensidad);
        return {
          franja,
          texto: formatearDecimal(valor, 1),
          fondo,
          texto_color: colorTextoSobre(fondo),
          titulo: `${d.distrito}, ${nombreFranja(franja)}: ${formatearDecimal(valor, 2)} esperados`,
        };
      }),
    }));
  });
}

import { Component, computed, input, signal } from '@angular/core';

import { formatearConteo, formatearDecimal } from '../../../core/format/formato';
import { normalizarBusqueda } from '../../../core/format/texto';
import { DistritoInforme } from '../../../core/models/informe-periodo.model';

export type ColumnaDistrito = 'distrito' | 'departamento' | 'esperado' | 'tercil' | 'tasa_10mil_hab';

const ORDEN_TERCIL: Record<DistritoInforme['tercil'], number> = { alto: 3, medio: 2, bajo: 1 };
const TEXTO_TERCIL: Record<DistritoInforme['tercil'], string> = { alto: 'Alto', medio: 'Medio', bajo: 'Bajo' };

function comparar(a: DistritoInforme, b: DistritoInforme, columna: ColumnaDistrito): number {
  switch (columna) {
    case 'distrito':
      return a.distrito.localeCompare(b.distrito, 'es');
    case 'departamento':
      return a.departamento.localeCompare(b.departamento, 'es') || a.distrito.localeCompare(b.distrito, 'es');
    case 'tercil':
      return ORDEN_TERCIL[a.tercil] - ORDEN_TERCIL[b.tercil];
    case 'tasa_10mil_hab':
      return a.tasa_10mil_hab - b.tasa_10mil_hab;
    default:
      return a.esperado - b.esperado;
  }
}

/** Tabla completa de distritos, ordenable por columna y con buscador por nombre. */
@Component({
  selector: 'app-tabla-distritos-informe',
  templateUrl: './tabla-distritos-informe.html',
  styleUrl: './tabla-distritos-informe.css',
})
export class TablaDistritosInforme {
  readonly distritos = input.required<DistritoInforme[]>();

  protected readonly busqueda = signal('');
  protected readonly columna = signal<ColumnaDistrito>('esperado');
  protected readonly descendente = signal(true);

  protected readonly filas = computed(() => {
    const consulta = normalizarBusqueda(this.busqueda());
    const columna = this.columna();
    const signo = this.descendente() ? -1 : 1;
    return this.distritos()
      .filter((d) => !consulta || normalizarBusqueda(`${d.distrito} ${d.departamento}`).includes(consulta))
      .sort((a, b) => signo * comparar(a, b, columna));
  });

  protected readonly formatearConteo = formatearConteo;
  protected readonly formatearDecimal = formatearDecimal;
  protected readonly textoTercil = TEXTO_TERCIL;

  protected onBusqueda(evento: Event): void {
    this.busqueda.set((evento.target as HTMLInputElement).value);
  }

  protected ordenarPor(columna: ColumnaDistrito): void {
    if (this.columna() === columna) {
      this.descendente.update((d) => !d);
    } else {
      this.columna.set(columna);
      this.descendente.set(columna !== 'distrito' && columna !== 'departamento');
    }
  }

  protected ariaOrden(columna: ColumnaDistrito): 'ascending' | 'descending' | 'none' {
    if (this.columna() !== columna) return 'none';
    return this.descendente() ? 'descending' : 'ascending';
  }

  protected indicador(columna: ColumnaDistrito): string {
    if (this.columna() !== columna) return '';
    return this.descendente() ? '▼' : '▲';
  }
}

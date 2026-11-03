import { Component, computed, input, output, signal } from '@angular/core';

import { normalizarBusqueda } from '../../../core/format/texto';

export interface OpcionBusqueda<T = unknown> {
  /** Identificador único (los nombres se repiten: «San Isidro» está en Cabañas y en Morazán). */
  id: string;
  nombre: string;
  departamento: string;
  /** false: el distrito no forma parte del estudio y no tiene tarjeta. */
  enAlcance: boolean;
  /** Carga útil que el padre recupera al elegir (código, geometría, etc.). */
  referencia: T;
}

const MAXIMO_SUGERENCIAS = 12;

@Component({
  selector: 'app-buscador-distrito',
  imports: [],
  templateUrl: './buscador-distrito.html',
  styleUrl: './buscador-distrito.css',
})
export class BuscadorDistrito {
  readonly opciones = input.required<OpcionBusqueda[]>();
  readonly elegir = output<OpcionBusqueda>();
  /** true: tras elegir se vacía el campo (selección múltiple); por defecto queda el nombre elegido. */
  readonly limpiarAlElegir = input(false);

  protected readonly texto = signal('');
  protected readonly abierto = signal(false);
  protected readonly activo = signal(-1);

  protected readonly sugerencias = computed<OpcionBusqueda[]>(() => {
    const consulta = normalizarBusqueda(this.texto());
    if (!consulta) {
      return [];
    }
    const coincidencias = this.opciones()
      .map((o) => ({ o, n: normalizarBusqueda(o.nombre) }))
      .filter(({ n }) => n.includes(consulta));
    coincidencias.sort(
      (a, b) =>
        Number(b.n.startsWith(consulta)) - Number(a.n.startsWith(consulta)) ||
        Number(b.o.enAlcance) - Number(a.o.enAlcance) ||
        a.n.localeCompare(b.n) ||
        a.o.departamento.localeCompare(b.o.departamento),
    );
    return coincidencias.slice(0, MAXIMO_SUGERENCIAS).map(({ o }) => o);
  });

  protected readonly listaVisible = computed(() => this.abierto() && this.texto().trim() !== '');

  protected onEntrada(evento: Event): void {
    this.texto.set((evento.target as HTMLInputElement).value);
    this.abierto.set(true);
    this.activo.set(-1);
  }

  protected onTecla(evento: KeyboardEvent): void {
    const total = this.sugerencias().length;
    switch (evento.key) {
      case 'ArrowDown':
        evento.preventDefault();
        this.abierto.set(true);
        this.activo.set(total === 0 ? -1 : (this.activo() + 1) % total);
        break;
      case 'ArrowUp':
        evento.preventDefault();
        this.abierto.set(true);
        this.activo.set(total === 0 ? -1 : this.activo() <= 0 ? total - 1 : this.activo() - 1);
        break;
      case 'Enter': {
        if (!this.listaVisible()) {
          break;
        }
        evento.preventDefault();
        const indice = this.activo() >= 0 ? this.activo() : total === 1 ? 0 : -1;
        if (indice >= 0) {
          this.elegirOpcion(this.sugerencias()[indice]);
        }
        break;
      }
      case 'Escape':
        if (this.abierto()) {
          this.abierto.set(false);
          this.activo.set(-1);
        } else {
          this.texto.set('');
        }
        break;
    }
  }

  protected elegirOpcion(opcion: OpcionBusqueda): void {
    this.texto.set(this.limpiarAlElegir() ? '' : opcion.nombre);
    this.abierto.set(false);
    this.activo.set(-1);
    this.elegir.emit(opcion);
  }

  protected onFoco(): void {
    if (this.texto().trim() !== '') {
      this.abierto.set(true);
    }
  }

  protected onDesenfoque(): void {
    this.abierto.set(false);
    this.activo.set(-1);
  }
}

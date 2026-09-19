import { Injectable, signal } from '@angular/core';

/**
 * Señal de selección compartida entre el mapa y el panel de ranking: quien la
 * escribe (click en un polígono o en una fila) sincroniza a ambos.
 */
@Injectable({ providedIn: 'root' })
export class SeleccionDistritoService {
  private readonly _distritoSeleccionado = signal<string | null>(null);
  readonly distritoSeleccionado = this._distritoSeleccionado.asReadonly();

  seleccionar(codigo: string | null): void {
    this._distritoSeleccionado.set(codigo);
  }
}

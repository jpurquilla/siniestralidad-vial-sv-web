import { Component, input, output, signal } from '@angular/core';

import { FiltroSiniestros, OpcionesFiltroSiniestrosResponse } from '../../../core/models/siniestro-punto.model';

@Component({
  selector: 'app-filtros-hotspots',
  imports: [],
  templateUrl: './filtros-hotspots.html',
  styleUrl: './filtros-hotspots.css',
})
export class FiltrosHotspots {
  readonly opciones = input<OpcionesFiltroSiniestrosResponse | null>(null);
  readonly filtroChange = output<FiltroSiniestros>();

  protected readonly fechaInicio = signal('');
  protected readonly fechaFin = signal('');
  protected readonly tipoSiniestro = signal('');
  protected readonly tipoVehiculo = signal('');
  protected readonly factorCausante = signal('');
  protected readonly horaInicio = signal('');
  protected readonly horaFin = signal('');
  protected readonly departamento = signal('');

  protected onCampoChange(
    campo:
      | 'fechaInicio'
      | 'fechaFin'
      | 'tipoSiniestro'
      | 'tipoVehiculo'
      | 'factorCausante'
      | 'horaInicio'
      | 'horaFin'
      | 'departamento',
    evento: Event,
  ): void {
    const valor = (evento.target as HTMLInputElement | HTMLSelectElement).value;
    this[campo].set(valor);
    this.emitir();
  }

  private emitir(): void {
    const filtro: FiltroSiniestros = {
      ...(this.fechaInicio() && { fechaInicio: this.fechaInicio() }),
      ...(this.fechaFin() && { fechaFin: this.fechaFin() }),
      ...(this.tipoSiniestro() && { tipoSiniestro: this.tipoSiniestro() }),
      ...(this.tipoVehiculo() && { tipoVehiculo: this.tipoVehiculo() }),
      ...(this.factorCausante() && { factorCausante: this.factorCausante() }),
      ...(this.horaInicio() && { horaInicio: this.horaInicio() }),
      ...(this.horaFin() && { horaFin: this.horaFin() }),
      ...(this.departamento() && { departamento: this.departamento() }),
    };
    this.filtroChange.emit(filtro);
  }
}

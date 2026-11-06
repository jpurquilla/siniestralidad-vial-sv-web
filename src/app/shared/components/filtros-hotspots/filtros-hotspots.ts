import { Component, input, linkedSignal, output } from '@angular/core';

import { FiltroSiniestros, OpcionesFiltroSiniestrosResponse } from '../../../core/models/siniestro-punto.model';

@Component({
  selector: 'app-filtros-hotspots',
  imports: [],
  templateUrl: './filtros-hotspots.html',
  styleUrl: './filtros-hotspots.css',
})
export class FiltrosHotspots {
  readonly opciones = input<OpcionesFiltroSiniestrosResponse | null>(null);
  /** Valores con los que arrancan los campos (por ejemplo, el año por defecto). */
  readonly filtroInicial = input<FiltroSiniestros>({});
  readonly filtroChange = output<FiltroSiniestros>();

  protected readonly fechaInicio = linkedSignal(() => this.filtroInicial().fechaInicio ?? '');
  protected readonly fechaFin = linkedSignal(() => this.filtroInicial().fechaFin ?? '');
  protected readonly tipoSiniestro = linkedSignal(() => this.filtroInicial().tipoSiniestro ?? '');
  protected readonly tipoVehiculo = linkedSignal(() => this.filtroInicial().tipoVehiculo ?? '');
  protected readonly factorCausante = linkedSignal(() => this.filtroInicial().factorCausante ?? '');
  protected readonly horaInicio = linkedSignal(() => this.filtroInicial().horaInicio ?? '');
  protected readonly horaFin = linkedSignal(() => this.filtroInicial().horaFin ?? '');
  protected readonly departamento = linkedSignal(() => this.filtroInicial().departamento ?? '');

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

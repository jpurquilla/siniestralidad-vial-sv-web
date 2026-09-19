import { Component, input, output } from '@angular/core';
import { Franja, FRANJAS } from '../../../core/models/franja.model';

const PRCP_MENSUAL_MAX_MM = 500;

@Component({
  selector: 'app-controles-prediccion',
  imports: [],
  templateUrl: './controles-prediccion.html',
  styleUrl: './controles-prediccion.css',
})
export class ControlesPrediccion {
  readonly fecha = input.required<string>();
  readonly franja = input.required<Franja>();
  readonly prcpMensual = input<number | null>(null);

  readonly fechaChange = output<string>();
  readonly franjaChange = output<Franja>();
  readonly prcpMensualChange = output<number | null>();

  protected readonly franjas = FRANJAS;
  protected readonly prcpMensualMax = PRCP_MENSUAL_MAX_MM;

  protected onFechaChange(evento: Event): void {
    this.fechaChange.emit((evento.target as HTMLInputElement).value);
  }

  protected onFranjaChange(evento: Event): void {
    this.franjaChange.emit((evento.target as HTMLSelectElement).value as Franja);
  }

  protected onPrcpChange(evento: Event): void {
    const valor = (evento.target as HTMLInputElement).value;
    this.prcpMensualChange.emit(valor === '' ? null : Number(valor));
  }
}

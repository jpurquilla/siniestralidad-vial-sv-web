import { Component, computed, input, output } from '@angular/core';

import { formatearConteo } from '../../../core/format/formato';
import { etiquetaFranja } from '../../../core/modelo/etiquetas-modelo';
import { FRANJAS, Franja } from '../../../core/models/franja.model';

const PRCP_MENSUAL_MAX_MM = 500;

@Component({
  selector: 'app-controles-prediccion',
  imports: [],
  templateUrl: './controles-prediccion.html',
  styleUrl: './controles-prediccion.css',
})
export class ControlesPrediccion {
  readonly fecha = input.required<string>();
  readonly franja = input<Franja>('Tarde (12-17)');
  /** Escenario de lluvia elegido por el usuario; null = normal climatológica. */
  readonly prcpMensual = input<number | null>(null);
  /** Normal climatológica (mm) del distrito y mes, según la API; null si no se conoce. */
  readonly prcpNormal = input<number | null>(null);
  /** true si la API usó el último dato de parque vehicular disponible. */
  readonly usaUltimoParque = input(false);

  readonly fechaChange = output<string>();
  readonly franjaChange = output<Franja>();
  readonly prcpMensualChange = output<number | null>();

  protected readonly franjas = FRANJAS.map((valor) => ({ valor, etiqueta: etiquetaFranja(valor) }));

  /** Valor mostrado y posición del deslizador: el escenario o, si no hay, la normal. */
  protected readonly prcpVigente = computed<number | null>(
    () => this.prcpMensual() ?? this.prcpNormal(),
  );
  protected readonly prcpMax = computed(() =>
    Math.max(PRCP_MENSUAL_MAX_MM, Math.ceil(this.prcpVigente() ?? 0)),
  );
  protected readonly prcpTexto = computed(() => {
    const valor = this.prcpVigente();
    if (valor === null) {
      return 'normal climatológica';
    }
    return `${formatearConteo(valor)} mm${this.prcpMensual() === null ? ' (normal climatológica)' : ''}`;
  });

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

  protected restablecerPrcp(): void {
    this.prcpMensualChange.emit(null);
  }
}

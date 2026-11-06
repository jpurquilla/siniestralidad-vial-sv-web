import { Component, computed, input, output } from '@angular/core';

import { formatearPorcentaje } from '../../../core/format/formato';
import { etiquetaFranja } from '../../../core/modelo/etiquetas-modelo';
import { FRANJAS, Franja } from '../../../core/models/franja.model';

@Component({
  selector: 'app-controles-prediccion',
  imports: [],
  templateUrl: './controles-prediccion.html',
  styleUrl: './controles-prediccion.css',
})
export class ControlesPrediccion {
  readonly fecha = input.required<string>();
  readonly franja = input<Franja>('Tarde (12-17)');
  /** Escenario de lluvia relativo a la normal de cada distrito, en % (-100 a +100); 0 = lluvia normal. */
  readonly escenarioPct = input(0);
  /** true si la API usó el último dato de parque vehicular disponible. */
  readonly usaUltimoParque = input(false);
  /** Variación (%) del total nacional esperado frente a la normal; null si no hay escenario o aún no se calcula. */
  readonly variacionTotalPct = input<number | null>(null);

  readonly fechaChange = output<string>();
  readonly franjaChange = output<Franja>();
  readonly escenarioPctChange = output<number>();

  protected readonly franjas = FRANJAS.map((valor) => ({ valor, etiqueta: etiquetaFranja(valor) }));

  protected readonly escenarioTexto = computed(() => {
    const p = this.escenarioPct();
    if (p === 0) {
      return 'Lluvia normal';
    }
    if (p <= -100) {
      return 'Sin lluvia';
    }
    return p > 0
      ? `Lluvia ${p}% mayor que lo normal`
      : `Lluvia ${Math.abs(p)}% menor que lo normal`;
  });

  protected readonly efectoTexto = computed(() => {
    const v = this.variacionTotalPct();
    if (v === null) {
      return null;
    }
    if (Math.abs(v) < 0.5) {
      return 'Sin cambio en los siniestros esperados';
    }
    return `${formatearPorcentaje(v, { decimales: 1, conSigno: true })} de siniestros esperados`;
  });

  protected onFechaChange(evento: Event): void {
    this.fechaChange.emit((evento.target as HTMLInputElement).value);
  }

  protected onFranjaChange(evento: Event): void {
    this.franjaChange.emit((evento.target as HTMLSelectElement).value as Franja);
  }

  protected onEscenarioChange(evento: Event): void {
    this.escenarioPctChange.emit(Number((evento.target as HTMLInputElement).value));
  }

  protected restablecer(): void {
    this.escenarioPctChange.emit(0);
  }
}

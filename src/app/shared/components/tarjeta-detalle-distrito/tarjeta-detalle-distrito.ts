import { DecimalPipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { ConteoPipe, PorcentajePipe } from '../../../core/format/formato.pipes';
import { agruparCausas, fraseCausas } from '../../../core/modelo/causas';
import { horarioFranja, nombreFranja } from '../../../core/modelo/etiquetas-modelo';
import { DistritoOut } from '../../../core/models/distrito.model';
import { Franja } from '../../../core/models/franja.model';
import { CausaEsperada } from '../../../core/models/prediccion.model';
import { Tercil } from '../../../core/models/ranking.model';

export interface PuntoSerieHoraria {
  franja: Franja;
  valor: number;
}

@Component({
  selector: 'app-tarjeta-detalle-distrito',
  imports: [DecimalPipe, ConteoPipe, PorcentajePipe],
  templateUrl: './tarjeta-detalle-distrito.html',
  styleUrl: './tarjeta-detalle-distrito.css',
})
export class TarjetaDetalleDistrito {
  readonly distrito = input.required<DistritoOut | null>();
  readonly valorEsperado = input.required<number | null>();
  readonly tercil = input.required<Tercil | null>();
  readonly serieHoraria = input.required<PuntoSerieHoraria[]>();
  /** Reparto del esperado de la franja seleccionada por causa (proporción histórica 2022-2024). */
  readonly porCausa = input<CausaEsperada[]>([]);
  readonly franjaSeleccionada = input<Franja | null>(null);

  readonly cerrar = output<void>();

  protected readonly maximoSerie = computed(() =>
    Math.max(1e-9, ...this.serieHoraria().map((p) => p.valor)),
  );

  protected readonly causas = computed(() => agruparCausas(this.porCausa()));
  protected readonly maximoCausa = computed(() =>
    Math.max(1e-9, ...this.porCausa().map((c) => c.esperado)),
  );
  protected readonly frase = computed(() => {
    const franja = this.franjaSeleccionada();
    const total = this.valorEsperado();
    return franja && total !== null ? fraseCausas(total, franja, this.causas()) : null;
  });

  protected readonly nombreFranja = nombreFranja;
  protected readonly horarioFranja = horarioFranja;

  protected porcentaje(valor: number): number {
    return Math.round((valor / this.maximoSerie()) * 100);
  }

  protected anchoCausa(esperado: number): number {
    return Math.round((esperado / this.maximoCausa()) * 100);
  }
}

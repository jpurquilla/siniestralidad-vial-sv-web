import { DecimalPipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { ConteoPipe, PorcentajePipe } from '../../../core/format/formato.pipes';
import { etiquetaFranja } from '../../../core/modelo/etiquetas-modelo';
import { DistritoOut } from '../../../core/models/distrito.model';
import { Franja } from '../../../core/models/franja.model';
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

  readonly cerrar = output<void>();

  protected readonly maximoSerie = computed(() =>
    Math.max(1e-9, ...this.serieHoraria().map((p) => p.valor)),
  );

  protected readonly etiquetaFranja = etiquetaFranja;

  protected porcentaje(valor: number): number {
    return Math.round((valor / this.maximoSerie()) * 100);
  }
}

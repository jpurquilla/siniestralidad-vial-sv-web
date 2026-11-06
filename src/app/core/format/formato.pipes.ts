import { Pipe, PipeTransform } from '@angular/core';

import {
  formatearConteo,
  formatearDecimal,
  formatearFechaLarga,
  formatearPorcentaje,
  formatearValorP,
} from './formato';

@Pipe({ name: 'conteo' })
export class ConteoPipe implements PipeTransform {
  transform(valor: number | null | undefined): string {
    return formatearConteo(valor);
  }
}

@Pipe({ name: 'decimal2' })
export class Decimal2Pipe implements PipeTransform {
  transform(valor: number | null | undefined, decimales = 2): string {
    return formatearDecimal(valor, decimales);
  }
}

@Pipe({ name: 'porcentaje' })
export class PorcentajePipe implements PipeTransform {
  transform(
    valor: number | null | undefined,
    opciones: { esFraccion?: boolean; decimales?: number; conSigno?: boolean } = {},
  ): string {
    return formatearPorcentaje(valor, opciones);
  }
}

@Pipe({ name: 'fechaLarga' })
export class FechaLargaPipe implements PipeTransform {
  transform(iso: string | null | undefined): string {
    return formatearFechaLarga(iso);
  }
}

@Pipe({ name: 'valorP' })
export class ValorPPipe implements PipeTransform {
  transform(p: number | null | undefined): string {
    return formatearValorP(p);
  }
}

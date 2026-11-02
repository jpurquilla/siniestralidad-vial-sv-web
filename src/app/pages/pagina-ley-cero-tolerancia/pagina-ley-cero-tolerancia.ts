import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';

import { mensajeErrorHttp } from '../../core/errores/mensaje-error-http';
import { ConteoPipe, Decimal2Pipe, FechaLargaPipe, PorcentajePipe } from '../../core/format/formato.pipes';
import {
  ImpactoAnualOut,
  ImpactoResumenItemOut,
  TasaPorVehiculoOut,
} from '../../core/models/impacto-ley.model';
import { ImpactoLeyService } from '../../core/services/impacto-ley.service';
import { AvisoApi } from '../../shared/components/aviso-api/aviso-api';

@Component({
  selector: 'app-pagina-ley-cero-tolerancia',
  imports: [AvisoApi, ConteoPipe, Decimal2Pipe, FechaLargaPipe, PorcentajePipe],
  templateUrl: './pagina-ley-cero-tolerancia.html',
  styleUrl: './pagina-ley-cero-tolerancia.css',
})
export class PaginaLeyCeroTolerancia {
  private readonly impactoLeyService = inject(ImpactoLeyService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);
  protected readonly fechaAprobacionLey = signal<string | null>(null);
  protected readonly serieAnual = signal<ImpactoAnualOut[]>([]);
  protected readonly resumen = signal<ImpactoResumenItemOut[]>([]);
  protected readonly tasasPorVehiculo = signal<TasaPorVehiculoOut[]>([]);

  constructor() {
    this.impactoLeyService.obtener().subscribe({
      next: (respuesta) => {
        this.cargando.set(false);
        this.aviso.set(respuesta.aviso);
        this.fechaAprobacionLey.set(respuesta.fecha_aprobacion_ley);
        this.serieAnual.set(respuesta.serie_anual);
        this.resumen.set(respuesta.resumen);
        this.tasasPorVehiculo.set(respuesta.tasas_por_vehiculo ?? []);
      },
      error: (error: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(mensajeErrorHttp(error));
      },
    });
  }
}

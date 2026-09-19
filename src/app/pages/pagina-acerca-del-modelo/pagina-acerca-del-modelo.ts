import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';

import { mensajeErrorHttp } from '../../core/errores/mensaje-error-http';
import { ModeloInfoResponse } from '../../core/models/modelo-info.model';
import { ModeloInfoService } from '../../core/services/modelo-info.service';

@Component({
  selector: 'app-pagina-acerca-del-modelo',
  imports: [],
  templateUrl: './pagina-acerca-del-modelo.html',
  styleUrl: './pagina-acerca-del-modelo.css',
})
export class PaginaAcercaDelModelo {
  private readonly modeloInfoService = inject(ModeloInfoService);

  protected readonly info = signal<ModeloInfoResponse | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly metricasOrdenadas = () =>
    Object.entries(this.info()?.metricas ?? {}).sort(([a], [b]) => a.localeCompare(b));

  constructor() {
    this.modeloInfoService.obtener().subscribe({
      next: (respuesta) => {
        this.info.set(respuesta);
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(mensajeErrorHttp(error));
        this.cargando.set(false);
      },
    });
  }
}

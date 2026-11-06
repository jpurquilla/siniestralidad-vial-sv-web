import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';

import { mensajeErrorHttp } from '../../core/errores/mensaje-error-http';
import { ComparacionDistritoOut } from '../../core/models/comparacion-historica.model';
import { ComparacionHistoricaService } from '../../core/services/comparacion-historica.service';
import { ConteoPipe, PorcentajePipe } from '../../core/format/formato.pipes';
import { AvisoApi } from '../../shared/components/aviso-api/aviso-api';
import { NotaPeriodoEvaluacion } from '../../shared/components/nota-periodo-evaluacion/nota-periodo-evaluacion';

@Component({
  selector: 'app-pagina-ranking-comparativo',
  imports: [AvisoApi, ConteoPipe, NotaPeriodoEvaluacion, PorcentajePipe],
  templateUrl: './pagina-ranking-comparativo.html',
  styleUrl: './pagina-ranking-comparativo.css',
})
export class PaginaRankingComparativo {
  private readonly comparacionHistoricaService = inject(ComparacionHistoricaService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);
  protected readonly distritos = signal<ComparacionDistritoOut[]>([]);

  constructor() {
    this.comparacionHistoricaService.obtener().subscribe({
      next: (respuesta) => {
        this.cargando.set(false);
        this.aviso.set(respuesta.aviso);
        this.distritos.set(respuesta.distritos);
      },
      error: (error: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(mensajeErrorHttp(error));
      },
    });
  }

  protected claseBrecha(brechaPct: number): string {
    if (brechaPct > 15) {
      return 'brecha brecha-subestima';
    }
    if (brechaPct < -15) {
      return 'brecha brecha-sobreestima';
    }
    return 'brecha brecha-ajustada';
  }
}

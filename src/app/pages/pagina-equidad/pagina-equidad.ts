import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';

import { mensajeErrorHttp } from '../../core/errores/mensaje-error-http';
import { GrupoEquidadOut } from '../../core/models/equidad.model';
import { EquidadService } from '../../core/services/equidad.service';
import { AvisoApi } from '../../shared/components/aviso-api/aviso-api';

@Component({
  selector: 'app-pagina-equidad',
  imports: [AvisoApi, DecimalPipe],
  templateUrl: './pagina-equidad.html',
  styleUrl: './pagina-equidad.css',
})
export class PaginaEquidad {
  private readonly equidadService = inject(EquidadService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);
  protected readonly urbanoRural = signal<GrupoEquidadOut[]>([]);
  protected readonly densidadPoblacional = signal<GrupoEquidadOut[]>([]);

  constructor() {
    this.equidadService.obtener().subscribe({
      next: (respuesta) => {
        this.cargando.set(false);
        this.aviso.set(respuesta.aviso);
        this.urbanoRural.set(respuesta.urbano_rural);
        this.densidadPoblacional.set(respuesta.densidad_poblacional);
      },
      error: (error: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(mensajeErrorHttp(error));
      },
    });
  }
}

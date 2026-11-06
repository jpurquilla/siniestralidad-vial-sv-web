import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';

import { mensajeErrorHttp } from '../../core/errores/mensaje-error-http';
import { ConteoPipe, PorcentajePipe } from '../../core/format/formato.pipes';
import {
  LetalidadPorEdadOut,
  RepartoTipoUsuarioOut,
} from '../../core/models/usuarios-vulnerables.model';
import { UsuariosVulnerablesService } from '../../core/services/usuarios-vulnerables.service';
import { AvisoApi } from '../../shared/components/aviso-api/aviso-api';

@Component({
  selector: 'app-pagina-usuarios-vulnerables',
  imports: [AvisoApi, ConteoPipe, PorcentajePipe],
  templateUrl: './pagina-usuarios-vulnerables.html',
  styleUrl: './pagina-usuarios-vulnerables.css',
})
export class PaginaUsuariosVulnerables {
  private readonly usuariosVulnerablesService = inject(UsuariosVulnerablesService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);
  protected readonly repartoPorTipo = signal<RepartoTipoUsuarioOut[]>([]);
  protected readonly letalidadPorEdad = signal<LetalidadPorEdadOut[]>([]);

  constructor() {
    this.usuariosVulnerablesService.obtener().subscribe({
      next: (respuesta) => {
        this.cargando.set(false);
        this.aviso.set(respuesta.aviso);
        this.repartoPorTipo.set(respuesta.reparto_por_tipo);
        this.letalidadPorEdad.set(respuesta.letalidad_por_edad);
      },
      error: (error: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(mensajeErrorHttp(error));
      },
    });
  }
}

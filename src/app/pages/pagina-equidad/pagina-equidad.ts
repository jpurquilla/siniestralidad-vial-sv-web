import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';

import { RANGO_CALIBRADO, interpretarCalibracion } from '../../core/equidad/interpretar-calibracion';
import { mensajeErrorHttp } from '../../core/errores/mensaje-error-http';
import { formatearDecimal, formatearPorcentaje } from '../../core/format/formato';
import { GrupoEquidadOut } from '../../core/models/equidad.model';
import { EquidadService } from '../../core/services/equidad.service';
import { AvisoApi } from '../../shared/components/aviso-api/aviso-api';
import { NotaPeriodoEvaluacion } from '../../shared/components/nota-periodo-evaluacion/nota-periodo-evaluacion';

export interface GrupoVista {
  grupo: string;
  nDistritos: number;
  calibracion: string;
  spearman: string;
  descripcion: string | null;
  lectura: 'sobreestima' | 'subestima' | 'exacta';
  etiquetaLectura: string;
}

const NOTA_POCOS_DISTRITOS =
  'Los grupos rural y de baja densidad tienen pocos distritos: leer su Spearman con cautela.';

const DESCRIPCION_GRUPO: Record<string, string> = {
  Urbano: '30% o más de población urbana',
  Rural: 'menos de 30% de población urbana',
};

export interface CorteVista {
  titulo: string;
  nota: string | null;
  grupos: GrupoVista[];
}

function aVista(g: GrupoEquidadOut): GrupoVista {
  const i = interpretarCalibracion(g.calibracion);
  const detalle =
    i.lectura === 'exacta' ? i.etiqueta : `${i.etiqueta} (${formatearPorcentaje(i.desvioPct, { conSigno: true })})`;
  return {
    grupo: g.grupo,
    nDistritos: g.n_distritos,
    calibracion: formatearDecimal(g.calibracion, 2),
    spearman: formatearDecimal(g.spearman, 2),
    descripcion: DESCRIPCION_GRUPO[g.grupo] ?? null,
    lectura: i.lectura,
    etiquetaLectura: detalle,
  };
}

@Component({
  selector: 'app-pagina-equidad',
  imports: [AvisoApi, NotaPeriodoEvaluacion],
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

  protected readonly rangoCalibrado = `${formatearDecimal(RANGO_CALIBRADO.minimo, 2)} y ${formatearDecimal(RANGO_CALIBRADO.maximo, 2)}`;

  protected readonly cortes = computed<CorteVista[]>(() => [
    {
      titulo: 'Urbano vs. rural',
      nota: NOTA_POCOS_DISTRITOS,
      grupos: this.urbanoRural().map(aVista),
    },
    {
      titulo: 'Alta vs. baja densidad poblacional',
      nota: NOTA_POCOS_DISTRITOS,
      grupos: this.densidadPoblacional().map(aVista),
    },
  ]);

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

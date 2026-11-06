import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';

import { mensajeErrorHttp } from '../../core/errores/mensaje-error-http';
import { formatearConteo, formatearPorcentaje } from '../../core/format/formato';
import { crearEscalaDivergente } from '../../core/mapa/escala-divergente';
import { ComparacionDistritoOut } from '../../core/models/comparacion-historica.model';
import { DistritoGeoJsonResultado } from '../../core/models/distrito-geojson.model';
import { ComparacionHistoricaService } from '../../core/services/comparacion-historica.service';
import { DistritosService } from '../../core/services/distritos.service';
import { AvisoApi } from '../../shared/components/aviso-api/aviso-api';
import { ClaseLeyenda } from '../../shared/components/leyenda-mapa/clase-leyenda.model';
import { LeyendaMapa } from '../../shared/components/leyenda-mapa/leyenda-mapa';
import { DatoDistritoMapa, MapaDistritos } from '../../shared/components/mapa-distritos/mapa-distritos';
import { NotaPeriodoEvaluacion } from '../../shared/components/nota-periodo-evaluacion/nota-periodo-evaluacion';

@Component({
  selector: 'app-pagina-mapa-de-brecha',
  imports: [AvisoApi, LeyendaMapa, MapaDistritos, NotaPeriodoEvaluacion],
  templateUrl: './pagina-mapa-de-brecha.html',
  styleUrl: './pagina-mapa-de-brecha.css',
})
export class PaginaMapaDeBrecha {
  private readonly comparacionHistoricaService = inject(ComparacionHistoricaService);
  private readonly distritosService = inject(DistritosService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);
  protected readonly distritos = signal<ComparacionDistritoOut[]>([]);

  protected readonly geojson = signal<DistritoGeoJsonResultado | null>(null);
  protected readonly geojsonError = signal<string | null>(null);

  /** Escala fija en ±50%: los extremos se marcan como «fuera de escala». */
  protected readonly escala = crearEscalaDivergente();

  protected readonly extrasLeyenda: ClaseLeyenda[] = [
    { color: '#ffffff', etiqueta: 'Fuera de escala (más allá de ±50%)' },
  ];

  protected readonly datosPorDistrito = computed<Map<string, DatoDistritoMapa>>(() => {
    const resultado = new Map<string, DatoDistritoMapa>();
    for (const d of this.distritos()) {
      resultado.set(d.distrito_codigo, {
        nombre: d.nombre,
        valorEsperado: d.brecha_pct,
        tercil: null,
        observado: d.observado,
        predicho: d.predicho,
        fueraDeEscala: this.escala.fueraDeEscala(d.brecha_pct),
      });
    }
    return resultado;
  });

  protected readonly formatoTooltip = (dato: DatoDistritoMapa): string => {
    const lectura =
      dato.valorEsperado > 0 ? 'el modelo subestima' : dato.valorEsperado < 0 ? 'el modelo sobreestima' : 'sin diferencia';
    const lineas = [
      `<strong>${dato.nombre}</strong>`,
      `Observado: ${formatearConteo(dato.observado)} siniestros`,
      `Predicho: ${formatearConteo(dato.predicho)} siniestros`,
      `Brecha: ${formatearPorcentaje(dato.valorEsperado, { conSigno: true })} (${lectura})`,
    ];
    if (dato.fueraDeEscala) {
      lineas.push('Fuera de escala (más allá de ±50%)');
    }
    return lineas.join('<br>');
  };

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

    this.distritosService.geojson().subscribe({
      next: (resultado) => this.geojson.set(resultado),
      error: (error: HttpErrorResponse) => this.geojsonError.set(mensajeErrorHttp(error)),
    });
  }
}

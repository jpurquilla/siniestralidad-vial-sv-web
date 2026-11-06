import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, catchError, of, switchMap, tap } from 'rxjs';

import { DescargaArchivo } from '../../core/informes/descargar-archivo';
import { mensajeErrorInforme } from '../../core/informes/mensaje-error-informe';
import {
  FIGURA_1,
  FIGURA_2,
  FIGURA_3,
  FIGURA_4,
  FUENTE_FIGURAS,
  NOTAS_SUPUESTOS,
  TABLA_1,
  TABLA_2,
  TABLA_3,
  TEXTO_LLUVIA,
  textoParque,
} from '../../core/informes/numeracion-informe';
import {
  NOMBRES_DIAS,
  NOMBRES_DIAS_CORTOS,
  MAXIMO_DIAS_INFORME,
  diasInclusivos,
  nombreArchivoInforme,
  paramsDeSolicitud,
  solicitudDesdeParams,
  validarSolicitud,
} from '../../core/informes/solicitud-informe';
import { formatearDecimal, formatearFechaLarga } from '../../core/format/formato';
import { hoyEnElSalvador } from '../../core/format/fecha-el-salvador';
import { horarioFranja, nombreFranja } from '../../core/modelo/etiquetas-modelo';
import { FRANJAS, Franja } from '../../core/models/franja.model';
import { InformePeriodo, SolicitudInforme } from '../../core/models/informe-periodo.model';
import { DistritosService } from '../../core/services/distritos.service';
import { FormatoInforme, InformesService } from '../../core/services/informes.service';
import { SiniestrosService } from '../../core/services/siniestros.service';
import { AvisoSintetico } from '../../shared/components/aviso-sintetico/aviso-sintetico';
import { BuscadorDistrito, OpcionBusqueda } from '../../shared/components/buscador-distrito/buscador-distrito';
import { GraficoCausasBarras } from '../../shared/components/grafico-causas-barras/grafico-causas-barras';
import { GraficoCausasFranja } from '../../shared/components/grafico-causas-franja/grafico-causas-franja';
import { GraficoDiasSemana } from '../../shared/components/grafico-dias-semana/grafico-dias-semana';
import { MapaCalorFranja } from '../../shared/components/mapa-calor-franja/mapa-calor-franja';
import { TablaDistritosInforme } from '../../shared/components/tabla-distritos-informe/tabla-distritos-informe';

interface FilaDia {
  indice: number;
  corto: string;
  nombre: string;
}

/**
 * Informe de siniestros esperados por periodo. Los parámetros viven en la URL (mismos nombres que la
 * API). El informe se genera al abrir la página y cada vez que se pulsa «Generar informe»: no se
 * recalcula al editar, porque un rango de 92 días puede tardar unos 3 s.
 */
@Component({
  selector: 'app-pagina-informe-periodo',
  imports: [
    AvisoSintetico,
    BuscadorDistrito,
    GraficoCausasBarras,
    GraficoCausasFranja,
    GraficoDiasSemana,
    MapaCalorFranja,
    TablaDistritosInforme,
  ],
  templateUrl: './pagina-informe-periodo.html',
  styleUrls: ['./pagina-informe-periodo.css', './pagina-informe-periodo-formulario.css'],
})
export class PaginaInformePeriodo {
  private readonly informes = inject(InformesService);
  private readonly archivo = inject(DescargaArchivo);
  private readonly distritosService = inject(DistritosService);
  private readonly siniestros = inject(SiniestrosService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  protected readonly franjas = FRANJAS;
  protected readonly dias: FilaDia[] = NOMBRES_DIAS.map((nombre, indice) => ({
    indice,
    nombre,
    corto: NOMBRES_DIAS_CORTOS[indice],
  }));
  protected readonly maximoDias = MAXIMO_DIAS_INFORME;
  protected readonly textos = { FIGURA_1, FIGURA_2, FIGURA_3, FIGURA_4, TABLA_1, TABLA_2, TABLA_3 };
  protected readonly fuenteFiguras = FUENTE_FIGURAS;
  protected readonly textoLluvia = TEXTO_LLUVIA;
  protected readonly notasSupuestos = NOTAS_SUPUESTOS;
  protected readonly nombreFranja = nombreFranja;
  protected readonly horarioFranja = horarioFranja;
  protected readonly formatearDecimal = formatearDecimal;
  protected readonly formatearFechaLarga = formatearFechaLarga;

  // Formulario (estado en la URL).
  protected readonly solicitud = signal<SolicitudInforme>(
    solicitudDesdeParams(this.ruta.snapshot.queryParamMap, hoyEnElSalvador()),
  );
  protected readonly errorValidacion = computed(() => validarSolicitud(this.solicitud()));
  protected readonly diasPeriodo = computed(() => {
    const s = this.solicitud();
    return diasInclusivos(s.fecha_inicio, s.fecha_fin);
  });

  // Listas de apoyo.
  private readonly distritosCatalogo = signal<OpcionBusqueda<string>[]>([]);
  protected readonly departamentos = signal<string[]>([]);
  protected readonly errorListas = signal<string | null>(null);
  protected readonly opcionesDistrito = computed(() => this.distritosCatalogo() as OpcionBusqueda[]);
  protected readonly chipsDistritos = computed(() => {
    const nombres = new Map(this.distritosCatalogo().map((o) => [o.id, `${o.nombre} (${o.departamento})`]));
    return this.solicitud().distritos.map((codigo) => ({ codigo, nombre: nombres.get(codigo) ?? codigo }));
  });

  // Informe.
  protected readonly informe = signal<InformePeriodo | null>(null);
  /** Parámetros con que se generó el informe visible (los de las descargas). */
  private readonly solicitudGenerada = signal<SolicitudInforme | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly periodoInforme = computed(() => {
    const i = this.informe();
    return i
      ? `Del ${formatearFechaLarga(i.parametros.fecha_inicio)} al ${formatearFechaLarga(i.parametros.fecha_fin)}`
      : '';
  });
  protected readonly generadoEn = computed(() => {
    const g = this.informe()?.generado;
    return g ? `${formatearFechaLarga(g)}, ${g.slice(11, 16)}` : '';
  });
  protected readonly filtrosAplicados = computed(() => {
    const f = this.informe()?.parametros.filtros;
    if (!f) return [];
    const lista: string[] = [];
    if (f.departamento) lista.push(`Departamento: ${f.departamento}`);
    if (f.distritos.length) lista.push(`Distritos: ${f.distritos.length}`);
    if (f.franjas.length) lista.push(`Franjas: ${f.franjas.map(nombreFranja).join(', ')}`);
    if (f.dias_semana.length) lista.push(`Días: ${f.dias_semana.map((d) => NOMBRES_DIAS[d]).join(', ')}`);
    return lista;
  });
  protected readonly textoParque = computed(() => {
    const i = this.informe();
    if (!i) return null;
    const { fecha_inicio, fecha_fin } = i.parametros;
    return textoParque(i.supuestos.dias_con_ultimo_parque, diasInclusivos(fecha_inicio, fecha_fin));
  });

  // Descargas.
  protected readonly descargando = signal<FormatoInforme | null>(null);
  protected readonly errorDescarga = signal<string | null>(null);

  private readonly generar$ = new Subject<SolicitudInforme>();

  constructor() {
    this.distritosService.listar().subscribe({
      next: (r) =>
        this.distritosCatalogo.set(
          r.distritos.map((d) => ({ id: d.codigo, nombre: d.nombre, departamento: d.departamento, enAlcance: true, referencia: d.codigo })),
        ),
      error: (e: HttpErrorResponse) => this.errorListas.set(mensajeErrorInforme(e)),
    });
    this.siniestros.opcionesFiltro().subscribe({
      next: (r) => this.departamentos.set(r.departamentos),
      error: (e: HttpErrorResponse) => this.errorListas.set(mensajeErrorInforme(e)),
    });

    this.generar$
      .pipe(
        tap(() => {
          this.cargando.set(true);
          this.error.set(null);
          this.errorDescarga.set(null);
        }),
        switchMap((solicitud) =>
          this.informes.periodo(solicitud).pipe(
            tap((informe) => {
              this.informe.set(informe);
              this.solicitudGenerada.set(solicitud);
            }),
            catchError((e: HttpErrorResponse) => {
              this.error.set(mensajeErrorInforme(e));
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.cargando.set(false));

    this.actualizarUrl();
    this.generar();
  }

  protected generar(): void {
    if (this.errorValidacion()) {
      return;
    }
    this.generar$.next(this.solicitud());
  }

  protected onFecha(campo: 'fecha_inicio' | 'fecha_fin', evento: Event): void {
    this.cambiar({ [campo]: (evento.target as HTMLInputElement).value });
  }

  protected onDepartamento(evento: Event): void {
    this.cambiar({ departamento: (evento.target as HTMLSelectElement).value || null });
  }

  protected onElegirDistrito(opcion: OpcionBusqueda): void {
    const codigo = opcion.id;
    if (!this.solicitud().distritos.includes(codigo)) {
      this.cambiar({ distritos: [...this.solicitud().distritos, codigo] });
    }
  }

  protected quitarDistrito(codigo: string): void {
    this.cambiar({ distritos: this.solicitud().distritos.filter((d) => d !== codigo) });
  }

  protected alternarFranja(franja: Franja, marcada: boolean): void {
    const elegidas = new Set(this.solicitud().franjas);
    if (marcada) {
      elegidas.add(franja);
    } else {
      elegidas.delete(franja);
    }
    this.cambiar({ franjas: FRANJAS.filter((f) => elegidas.has(f)) });
  }

  protected alternarDia(dia: number, marcado: boolean): void {
    const actuales = this.solicitud().dias_semana.filter((d) => d !== dia);
    this.cambiar({ dias_semana: (marcado ? [...actuales, dia] : actuales).sort((a, b) => a - b) });
  }

  protected descargar(formato: FormatoInforme): void {
    const solicitud = this.solicitudGenerada();
    if (!solicitud || this.descargando()) {
      return;
    }
    this.descargando.set(formato);
    this.errorDescarga.set(null);
    this.informes.descargar(solicitud, formato).subscribe({
      next: (blob) => {
        this.archivo.guardar(blob, nombreArchivoInforme(solicitud, formato));
        this.descargando.set(null);
      },
      error: (e: HttpErrorResponse) => {
        this.errorDescarga.set(`No se pudo generar el ${formato === 'pdf' ? 'PDF' : 'Excel'}. ${mensajeErrorInforme(e)}`);
        this.descargando.set(null);
      },
    });
  }

  private cambiar(cambio: Partial<SolicitudInforme>): void {
    this.solicitud.update((s) => ({ ...s, ...cambio }));
    this.actualizarUrl();
  }

  private actualizarUrl(): void {
    void this.router.navigate([], {
      relativeTo: this.ruta,
      queryParams: paramsDeSolicitud(this.solicitud()),
      replaceUrl: true,
    });
  }
}

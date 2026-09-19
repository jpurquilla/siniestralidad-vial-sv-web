import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FiltrosHotspots } from './filtros-hotspots';
import { OpcionesFiltroSiniestrosResponse } from '../../../core/models/siniestro-punto.model';

const OPCIONES: OpcionesFiltroSiniestrosResponse = {
  tipos_siniestro: ['Volcamiento', 'Atropello'],
  tipos_vehiculo: ['Motocicleta', 'Automovil'],
  factores_causantes: ['Velocidad Excesiva'],
  departamentos: ['San Salvador', 'Santa Ana'],
};

describe('FiltrosHotspots', () => {
  let fixture: ComponentFixture<FiltrosHotspots>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FiltrosHotspots);
    fixture.componentRef.setInput('opciones', OPCIONES);
    fixture.detectChanges();
  });

  function elemento<T extends Element>(testid: string): T {
    return (fixture.nativeElement as HTMLElement).querySelector(`[data-testid="${testid}"]`) as T;
  }

  it('puebla los selects con las opciones reales recibidas', () => {
    const selectTipoSiniestro = elemento<HTMLSelectElement>('tipo-siniestro');
    const etiquetas = Array.from(selectTipoSiniestro.options).map((o) => o.value);
    expect(etiquetas).toContain('Volcamiento');
    expect(etiquetas).toContain('Atropello');

    const selectDepartamento = elemento<HTMLSelectElement>('departamento');
    expect(Array.from(selectDepartamento.options).map((o) => o.value)).toContain('San Salvador');
  });

  it('emite filtroChange con fecha_inicio/fecha_fin al cambiar las fechas', () => {
    const emitidos: unknown[] = [];
    fixture.componentInstance.filtroChange.subscribe((f) => emitidos.push(f));

    const inputFechaInicio = elemento<HTMLInputElement>('fecha-inicio');
    inputFechaInicio.value = '2022-08-03';
    inputFechaInicio.dispatchEvent(new Event('change'));

    expect(emitidos.at(-1)).toEqual(expect.objectContaining({ fechaInicio: '2022-08-03' }));
  });

  it('emite filtroChange con tipoSiniestro al elegir un select', () => {
    const emitidos: unknown[] = [];
    fixture.componentInstance.filtroChange.subscribe((f) => emitidos.push(f));

    const select = elemento<HTMLSelectElement>('tipo-siniestro');
    select.value = 'Volcamiento';
    select.dispatchEvent(new Event('change'));

    expect(emitidos.at(-1)).toEqual(expect.objectContaining({ tipoSiniestro: 'Volcamiento' }));
  });

  it('no incluye campos vacíos en el filtro emitido (vuelven a "Todos")', () => {
    const emitidos: unknown[] = [];
    fixture.componentInstance.filtroChange.subscribe((f) => emitidos.push(f));

    const select = elemento<HTMLSelectElement>('tipo-siniestro');
    select.value = 'Volcamiento';
    select.dispatchEvent(new Event('change'));
    select.value = '';
    select.dispatchEvent(new Event('change'));

    expect(Object.keys(emitidos.at(-1) as object)).not.toContain('tipoSiniestro');
  });
});

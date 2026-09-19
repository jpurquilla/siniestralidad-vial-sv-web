import { TestBed } from '@angular/core/testing';
import { RankingGrupo } from './ranking-grupo';
import { RankingItemOut } from '../../../core/models/ranking.model';

const items: RankingItemOut[] = [
  {
    distrito_codigo: '01-01',
    nombre: 'Distrito A',
    siniestros_esperados: 5,
    tercil: 'alto',
    confiabilidad_spearman: 0.98,
  },
  {
    distrito_codigo: '01-02',
    nombre: 'Distrito B',
    siniestros_esperados: 3,
    tercil: 'alto',
    confiabilidad_spearman: 0.98,
  },
];

function crear(
  overrides: { advertencia?: string | null; distritoSeleccionado?: string | null } = {},
) {
  const fixture = TestBed.createComponent(RankingGrupo);
  fixture.componentRef.setInput('titulo', 'Tercil alto');
  fixture.componentRef.setInput('items', items);
  fixture.componentRef.setInput('advertencia', overrides.advertencia ?? null);
  fixture.componentRef.setInput('distritoSeleccionado', overrides.distritoSeleccionado ?? null);
  fixture.detectChanges();
  return fixture;
}

describe('RankingGrupo', () => {
  it('renderiza una fila por distrito', () => {
    const fixture = crear();
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('[data-fila]').length).toBe(2);
  });

  it('muestra la advertencia de fiabilidad cuando se pasa', () => {
    const fixture = crear({ advertencia: 'El ordenamiento de este grupo es poco confiable.' });
    expect((fixture.nativeElement as HTMLElement).textContent ?? '').toContain('poco confiable');
  });

  it('no muestra advertencia cuando no se pasa', () => {
    const fixture = crear();
    expect((fixture.nativeElement as HTMLElement).querySelector('.advertencia')).toBeNull();
  });

  it('emite seleccionar con el código del distrito al hacer click en una fila', () => {
    const fixture = crear();
    const emitidos: string[] = [];
    fixture.componentInstance.seleccionar.subscribe((v) => emitidos.push(v));

    const filas = (fixture.nativeElement as HTMLElement).querySelectorAll('[data-fila]');
    (filas[1] as HTMLElement).click();

    expect(emitidos).toEqual(['01-02']);
  });

  it('marca como seleccionada la fila que coincide con distritoSeleccionado', () => {
    const fixture = crear({ distritoSeleccionado: '01-02' });
    const filas = (fixture.nativeElement as HTMLElement).querySelectorAll('[data-fila]');
    expect((filas[1] as HTMLElement).classList.contains('seleccionado')).toBe(true);
    expect((filas[0] as HTMLElement).classList.contains('seleccionado')).toBe(false);
  });
});

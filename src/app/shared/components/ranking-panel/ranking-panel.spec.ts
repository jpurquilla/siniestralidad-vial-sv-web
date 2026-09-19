import { TestBed } from '@angular/core/testing';
import { RankingPanel } from './ranking-panel';
import { RankingItemOut } from '../../../core/models/ranking.model';

const ranking: RankingItemOut[] = [
  {
    distrito_codigo: '01-01',
    nombre: 'Distrito alto',
    siniestros_esperados: 9,
    tercil: 'alto',
    confiabilidad_spearman: 0.9775,
  },
  {
    distrito_codigo: '02-02',
    nombre: 'Distrito medio',
    siniestros_esperados: 4,
    tercil: 'medio',
    confiabilidad_spearman: 0.647,
  },
  {
    distrito_codigo: '03-03',
    nombre: 'Distrito bajo',
    siniestros_esperados: 1,
    tercil: 'bajo',
    confiabilidad_spearman: 0.8003,
  },
];

function crear() {
  const fixture = TestBed.createComponent(RankingPanel);
  fixture.componentRef.setInput('ranking', ranking);
  fixture.componentRef.setInput('distritoSeleccionado', null);
  fixture.detectChanges();
  return fixture;
}

describe('RankingPanel', () => {
  it('agrupa el ranking en tercil alto, medio y bajo', () => {
    const fixture = crear();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Distrito alto');
    expect(texto).toContain('Distrito medio');
    expect(texto).toContain('Distrito bajo');
  });

  it('solo el grupo del tercil medio muestra la advertencia de fiabilidad', () => {
    const fixture = crear();
    const advertencias = (fixture.nativeElement as HTMLElement).querySelectorAll('.advertencia');
    expect(advertencias.length).toBe(1);
    expect(advertencias[0].textContent ?? '').toContain('poco confiable');
  });

  it('reemite seleccionar con el código del distrito clickeado, sin importar el grupo', () => {
    const fixture = crear();
    const emitidos: string[] = [];
    fixture.componentInstance.seleccionar.subscribe((v) => emitidos.push(v));

    const filas = (fixture.nativeElement as HTMLElement).querySelectorAll('[data-fila]');
    (filas[0] as HTMLElement).click();

    expect(emitidos).toEqual(['01-01']);
  });
});

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

  it('muestra el aviso de orden aproximado y no califica ningún tercil de poco confiable', () => {
    const fixture = crear();
    const el = fixture.nativeElement as HTMLElement;
    const texto = el.textContent ?? '';
    expect(el.querySelector('[data-aviso-orden]')?.textContent).toContain(
      'El orden dentro de cada tercil es aproximado: los distritos de un mismo grupo tienen valores esperados parecidos y su posición relativa puede variar.',
    );
    expect(el.querySelectorAll('.advertencia').length).toBe(0);
    expect(texto.toLowerCase()).not.toContain('poco confiable');
    expect(texto.toLowerCase()).not.toContain('ordena mal');
  });

  it('muestra el Spearman de cada tercil como dato descriptivo', () => {
    const fixture = crear();
    const valores = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('[data-spearman]'),
    ).map((e) => e.textContent ?? '');
    expect(valores.length).toBe(3);
    expect(valores[0]).toContain('0.98');
    expect(valores[1]).toContain('0.65');
    expect(valores[2]).toContain('0.80');
  });

  it('aclara que el valor es siniestros esperados en la franja seleccionada', () => {
    const fixture = crear();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Siniestros esperados en la franja seleccionada',
    );
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

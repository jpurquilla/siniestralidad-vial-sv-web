import { CausaEsperada } from '../models/prediccion.model';
import { agruparCausas, fraseCausas } from './causas';

/** 7 causas con proporciones que suman 1; esperado total 0.72 (como el ejemplo de la noche). */
function causas(total = 0.72): CausaEsperada[] {
  const p: [string, number][] = [
    ['Distracción del Conductor', 0.2203],
    ['Invadir Carril', 0.1847],
    ['Estado de Ebriedad o Droga', 0.152],
    ['No Respetar Señales de Tránsito', 0.1208],
    ['No Guardar Distancia Reglamentaria', 0.1193],
    ['Velocidad Excesiva', 0.0603],
    ['Otros', 0.1426],
  ];
  return p
    .sort((a, b) => b[1] - a[1])
    .map(([causa, proporcion]) => ({ causa, proporcion, esperado: total * proporcion }));
}

describe('agruparCausas', () => {
  it('toma las 5 principales y agrupa el resto en «Otras causas» conservando el total', () => {
    const datos = causas();
    const g = agruparCausas(datos);
    expect(g.principales.length).toBe(5);
    expect(g.otras?.causa).toBe('Otras causas');
    const total = g.principales.reduce((s, c) => s + c.esperado, 0) + (g.otras?.esperado ?? 0);
    expect(total).toBeCloseTo(0.72, 9);
    const prop = g.principales.reduce((s, c) => s + c.proporcion, 0) + (g.otras?.proporcion ?? 0);
    expect(prop).toBeCloseTo(1, 9);
  });

  it('con 5 causas o menos no hay fila «Otras causas»', () => {
    expect(agruparCausas(causas().slice(0, 4)).otras).toBeNull();
  });
});

describe('fraseCausas', () => {
  it('menciona la causa principal y la ebriedad cuando está entre las 5 principales', () => {
    const frase = fraseCausas(0.72, 'Noche (18-23)', agruparCausas(causas()));
    expect(frase).toBe(
      'En promedio, de los 0.72 siniestros esperados esta noche, 0.16 se deberían a distracción del conductor (22.0%) y 0.11 a ebriedad o droga (15.2%).',
    );
  });

  it('si la ebriedad es la principal la menciona una sola vez', () => {
    const datos = causas().map((c) => (c.causa === 'Estado de Ebriedad o Droga' ? { ...c, proporcion: 0.9, esperado: 0.648 } : c));
    const frase = fraseCausas(0.72, 'Madrugada (00-05)', agruparCausas(datos));
    expect(frase).toBe(
      'En promedio, de los 0.72 siniestros esperados esta madrugada, 0.65 se deberían a ebriedad o droga (90.0%).',
    );
  });

  it('si la ebriedad no está entre las 5 principales, menciona solo la principal', () => {
    const datos = causas().filter((c) => c.causa !== 'Estado de Ebriedad o Droga').concat({
      causa: 'Estado de Ebriedad o Droga',
      proporcion: 0.001,
      esperado: 0.0007,
    });
    const frase = fraseCausas(0.72, 'Tarde (12-17)', agruparCausas(datos));
    expect(frase).toContain('se deberían a distracción del conductor');
    expect(frase).not.toContain('ebriedad');
  });

  it('sin causas no hay frase', () => {
    expect(fraseCausas(1, 'Tarde (12-17)', agruparCausas([]))).toBeNull();
  });
});

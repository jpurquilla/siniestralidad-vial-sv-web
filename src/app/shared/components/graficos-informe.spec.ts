import { TestBed } from '@angular/core/testing';

import { crearInformeFixture } from '../../core/informes/informe-periodo.fixture';
import { colorDeCausa, colorTextoSobre, contraste, COLOR_SIN_DEFINIR } from '../../core/informes/color-causa';
import { CausaInforme } from '../../core/models/informe-periodo.model';
import { GraficoCausasBarras } from './grafico-causas-barras/grafico-causas-barras';
import { GraficoCausasFranja } from './grafico-causas-franja/grafico-causas-franja';
import { GraficoDiasSemana } from './grafico-dias-semana/grafico-dias-semana';
import { MapaCalorFranja } from './mapa-calor-franja/mapa-calor-franja';
import { TablaDistritosInforme } from './tabla-distritos-informe/tabla-distritos-informe';

const informe = crearInformeFixture();

function montar<T>(tipo: new () => T, entradas: Record<string, unknown>) {
  const fixture = TestBed.createComponent(tipo);
  for (const [k, v] of Object.entries(entradas)) {
    fixture.componentRef.setInput(k, v);
  }
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('color-causa', () => {
  it('toma el color de colores_causas y usa gris solo si falta', () => {
    expect(colorDeCausa({ A: '#123456' }, 'A')).toBe('#123456');
    expect(colorDeCausa({}, 'B')).toBe(COLOR_SIN_DEFINIR);
  });
  it('elige texto claro u oscuro según el fondo', () => {
    expect(colorTextoSobre('#1f3a5f')).toBe('#ffffff');
    expect(colorTextoSobre('#e6ab02')).toBe('#111111');
    expect(colorTextoSobre('rojo')).toBe('#111111');
  });
  it('toda la paleta del fixture da texto con contraste de al menos 4', () => {
    for (const color of Object.values(informe.colores_causas)) {
      expect(contraste(color, colorTextoSobre(color))).toBeGreaterThanOrEqual(4);
    }
  });
});

describe('GraficoCausasBarras', () => {
  it('dibuja una fila por causa con su color, su barra de error y la etiqueta directa al final', () => {
    const { el } = montar(GraficoCausasBarras, { causas: informe.por_causa, colores: informe.colores_causas });
    const filas = el.querySelectorAll('[data-fila-causa]');
    expect(filas.length).toBe(9);
    expect(filas[0].textContent).toContain('Distracción del conductor');
    expect((filas[0].querySelector('[data-barra-causa]') as HTMLElement).style.backgroundColor).not.toBe('');
    expect(filas[0].querySelectorAll('.bigote .tapa').length).toBe(2);
    const etiqueta = filas[0].querySelector('[data-etiqueta-causa]')!.textContent!.replace(/\s+/g, ' ').trim();
    expect(etiqueta).toBe('535 (497 a 574)');
    expect(el.querySelector('[role="group"]')?.getAttribute('aria-label')).toContain('por causa');
    expect(el.textContent).toContain('Línea: rango del 90%.');
  });

  it('el eje usa números redondos y cubre el máximo del rango', () => {
    const { el } = montar(GraficoCausasBarras, { causas: informe.por_causa, colores: informe.colores_causas });
    const marcas = Array.from(el.querySelectorAll('.marca')).map((m) => m.textContent!.trim());
    expect(marcas).toEqual(['0', '200', '400', '600']);
  });

  it('muestra el tooltip al pasar sobre la barra, a la derecha del cursor, con nombre completo, esperado y rango', () => {
    const { fixture, el } = montar(GraficoCausasBarras, { causas: informe.por_causa, colores: informe.colores_causas });
    expect(el.querySelector('[data-tooltip]')).toBeNull();
    const barra = el.querySelectorAll('[data-barra-causa]')[2] as HTMLElement;
    barra.dispatchEvent(new MouseEvent('mousemove', { clientX: 120, clientY: 80, bubbles: true }));
    fixture.detectChanges();
    const tooltip = el.querySelector('[data-tooltip]') as HTMLElement;
    expect(tooltip).toBeTruthy();
    expect(tooltip.textContent).toContain('No respetar señales de tránsito');
    expect(tooltip.textContent).toContain('Esperado: 238 (12.0%)');
    expect(tooltip.textContent).toContain('Rango del 90%: 212 a 264');
    // a la derecha del cursor y por debajo del eje de la barra (no tapa su etiqueta)
    expect(parseFloat(tooltip.style.left)).toBeGreaterThan(120);
    expect(parseFloat(tooltip.style.top)).toBeGreaterThan(80);
    barra.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 80, bubbles: true }));
    fixture.detectChanges();
    expect(parseFloat((el.querySelector('[data-tooltip]') as HTMLElement).style.left)).toBe(166);
    barra.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    fixture.detectChanges();
    expect(el.querySelector('[data-tooltip]')).toBeNull();
  });

  it('una sola causa ocupa todo el ancho', () => {
    const una: CausaInforme[] = [{ causa: 'Otras causas', esperado: 10, ic90_inf: 7, ic90_sup: 14, porcentaje: 100 }];
    const { el } = montar(GraficoCausasBarras, { causas: una, colores: { 'Otras causas': '#9e9e9e' } });
    expect(el.querySelectorAll('[data-fila-causa]').length).toBe(1);
  });

  it('valores en cero y rango degenerado no producen NaN', () => {
    const ceros: CausaInforme[] = [
      { causa: 'A', esperado: 0, ic90_inf: 0, ic90_sup: 0, porcentaje: 0 },
      { causa: 'B', esperado: 0, ic90_inf: 0, ic90_sup: 0, porcentaje: 0 },
    ];
    const { el } = montar(GraficoCausasBarras, { causas: ceros, colores: {} });
    expect(el.innerHTML).not.toContain('NaN');
    const degenerado: CausaInforme[] = [{ causa: 'A', esperado: 5, ic90_inf: 5, ic90_sup: 5, porcentaje: 100 }];
    const r = montar(GraficoCausasBarras, { causas: degenerado, colores: { A: '#111111' } });
    expect(r.el.innerHTML).not.toContain('NaN');
  });

  it('sin causas no falla', () => {
    const { el } = montar(GraficoCausasBarras, { causas: [], colores: {} });
    expect(el.querySelectorAll('[data-fila-causa]').length).toBe(0);
  });
});

describe('GraficoCausasFranja', () => {
  it('una barra por franja; los segmentos suman 100% y hay una clave compacta de causas', () => {
    const { el } = montar(GraficoCausasFranja, { franjas: informe.causas_por_franja, colores: informe.colores_causas });
    const filas = el.querySelectorAll('[data-fila-franja]');
    expect(filas.length).toBe(4);
    const anchos = Array.from(filas[0].querySelectorAll('[data-segmento]')).map((r) => parseFloat((r as HTMLElement).style.width));
    expect(anchos.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 3);
    expect(el.querySelectorAll('[data-leyenda-causa]').length).toBe(9);
  });

  it('el porcentaje va dentro del segmento solo si mide más de 8% y el texto contrasta con el fondo', () => {
    const { el } = montar(GraficoCausasFranja, { franjas: informe.causas_por_franja, colores: informe.colores_causas });
    for (const seg of Array.from(el.querySelectorAll('[data-segmento]')) as HTMLElement[]) {
      const ancho = parseFloat(seg.style.width);
      const tiene = !!seg.querySelector('.porcentaje');
      expect(tiene).toBe(ancho > 8);
      if (tiene) {
        const fondo = informe.colores_causas[seg.getAttribute('title')!.split(', ')[1].split(':')[0]];
        expect(contraste(fondo, colorTextoSobre(fondo))).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it('una sola causa al 100%, y proporciones en cero no dibujan segmentos ni NaN', () => {
    const { el } = montar(GraficoCausasFranja, {
      franjas: [
        { franja: 'Noche (18-23)', causas: [{ causa: 'A', proporcion: 1 }] },
        { franja: 'Tarde (12-17)', causas: [{ causa: 'A', proporcion: 0 }] },
      ],
      colores: { A: '#112233' },
    });
    const filas = el.querySelectorAll('[data-fila-franja]');
    expect(filas[0].querySelectorAll('[data-segmento]').length).toBe(1);
    expect(filas[0].textContent).toContain('100%');
    expect(filas[1].querySelectorAll('[data-segmento]').length).toBe(0);
    expect(el.innerHTML).not.toContain('NaN');
  });
});

describe('GraficoDiasSemana', () => {
  it('siete columnas con el promedio por día (suma / veces); la mayor llega al tope del eje', () => {
    const { el } = montar(GraficoDiasSemana, { dias: informe.por_dia_semana });
    const columnas = el.querySelectorAll('[data-columna-dia] rect');
    expect(columnas.length).toBe(7);
    const valores = Array.from(el.querySelectorAll('[data-valor-dia]')).map((t) => Number(t.textContent));
    informe.por_dia_semana.forEach((d, i) => expect(valores[i]).toBe(Math.round(d.suma / d.veces)));
    const altos = Array.from(columnas).map((c) => Number(c.getAttribute('height')));
    expect(Math.max(...altos)).toBeGreaterThan(100);
    expect(Math.max(...altos)).toBeLessThanOrEqual(150);
  });

  it('indica bajo el gráfico cuántas veces aparece cada día en el periodo', () => {
    const { el } = montar(GraficoDiasSemana, { dias: informe.por_dia_semana });
    expect(el.querySelector('[data-testid="veces-dias"]')?.textContent).toContain(
      'Veces que aparece cada día en el periodo: lunes 5, martes 5, miércoles 5, jueves 4, viernes 4, sábado 4, domingo 4.',
    );
  });

  it('el eje vertical usa números redondos', () => {
    const { el } = montar(GraficoDiasSemana, { dias: informe.por_dia_semana });
    const marcas = Array.from(el.querySelectorAll('text.eje')).map((t) => t.textContent!.trim());
    expect(marcas).toEqual(['0', '20', '40', '60', '80']);
  });

  it('todo en cero: columnas de alto 0 y sin NaN', () => {
    const { el } = montar(GraficoDiasSemana, {
      dias: [
        { dia: 'Lunes', esperado: 0, veces: 0, suma: 0 },
        { dia: 'Martes', esperado: 0, veces: 0, suma: 0 },
      ],
    });
    expect(el.innerHTML).not.toContain('NaN');
  });
});

describe('MapaCalorFranja', () => {
  it('muestra como máximo 20 distritos y 4 franjas', () => {
    const { el } = montar(MapaCalorFranja, { distritos: informe.distrito_x_franja });
    expect(el.querySelectorAll('[data-fila-calor]').length).toBe(20);
    expect(el.querySelectorAll('[data-fila-calor]')[0].querySelectorAll('td').length).toBe(4);
  });

  it('la escala de color usa marcas redondas que cubren el máximo', () => {
    const { el } = montar(MapaCalorFranja, { distritos: informe.distrito_x_franja });
    const marcas = Array.from(el.querySelectorAll('[data-testid="escala-calor"] .marca')).map((m) => m.textContent!.trim());
    expect(marcas).toEqual(['0', '20', '40', '60', '80']);
  });

  it('franjas ausentes cuentan como 0', () => {
    const { el } = montar(MapaCalorFranja, { distritos: [{ codigo: 'a', distrito: 'A', franjas: { 'Noche (18-23)': 3 } }] });
    expect(el.querySelectorAll('td')[0].textContent?.trim()).toBe('0.0');
    expect(el.querySelectorAll('td')[3].textContent?.trim()).toBe('3.0');
  });
});

describe('TablaDistritosInforme', () => {
  const nombres = (el: HTMLElement) => Array.from(el.querySelectorAll('[data-fila-distrito] th')).map((t) => t.textContent?.trim());

  it('ordena por esperado desc, alterna con clic y ordena por nombre', () => {
    const { fixture, el } = montar(TablaDistritosInforme, { distritos: informe.por_distrito });
    expect(nombres(el)[0]).toBe('San Salvador');
    (el.querySelector('[data-orden="esperado"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(nombres(el)[0]).toBe(informe.por_distrito[informe.por_distrito.length - 1].distrito);
    (el.querySelector('[data-orden="distrito"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(nombres(el)[0]).toBe('Acajutla');
  });

  it('el tercil viene de la API (35 / 34 / 34 para 103 distritos) y no hay columna de causa', () => {
    const { el } = montar(TablaDistritosInforme, { distritos: informe.por_distrito });
    const conteo = (t: string) => el.querySelectorAll(`[data-tercil="${t}"]`).length;
    expect(informe.por_distrito.length).toBe(103);
    expect([conteo('alto'), conteo('medio'), conteo('bajo')]).toEqual([35, 34, 34]);
    expect(Array.from(el.querySelectorAll('thead th')).map((t) => t.textContent!.replace(/[▼▲]/g, '').trim())).toEqual([
      'Distrito', 'Departamento', 'Esperados', 'Rango del 90%', 'Riesgo', 'Por 10,000 hab.',
    ]);
    expect(el.textContent).not.toMatch(/causa principal/i);
  });

  it('el buscador filtra sin tildes y avisa si no hay resultados', () => {
    const { fixture, el } = montar(TablaDistritosInforme, { distritos: informe.por_distrito });
    const entrada = el.querySelector('[data-testid="buscar-tabla"]') as HTMLInputElement;
    entrada.value = 'antiguo cuscatlan';
    entrada.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(nombres(el)).toEqual(['Antiguo Cuscatlán']);
    entrada.value = 'zzz';
    entrada.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(el.querySelector('[data-sin-resultados]')).toBeTruthy();
  });
});

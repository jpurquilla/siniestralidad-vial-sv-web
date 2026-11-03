import { TestBed } from '@angular/core/testing';
import { ControlesPrediccion } from './controles-prediccion';

function crear(
  extras: { escenarioPct?: number; ultimoParque?: boolean; variacion?: number | null } = {},
) {
  const fixture = TestBed.createComponent(ControlesPrediccion);
  fixture.componentRef.setInput('fecha', '2024-06-15');
  fixture.componentRef.setInput('franja', 'Tarde (12-17)');
  fixture.componentRef.setInput('escenarioPct', extras.escenarioPct ?? 0);
  fixture.componentRef.setInput('usaUltimoParque', extras.ultimoParque ?? false);
  fixture.componentRef.setInput('variacionTotalPct', extras.variacion ?? null);
  fixture.detectChanges();
  return fixture;
}

describe('ControlesPrediccion', () => {
  it('muestra la fecha y la franja recibidas con el selector de franjas visible', () => {
    const fixture = crear();
    const el = fixture.nativeElement as HTMLElement;
    expect((el.querySelector('[data-testid="fecha"]') as HTMLInputElement).value).toBe(
      '2024-06-15',
    );
    const select = el.querySelector('[data-testid="franja"]') as HTMLSelectElement;
    expect(select.value).toBe('Tarde (12-17)');
    expect(select.options.length).toBe(4);
    expect(Array.from(select.options).map((o) => o.textContent?.trim())).toContain(
      'Mañana (06-11)',
    );
  });

  it('muestra la nota de que la predicción varía según la franja', () => {
    const el = crear().nativeElement as HTMLElement;
    expect(el.textContent).toContain('La predicción varía según la franja horaria.');
  });

  it('emite fechaChange cuando cambia la fecha', () => {
    const fixture = crear();
    const emitidos: string[] = [];
    fixture.componentInstance.fechaChange.subscribe((v) => emitidos.push(v));

    const input = fixture.nativeElement.querySelector('[data-testid="fecha"]') as HTMLInputElement;
    input.value = '2024-07-01';
    input.dispatchEvent(new Event('change'));

    expect(emitidos).toEqual(['2024-07-01']);
  });

  it('emite franjaChange con el valor de la API cuando cambia la franja', () => {
    const fixture = crear();
    const emitidos: string[] = [];
    fixture.componentInstance.franjaChange.subscribe((v) => emitidos.push(v));

    const select = fixture.nativeElement.querySelector(
      '[data-testid="franja"]',
    ) as HTMLSelectElement;
    select.value = 'Noche (18-23)';
    select.dispatchEvent(new Event('change'));

    expect(emitidos).toEqual(['Noche (18-23)']);
  });

  it('avisa cuando se usa el último dato de parque vehicular disponible', () => {
    const sin = crear().nativeElement as HTMLElement;
    expect(sin.querySelector('[data-testid="aviso-parque"]')).toBeNull();

    const con = crear({ ultimoParque: true }).nativeElement as HTMLElement;
    expect(con.querySelector('[data-testid="aviso-parque"]')?.textContent).toContain(
      'Para esta fecha se usa el último dato disponible de parque vehicular.',
    );
  });

  it('la nota de franja está dentro del recuadro de controles', () => {
    const el = crear().nativeElement as HTMLElement;
    expect(el.querySelector('.controles [data-testid="nota-franja"]')).not.toBeNull();
  });
  it('el deslizador va de -100% a +100%, inicia en 0% y rotula «Lluvia normal»', () => {
    const el = crear().nativeElement as HTMLElement;
    const range = el.querySelector('[data-testid="prcp"]') as HTMLInputElement;
    expect([range.min, range.max, range.value]).toEqual(['-100', '100', '0']);
    expect(el.querySelector('[data-testid="prcp-texto"]')?.textContent).toContain('Lluvia normal');
    expect(el.textContent).toContain('Sin lluvia');
    expect(el.textContent).toContain('El doble de lo normal');
    expect(el.querySelector('[data-testid="prcp-efecto"]')).toBeNull();
  });

  it('describe el escenario en texto', () => {
    const texto = (pct: number) =>
      (crear({ escenarioPct: pct }).nativeElement as HTMLElement).querySelector(
        '[data-testid="prcp-texto"]',
      )?.textContent;
    expect(texto(50)).toContain('Lluvia 50% mayor que lo normal');
    expect(texto(-30)).toContain('Lluvia 30% menor que lo normal');
    expect(texto(-100)).toContain('Sin lluvia');
  });

  it('emite el escenario como número y permite volver a lluvia normal', () => {
    const fixture = crear({ escenarioPct: 50 });
    const emitidos: number[] = [];
    fixture.componentInstance.escenarioPctChange.subscribe((v) => emitidos.push(v));
    const el = fixture.nativeElement as HTMLElement;

    const range = el.querySelector('[data-testid="prcp"]') as HTMLInputElement;
    range.value = '-25';
    range.dispatchEvent(new Event('input'));
    (el.querySelector('[data-testid="prcp-restablecer"]') as HTMLButtonElement).click();

    expect(emitidos).toEqual([-25, 0]);
  });

  it('muestra el efecto en el total nacional con un decimal, o «Sin cambio» si es menor que 0.5%', () => {
    const efecto = (v: number) =>
      (crear({ escenarioPct: 50, variacion: v }).nativeElement as HTMLElement).querySelector(
        '[data-testid="prcp-efecto"]',
      )?.textContent;
    expect(efecto(8.34)).toContain('+8.3% de siniestros esperados');
    expect(efecto(-3.4)).toContain('-3.4% de siniestros esperados');
    expect(efecto(0.3)).toContain('Sin cambio en los siniestros esperados');
  });

  it('mantiene la nota del efecto escalonado', () => {
    expect(
      (crear().nativeElement as HTMLElement).querySelector('[data-testid="prcp-escalonado"]')
        ?.textContent,
    ).toContain(
      'El efecto de la lluvia es escalonado: el modelo responde a partir de ciertos niveles mensuales, por eso algunos distritos no cambian.',
    );
  });
});

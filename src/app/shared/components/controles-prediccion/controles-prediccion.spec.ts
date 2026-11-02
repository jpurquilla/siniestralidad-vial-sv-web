import { TestBed } from '@angular/core/testing';
import { ControlesPrediccion } from './controles-prediccion';

function crear(
  extras: { prcpMensual?: number | null; prcpNormal?: number | null; ultimoParque?: boolean } = {},
) {
  const fixture = TestBed.createComponent(ControlesPrediccion);
  fixture.componentRef.setInput('fecha', '2024-06-15');
  fixture.componentRef.setInput('franja', 'Tarde (12-17)');
  fixture.componentRef.setInput('prcpMensual', extras.prcpMensual ?? null);
  fixture.componentRef.setInput('prcpNormal', extras.prcpNormal ?? null);
  fixture.componentRef.setInput('usaUltimoParque', extras.ultimoParque ?? false);
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

  it('el deslizador de lluvia inicia en la normal climatológica y la muestra en mm', () => {
    const fixture = crear({ prcpNormal: 180 });
    const el = fixture.nativeElement as HTMLElement;
    expect((el.querySelector('[data-testid="prcp"]') as HTMLInputElement).value).toBe('180');
    expect(el.querySelector('[data-testid="prcp-texto"]')?.textContent).toContain('180 mm');
  });

  it('emite prcpMensualChange con el valor numérico y permite volver a la normal', () => {
    const fixture = crear({ prcpMensual: 0, prcpNormal: 180 });
    const emitidos: (number | null)[] = [];
    fixture.componentInstance.prcpMensualChange.subscribe((v) => emitidos.push(v));
    const el = fixture.nativeElement as HTMLElement;

    const range = el.querySelector('[data-testid="prcp"]') as HTMLInputElement;
    range.value = '120';
    range.dispatchEvent(new Event('input'));
    (el.querySelector('[data-testid="prcp-restablecer"]') as HTMLButtonElement).click();

    expect(emitidos).toEqual([120, null]);
  });

  it('avisa cuando se usa el último dato de parque vehicular disponible', () => {
    const sin = crear().nativeElement as HTMLElement;
    expect(sin.querySelector('[data-testid="aviso-parque"]')).toBeNull();

    const con = crear({ ultimoParque: true }).nativeElement as HTMLElement;
    expect(con.querySelector('[data-testid="aviso-parque"]')?.textContent).toContain(
      'Para esta fecha se usa el último dato disponible de parque vehicular.',
    );
  });
});

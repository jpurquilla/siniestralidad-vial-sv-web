import { TestBed } from '@angular/core/testing';
import { ControlesPrediccion } from './controles-prediccion';

function crear(prcpMensual: number | null = null) {
  const fixture = TestBed.createComponent(ControlesPrediccion);
  fixture.componentRef.setInput('fecha', '2024-06-15');
  fixture.componentRef.setInput('franja', 'Tarde (12-17)');
  fixture.componentRef.setInput('prcpMensual', prcpMensual);
  fixture.detectChanges();
  return fixture;
}

describe('ControlesPrediccion', () => {
  it('muestra la fecha y franja recibidas', () => {
    const fixture = crear();
    const el = fixture.nativeElement as HTMLElement;
    expect((el.querySelector('[data-testid="fecha"]') as HTMLInputElement).value).toBe(
      '2024-06-15',
    );
    expect((el.querySelector('[data-testid="franja"]') as HTMLSelectElement).value).toBe(
      'Tarde (12-17)',
    );
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

  it('emite franjaChange cuando cambia la franja', () => {
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

  it('emite prcpMensualChange con el valor numérico al mover el control de lluvia', () => {
    const fixture = crear(0);
    const emitidos: (number | null)[] = [];
    fixture.componentInstance.prcpMensualChange.subscribe((v) => emitidos.push(v));

    const range = fixture.nativeElement.querySelector('[data-testid="prcp"]') as HTMLInputElement;
    range.value = '120';
    range.dispatchEvent(new Event('input'));

    expect(emitidos).toEqual([120]);
  });
});

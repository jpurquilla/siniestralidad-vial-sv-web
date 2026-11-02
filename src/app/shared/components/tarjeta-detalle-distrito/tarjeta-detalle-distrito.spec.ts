import { TestBed } from '@angular/core/testing';
import { TarjetaDetalleDistrito } from './tarjeta-detalle-distrito';
import { DistritoOut } from '../../../core/models/distrito.model';
import { etiquetaFranja } from '../../../core/modelo/etiquetas-modelo';
import { Franja } from '../../../core/models/franja.model';

const distrito: DistritoOut = {
  codigo: '01-01',
  nombre: 'San Salvador Centro',
  departamento: 'San Salvador',
  pct_urbano: 0.97,
  poblacion: 150000,
  poblacion_baja: false,
};

const serieHoraria: { franja: Franja; valor: number }[] = [
  { franja: 'Madrugada (00-05)', valor: 0.2 },
  { franja: 'Manana (06-11)', valor: 0.5 },
  { franja: 'Tarde (12-17)', valor: 0.8 },
  { franja: 'Noche (18-23)', valor: 1.1 },
];

describe('TarjetaDetalleDistrito', () => {
  it('muestra un mensaje cuando no hay distrito seleccionado', () => {
    const fixture = TestBed.createComponent(TarjetaDetalleDistrito);
    fixture.componentRef.setInput('distrito', null);
    fixture.componentRef.setInput('valorEsperado', null);
    fixture.componentRef.setInput('tercil', null);
    fixture.componentRef.setInput('serieHoraria', []);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent ?? '').toContain(
      'Seleccioná un distrito',
    );
  });

  it('muestra los datos del distrito, el valor esperado y la serie horaria', () => {
    const fixture = TestBed.createComponent(TarjetaDetalleDistrito);
    fixture.componentRef.setInput('distrito', distrito);
    fixture.componentRef.setInput('valorEsperado', 4.2);
    fixture.componentRef.setInput('tercil', 'alto');
    fixture.componentRef.setInput('serieHoraria', serieHoraria);
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('San Salvador Centro');
    expect(texto).toContain('4.2');
    for (const punto of serieHoraria) {
      expect(texto).toContain(etiquetaFranja(punto.franja));
    }
    expect(texto).toContain('Mañana (06-11)');
    expect(texto).toContain('150,000');
    expect(texto).toContain('97.0%');
    expect(texto).toContain('siniestros esperados en la franja seleccionada');
  });

  it('emite cerrar al hacer click en el botón de cerrar', () => {
    const fixture = TestBed.createComponent(TarjetaDetalleDistrito);
    fixture.componentRef.setInput('distrito', distrito);
    fixture.componentRef.setInput('valorEsperado', 4.2);
    fixture.componentRef.setInput('tercil', 'alto');
    fixture.componentRef.setInput('serieHoraria', serieHoraria);
    fixture.detectChanges();

    let cerrado = false;
    fixture.componentInstance.cerrar.subscribe(() => (cerrado = true));
    (fixture.nativeElement.querySelector('[data-cerrar]') as HTMLElement).click();

    expect(cerrado).toBe(true);
  });
});

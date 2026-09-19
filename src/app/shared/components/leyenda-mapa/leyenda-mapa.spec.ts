import { TestBed } from '@angular/core/testing';
import { LeyendaMapa } from './leyenda-mapa';
import { ClaseLeyenda } from './clase-leyenda.model';

describe('LeyendaMapa', () => {
  const clases: ClaseLeyenda[] = [
    { color: '#f7fbff', etiqueta: '0,0 – 1,2' },
    { color: '#c6dbef', etiqueta: '1,2 – 2,4' },
    { color: '#6baed6', etiqueta: '2,4 – 3,6' },
    { color: '#2171b5', etiqueta: '3,6 – 4,8' },
    { color: '#08306b', etiqueta: '4,8 – 6,0' },
  ];

  function crear() {
    const fixture = TestBed.createComponent(LeyendaMapa);
    fixture.componentRef.setInput('clases', clases);
    fixture.componentRef.setInput('colorSinDato', '#d9d9d9');
    fixture.detectChanges();
    return fixture;
  }

  it('renderiza una entrada por clase más la de "sin dato"', () => {
    const fixture = crear();
    const items = (fixture.nativeElement as HTMLElement).querySelectorAll('[data-clase]');
    expect(items.length).toBe(clases.length + 1);
  });

  it('muestra la etiqueta de cada corte de clase', () => {
    const fixture = crear();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    for (const clase of clases) {
      expect(texto).toContain(clase.etiqueta);
    }
  });

  it('distingue "sin dato" de la clase más baja', () => {
    const fixture = crear();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto.toLowerCase()).toContain('sin dato');
  });
});

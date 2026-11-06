import { TestBed } from '@angular/core/testing';

import { BuscadorDistrito, OpcionBusqueda } from './buscador-distrito';

const OPCIONES: OpcionBusqueda[] = [
  { id: 'a', nombre: 'Antiguo Cuscatlán', departamento: 'La Libertad', enAlcance: true, referencia: 'antiguo cuscatlan' },
  { id: 'b', nombre: 'Cuscatancingo', departamento: 'San Salvador', enAlcance: true, referencia: 'cuscatancingo' },
  { id: 'c', nombre: 'San Isidro', departamento: 'Cabañas', enAlcance: false, referencia: null },
  { id: 'd', nombre: 'San Isidro', departamento: 'Morazán', enAlcance: false, referencia: null },
  { id: 'e', nombre: 'San Salvador', departamento: 'San Salvador', enAlcance: true, referencia: 'san salvador' },
];

function crear() {
  const fixture = TestBed.createComponent(BuscadorDistrito);
  fixture.componentRef.setInput('opciones', OPCIONES);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const input = el.querySelector('[data-testid="buscador"]') as HTMLInputElement;
  const escribir = (valor: string) => {
    input.value = valor;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const tecla = (key: string) => {
    input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    fixture.detectChanges();
  };
  const sugerencias = () =>
    Array.from(el.querySelectorAll('[data-sugerencia]')).map(
      (e) => `${e.querySelector('.nombre')?.textContent} ${e.querySelector('.departamento')?.textContent}`,
    );
  return { fixture, el, escribir, tecla, sugerencias };
}

describe('BuscadorDistrito', () => {
  it('encuentra sin importar tildes ni mayúsculas («cuscatlan» -> «Antiguo Cuscatlán»)', () => {
    const { escribir, sugerencias } = crear();
    escribir('CUSCATLAN');
    expect(sugerencias()).toEqual(['Antiguo Cuscatlán La Libertad']);
  });

  it('muestra el departamento para distinguir nombres repetidos', () => {
    const { escribir, sugerencias } = crear();
    escribir('san isidro');
    const s = sugerencias();
    expect(s.length).toBe(2);
    expect(s.some((t) => t?.includes('Cabañas'))).toBe(true);
    expect(s.some((t) => t?.includes('Morazán'))).toBe(true);
  });

  it('rotula «Fuera del alcance» a los distritos fuera del estudio', () => {
    const { el, escribir } = crear();
    escribir('isidro');
    expect(el.querySelectorAll('[data-fuera-alcance]').length).toBe(2);
    escribir('cuscatlan');
    expect(el.querySelector('[data-fuera-alcance]')).toBeNull();
  });

  it('con flechas y Enter elige la opción activa y emite', () => {
    const { fixture, escribir, tecla } = crear();
    const elegidos: OpcionBusqueda[] = [];
    fixture.componentInstance.elegir.subscribe((o) => elegidos.push(o));
    escribir('cusca'); // sugerencias: Cuscatancingo (empieza con), Antiguo Cuscatlán
    tecla('ArrowDown');
    tecla('ArrowDown');
    tecla('Enter');
    expect(elegidos.map((o) => o.id)).toEqual(['a']);
    escribir('cusca');
    tecla('ArrowUp'); // desde ninguna: envuelve a la última
    tecla('ArrowUp');
    tecla('Enter');
    expect(elegidos.map((o) => o.id)).toEqual(['a', 'b']);
  });

  it('Enter sin opción activa y con varias sugerencias no elige nada', () => {
    const { fixture, escribir, tecla } = crear();
    const elegidos: OpcionBusqueda[] = [];
    fixture.componentInstance.elegir.subscribe((o) => elegidos.push(o));
    escribir('san');
    tecla('Enter');
    expect(elegidos).toEqual([]);
  });

  it('Escape cierra la lista y un segundo Escape borra el texto', () => {
    const { el, escribir, tecla } = crear();
    escribir('san');
    expect(el.querySelector('[data-testid="sugerencias"]')).not.toBeNull();
    tecla('Escape');
    expect(el.querySelector('[data-testid="sugerencias"]')).toBeNull();
    tecla('Escape');
    expect((el.querySelector('[data-testid="buscador"]') as HTMLInputElement).value).toBe('');
  });

  it('elegir con el ratón emite la opción y cierra la lista', () => {
    const { fixture, el, escribir } = crear();
    const elegidos: OpcionBusqueda[] = [];
    fixture.componentInstance.elegir.subscribe((o) => elegidos.push(o));
    escribir('soy');
    expect(el.querySelector('[data-sin-resultados]')).not.toBeNull();
    escribir('cuscatan');
    (el.querySelector('[data-sugerencia]') as HTMLElement).dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    expect(elegidos.map((o) => o.id)).toEqual(['b']);
    expect(el.querySelector('[data-testid="sugerencias"]')).toBeNull();
  });
});

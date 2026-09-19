import { TestBed } from '@angular/core/testing';
import { SeleccionDistritoService } from './seleccion-distrito.service';

describe('SeleccionDistritoService', () => {
  it('empieza sin ningún distrito seleccionado', () => {
    const servicio = TestBed.inject(SeleccionDistritoService);
    expect(servicio.distritoSeleccionado()).toBeNull();
  });

  it('actualiza la señal al seleccionar un distrito', () => {
    const servicio = TestBed.inject(SeleccionDistritoService);
    servicio.seleccionar('01-01');
    expect(servicio.distritoSeleccionado()).toBe('01-01');
  });

  it('permite limpiar la selección con null', () => {
    const servicio = TestBed.inject(SeleccionDistritoService);
    servicio.seleccionar('01-01');
    servicio.seleccionar(null);
    expect(servicio.distritoSeleccionado()).toBeNull();
  });
});

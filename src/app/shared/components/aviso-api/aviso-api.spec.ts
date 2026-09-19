import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvisoApi } from './aviso-api';

describe('AvisoApi', () => {
  let fixture: ComponentFixture<AvisoApi>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AvisoApi);
  });

  it('muestra el mensaje recibido por input', () => {
    fixture.componentRef.setInput('mensaje', 'Este endpoint es retrospectivo, no predictivo.');
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Este endpoint es retrospectivo, no predictivo.');
  });
});

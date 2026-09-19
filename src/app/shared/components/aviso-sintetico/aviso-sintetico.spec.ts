import { TestBed } from '@angular/core/testing';
import { AvisoSintetico } from './aviso-sintetico';

describe('AvisoSintetico', () => {
  it('renderiza el aviso de datos sintéticos', async () => {
    const fixture = TestBed.createComponent(AvisoSintetico);
    fixture.detectChanges();
    await fixture.whenStable();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto.toLowerCase()).toContain('sintético');
    expect(texto.toLowerCase()).toContain('onasevi');
  });
});

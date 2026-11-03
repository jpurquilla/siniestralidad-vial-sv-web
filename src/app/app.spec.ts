import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('muestra el logotipo (favicon.svg, 32 px) junto al nombre', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const logo = (fixture.nativeElement as HTMLElement).querySelector('[data-app-logo]') as HTMLImageElement;
    expect(logo.getAttribute('src')).toBe('favicon.svg');
    expect([logo.width, logo.height]).toEqual([32, 32]);
    expect(logo.nextElementSibling?.querySelector('h1')?.textContent).toContain('Siniestralidad Vial SV');
  });

  it('muestra el título y los enlaces de navegación', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Siniestralidad Vial SV');
    expect(compiled.textContent).toContain('Mapa de riesgo');
    expect(compiled.textContent).toContain('Ley Cero Tolerancia');
  });
});

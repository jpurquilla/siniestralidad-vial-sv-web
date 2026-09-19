import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../core/config/api-base-url.token';
import { UsuariosVulnerablesResponse } from '../../core/models/usuarios-vulnerables.model';
import { PaginaUsuariosVulnerables } from './pagina-usuarios-vulnerables';

const API = 'http://api.prueba.test';

describe('PaginaUsuariosVulnerables', () => {
  let fixture: ComponentFixture<PaginaUsuariosVulnerables>;
  let httpMock: HttpTestingController;

  const respuesta: UsuariosVulnerablesResponse = {
    aviso: 'Pantalla retrospectiva, 2022-2026.',
    reparto_por_tipo: [
      { tipo: 'Peaton', pct_fatales: 42.47, letalidad_por_siniestro: 0.2294 },
      { tipo: 'Motociclista', pct_fatales: 30.0, letalidad_por_siniestro: 0.15 },
    ],
    letalidad_por_edad: [
      { rango_etario: '0-15', victimas: 200, letalidad: 0.09 },
      { rango_etario: '71+', victimas: 150, letalidad: 0.2982 },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: API },
      ],
    });
    fixture = TestBed.createComponent(PaginaUsuariosVulnerables);
    fixture.detectChanges();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('pide usuarios vulnerables al iniciar y muestra el reparto por tipo y por edad', () => {
    const peticion = httpMock.expectOne(`${API}/api/v1/usuarios-vulnerables`);
    peticion.flush(respuesta);
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Pantalla retrospectiva, 2022-2026.');
    expect(texto).toContain('Peaton');
    expect(texto).toContain('Motociclista');
    expect(texto).toContain('0-15');
    expect(texto).toContain('71+');
  });

  it('muestra un mensaje de error si la petición falla', () => {
    const peticion = httpMock.expectOne(`${API}/api/v1/usuarios-vulnerables`);
    peticion.flush('error interno', { status: 500, statusText: 'Internal Server Error' });
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto.toLowerCase()).toContain('error');
  });
});

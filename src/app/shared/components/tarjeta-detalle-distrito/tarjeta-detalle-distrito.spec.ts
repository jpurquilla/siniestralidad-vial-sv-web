import { TestBed } from '@angular/core/testing';
import { TarjetaDetalleDistrito } from './tarjeta-detalle-distrito';
import { DistritoOut } from '../../../core/models/distrito.model';
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
      'Seleccione un distrito',
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
    const nombres = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('[data-franja-nombre]'),
    ).map((e) => e.textContent?.trim());
    const horarios = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('[data-franja-horario]'),
    ).map((e) => e.textContent?.trim());
    expect(nombres).toEqual(['Madrugada', 'Mañana', 'Tarde', 'Noche']);
    expect(horarios).toEqual(['00:00 a 05:59', '06:00 a 11:59', '12:00 a 17:59', '18:00 a 23:59']);
    expect(texto).toContain('150,000');
    expect(texto).toContain('97.0%');
    expect(texto).toContain('siniestros esperados en la franja seleccionada');
  });

  it('emite cerrar al hacer clic en el botón de cerrar', () => {
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

  describe('siniestros esperados por causa', () => {
    const total = 0.72;
    const proporciones: [string, number][] = [
      ['Distracción del Conductor', 0.2203],
      ['Invadir Carril', 0.1847],
      ['Estado de Ebriedad o Droga', 0.152],
      ['No Respetar Señales de Tránsito', 0.1208],
      ['No Guardar Distancia Reglamentaria', 0.1193],
      ['Velocidad Excesiva', 0.0603],
      ['Otros', 0.1426],
    ];
    const porCausa = proporciones.map(([causa, proporcion]) => ({ causa, proporcion, esperado: total * proporcion }));

    function crear(causas = porCausa) {
      const fixture = TestBed.createComponent(TarjetaDetalleDistrito);
      fixture.componentRef.setInput('distrito', distrito);
      fixture.componentRef.setInput('valorEsperado', total);
      fixture.componentRef.setInput('tercil', 'alto');
      fixture.componentRef.setInput('serieHoraria', serieHoraria);
      fixture.componentRef.setInput('porCausa', causas);
      fixture.componentRef.setInput('franjaSeleccionada', 'Noche (18-23)');
      fixture.detectChanges();
      return fixture.nativeElement as HTMLElement;
    }

    it('muestra 5 barras más «Otras causas», con valor a 2 decimales y porcentaje a 1', () => {
      const el = crear();
      expect(el.querySelector('h3:nth-of-type(2)')?.textContent).toContain('Siniestros esperados por causa');
      const filas = Array.from(el.querySelectorAll('[data-causa]'));
      expect(filas.length).toBe(6);
      expect(filas.filter((f) => f.hasAttribute('data-causa-otras')).length).toBe(1);
      expect(filas[0].textContent).toContain('Distracción del Conductor');
      expect(filas[0].textContent).toContain('0.16');
      expect(filas[0].textContent).toContain('22.0%');
      const otras = el.querySelector('[data-causa-otras]')?.textContent ?? '';
      expect(otras).toContain('Otras causas');
      // Las 5 principales incluyen «Otros» (14.3%); el resto es (0.1193 + 0.0603) × 0.72.
      expect(otras).toContain('0.13');
      expect(otras).toContain('18.0%');
    });

    it('muestra la frase con la causa principal y la ebriedad', () => {
      const frase = crear().querySelector('[data-frase-causas]')?.textContent ?? '';
      expect(frase).toContain('En promedio, de los 0.72 siniestros esperados esta noche');
      expect(frase).toContain('distracción del conductor (22.0%)');
      expect(frase).toContain('0.11 a ebriedad o droga (15.2%)');
    });

    it('incluye la nota de que son valores promedio', () => {
      expect(crear().querySelector('[data-nota-causas]')?.textContent?.replace(/\s+/g, ' ')).toContain(
        'Son valores promedio: indican cómo suelen repartirse las causas en esta franja horaria, no la causa de un siniestro en particular. La composición proviene del histórico 2022-2024 y en el conjunto de datos no varía entre distritos ni entre días de la semana.',
      );
    });

    it('sin datos de causas no muestra la sección', () => {
      const el = crear([]);
      expect(el.querySelector('[data-causas]')).toBeNull();
      expect(el.textContent).not.toContain('Siniestros esperados por causa');
    });
  });
});

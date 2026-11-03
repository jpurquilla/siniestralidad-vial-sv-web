import { convertToParamMap } from '@angular/router';

import {
  diasInclusivos,
  nombreArchivoInforme,
  paramsDeSolicitud,
  solicitudDesdeParams,
  solicitudPorDefecto,
  sumarDias,
  validarSolicitud,
} from './solicitud-informe';

describe('solicitud-informe', () => {
  it('suma días sin depender de la zona horaria, cruzando mes y año', () => {
    expect(sumarDias('2026-11-02', 30)).toBe('2026-12-02');
    expect(sumarDias('2026-12-20', 30)).toBe('2027-01-19');
  });

  it('cuenta días inclusivos', () => {
    expect(diasInclusivos('2026-11-02', '2026-11-02')).toBe(1);
    expect(diasInclusivos('2026-11-02', '2026-12-02')).toBe(31);
    expect(diasInclusivos('x', '2026-12-02')).toBeNaN();
  });

  it('el rango por defecto es hoy → hoy + 30 días', () => {
    const s = solicitudPorDefecto('2026-11-02');
    expect(s).toEqual({ fecha_inicio: '2026-11-02', fecha_fin: '2026-12-02', departamento: null, distritos: [], franjas: [], dias_semana: [] });
  });

  it('valida el máximo de 92 días, el orden y las fechas vacías', () => {
    const base = solicitudPorDefecto('2026-01-01');
    expect(validarSolicitud({ ...base, fecha_fin: '2026-04-02' })).toBeNull(); // 92 días
    expect(validarSolicitud({ ...base, fecha_fin: '2026-04-03' })).toContain('máximo es 92');
    expect(validarSolicitud({ ...base, fecha_fin: '2025-12-31' })).toContain('anterior');
    expect(validarSolicitud({ ...base, fecha_inicio: '' })).toContain('Indique');
  });

  it('lee la URL con listas repetidas y descarta valores inválidos', () => {
    const params = convertToParamMap({
      fecha_inicio: '2026-11-03',
      fecha_fin: '2026-11-10',
      departamento: 'San Salvador',
      distritos: ['san salvador', 'apopa', 'apopa'],
      franjas: ['Noche (18-23)', 'Inventada'],
      dias_semana: ['4', '0', '9', 'x'],
    });
    expect(solicitudDesdeParams(params, '2026-01-01')).toEqual({
      fecha_inicio: '2026-11-03',
      fecha_fin: '2026-11-10',
      departamento: 'San Salvador',
      distritos: ['san salvador', 'apopa'],
      franjas: ['Noche (18-23)'],
      dias_semana: [0, 4],
    });
  });

  it('sin parámetros usa los valores por defecto; ida y vuelta conserva la solicitud', () => {
    expect(solicitudDesdeParams(convertToParamMap({}), '2026-11-02')).toEqual(solicitudPorDefecto('2026-11-02'));
    const s = { ...solicitudPorDefecto('2026-11-02'), distritos: ['a', 'b'], dias_semana: [6], departamento: 'Cabañas' };
    const params = paramsDeSolicitud(s);
    expect(params['dias_semana']).toEqual(['6']);
    expect(solicitudDesdeParams(convertToParamMap(params), '2000-01-01')).toEqual(s);
  });

  it('nombra el archivo con el periodo', () => {
    expect(nombreArchivoInforme(solicitudPorDefecto('2026-11-02'), 'xlsx')).toBe('informe-siniestros-2026-11-02_2026-12-02.xlsx');
  });
});

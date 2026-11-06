import { convertToParamMap } from '@angular/router';

import { FiltroSiniestros } from '../models/siniestro-punto.model';
import { filtroDesdeParams, paramsDeFiltro } from './filtro-url';

describe('filtro-url', () => {
  const filtro: FiltroSiniestros = {
    fechaInicio: '2024-01-01',
    fechaFin: '2024-12-31',
    horaInicio: '06:00',
    horaFin: '11:59',
    tipoSiniestro: 'Colisión',
    tipoVehiculo: 'Motocicleta',
    factorCausante: 'Estado de Ebriedad o Droga',
    departamento: 'San Salvador',
  };

  it('ida y vuelta: lo que se escribe en la URL se lee igual', () => {
    expect(filtroDesdeParams(convertToParamMap(paramsDeFiltro(filtro)))).toEqual(filtro);
  });

  it('usa los mismos nombres que la API', () => {
    expect(Object.keys(paramsDeFiltro(filtro)).sort()).toEqual([
      'departamento',
      'factor_causante',
      'fecha_fin',
      'fecha_inicio',
      'hora_fin',
      'hora_inicio',
      'tipo_siniestro',
      'tipo_vehiculo',
    ]);
  });

  it('omite los campos vacíos y tolera parámetros ajenos', () => {
    expect(paramsDeFiltro({ fechaInicio: '', departamento: 'Cabañas' })).toEqual({
      departamento: 'Cabañas',
    });
    expect(filtroDesdeParams(convertToParamMap({ metrica: 'numero', fecha_inicio: '' }))).toEqual({});
  });
});

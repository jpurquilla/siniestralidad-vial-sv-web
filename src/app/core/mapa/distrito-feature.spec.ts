import { codigoDeFeature } from './distrito-feature';
import { DistritoFeature } from '../models/distrito-geojson.model';

function crearFeature(properties: Record<string, unknown>): DistritoFeature {
  return {
    type: 'Feature',
    properties,
    geometry: { type: 'Polygon', coordinates: [] },
  };
}

describe('codigoDeFeature', () => {
  it('usa distrito_key cuando está presente', () => {
    const feature = crearFeature({ distrito_key: '01-01', codigo: '99-99' });
    expect(codigoDeFeature(feature)).toBe('01-01');
  });

  it('usa codigo cuando no hay distrito_key', () => {
    const feature = crearFeature({ codigo: '02-02' });
    expect(codigoDeFeature(feature)).toBe('02-02');
  });

  it('devuelve undefined cuando no hay ninguna de las dos propiedades', () => {
    const feature = crearFeature({ nombre: 'Sin identificador' });
    expect(codigoDeFeature(feature)).toBeUndefined();
  });
});

import { DistritoFeature } from '../models/distrito-geojson.model';

/**
 * El GeoJSON identifica cada distrito por `distrito_key` o `codigo`
 * (ver api/README.md §7); no sabemos cuál usará el archivo real todavía.
 */
export function codigoDeFeature(feature: DistritoFeature): string | undefined {
  const propiedades = feature.properties;
  if (typeof propiedades.distrito_key === 'string') {
    return propiedades.distrito_key;
  }
  if (typeof propiedades.codigo === 'string') {
    return propiedades.codigo;
  }
  return undefined;
}

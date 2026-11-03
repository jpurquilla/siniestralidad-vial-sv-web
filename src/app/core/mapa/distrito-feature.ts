import { separarPalabrasPegadas } from '../format/texto';
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

function textoDePropiedad(feature: DistritoFeature, claves: string[]): string | undefined {
  for (const clave of claves) {
    const valor = feature.properties[clave];
    if (typeof valor === 'string' && valor) {
      return valor;
    }
  }
  return undefined;
}

/** Nombre legible; los nombres GADM vienen pegados («SanIsidro») y se separan. */
export function nombreDeFeature(feature: DistritoFeature): string {
  const nombre = textoDePropiedad(feature, ['nombre', 'nombre_gadm', 'Dis_min']);
  return nombre ? separarPalabrasPegadas(nombre) : 'Distrito';
}

export function departamentoDeFeature(feature: DistritoFeature): string {
  return textoDePropiedad(feature, ['departamento', 'departamento_gadm']) ?? '';
}

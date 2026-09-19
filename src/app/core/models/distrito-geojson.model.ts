/**
 * El OpenAPI no tipa el detalle del GeoJSON (schema abierto). Modelamos lo
 * mínimo que la app necesita: una FeatureCollection con una Feature por
 * distrito, identificable por `distrito_key` o `codigo` (ver api/README.md §7).
 */
export interface DistritoFeatureProperties {
  distrito_key?: string;
  codigo?: string;
  [propiedad: string]: unknown;
}

export interface DistritoFeature {
  type: 'Feature';
  properties: DistritoFeatureProperties;
  geometry: {
    type: string;
    coordinates: unknown;
  };
}

export interface DistritoFeatureCollection {
  type: 'FeatureCollection';
  features: DistritoFeature[];
}

/**
 * El 503 de /api/v1/distritos/geojson es un estado esperado (todavía no se
 * cargó el archivo de geometrías, ver api/README.md §7), no una falla de red.
 * El servicio lo modela como dato en vez de propagarlo como error genérico.
 */
export type DistritoGeoJsonResultado =
  { estado: 'ok'; datos: DistritoFeatureCollection } | { estado: 'no_disponible'; mensaje: string };

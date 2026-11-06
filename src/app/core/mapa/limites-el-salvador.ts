import * as L from 'leaflet';

/** Navegación acotada a El Salvador (con margen); los siniestros van de 13.15 a 14.40 N. */
export const LIMITES_EL_SALVADOR: L.LatLngBoundsLiteral = [
  [12.9, -90.35],
  [14.65, -87.5],
];

/** Zoom máximo de las páginas de concentraciones: nivel ciudad. */
export const ZOOM_MAXIMO_CONCENTRACIONES = 12;

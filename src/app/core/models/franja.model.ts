/**
 * Las cuatro franjas horarias del proyecto. El valor coincide carácter por
 * carácter con el enum `Franja` del OpenAPI de la API (NB03).
 */
export type Franja = 'Madrugada (00-05)' | 'Manana (06-11)' | 'Tarde (12-17)' | 'Noche (18-23)';

export const FRANJAS: readonly Franja[] = [
  'Madrugada (00-05)',
  'Manana (06-11)',
  'Tarde (12-17)',
  'Noche (18-23)',
];

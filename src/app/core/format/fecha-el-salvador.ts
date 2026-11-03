const ZONA_EL_SALVADOR = 'America/El_Salvador';

/**
 * Fecha de hoy (YYYY-MM-DD) en la zona horaria de El Salvador, sin depender de la
 * zona del navegador ni de UTC (a las 20:00 locales UTC ya es «mañana»).
 */
export function hoyEnElSalvador(ahora: Date = new Date()): string {
  // 'en-CA' formatea como YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_EL_SALVADOR,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ahora);
}

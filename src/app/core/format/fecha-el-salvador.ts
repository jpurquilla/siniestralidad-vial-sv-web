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

/**
 * Primer día del mes que debe abrir el calendario: el mes indicado en la URL
 * («YYYY-MM» o «YYYY-MM-DD») o, si falta o es inválido, el mes actual en El Salvador.
 */
export function mesInicialCalendario(parametro: string | null, hoy: string = hoyEnElSalvador()): Date {
  const coincidencia = /^(\d{4})-(0[1-9]|1[0-2])(?:-\d{2})?$/.exec(parametro ?? '') ?? /^(\d{4})-(\d{2})/.exec(hoy);
  const [, anio, mes] = coincidencia as RegExpExecArray;
  return new Date(Number(anio), Number(mes) - 1, 1);
}

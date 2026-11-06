/** Numeración fija de figuras y tablas del informe (igual en la página y en el PDF). */
export const FUENTE_FIGURAS =
  'Fuente: Radar Vial SV, modelo de frecuencia (NB12), con datos sintéticos calibrados a ONASEVI/FONAT.';

export const FIGURA_1 = 'Figura 1. Siniestros esperados por causa en el periodo';
export const FIGURA_2 = 'Figura 2. Composición de causas por franja horaria';
export const FIGURA_3 = 'Figura 3. Siniestros esperados por día de la semana (promedio por día)';
export const FIGURA_4 = 'Figura 4. Siniestros esperados por distrito y franja horaria';
export const TABLA_1 = 'Tabla 1. Resumen';
export const TABLA_2 = 'Tabla 2. Dónde y cuándo concentrar los controles';
export const TABLA_3 = 'Tabla 3. Siniestros esperados por distrito (todos)';

export const TEXTO_LLUVIA = 'La lluvia corresponde a la normal climatológica de cada mes.';

/** Supuestos que antes se repetían como notas bajo los gráficos. */
export const NOTAS_SUPUESTOS = [
  'Los valores son promedios (esperados), no conteos observados.',
  'El conjunto de datos asigna todos los siniestros del país a los 103 distritos del estudio.',
  'La composición por causa usa la proporción histórica de cada franja horaria (2022-2024).',
  'En «Esperado por día», cada valor es el promedio de un día de ese tipo dentro del periodo; «Veces» indica cuántos días de ese tipo tiene el periodo.',
];

export function textoParque(diasConUltimo: number, diasPeriodo: number): string | null {
  return diasConUltimo > 0
    ? `En fechas sin dato de parque vehicular se usa el último dato disponible (${diasConUltimo} de ${diasPeriodo} días).`
    : null;
}

/**
 * Calibración = siniestros predichos / observados.
 * > 1 el modelo sobreestima, < 1 subestima, 1.00 es exacto.
 */
export type LecturaCalibracion = 'sobreestima' | 'subestima' | 'exacta';

/** Tolerancia de lectura: dentro de ±5% se considera calibrado (criterio de presentación). */
export const TOLERANCIA_CALIBRACION = 0.05;

/** Rango de calibración que recibe la etiqueta «Calibrado»; derivado de la misma tolerancia que usa interpretarCalibracion. */
export const RANGO_CALIBRADO = {
  minimo: 1 - TOLERANCIA_CALIBRACION,
  maximo: 1 + TOLERANCIA_CALIBRACION,
} as const;

export interface InterpretacionCalibracion {
  lectura: LecturaCalibracion;
  etiqueta: string;
  /** Desvío respecto de 1.00, en % (p. ej. 1.08 -> +8.0). */
  desvioPct: number;
}

export function interpretarCalibracion(calibracion: number): InterpretacionCalibracion {
  const desvioPct = (calibracion - 1) * 100;
  if (calibracion > 1 + TOLERANCIA_CALIBRACION) {
    return { lectura: 'sobreestima', etiqueta: 'Sobreestima', desvioPct };
  }
  if (calibracion < 1 - TOLERANCIA_CALIBRACION) {
    return { lectura: 'subestima', etiqueta: 'Subestima', desvioPct };
  }
  return { lectura: 'exacta', etiqueta: 'Calibrado', desvioPct };
}

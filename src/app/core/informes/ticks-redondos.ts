/** Pasos «redondos» (múltiplos de 1, 2, 2.5 y 5 por una potencia de 10). */
const MULTIPLOS = [1, 2, 2.5, 5, 10];

export interface EjeRedondo {
  /** Valores de las marcas: 0, paso, 2·paso… hasta `tope`. */
  ticks: number[];
  /** Última marca: el menor múltiplo del paso que cubre el máximo. */
  tope: number;
  paso: number;
}

function limpiar(valor: number): number {
  return Number(valor.toPrecision(12));
}

/**
 * Marcas de eje con números redondos (0, 100, 200, 300…; nunca 253 ni 506).
 * `objetivo` es el número aproximado de intervalos; con `entero` el paso nunca es fraccionario.
 */
export function ticksRedondos(maximo: number, opciones: { objetivo?: number; entero?: boolean } = {}): EjeRedondo {
  const objetivo = Math.max(1, opciones.objetivo ?? 5);
  const entero = opciones.entero ?? false;
  if (!Number.isFinite(maximo) || maximo <= 0) {
    return { ticks: [0, 1], tope: 1, paso: 1 };
  }
  const bruto = maximo / objetivo;
  let exponente = Math.floor(Math.log10(bruto));
  let paso = 0;
  for (let vuelta = 0; vuelta < 40 && paso === 0; vuelta++) {
    for (const m of MULTIPLOS) {
      const candidato = limpiar(m * Math.pow(10, exponente));
      if (entero && candidato % 1 !== 0) continue;
      if (candidato >= bruto - 1e-12) {
        paso = candidato;
        break;
      }
    }
    exponente++;
  }
  const intervalos = Math.max(1, Math.ceil(limpiar(maximo / paso)));
  const ticks = Array.from({ length: intervalos + 1 }, (_, i) => limpiar(i * paso));
  return { ticks, tope: ticks[ticks.length - 1], paso };
}

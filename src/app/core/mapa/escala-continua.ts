/**
 * Escala continua para el calendario: interpola entre un azul muy claro y un
 * azul oscuro según la posición del valor entre el mínimo y el máximo del
 * mes. A diferencia de las 5 clases del mapa, acá cada día tiene su propio
 * tono, y la leyenda se expresa como diferencia respecto del promedio del mes.
 */
const COLOR_MIN: Rgb = [239, 243, 255]; // #eff3ff
const COLOR_MAX: Rgb = [8, 81, 156]; // #08519c

type Rgb = [number, number, number];

export interface EscalaContinua {
  minimo: number;
  maximo: number;
  promedio: number;
  /** Color CSS del valor, interpolado entre el mínimo y el máximo. */
  colorPara(valor: number): string;
  /** Color de texto legible (oscuro o claro) sobre el fondo de `colorPara(valor)`. */
  textoPara(valor: number): string;
  /** Diferencia porcentual del valor respecto del promedio. */
  diferenciaPct(valor: number): number;
}

function mezclar(t: number): Rgb {
  return [0, 1, 2].map((i) => Math.round(COLOR_MIN[i] + (COLOR_MAX[i] - COLOR_MIN[i]) * t)) as Rgb;
}

function luminanciaRelativa([r, g, b]: Rgb): number {
  const canal = (c: number): number => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

export function crearEscalaContinua(valores: number[]): EscalaContinua | null {
  if (valores.length === 0) {
    return null;
  }
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;
  const rango = maximo - minimo;

  const posicion = (valor: number): number =>
    rango === 0 ? 0.5 : Math.min(1, Math.max(0, (valor - minimo) / rango));

  return {
    minimo,
    maximo,
    promedio,
    colorPara: (valor) => `rgb(${mezclar(posicion(valor)).join(', ')})`,
    textoPara: (valor) => (luminanciaRelativa(mezclar(posicion(valor))) > 0.21 ? '#14212e' : '#ffffff'),
    diferenciaPct: (valor) => (promedio === 0 ? 0 : ((valor - promedio) / promedio) * 100),
  };
}

/** Gradiente CSS de la leyenda (de mínimo a máximo). */
export const GRADIENTE_CONTINUO = `linear-gradient(to right, rgb(${COLOR_MIN.join(', ')}), rgb(${COLOR_MAX.join(', ')}))`;

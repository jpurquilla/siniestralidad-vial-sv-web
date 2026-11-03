/** Color de reserva solo si la API no envía la causa en `colores_causas` (nunca se definen colores propios por causa). */
export const COLOR_SIN_DEFINIR = '#9e9e9e';

export function colorDeCausa(colores: Record<string, string>, causa: string): string {
  return colores[causa] ?? COLOR_SIN_DEFINIR;
}

function luminancia(hex: string): number | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) {
    return null;
  }
  const canales = [0, 2, 4].map((i) => {
    const c = parseInt(m[1].slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * canales[0] + 0.7152 * canales[1] + 0.0722 * canales[2];
}

/** Relación de contraste WCAG entre dos hex `#rrggbb` (1 si alguno no es válido). */
export function contraste(a: string, b: string): number {
  const la = luminancia(a);
  const lb = luminancia(b);
  if (la === null || lb === null) {
    return 1;
  }
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Texto legible (blanco o casi negro) sobre un fondo hex `#rrggbb`: el de mayor contraste. */
export function colorTextoSobre(fondoHex: string): string {
  if (luminancia(fondoHex) === null) {
    return '#111111';
  }
  return contraste(fondoHex, '#ffffff') > contraste(fondoHex, '#111111') ? '#ffffff' : '#111111';
}

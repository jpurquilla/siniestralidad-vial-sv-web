/**
 * Formatos de presentación compartidos. Convención de la app:
 *  - conteos sin decimales y con coma de miles («11,058»);
 *  - porcentajes con un decimal («4.0%»);
 *  - fechas en lenguaje natural («15 de septiembre de 2026»).
 * Se usa 'en-US' a propósito: produce «11,058» y «4.0» de forma estable en
 * cualquier navegador, sin depender del locale instalado.
 */
const LOCALE_NUMEROS = 'en-US';

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export const SIN_DATO = 'sin dato';

function esNumero(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isFinite(valor);
}

/** Entero con separador de miles. */
export function formatearConteo(valor: number | null | undefined): string {
  if (!esNumero(valor)) {
    return SIN_DATO;
  }
  return Math.round(valor).toLocaleString(LOCALE_NUMEROS, { maximumFractionDigits: 0 });
}

/** Número con una cantidad fija de decimales (por defecto 2). */
export function formatearDecimal(valor: number | null | undefined, decimales = 2): string {
  if (!esNumero(valor)) {
    return SIN_DATO;
  }
  return valor.toLocaleString(LOCALE_NUMEROS, {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

/**
 * Porcentaje con un decimal. `valor` ya viene en escala 0-100, salvo que se
 * indique `esFraccion` (0.23 -> «23.0%»).
 */
export function formatearPorcentaje(
  valor: number | null | undefined,
  opciones: { esFraccion?: boolean; decimales?: number; conSigno?: boolean } = {},
): string {
  if (!esNumero(valor)) {
    return SIN_DATO;
  }
  const decimales = opciones.decimales ?? 1;
  const escalado = opciones.esFraccion ? valor * 100 : valor;
  const texto = formatearDecimal(escalado, decimales);
  const signo = opciones.conSigno && escalado > 0 ? '+' : '';
  return `${signo}${texto}%`;
}

/** Valor p de una prueba estadística: «p < 0.001» o «p = 0.023». */
export function formatearValorP(p: number | null | undefined): string {
  if (!esNumero(p)) {
    return SIN_DATO;
  }
  return p < 0.001 ? 'p < 0.001' : `p = ${formatearDecimal(p, 3)}`;
}

/**
 * Fecha ISO («2026-09-15» o «2026-09-15T00:18:28») a «15 de septiembre de 2026».
 * Se interpreta sin zona horaria para que el día nunca se corra por UTC.
 */
export function formatearFechaLarga(iso: string | null | undefined): string {
  if (!iso) {
    return SIN_DATO;
  }
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!coincidencia) {
    return iso;
  }
  const [, anio, mes, dia] = coincidencia;
  const nombreMes = MESES[Number(mes) - 1];
  if (!nombreMes) {
    return iso;
  }
  return `${Number(dia)} de ${nombreMes} de ${anio}`;
}

/** «Agosto de 2026»: mayúscula solo en el mes, «de» en minúscula. */
export function formatearMesAnio(anio: number, mes0Indexado: number): string {
  const mes = MESES[mes0Indexado] ?? '';
  return `${mes.charAt(0).toUpperCase()}${mes.slice(1)} de ${anio}`;
}

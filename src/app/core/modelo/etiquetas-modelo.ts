const ETIQUETAS_VARIABLES: Record<string, string> = {
  es_lluviosa: 'Temporada lluviosa',
  es_finde: 'Fin de semana',
  dia_semana: 'Día de la semana',
  periodo_agostino: 'Fiestas agostinas',
  es_feriado: 'Día feriado',
  prcp_mensual: 'Precipitación mensual',
  pct_urbano: '% de población urbana',
  poblacion_baja: 'Distrito de población baja',
  franja_cod: 'Franja horaria',
  crec_parque_12m: 'Crecimiento del parque vehicular (12 meses)',
  pct_hogares_auto: '% de hogares con automóvil',
  pct_trabaja_otro_lugar: '% que trabaja en otro lugar',
};

const ETIQUETAS_METRICAS: Record<string, string> = {
  MAE: 'Error absoluto medio',
  RMSE: 'Raíz del error cuadrático medio',
  media_predicha: 'Media predicha',
  calibracion: 'Calibración',
  spearman_global: 'Spearman global',
  spearman_tercil_alto: 'Spearman del tercil alto',
  objetivo: 'Valor observado de referencia',
};

const ETIQUETAS_FRANJAS: Record<string, string> = {
  'Madrugada (00-05)': 'Madrugada (00-05)',
  'Manana (06-11)': 'Mañana (06-11)',
  'Tarde (12-17)': 'Tarde (12-17)',
  'Noche (18-23)': 'Noche (18-23)',
};

function humanizar(clave: string): string {
  const texto = clave.replace(/_/g, ' ').trim();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function etiquetaVariable(variable: string): string {
  return ETIQUETAS_VARIABLES[variable] ?? humanizar(variable);
}

export function etiquetaMetrica(metrica: string): string {
  return ETIQUETAS_METRICAS[metrica] ?? humanizar(metrica);
}

/** Muestra la franja con tilde («Mañana») aunque el valor de la API no la lleve. */
export function etiquetaFranja(franja: string): string {
  return ETIQUETAS_FRANJAS[franja] ?? franja;
}

/**
 * Nombre legible del modelo: si `nombre` ya es un texto normal se usa tal
 * cual; si parece un identificador de archivo (guiones bajos, .pkl, sufijos
 * entre paréntesis) se limpia para mostrarlo sin jerga.
 */
export function nombreLegibleModelo(nombre: string): string {
  const esIdentificador = /_|\.pkl|\(NB\d+/i.test(nombre);
  if (!esIdentificador) {
    return nombre;
  }
  let texto = nombre
    .replace(/\(.*?\)/g, '')
    .replace(/\.pkl$/i, '')
    .replace(/_/g, ' ')
    .replace(/\bxgboost\b/i, 'XGBoost')
    .trim();
  const version = /\bv(\d+)\b/i.exec(texto);
  texto = texto.replace(/\bv\d+\b/i, '').replace(/\s+/g, ' ').trim();
  texto = texto.charAt(0).toUpperCase() + texto.slice(1);
  return version ? `Modelo de ${texto.toLowerCase().replace('xgboost', 'XGBoost')} (versión ${version[1]})` : `Modelo de ${texto}`;
}

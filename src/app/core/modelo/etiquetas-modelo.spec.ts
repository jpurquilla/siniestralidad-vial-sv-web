import {
  etiquetaFranja,
  etiquetaMetrica,
  etiquetaVariable,
  nombreLegibleModelo,
} from './etiquetas-modelo';

describe('etiquetas-modelo', () => {
  it('traduce variables y métricas conocidas y humaniza las desconocidas', () => {
    expect(etiquetaVariable('franja_cod')).toBe('Franja horaria');
    expect(etiquetaVariable('pct_hogares_auto')).toBe('% de hogares con automóvil');
    expect(etiquetaVariable('variable_nueva')).toBe('Variable nueva');
    expect(etiquetaMetrica('MAE')).toBe('Error absoluto medio');
    expect(etiquetaMetrica('calibracion')).toBe('Calibración');
  });

  it('muestra «Mañana» con tilde', () => {
    expect(etiquetaFranja('Manana (06-11)')).toBe('Mañana (06-11)');
  });

  it('no deja el nombre de archivo en el nombre legible', () => {
    const legible = nombreLegibleModelo('frecuencia_xgboost_offset_v3.pkl');
    expect(legible).not.toContain('_');
    expect(legible).not.toContain('.pkl');
    expect(legible).toContain('XGBoost');
    expect(nombreLegibleModelo('Modelo final de frecuencia')).toBe('Modelo final de frecuencia');
  });
});

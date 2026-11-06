import { normalizarBusqueda, separarPalabrasPegadas } from './texto';

describe('texto', () => {
  it('normaliza tildes y mayúsculas', () => {
    expect(normalizarBusqueda('Antiguo Cuscatlán')).toBe('antiguo cuscatlan');
    expect(normalizarBusqueda('  CUSCATLAN ')).toBe('cuscatlan');
    expect(normalizarBusqueda('Cabañas')).toBe('cabanas');
  });

  it('separa nombres pegados con mayúsculas internas', () => {
    expect(separarPalabrasPegadas('SanIsidroLabrador')).toBe('San Isidro Labrador');
    expect(separarPalabrasPegadas('Ahuachapán')).toBe('Ahuachapán');
  });
});

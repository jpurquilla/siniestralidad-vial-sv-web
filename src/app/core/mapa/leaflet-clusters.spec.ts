import { crearGrupoDeClusters } from './leaflet-clusters';

describe('crearGrupoDeClusters', () => {
  it('crea el grupo con el plugin registrado en la instancia de Leaflet que se usa', () => {
    const grupo = crearGrupoDeClusters();
    expect(typeof grupo.addLayer).toBe('function');
    expect(typeof grupo.clearLayers).toBe('function');
  });
});

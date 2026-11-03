import * as L from 'leaflet';
// El orden importa: el plugin se registra sobre Leaflet, que debe estar cargado antes.
import 'leaflet.markercluster';

/**
 * Crea un grupo de clusters sobre la MISMA instancia de Leaflet en la que se registró el plugin.
 *
 * Leaflet (UMD/CommonJS) publica su objeto de exportación en `window.L` y leaflet.markercluster
 * añade `markerClusterGroup` a ese objeto. Pero en el build de producción `import * as L` es una
 * copia (namespace) hecha antes de que el plugin se registrara, así que `L.markerClusterGroup`
 * queda `undefined` y los puntos no se dibujan («b.markerClusterGroup is not a function»).
 * En desarrollo no se nota porque el namespace se resuelve de otra forma.
 */
export function crearGrupoDeClusters(opciones?: L.MarkerClusterGroupOptions): L.MarkerClusterGroup {
  const instancia = (globalThis as { L?: typeof L }).L ?? L;
  return instancia.markerClusterGroup(opciones);
}

import { HttpErrorResponse } from '@angular/common/http';

import { mensajeErrorHttp } from '../errores/mensaje-error-http';

/**
 * 422 y 404 de la API de informes traen un mensaje claro en español
 * (`detail` de texto): se muestra tal cual. El resto, con el mensaje general.
 */
export function mensajeErrorInforme(error: HttpErrorResponse): string {
  const detail = (error.error as { detail?: unknown } | null)?.detail;
  if ((error.status === 422 || error.status === 404) && typeof detail === 'string' && detail.trim()) {
    return detail;
  }
  if (error.status === 404) {
    return 'No se encontró alguno de los distritos indicados.';
  }
  return mensajeErrorHttp(error);
}

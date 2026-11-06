import { HttpErrorResponse } from '@angular/common/http';

interface DetalleValidacion {
  loc: (string | number)[];
  msg: string;
}

function detalleDeValidacion(error: HttpErrorResponse): string | null {
  const detail = (error.error as { detail?: unknown } | null)?.detail;
  if (!Array.isArray(detail)) {
    return null;
  }
  return (detail as DetalleValidacion[]).map((d) => d.msg).join('; ');
}

export function mensajeErrorHttp(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'No se pudo conectar con la API. Verifique que esté corriendo y que CORS permita este origen.';
  }

  if (error.status === 422) {
    const detalle = detalleDeValidacion(error);
    return detalle
      ? `Los datos enviados no son válidos: ${detalle}.`
      : 'Los datos enviados no son válidos.';
  }

  if (error.status >= 500) {
    return 'La API respondió con un error interno. Intente de nuevo en unos segundos.';
  }

  return `La API respondió con un error inesperado (código ${error.status}).`;
}

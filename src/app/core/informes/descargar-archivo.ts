import { Injectable } from '@angular/core';

/** Dispara la descarga de un Blob en el navegador (inyectable para poder sustituirlo en pruebas). */
@Injectable({ providedIn: 'root' })
export class DescargaArchivo {
  guardar(blob: Blob, nombre: string): void {
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

/** Minúsculas y sin tildes: «Antiguo Cuscatlán» -> «antiguo cuscatlan». Para búsquedas. */
export function normalizarBusqueda(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** «SanIsidroLabrador» (nombres GADM sin espacios) -> «San Isidro Labrador». */
export function separarPalabrasPegadas(texto: string): string {
  return texto.replace(/([a-záéíóúñ])([A-ZÁÉÍÓÚÑ])/g, '$1 $2');
}

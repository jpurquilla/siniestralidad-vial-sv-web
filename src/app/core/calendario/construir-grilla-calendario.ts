export function fechaISO(anio: number, mes0: number, dia: number): string {
  const mm = String(mes0 + 1).padStart(2, '0');
  const dd = String(dia).padStart(2, '0');
  return `${anio}-${mm}-${dd}`;
}

/**
 * Grilla de 42 celdas (6 semanas × 7 días, domingo a sábado) para un mes,
 * con `null` en los días de relleno antes/después del mes real.
 */
export function construirGrillaCalendario(anio: number, mes0Indexado: number): (string | null)[] {
  const primerDiaSemana = new Date(anio, mes0Indexado, 1).getDay();
  const diasEnElMes = new Date(anio, mes0Indexado + 1, 0).getDate();

  const celdas: (string | null)[] = [];
  for (let i = 0; i < primerDiaSemana; i++) {
    celdas.push(null);
  }
  for (let dia = 1; dia <= diasEnElMes; dia++) {
    celdas.push(fechaISO(anio, mes0Indexado, dia));
  }
  while (celdas.length < 42) {
    celdas.push(null);
  }
  return celdas;
}

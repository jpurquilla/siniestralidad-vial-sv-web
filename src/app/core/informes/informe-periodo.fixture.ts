import { formatearConteo, formatearDecimal } from '../format/formato';
import { FRANJAS, Franja } from '../models/franja.model';
import { InformePeriodo } from '../models/informe-periodo.model';

/**
 * Respuesta simulada (datos de ejemplo anónimos) con la forma del contrato v2 de
 * `POST /api/v1/informes/periodo`. Se usa en specs y en la verificación visual.
 * Periodo: 2026-11-02 (lunes) a 2026-12-02: lunes, martes y miércoles aparecen 5 veces.
 */
const EBRIEDAD = 'Estado de ebriedad o droga';
const CAUSAS: [string, string, number][] = [
  ['Distracción del conductor', '#1f3a5f', 0.27],
  ['Exceso de velocidad', '#3f6a9e', 0.18],
  ['No respetar señales de tránsito', '#8fb0d6', 0.12],
  [EBRIEDAD, '#c8861a', 0.1],
  ['Invadir carril', '#4d4d4d', 0.09],
  ['No guardar distancia', '#7a7a7a', 0.07],
  ['Cruce indebido', '#a3a3a3', 0.06],
  ['Falla mecánica', '#c4c4c4', 0.05],
];
const OTRAS = 'Otras causas';
const NOMBRES = [
  'San Salvador', 'San Miguel', 'Santa Tecla', 'Santa Ana', 'Soyapango', 'Apopa', 'Mejicanos', 'Ilopango',
  'Ciudad Delgado', 'Antiguo Cuscatlán', 'Sonsonate', 'La Libertad', 'Usulután', 'Zacatecoluca', 'Cojutepeque',
  'Chalatenango', 'San Vicente', 'Ahuachapán', 'La Unión', 'Cuscatancingo', 'Nejapa', 'San Marcos',
  'Quezaltepeque', 'Acajutla', 'Atiquizaya',
];
const N_DISTRITOS = 103;
const DEPARTAMENTOS = ['San Salvador', 'Santa Ana', 'San Miguel', 'La Libertad'];
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const VECES = [5, 5, 5, 4, 4, 4, 4];
/** Promedio por día de ejemplo (sin escalar): el sábado es el mayor. */
const PROMEDIO_DIA = [58, 59, 60, 62, 66, 70, 63];
const PESO_FRANJA: Record<Franja, number> = {
  'Madrugada (00-05)': 0.12,
  'Manana (06-11)': 0.3,
  'Tarde (12-17)': 0.34,
  'Noche (18-23)': 0.24,
};
const TOTAL = 1982;

const codigo = (nombre: string) => nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const ic = (v: number) => ({ ic90_inf: Math.floor(v - 1.645 * Math.sqrt(v)), ic90_sup: Math.ceil(v + 1.645 * Math.sqrt(v)) });
const r2 = (v: number) => Math.round(v * 100) / 100;
const entero = (v: number) => formatearConteo(v);

function nombreDistrito(i: number): string {
  return i < NOMBRES.length ? NOMBRES[i] : `Distrito de ejemplo ${i + 1}`;
}

function pesosDistritos(): number[] {
  const crudos = Array.from({ length: N_DISTRITOS }, (_, i) => 1 / (i + 2));
  const suma = crudos.reduce((a, b) => a + b, 0);
  return crudos.map((p) => p / suma);
}

/** Tercil del propio informe: 103 → 35 / 34 / 34 (los grupos más altos reciben el resto). */
export function tercilPorPosicion(posicion: number, n: number): 'alto' | 'medio' | 'bajo' {
  const base = Math.floor(n / 3);
  const resto = n % 3;
  const alto = base + (resto > 0 ? 1 : 0);
  const medio = base + (resto > 1 ? 1 : 0);
  return posicion < alto ? 'alto' : posicion < alto + medio ? 'medio' : 'bajo';
}

/** Proporciones por franja que suman 1: la ebriedad sube de noche y madrugada. */
function proporciones(franja: Franja): [string, number][] {
  const ebriedadExtra = franja === 'Noche (18-23)' || franja === 'Madrugada (00-05)' ? 0.06 : -0.02;
  const base = CAUSAS.map(([c, , p]): [string, number] => [c, c === EBRIEDAD ? p + ebriedadExtra : p]);
  const suma = base.reduce((a, [, p]) => a + p, 0);
  return [...base, [OTRAS, Math.max(0, 1 - suma)] as [string, number]];
}

export function crearInformeFixture(): InformePeriodo {
  const pesos = pesosDistritos();
  const porDistrito = pesos.map((peso, i) => {
    const esperado = r2(TOTAL * peso);
    return {
      codigo: codigo(nombreDistrito(i)),
      distrito: nombreDistrito(i),
      departamento: DEPARTAMENTOS[i % DEPARTAMENTOS.length],
      esperado,
      ...ic(esperado),
      tercil: tercilPorPosicion(i, N_DISTRITOS),
      tasa_10mil_hab: r2((esperado / (20 + i * 3)) * 0.5),
    };
  });

  const sumasCrudas = PROMEDIO_DIA.map((p, i) => p * VECES[i]);
  const factor = TOTAL / sumasCrudas.reduce((a, b) => a + b, 0);
  const porDia = DIAS.map((dia, i) => {
    const suma = r2(sumasCrudas[i] * factor);
    return { dia, esperado: VECES[i] ? r2(suma / VECES[i]) : 0, veces: VECES[i], suma };
  });
  const diaMayor = porDia.reduce((a, b) => (b.esperado > a.esperado ? b : a));
  const porFranja = FRANJAS.map((franja) => ({ franja, esperado: r2(TOTAL * PESO_FRANJA[franja]) }));
  const franjaMayor = porFranja.reduce((a, b) => (b.esperado > a.esperado ? b : a));
  const total = { esperado: TOTAL, ...ic(TOTAL) };
  const top4 = porDistrito.slice(0, 4);
  const pctTop4 = Math.round((top4.reduce((a, d) => a + d.esperado, 0) / TOTAL) * 100);

  const causasTotal = [
    ...CAUSAS.map(([c, , p]) => [c, p] as [string, number]),
    [OTRAS, 1 - CAUSAS.reduce((a, [, , p]) => a + p, 0)] as [string, number],
  ];
  const colores: Record<string, string> = Object.fromEntries(CAUSAS.map(([c, col]) => [c, col]));
  for (const extra of ['Conducir en contra vía', 'Adelantamiento indebido', 'Giro indebido', 'Mal estado de la vía', 'Fatiga', 'Otros', 'Sin dato', 'Peatón imprudente', 'Fallas de frenos']) {
    colores[extra] = '#9a9a9a';
  }
  colores[OTRAS] = '#e0e0e0';

  const texto =
    `Entre el 2 de noviembre y el 2 de diciembre de 2026 se esperan unos ${entero(total.esperado)} siniestros en el país ` +
    `(entre ${entero(total.ic90_inf)} y ${entero(total.ic90_sup)} con 90% de probabilidad). ` +
    `La tarde concentra el ${Math.round((franjaMayor.esperado / TOTAL) * 100)}% y los ${diaMayor.dia.toLowerCase().replace('sábado', 'sábados')} son, en promedio, los días de mayor riesgo. ` +
    `${top4.slice(0, 3).map((d) => d.distrito).join(', ')} y ${top4[3].distrito} reúnen el ${pctTop4}% del total. ` +
    'De noche y de madrugada, la ebriedad explica cerca del 15% de los siniestros esperados, frente al 4% del día.';

  return {
    parametros: {
      fecha_inicio: '2026-11-02',
      fecha_fin: '2026-12-02',
      filtros: { departamento: null, distritos: [], franjas: [], dias_semana: [] },
    },
    generado: '2026-11-02T11:45:00-06:00',
    resumen: {
      texto,
      filas: [
        { etiqueta: 'Total esperado', valor: `${entero(total.esperado)} (entre ${entero(total.ic90_inf)} y ${entero(total.ic90_sup)})` },
        { etiqueta: 'Franja de mayor riesgo', valor: `Tarde (12-17), ${Math.round((franjaMayor.esperado / TOTAL) * 100)}% del total` },
        { etiqueta: 'Día de mayor riesgo (promedio)', valor: `${diaMayor.dia}, ${entero(diaMayor.esperado)} por día` },
        { etiqueta: 'Distrito con más siniestros esperados', valor: `${porDistrito[0].distrito}, ${formatearDecimal(porDistrito[0].esperado, 1)}` },
      ],
    },
    total,
    por_distrito: porDistrito,
    por_franja: porFranja,
    por_dia_semana: porDia,
    distrito_x_franja: porDistrito.map((d) => ({
      codigo: d.codigo,
      distrito: d.distrito,
      franjas: Object.fromEntries(FRANJAS.map((f) => [f, r2(d.esperado * PESO_FRANJA[f])])),
    })),
    por_causa: causasTotal.map(([causa, p]) => {
      const esperado = r2(TOTAL * p);
      return { causa, esperado, ...ic(esperado), porcentaje: r2(p * 100) };
    }),
    causas_por_franja: FRANJAS.map((franja) => ({
      franja,
      causas: proporciones(franja).map(([causa, proporcion]) => ({ causa, proporcion: Math.round(proporcion * 10000) / 10000 })),
    })),
    prioridades: Array.from({ length: 10 }, (_, i) => ({
      distrito: NOMBRES[i % 4],
      franja: FRANJAS[(i + 1) % 4],
      dia_semana: DIAS[(i * 3) % 7],
      esperado: r2(4.2 - i * 0.25),
      veces: VECES[(i * 3) % 7],
    })),
    colores_causas: colores,
    supuestos: {
      dias_con_lluvia_normal: 31,
      dias_con_ultimo_parque: 31,
      composicion_vehiculos: [
        { tipo: 'Automóvil', porcentaje: 49.2 },
        { tipo: 'Motocicleta', porcentaje: 21.1 },
        { tipo: 'Camión', porcentaje: 12.4 },
        { tipo: 'Pick-up', porcentaje: 9.8 },
        { tipo: 'Otros', porcentaje: 7.5 },
      ],
    },
    limitaciones: [
      'Datos sintéticos, calibrados sobre agregados de ONASEVI/FONAT; las reglas con que se generaron no están documentadas.',
      'Para fechas futuras se usa la lluvia normal del mes y el último dato disponible de parque vehicular.',
      'Las causas son una composición promedio por franja horaria; no indican la causa de siniestros en particular. En el conjunto de datos la composición varía según la franja, pero no entre distritos ni días de la semana.',
      'En el conjunto de datos, el tipo de vehículo involucrado no varía de forma apreciable entre distritos, franjas horarias ni causas (p. ej. Automóvil 49.2%, Motocicleta 21.1%), por lo que el informe no lo desglosa.',
      'En el periodo de evaluación el modelo sobreestimó un 20% los siniestros en los distritos rurales (menos de 30% de población urbana).',
      'El rango del 90% refleja solo la variación aleatoria (Poisson) dada la predicción; no incluye el error del propio modelo.',
    ],
  };
}

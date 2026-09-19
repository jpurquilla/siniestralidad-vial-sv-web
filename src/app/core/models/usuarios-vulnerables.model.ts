export interface RepartoTipoUsuarioOut {
  tipo: string;
  /** % de siniestros fatales de este tipo, sobre el total con víctima. */
  pct_fatales: number;
  /** Fracción de los siniestros de este tipo que tuvieron al menos un fallecido. */
  letalidad_por_siniestro: number;
}

export interface LetalidadPorEdadOut {
  rango_etario: string;
  victimas: number;
  letalidad: number;
}

export interface UsuariosVulnerablesResponse {
  aviso: string;
  reparto_por_tipo: RepartoTipoUsuarioOut[];
  letalidad_por_edad: LetalidadPorEdadOut[];
}

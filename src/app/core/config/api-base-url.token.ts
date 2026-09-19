import { InjectionToken } from '@angular/core';

/**
 * URL base de la API, resuelta en main.ts a partir de /public/config.json
 * antes de bootstrapApplication. Todos los servicios HTTP la inyectan en vez
 * de construir la URL por su cuenta.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

interface AppConfig {
  apiBaseUrl?: unknown;
}

/**
 * Lee /public/config.json en tiempo de arranque. Si falta, no es JSON válido,
 * o no trae apiBaseUrl como string, cae al valor de respaldo y avisa por consola.
 */
export async function loadApiBaseUrl(valorDeRespaldo: string): Promise<string> {
  try {
    const respuesta = await fetch('/config.json');
    if (!respuesta.ok) {
      throw new Error(`config.json respondió con estado ${respuesta.status}`);
    }

    const config = (await respuesta.json()) as AppConfig;
    if (typeof config.apiBaseUrl !== 'string') {
      throw new Error('config.json no tiene un campo "apiBaseUrl" válido');
    }

    return config.apiBaseUrl;
  } catch (error) {
    console.warn(
      `No se pudo leer /config.json, se usa el valor de respaldo "${valorDeRespaldo}".`,
      error,
    );
    return valorDeRespaldo;
  }
}

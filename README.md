# Siniestralidad vial El Salvador — Frontend (Fase 6)

Prototipo web del visualizador de riesgo de siniestralidad vial en El Salvador. Consume la
API FastAPI del repositorio [`siniestralidad-vial-sv`](../siniestralidad-vial-sv) (carpeta
`api/`). Se presenta ante jurado como demo de la Fase 6 de una tesina de maestría.

## Stack

- **Angular 21.2** (última versión de la rama 21, la más nueva compatible con el Node
  instalado en esta máquina — Angular 22 exige Node `^24.15.0` y acá corre `v24.12.0`).
- Standalone components, sin `NgModule`. `signals` para todo el estado, `inject()`, control
  flow moderno (`@if`/`@for`/`@switch`).
- **Zoneless** (`--zoneless` en el scaffold): no se instala `zone.js`; el detector de
  cambios corre sin él.
- **Vitest** como test runner (default del CLI en esta versión, en vez de Karma/Jasmine).
- **Leaflet** para el mapa (ver justificación abajo).
- Convención de nombres de archivo **2025** del CLI (`app.ts`, no `app.component.ts`).

## Instalación

Requiere Node compatible con Angular 21 (`^20.19.0`, `^22.12.0` o `>=24.0.0`).

```bash
npm install
```

## Levantar API y frontend juntos

**1. La API** (repositorio hermano `siniestralidad-vial-sv/api`):

```bash
cd ../siniestralidad-vial-sv/api
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Habilitá el origen de este frontend en el `.env` de la API (no está en el `.env.example`
por defecto):

```bash
CORS_ORIGENES=["http://localhost:4200"]
```

**2. Este frontend:**

```bash
npm start   # ng serve, puerto 4200 por defecto
```

No hay proxy de desarrollo configurado a propósito (ver siguiente sección) — con CORS
habilitado en la API alcanza.

## Dónde se cambia la URL de la API

**Un solo lugar, editable sin recompilar:** `public/config.json`.

```json
{ "apiBaseUrl": "http://localhost:8000" }
```

En `src/main.ts`, antes de `bootstrapApplication`, se hace `fetch('/config.json')` y el
valor resuelto se provee como el `InjectionToken<string>` `API_BASE_URL`
(`src/app/core/config/api-base-url.token.ts`). **Todos** los servicios HTTP
(`src/app/core/services/*.ts`) inyectan ese token; ninguno arma la URL de otra forma.

La cadena `http://localhost:8000` aparece **exactamente en dos lugares** del código:
`public/config.json` y el valor de respaldo en `main.ts` (para cuando `config.json` no se
puede leer). Un test de invariante
(`src/app/core/config/no-hardcoded-api-url.spec.ts`) falla si aparece en cualquier otro
archivo de producción.

Por qué `config.json` y no `environment.ts`: el archivo vive en `public/`, así que termina
tal cual en `dist/` — se edita en el build ya compilado (por ejemplo, para apuntar la demo
a otra máquina) sin necesidad de `ng build` de nuevo. Un `environment.ts` habría quedado
inlineado en el bundle de JS y hubiera obligado a recompilar para cada cambio de URL.

No se configuró el proxy de desarrollo de Angular (`proxy.conf.json`) a propósito: tener
proxy **y** `config.json` al mismo tiempo hace ambiguo de dónde sale realmente la URL en
cada entorno. Con URL absoluta + CORS, el proxy sobra.

## Tests

```bash
npm test
npm test -- --coverage   # reporte de cobertura (@vitest/coverage-v8)
```

74 tests, cobertura 96.4% statements / 92.9% branches / 90.3% funciones / 97.4% líneas.
Cubren, entre otras cosas:

- Carga de `config.json` y su fallback (`load-api-base-url.spec.ts`).
- El invariante de que la URL no se hardcodea fuera de `main.ts`
  (`no-hardcoded-api-url.spec.ts`).
- Los 4 servicios de API, incluyendo casos de error (404/422/500/503).
- Componentes dumb: inputs → render, eventos de usuario → outputs.
- Sincronización de selección entre mapa y ranking en los dos sentidos
  (`pagina-mapa.spec.ts`).
- Que el aviso de datos sintéticos se renderiza (`aviso-sintetico.spec.ts`).
- Estados de error específicos por endpoint (distritos/geojson/ranking/predicciones),
  no un error genérico.

`npm audit`: 0 vulnerabilidades a la fecha de este README.

## Elección de mapa: Leaflet, no MapLibre GL

El requisito es coroplético por polígono (nunca puntos ni heatmap), con ~103 distritos y
sin necesidad de un basemap vectorial rico. Leaflet:

- Tiene el patrón de coroplético por `style()` sobre `L.geoJSON` como caso de uso canónico,
  con menos código que las expresiones `fill-color` de MapLibre GL.
- No depende de tiles externos: en la demo se muestran los polígonos sobre fondo plano,
  encuadrados a su propio `bounds`, sin arriesgar que un wifi lento rompa el mapa frente al
  jurado.
- MapLibre GL (WebGL) rinde mejor con miles de features o basemaps vectoriales — no es el
  caso acá.

## Las cuatro restricciones de dominio (no las rompas pensando que "mejorás" la app)

1. **El mapa es solo coroplético por distrito.** NB10 encontró que por debajo de ~1 km no
   hay estructura espacial real en el conjunto (el efecto medido es 0.71%, muy por debajo
   del umbral de significancia usado). Un mapa de puntos o un heatmap mostraría el reparto
   por exposición como si fuera un hallazgo vial.
2. **No hay predicción de severidad.** El submodelo de NB09 usa variables (`grupo_vulnerable`,
   `rango_etario`) que se conocen después de identificar a las víctimas: no admiten uso
   predictivo ex-ante. Por eso la API no expone ese submodelo y esta UI no tiene pantalla de
   "probabilidad de fatalidad".
3. **El conjunto de datos es sintético**, calibrado sobre agregados de ONASEVI/FONAT (NB01).
   El aviso (`AvisoSintetico`) es permanente en la pantalla del mapa, no un detalle
   escondido en "Acerca del modelo".
4. **El tercil medio ordena mal** (Spearman 0.6470 en la evaluación de NB07, contra 0.9775
   del tercil alto). El panel de ranking agrupa por tercil y el grupo medio siempre lleva
   la advertencia — no se presentan sus 103 posiciones como si tuvieran la misma confianza
   que el tercil alto.

## Qué falta / limitaciones conocidas

- **No existe GeoJSON de distritos en el repositorio de la API.** `GET /api/v1/distritos/geojson`
  devuelve 503 y esta app lo muestra explícitamente ("faltan las geometrías"), sin inventar
  polígonos. Para habilitar el mapa de verdad, colocar un GeoJSON válido (una `Feature` por
  distrito, con `distrito_key` o `codigo`) en
  `../siniestralidad-vial-sv/data/geo/distritos.geojson` — ver `api/README.md` §7.
- El panel de ranking y el detalle de distrito ya funcionan con datos reales de la API
  aunque el mapa esté en 503 (se probó manualmente contra la API corriendo en local).
- **`GET /api/v1/modelo/info` no expone importancia SHAP** (verificado contra
  `api/app/infrastructure/modelo/info_modelo.py`: el campo no existe en ningún lado de la
  respuesta). El brief original pedía mostrar "variables y su importancia SHAP" — se
  muestran las variables, y la pantalla "Acerca del modelo" avisa explícitamente que la
  importancia SHAP todavía no la expone la API, en vez de omitirlo en silencio. Para
  mostrarla de verdad hay que extender ese endpoint en el repo de la API (fuera de
  `web/`).

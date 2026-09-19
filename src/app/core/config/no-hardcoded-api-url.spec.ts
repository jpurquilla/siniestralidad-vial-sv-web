import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const URL_RESPALDO = 'http://localhost:8000';

// Ancorado a process.cwd() (la raíz del proyecto cuando corre `ng test`), no
// a import.meta.url: con --coverage la instrumentación v8 reescribe cómo se
// resuelve la URL del propio módulo y este archivo terminaba mirando una
// ruta equivocada.
const RAIZ_SRC = resolve(process.cwd(), 'src');
const MAIN_TS = join(RAIZ_SRC, 'main.ts');
const ESTE_ARCHIVO = resolve(RAIZ_SRC, 'app/core/config/no-hardcoded-api-url.spec.ts');

function listarArchivosTs(dir: string): string[] {
  const resultado: string[] = [];
  for (const entrada of readdirSync(dir)) {
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) {
      resultado.push(...listarArchivosTs(ruta));
    } else if (ruta.endsWith('.ts')) {
      resultado.push(ruta);
    }
  }
  return resultado;
}

describe('la URL de respaldo de la API vive en un único lugar del código', () => {
  it('main.ts contiene el valor de respaldo exactamente una vez', () => {
    const contenido = readFileSync(MAIN_TS, 'utf-8');
    const ocurrencias = contenido.split(URL_RESPALDO).length - 1;
    expect(ocurrencias).toBe(1);
  });

  it('ningún archivo de producción de src/app hardcodea la URL de la API', () => {
    const archivosApp = listarArchivosTs(join(RAIZ_SRC, 'app')).filter(
      (ruta) => ruta !== ESTE_ARCHIVO && !ruta.endsWith('.spec.ts'),
    );

    const archivosConLaUrl = archivosApp.filter((ruta) =>
      readFileSync(ruta, 'utf-8').includes(URL_RESPALDO),
    );

    expect(archivosConLaUrl).toEqual([]);
  });
});

import { loadApiBaseUrl } from './load-api-base-url';

describe('loadApiBaseUrl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('devuelve apiBaseUrl de config.json cuando el fetch tiene éxito', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ apiBaseUrl: 'http://api.ejemplo.test' }),
      } as Response),
    );

    const resultado = await loadApiBaseUrl('http://localhost:8000');

    expect(resultado).toBe('http://api.ejemplo.test');
  });

  it('usa el valor de respaldo y avisa si config.json no se puede leer (fetch rechaza)', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const resultado = await loadApiBaseUrl('http://localhost:8000');

    expect(resultado).toBe('http://localhost:8000');
    expect(warnSpy).toHaveBeenCalled();
  });

  it('usa el valor de respaldo y avisa si config.json responde con estado no-ok', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 } as Response));

    const resultado = await loadApiBaseUrl('http://localhost:8000');

    expect(resultado).toBe('http://localhost:8000');
    expect(warnSpy).toHaveBeenCalled();
  });

  it('usa el valor de respaldo y avisa si config.json no trae apiBaseUrl', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response),
    );

    const resultado = await loadApiBaseUrl('http://localhost:8000');

    expect(resultado).toBe('http://localhost:8000');
    expect(warnSpy).toHaveBeenCalled();
  });
});

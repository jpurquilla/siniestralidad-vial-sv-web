import { HttpErrorResponse } from '@angular/common/http';
import { mensajeErrorHttp } from './mensaje-error-http';

describe('mensajeErrorHttp', () => {
  it('da un mensaje de conexión cuando el status es 0 (API caída o sin red)', () => {
    const error = new HttpErrorResponse({
      status: 0,
      url: 'http://localhost:8000/api/v1/distritos',
    });
    expect(mensajeErrorHttp(error)).toContain('No se pudo conectar con la API');
  });

  it('incluye el detalle de validación cuando el status es 422', () => {
    const error = new HttpErrorResponse({
      status: 422,
      error: {
        detail: [{ loc: ['body', 'distritos'], msg: 'distrito inexistente', type: 'value_error' }],
      },
    });
    expect(mensajeErrorHttp(error)).toContain('distrito inexistente');
  });

  it('da un mensaje de validación genérico en 422 sin detalle estructurado', () => {
    const error = new HttpErrorResponse({ status: 422, error: { detail: 'texto plano' } });
    expect(mensajeErrorHttp(error)).toBe('Los datos enviados no son válidos.');
  });

  it('da un mensaje de error del servidor para 5xx', () => {
    const error = new HttpErrorResponse({ status: 500 });
    expect(mensajeErrorHttp(error)).toContain('error interno');
  });

  it('da un mensaje genérico con el código para otros status', () => {
    const error = new HttpErrorResponse({ status: 404 });
    expect(mensajeErrorHttp(error)).toContain('404');
  });
});

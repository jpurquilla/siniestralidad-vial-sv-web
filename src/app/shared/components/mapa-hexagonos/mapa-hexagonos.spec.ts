import { HexagonoOut } from '../../../core/models/siniestro-punto.model';
import { tooltipHexagono } from './mapa-hexagonos';

const hex = (conteo: number, distritos: string[]): HexagonoOut => ({
  id: 'a',
  conteo,
  distritos,
  centro: [13.7, -89.2],
  vertices: [],
});

describe('tooltipHexagono', () => {
  it('muestra el número de siniestros y los distritos que abarca', () => {
    expect(tooltipHexagono(hex(1234, ['San Salvador', 'Soyapango']))).toBe(
      '<strong>1,234 siniestros</strong><br>Distritos: San Salvador, Soyapango',
    );
  });

  it('usa el singular y abrevia las listas largas', () => {
    expect(tooltipHexagono(hex(1, ['Apopa']))).toBe('<strong>1 siniestro</strong><br>Distrito: Apopa');
    expect(tooltipHexagono(hex(9, ['A', 'B', 'C', 'D', 'E', 'F']))).toContain('A, B, C, D y 2 más');
  });

  it('escapa el HTML de los nombres', () => {
    expect(tooltipHexagono(hex(2, ['<b>x</b>']))).toContain('&lt;b&gt;x&lt;/b&gt;');
  });
});

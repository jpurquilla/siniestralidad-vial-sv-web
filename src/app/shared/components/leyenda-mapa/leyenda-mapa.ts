import { Component, input } from '@angular/core';
import { ClaseLeyenda } from './clase-leyenda.model';

@Component({
  selector: 'app-leyenda-mapa',
  imports: [],
  templateUrl: './leyenda-mapa.html',
  styleUrl: './leyenda-mapa.css',
})
export class LeyendaMapa {
  readonly clases = input.required<ClaseLeyenda[]>();
  readonly colorSinDato = input.required<string>();
}

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
  /** Etiqueta de la clase sin dato; por ejemplo «Fuera del alcance del estudio». */
  readonly etiquetaSinDato = input('Sin dato');
  /** true: la muestra de «sin dato» se dibuja solo con contorno, igual que en el mapa. */
  readonly sinDatoSoloContorno = input(false);
  /** Clases adicionales (por ejemplo «Fuera de escala»), tras las de la escala. */
  readonly extras = input<ClaseLeyenda[]>([]);
  readonly titulo = input('Leyenda de siniestros esperados');
}

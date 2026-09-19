import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

interface ItemNav {
  num: string;
  label: string;
  ruta: string;
  exacta?: boolean;
}

interface SeccionNav {
  titulo: string;
  items: ItemNav[];
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly secciones: SeccionNav[] = [
    {
      titulo: 'Predicción',
      items: [
        { num: '1', label: 'Mapa de riesgo', ruta: '/', exacta: true },
        { num: '2', label: 'Calendario de riesgo', ruta: '/calendario' },
      ],
    },
    {
      titulo: 'Diagnóstico',
      items: [
        { num: '3', label: 'Ranking de distritos', ruta: '/ranking' },
        { num: '4', label: 'Panel de equidad', ruta: '/equidad' },
        { num: '5', label: 'Mapa de brecha', ruta: '/mapa-de-brecha' },
        { num: '6', label: 'Mapa de hotspots', ruta: '/hotspots' },
      ],
    },
    {
      titulo: 'Impacto',
      items: [
        { num: '7', label: 'Ley Cero Tolerancia', ruta: '/ley-cero-tolerancia' },
        { num: '8', label: 'Usuarios vulnerables', ruta: '/usuarios-vulnerables' },
      ],
    },
  ];
}

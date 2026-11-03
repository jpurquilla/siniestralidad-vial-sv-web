import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

interface ItemNav {
  num: string;
  label: string;
  ruta: string;
  exacta?: boolean;
  /** Conserva los parámetros de URL (filtros) al navegar desde el menú. */
  conservarFiltros?: boolean;
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
        { num: '3', label: 'Informe por periodo', ruta: '/informe-periodo' },
      ],
    },
    {
      titulo: 'Diagnóstico',
      items: [
        { num: '4', label: 'Panel de equidad', ruta: '/equidad' },
        { num: '5', label: 'Mapa de brecha', ruta: '/mapa-de-brecha' },
        { num: '6', label: 'Mapa de hotspots', ruta: '/hotspots' },
        { num: '7', label: 'Concentraciones por área (2 km)', ruta: '/concentraciones-area', conservarFiltros: true },
        { num: '8', label: 'Concentraciones por distrito', ruta: '/concentraciones-distrito', conservarFiltros: true },
      ],
    },
    {
      titulo: 'Impacto',
      items: [
        { num: '9', label: 'Ley Cero Tolerancia', ruta: '/ley-cero-tolerancia' },
        { num: '10', label: 'Usuarios vulnerables', ruta: '/usuarios-vulnerables' },
      ],
    },
  ];
}

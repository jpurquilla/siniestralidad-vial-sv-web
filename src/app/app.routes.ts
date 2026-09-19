import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/pagina-mapa/pagina-mapa').then((m) => m.PaginaMapa),
  },
  {
    path: 'calendario',
    loadComponent: () =>
      import('./pages/pagina-calendario/pagina-calendario').then((m) => m.PaginaCalendario),
  },
  {
    path: 'ranking',
    loadComponent: () =>
      import('./pages/pagina-ranking-comparativo/pagina-ranking-comparativo').then(
        (m) => m.PaginaRankingComparativo,
      ),
  },
  {
    path: 'equidad',
    loadComponent: () => import('./pages/pagina-equidad/pagina-equidad').then((m) => m.PaginaEquidad),
  },
  {
    path: 'ley-cero-tolerancia',
    loadComponent: () =>
      import('./pages/pagina-ley-cero-tolerancia/pagina-ley-cero-tolerancia').then(
        (m) => m.PaginaLeyCeroTolerancia,
      ),
  },
  {
    path: 'usuarios-vulnerables',
    loadComponent: () =>
      import('./pages/pagina-usuarios-vulnerables/pagina-usuarios-vulnerables').then(
        (m) => m.PaginaUsuariosVulnerables,
      ),
  },
  {
    path: 'mapa-de-brecha',
    loadComponent: () =>
      import('./pages/pagina-mapa-de-brecha/pagina-mapa-de-brecha').then(
        (m) => m.PaginaMapaDeBrecha,
      ),
  },
  {
    path: 'hotspots',
    loadComponent: () => import('./pages/pagina-hotspots/pagina-hotspots').then((m) => m.PaginaHotspots),
  },
  {
    path: 'acerca-del-modelo',
    loadComponent: () =>
      import('./pages/pagina-acerca-del-modelo/pagina-acerca-del-modelo').then(
        (m) => m.PaginaAcercaDelModelo,
      ),
  },
  { path: '**', redirectTo: '' },
];

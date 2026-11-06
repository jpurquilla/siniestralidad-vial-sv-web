import { Component } from '@angular/core';

/**
 * Encabezado común de las páginas diagnósticas: deja claro que lo observado
 * corresponde al periodo de evaluación, que el modelo no vio al entrenar.
 */
@Component({
  selector: 'app-nota-periodo-evaluacion',
  template: `
    <p class="periodo" data-periodo-evaluacion>
      <strong>Observado (2025-2026, periodo de evaluación)</strong>
      <span>
        El modelo no vio estos datos al entrenar: sus predicciones se comparan con lo que
        realmente ocurrió en ese periodo.
      </span>
    </p>
  `,
  styles: `
    .periodo {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      margin: 0 0 1rem;
      padding: 0.6rem 0.9rem;
      max-width: 52rem;
      font-size: 0.85rem;
      line-height: 1.45;
      color: var(--color-text);
      background: var(--color-surface-2);
      border-left: 3px solid var(--color-brand);
      border-radius: var(--radius-sm);
    }
    span {
      color: var(--color-text-muted);
    }
  `,
})
export class NotaPeriodoEvaluacion {}

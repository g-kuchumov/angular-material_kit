import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@ngneat/transloco';

/** Экран «нет права»: маршрут скрыт гардом, но прямой переход возможен. */
@Component({
  selector: 'amk-forbidden',
  imports: [RouterLink, TranslocoDirective],
  template: `
    <ng-container *transloco="let t">
      <div class="forbidden">
        <h1>{{ t('forbidden.title') }}</h1>
        <p>{{ t('forbidden.description') }}</p>
        <a class="forbidden-link" routerLink="/users/me">{{ t('forbidden.back') }}</a>
      </div>
    </ng-container>
  `,
  styles: [
    `
      .forbidden {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        min-height: 60vh;
        text-align: center;
      }

      .forbidden-link {
        margin-top: 1rem;
      }
    `,
  ],
})
export class Forbidden {}

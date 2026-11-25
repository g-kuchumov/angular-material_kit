import { Directive, inject } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { MENU_CONTEXT } from './menu-context.token';

@Directive()
export class BaseMenuDirective {
  private context = inject(MENU_CONTEXT);
  private transloco = inject(TranslocoService);

  public get disabled(): boolean {
    return this.context.busy();
  }

  public t(key: string): string {
    return this.transloco.translate(key);
  }
}

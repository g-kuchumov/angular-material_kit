import { Component } from '@angular/core';
import { TranslocoDirective } from '@ngneat/transloco';

import { ExpressionPanel } from './expression-panel/expression-panel';

@Component({
  selector: 'amk-settings',
  imports: [ExpressionPanel, TranslocoDirective],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {}

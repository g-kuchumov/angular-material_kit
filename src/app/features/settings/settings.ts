import { Component } from '@angular/core';

import { ExpressionPanel } from './expression-panel/expression-panel';

@Component({
  selector: 'amk-settings',
  imports: [ExpressionPanel],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {}

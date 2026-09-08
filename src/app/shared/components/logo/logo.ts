import { Component, Input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { NgClass } from '@angular/common';
import { TranslocoDirective } from '@ngneat/transloco';

@Component({
  selector: 'amk-logo',
  imports: [MatIcon, NgClass, TranslocoDirective],
  templateUrl: './logo.html',
  styleUrl: './logo.scss',
})
export class Logo {
  @Input() public direction: 'row' | 'column' = 'row';
  @Input() public size: 'small' | 'medium' | 'large' = 'medium';
}

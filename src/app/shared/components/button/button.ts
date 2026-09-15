import { Component } from '@angular/core';
import { MatButton, MatFabButton, MatIconButton, MatMiniFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatDivider } from '@angular/material/list';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@ngneat/transloco';

@Component({
  selector: 'amk-button',
  imports: [
    MatIcon,
    MatFabButton,
    RouterLink,
    MatDivider,
    MatMiniFabButton,
    MatIconButton,
    MatButton,
    TranslocoDirective,
  ],
  templateUrl: './button.html',
  styleUrl: './button.scss',
})
export class Button {}

import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatFabButton, MatIconButton, MatMiniFabButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MatDivider } from '@angular/material/list';

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
  ],
  templateUrl: './button.html',
  styleUrl: './button.scss',
})
export class Button {}

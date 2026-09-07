import { Component } from '@angular/core';
import { Sidenav } from './shared/components/sidenav/sidenav';

@Component({
  selector: 'amk-root',
  imports: [Sidenav],
  standalone: true,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}

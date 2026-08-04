import { Component } from '@angular/core';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';

@Component({
  selector: 'amk-button-toggle',
  imports: [MatButtonToggleGroup, MatButtonToggle],
  templateUrl: './button-toggle.html',
  styleUrl: './button-toggle.scss',
})
export class ButtonToggle {}

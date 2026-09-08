import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@ngneat/transloco';

@Component({
  selector: 'amk-footer',
  imports: [DatePipe, MatButton, RouterLink, TranslocoDirective],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  public currentDate = new Date();
}

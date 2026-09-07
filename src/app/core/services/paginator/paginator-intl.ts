import { inject, Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslocoService } from '@ngneat/transloco';
import { Subject, switchMap, take, takeUntil } from 'rxjs';

type PaginatorKeys =
  'itemsPerPage' | 'nextPage' | 'previousPage' | 'firstPage' | 'lastPage' | 'range' | 'rangeZero';

@Injectable()
export class CustomPaginatorIntl extends MatPaginatorIntl {
  private readonly transloco = inject(TranslocoService);

  private readonly destroy$ = new Subject<void>();

  constructor() {
    super();

    this.translateLabels();

    this.transloco.langChanges$
      .pipe(
        switchMap(() =>
          this.transloco.selectTranslateObject<PaginatorKeys>('paginator').pipe(take(1)),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.translateLabels();

        this.changes.next();
      });
  }

  private translateLabels() {
    this.itemsPerPageLabel = this.transloco.translate('paginator.itemsPerPage');
    this.nextPageLabel = this.transloco.translate('paginator.nextPage');
    this.previousPageLabel = this.transloco.translate('paginator.previousPage');
    this.firstPageLabel = this.transloco.translate('paginator.firstPage');
    this.lastPageLabel = this.transloco.translate('paginator.lastPage');

    this.getRangeLabel = (page: number, pageSize: number, length: number) => {
      if (length === 0 || pageSize === 0) {
        return this.transloco.translate('paginator.rangeZero', { length });
      }
      const start = page * pageSize;
      const end = start + pageSize > length ? length : start + pageSize;
      return this.transloco.translate('paginator.range', { start: start + 1, end, length });
    };
  }
}

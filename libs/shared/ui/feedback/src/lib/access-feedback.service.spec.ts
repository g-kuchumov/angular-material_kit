import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';

import { provideTestTransloco } from '@amk/shared-testing';
import { AccessFeedbackService } from './access-feedback.service';

describe('AccessFeedbackService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ providers: [provideTestTransloco()] }).compileComponents();
  });

  it('показывает отказ изменения в snackbar и сохраняет управление формой', () => {
    const snackBar = TestBed.inject(MatSnackBar);
    const open = vi.spyOn(snackBar, 'open');

    TestBed.inject(AccessFeedbackService).mutationDenied();

    expect(open).toHaveBeenCalledOnce();
    expect(open.mock.calls[0]?.[0]).toBe('access.denied.mutation');
  });
});

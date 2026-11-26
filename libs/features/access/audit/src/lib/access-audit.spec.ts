import { TestBed } from '@angular/core/testing';

import { ACCESS_API } from '@amk/domain-access-api';
import { provideTestApp } from '@amk/shared-testing';
import { AccessAudit } from './access-audit';

describe('AccessAudit', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccessAudit],
      providers: [provideTestApp()],
    }).compileComponents();
  });

  it('загружает журнал и фильтрует события', async () => {
    const loadSpy = vi.spyOn(TestBed.inject(ACCESS_API), 'loadAudit');
    const fixture = TestBed.createComponent(AccessAudit);
    await fixture.whenStable();

    expect(loadSpy).toHaveBeenCalled();
    expect(fixture.componentInstance.events().length).toBe(2);

    fixture.componentInstance.filter.setValue('granted');

    expect(fixture.componentInstance.filteredEvents().map((event) => event.id)).toEqual(['audit-1']);
  });

  it('пустой фильтр показывает все события', async () => {
    const fixture = TestBed.createComponent(AccessAudit);
    await fixture.whenStable();

    fixture.componentInstance.filter.setValue('нет такого');

    expect(fixture.componentInstance.filteredEvents()).toEqual([]);
  });
});

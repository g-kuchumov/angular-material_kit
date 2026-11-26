import { ACCESS_API } from '@amk/domain-access-api';
import { USERS_API } from '@amk/domain-users-api';
import { UserId } from '@amk/domain-users-model';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { TranslocoDirective } from '@ngneat/transloco';

/** Журнал только для чтения: у клиента нет контракта на изменение событий. */
@Component({
  selector: 'amk-access-audit',
  imports: [
    ReactiveFormsModule,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatFormField,
    MatLabel,
    MatInput,
    TranslocoDirective,
  ],
  templateUrl: './access-audit.html',
  styleUrl: './access-audit.scss',
})
export class AccessAudit {
  private readonly access = inject(ACCESS_API);

  private readonly users = inject(USERS_API);

  public readonly events = this.access.audit;

  public readonly usersList = this.users.users;

  public readonly filter = new FormControl('', { nonNullable: true });

  private readonly query = toSignal(this.filter.valueChanges, { initialValue: '' });

  public readonly filteredEvents = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.events().filter(
      (event) =>
        !query ||
        event.action.toLowerCase().includes(query) ||
        event.targetId.toLowerCase().includes(query) ||
        event.traceId.toLowerCase().includes(query),
    );
  });

  constructor() {
    void this.users.search();
    void this.access.loadAudit();
  }

  public actorName(actorId: UserId): string {
    return this.usersList().find((user) => user.id === actorId)?.displayName ?? actorId;
  }
}

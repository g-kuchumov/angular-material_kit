import { UserId } from '@amk/domain-users-model';

/** Неизменяемое событие аудита. Удаление/изменение запрещено на уровне API. */
export interface AuditEvent {
  readonly id: string;
  readonly actorId: UserId;
  readonly action: string;
  readonly targetType: string;
  readonly targetId: string;
  readonly before?: unknown;
  readonly after?: unknown;
  readonly traceId: string;
  readonly occurredAt: string;
}

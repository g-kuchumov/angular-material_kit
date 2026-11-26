import { SidenavNode } from './sidenav-node.model';

/**
 * Меню конкретного контекста приложения (страницы со списком, страницы сущности и т.д.).
 * Контекст объявляет та страница, на которую перешло приложение; сам сервис не знает,
 * что именно находится внутри — только заголовок и список пунктов.
 */
export interface SidenavContext {
  id: string;
  title: string;
  items: SidenavNode[];
  /** Маршрут страницы, которой принадлежит контекст. Нужен для возврата к её контенту. */
  route?: string;
  /** Ключ перевода подписи кнопки возврата. По умолчанию используется `sidenav.back`. */
  backLabelKey?: string;
}

export interface MenuItem {
  label: string;
  route?: string;
  icon?: string;
}

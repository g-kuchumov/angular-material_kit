import { TestBed } from '@angular/core/testing';

import { createSidenavNode, SIDENAV_API, SidenavContext } from '@amk/domain-navigation-api';
import { provideTestTransloco } from '@amk/shared-testing';
import { provideSidenav } from './provide-sidenav';
import { SidenavService } from './sidenav.service';

function context(id: string, route = `${id}-page`): SidenavContext {
  return {
    id,
    title: `Title ${id}`,
    route,
    items: [createSidenavNode({ id: `${id}-item`, label: `Item ${id}` })],
  };
}

const ROOT_NODES = [createSidenavNode({ id: 'root', label: 'Root' })];

describe('SidenavService', () => {
  let service: SidenavService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...provideTestTransloco(), ...provideSidenav(ROOT_NODES)],
    });
    service = TestBed.inject(SidenavService);
  });

  it('публикует реализацию через контракт SIDENAV_API', () => {
    expect(TestBed.inject(SIDENAV_API)).toBe(service);
  });

  it('показывает корневое меню и не имеет заголовка контекста в начале', () => {
    const rootMenu = service.menu();

    expect(rootMenu.length).toBeGreaterThan(0);
    expect(service.hasContext()).toBe(false);
    expect(service.contextTitle()).toBe('');
  });

  it('показывает пункты меню текущего контекста вместо корневого меню', () => {
    const current = context('current');

    service.enterContext(current);

    expect(service.hasContext()).toBe(true);
    expect(service.menu()).toBe(current.items);
    expect(service.contextTitle()).toBe(current.title);
  });

  it('возвращается на один контекст за раз при любом количестве вложений', () => {
    const first = context('first');
    const second = context('second');
    const third = context('third');
    const rootMenu = service.menu();

    service.enterContext(first);
    service.enterContext(second);
    service.enterContext(third);

    expect(service.menu()).toBe(third.items);

    service.goBack();
    expect(service.menu()).toBe(second.items);
    expect(service.contextTitle()).toBe(second.title);

    service.goBack();
    expect(service.menu()).toBe(first.items);
    expect(service.contextTitle()).toBe(first.title);

    service.goBack();
    expect(service.menu()).toBe(rootMenu);
    expect(service.hasContext()).toBe(false);
    expect(service.contextTitle()).toBe('');
  });

  it('указывает маршрут страницы для возврата из текущего контекста', () => {
    const first = context('first');
    const second = context('second');

    expect(service.backRoute()).toBeNull();

    service.enterContext(first);
    expect(service.backRoute()).toBe('/');

    service.enterContext(second);
    expect(service.backRoute()).toBe(first.route);

    service.goBack();
    expect(service.backRoute()).toBe('/');
  });

  it('не добавляет уровень при повторном входе в текущий контекст', () => {
    const first = context('first');

    service.enterContext(first);
    service.enterContext({ ...first, title: 'Обновлённый заголовок' });

    expect(service.contextTitle()).toBe('Обновлённый заголовок');
    expect(service.backRoute()).toBe('/');

    service.goBack();
    expect(service.hasContext()).toBe(false);
  });

  it('не выходит за пределы корневого меню', () => {
    const rootMenu = service.menu();

    service.goBack();

    expect(service.menu()).toBe(rootMenu);
    expect(service.hasContext()).toBe(false);
  });

  it('сбрасывает сразу все контексты', () => {
    const rootMenu = service.menu();

    service.enterContext(context('first'));
    service.enterContext(context('second'));
    service.resetContext();

    expect(service.menu()).toBe(rootMenu);
    expect(service.hasContext()).toBe(false);
  });
});

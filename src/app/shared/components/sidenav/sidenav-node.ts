import { Component, computed, input, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatListItem, MatListItemIcon } from '@angular/material/list';
import { SidenavNode } from '../../../core/services/sidenav/sidenav-node.model';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'amk-sidenav-node',
  imports: [
    RouterLink,
    RouterLinkActive,
    MatIcon,
    MatListItem,
    MatListItemIcon,
    MatIconButton,
    MatTooltip,
  ],
  templateUrl: './sidenav-node.html',
  styleUrl: './sidenav-node.scss',
})
export class SidenavNodeComponent {
  public readonly node = input.required<SidenavNode>();

  public readonly depth = input(0);

  public readonly disabled = input(false);

  public readonly expandedIds = input<ReadonlySet<string>>(new Set());

  public readonly toggleNode = output<string>();

  public readonly navigate = output();

  public readonly isExpanded = computed(() => this.expandedIds().has(this.node().id));

  public readonly hasChildren = computed(() => this.node().children.length > 0);

  public onToggleClick(event: Event): void {
    event.stopPropagation();
    this.toggleNode.emit(this.node().id);
  }

  public checkEllipsis(element: HTMLElement, tooltip: MatTooltip): void {
    const hasEllipsis = element.scrollWidth > element.clientWidth + 1;

    if (hasEllipsis) {
      // eslint-disable-next-line no-param-reassign
      tooltip.disabled = false;
      tooltip.show();
    } else {
      // eslint-disable-next-line no-param-reassign
      tooltip.disabled = true;
      tooltip.hide();
    }
  }
}

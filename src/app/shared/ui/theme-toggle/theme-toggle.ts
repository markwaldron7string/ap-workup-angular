import { Component, inject } from '@angular/core';
import { ThemeService } from '../../../core/theme.service';

@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.html',
  host: { class: 'theme-toggle', role: 'group', 'aria-label': 'Theme' },
})
export class ThemeToggle {
  protected readonly themes = inject(ThemeService);
}

import { DOCUMENT, Injectable, inject, signal } from '@angular/core';

const THEMES = ['dark', 'light', 'original'] as const;

export type Theme = (typeof THEMES)[number];

const STORAGE_KEY = 'calcTheme';

/** Owns the colour theme: remembers it in localStorage and applies it as <html data-theme="...">. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly current = signal<Theme>('dark');

  readonly theme = this.current.asReadonly();

  constructor() {
    this.set(this.savedTheme() ?? 'dark');
  }

  set(theme: Theme): void {
    this.current.set(theme);
    this.document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage is blocked or full. The theme still applies for this visit.
    }
  }

  /** The theme saved on an earlier visit, if storage is readable and holds a theme we know. */
  private savedTheme(): Theme | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return THEMES.find((theme) => theme === saved) ?? null;
    } catch {
      return null;
    }
  }
}

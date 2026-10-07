import { TestBed } from '@angular/core/testing';
import { installStorageMock } from '../../testing/dom';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    installStorageMock();
    document.documentElement.removeAttribute('data-theme');
  });

  it('starts in the dark theme and applies it to the page', () => {
    const themes = TestBed.inject(ThemeService);

    expect(themes.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('restores the theme saved on an earlier visit', () => {
    localStorage.setItem('calcTheme', 'original');

    expect(TestBed.inject(ThemeService).theme()).toBe('original');
  });

  it('falls back to dark when the saved value is not a theme', () => {
    localStorage.setItem('calcTheme', 'neon');

    const themes = TestBed.inject(ThemeService);

    expect(themes.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('still works when the browser blocks storage', () => {
    const blocked = () => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    };
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: { getItem: blocked, setItem: blocked },
    });

    const themes = TestBed.inject(ThemeService);
    expect(themes.theme()).toBe('dark');

    themes.set('light');
    expect(themes.theme()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('applies and remembers a newly chosen theme', () => {
    const themes = TestBed.inject(ThemeService);

    themes.set('light');

    expect(themes.theme()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('calcTheme')).toBe('light');
  });
});

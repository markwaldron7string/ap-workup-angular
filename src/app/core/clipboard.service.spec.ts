import { TestBed } from '@angular/core/testing';
import { ClipboardService } from './clipboard.service';

describe('ClipboardService', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows copied feedback immediately without waiting for clipboard', () => {
    vi.useFakeTimers();
    const writeText = vi
      .fn()
      .mockImplementation(() => new Promise<void>((resolve) => window.setTimeout(resolve, 100)));
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    const clipboard = TestBed.inject(ClipboardService);
    const button = { blur: vi.fn() } as unknown as HTMLElement;

    clipboard.copy('17', button);

    expect(clipboard.copiedText()).toBe('17');
    expect(writeText).toHaveBeenCalledWith('17');
    expect(button.blur).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(2000);
    expect(clipboard.copiedText()).toBe('');
    expect(button.blur).toHaveBeenCalledTimes(2);
  });

  it('keeps the feedback for the latest copy when two follow each other', () => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    const clipboard = TestBed.inject(ClipboardService);

    clipboard.copy('first');
    vi.advanceTimersByTime(1500);
    clipboard.copy('second');
    vi.advanceTimersByTime(1500);

    expect(clipboard.copiedText()).toBe('second');

    vi.advanceTimersByTime(500);
    expect(clipboard.copiedText()).toBe('');
  });
});

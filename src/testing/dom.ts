import { ComponentFixture } from '@angular/core/testing';

/** Small helpers for driving a component through its rendered DOM, the way a user would. */
export function domOf<T>(fixture: ComponentFixture<T>) {
  const root = fixture.nativeElement as HTMLElement;

  const query = <E extends HTMLElement>(selector: string): E | null =>
    root.querySelector<E>(selector);

  const get = <E extends HTMLElement>(selector: string): E => {
    const el = query<E>(selector);
    if (!el) throw new Error(`Missing element: ${selector}`);
    return el;
  };

  return {
    root,
    query,
    get,
    all: <E extends HTMLElement>(selector: string): E[] =>
      Array.from(root.querySelectorAll<E>(selector)),
    text: (selector: string): string => get(selector).textContent?.trim() ?? '',

    click(selector: string): void {
      get(selector).click();
      fixture.detectChanges();
    },

    typeInto(selector: string, value: string): void {
      const input = get<HTMLInputElement>(selector);
      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    },

    select(selector: string, value: string): void {
      const select = get<HTMLSelectElement>(selector);
      select.value = value;
      select.dispatchEvent(new Event('change'));
      fixture.detectChanges();
    },
  };
}

/** The test environment has no usable localStorage, so give it an in-memory one. */
export function installStorageMock(): void {
  const storage = new Map<string, string>();

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
    },
  });
}

/** Replaces navigator.clipboard and returns the writeText spy. */
export function mockClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  return writeText;
}

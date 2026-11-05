import { Platform } from 'react-native';

/**
 * Initializes web accessibility patches to prevent browser warnings and focus entrapment.
 *
 * Specifically addresses:
 * "Blocked aria-hidden on an element because its descendant retained focus."
 *
 * Root Cause Analysis:
 * In React Native Web and @react-navigation/elements (e.g. Screen.js line 38: `"aria-hidden": !focused`),
 * screen containers or modal backdrops are marked with `aria-hidden="true"`.
 * If a descendant element inside that container (e.g., a button, tab, link, or input) currently holds
 * DOM focus (`document.activeElement`), the Chromium/Blink accessibility engine detects that a focused
 * element is being concealed from assistive technology. To prevent screen reader focus traps,
 * the browser rejects setting `aria-hidden` and logs:
 *   "Blocked aria-hidden on an element because its descendant retained focus."
 *
 * Resolution:
 * On Web platforms, whenever `aria-hidden="true"` is about to be set on an element, we verify if
 * `document.activeElement` is a descendant of that element. If so, we proactively blur the active
 * element first. This clears focus to document body before `aria-hidden` is applied, preventing
 * the browser violation, preserving full screen reader accessibility, and eliminating the console warning.
 */
let isInitialized = false;

export function initWebA11yFix(): void {
  if (isInitialized) return;
  if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  try {
    const originalSetAttribute = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (name: string, value: string) {
      if (
        name.toLowerCase() === 'aria-hidden' &&
        (value === 'true' || value === '') &&
        document.activeElement &&
        document.activeElement !== document.body &&
        typeof this.contains === 'function' &&
        this.contains(document.activeElement)
      ) {
        try {
          (document.activeElement as HTMLElement)?.blur?.();
        } catch {
          // Ignore blur failures
        }
      }
      return originalSetAttribute.call(this, name, value);
    };

    // Reflective IDL property patch if supported by the browser
    if (typeof HTMLElement !== 'undefined' && HTMLElement.prototype) {
      const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'ariaHidden');
      if (descriptor && descriptor.set) {
        const originalSet = descriptor.set;
        Object.defineProperty(HTMLElement.prototype, 'ariaHidden', {
          ...descriptor,
          set(value: string | null) {
            if (
              (value === 'true' || value === '') &&
              document.activeElement &&
              document.activeElement !== document.body &&
              typeof this.contains === 'function' &&
              this.contains(document.activeElement)
            ) {
              try {
                (document.activeElement as HTMLElement)?.blur?.();
              } catch {
                // Ignore blur failures
              }
            }
            return originalSet.call(this, value);
          },
        });
      }
    }

    isInitialized = true;
  } catch (err) {
    if (__DEV__) {
      console.warn('[webA11yFix] Failed to attach web a11y patch:', err);
    }
  }
}

/**
 * Safely blurs the active DOM element on Web.
 * Recommended to be called during modal dismissals or route transitions.
 */
export function blurActiveElementOnWeb(): void {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    try {
      if (document.activeElement && document.activeElement !== document.body) {
        (document.activeElement as HTMLElement)?.blur?.();
      }
    } catch {
      // Ignore
    }
  }
}

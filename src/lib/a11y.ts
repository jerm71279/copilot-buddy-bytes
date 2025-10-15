/**
 * Accessibility Utilities
 * Helpers for keyboard navigation, ARIA labels, and focus management
 */

/**
 * Trap focus within a container (for modals/dialogs)
 */
export function trapFocus(containerElement: HTMLElement) {
  const focusableElements = containerElement.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  containerElement.addEventListener('keydown', handleKeyDown);

  return () => {
    containerElement.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Announce to screen readers (using live region)
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Generate unique ID for ARIA relationships
 */
export function generateAriaId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Keyboard event handler for common patterns
 */
export function handleKeyboardNavigation(
  event: React.KeyboardEvent,
  handlers: {
    onEnter?: () => void;
    onSpace?: () => void;
    onEscape?: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
  }
) {
  const { key } = event;

  switch (key) {
    case 'Enter':
      handlers.onEnter?.();
      break;
    case ' ':
      event.preventDefault(); // Prevent page scroll
      handlers.onSpace?.();
      break;
    case 'Escape':
      handlers.onEscape?.();
      break;
    case 'ArrowUp':
      event.preventDefault();
      handlers.onArrowUp?.();
      break;
    case 'ArrowDown':
      event.preventDefault();
      handlers.onArrowDown?.();
      break;
    case 'ArrowLeft':
      handlers.onArrowLeft?.();
      break;
    case 'ArrowRight':
      handlers.onArrowRight?.();
      break;
  }
}

/**
 * Check color contrast ratio for WCAG compliance
 */
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string) => {
    // Simplified luminance calculation
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const [rs, gs, bs] = [r, g, b].map(c => 
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Validate WCAG AA compliance (4.5:1 for normal text)
 */
export function meetsWCAGAA(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 4.5;
}

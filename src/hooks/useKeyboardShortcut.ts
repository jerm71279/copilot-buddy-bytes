import { useEffect } from "react";

interface KeyboardShortcutOptions {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
}

/**
 * Reusable hook for keyboard shortcuts
 * Eliminates duplicate keyboard event handling logic
 * 
 * @param options - Keyboard shortcut configuration
 * @param callback - Function to call when shortcut is triggered
 * 
 * @example
 * // Open search with Cmd/Ctrl + K
 * useKeyboardShortcut(
 *   { key: 'k', ctrl: true, meta: true },
 *   () => setSearchOpen(true)
 * );
 */
export const useKeyboardShortcut = (
  options: KeyboardShortcutOptions,
  callback: () => void
) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const matchesKey = e.key.toLowerCase() === options.key.toLowerCase();
      const matchesCtrl = options.ctrl ? e.ctrlKey : true;
      const matchesMeta = options.meta ? e.metaKey : true;
      const matchesShift = options.shift ? e.shiftKey : !e.shiftKey;
      const matchesAlt = options.alt ? e.altKey : !e.altKey;

      // For Cmd/Ctrl + K pattern, check if either ctrl OR meta is pressed
      const metaOrCtrl = options.ctrl && options.meta 
        ? (e.ctrlKey || e.metaKey) 
        : matchesCtrl && matchesMeta;

      if (matchesKey && metaOrCtrl && matchesShift && matchesAlt) {
        e.preventDefault();
        callback();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [options, callback]);
};

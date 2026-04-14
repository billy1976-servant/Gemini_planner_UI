import type React from "react";

/** True if the event target is (or is inside) a field where Space/Enter should not activate parent buttons/links. */
export function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  const el = target instanceof Element ? (target as HTMLElement) : null;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return el.closest("input, textarea, select, [contenteditable='true']") != null;
}

/**
 * Some handlers only inspect `e.target`; focus can differ in edge cases — also check `document.activeElement`.
 */
export function isKeyboardEventFromEditableField(e: { target: EventTarget | null }): boolean {
  if (isEditableKeyboardTarget(e.target)) return true;
  if (typeof document !== "undefined" && isEditableKeyboardTarget(document.activeElement)) return true;
  return false;
}

/** Prevent parent `role="button"` / global shortcuts from stealing Space or Enter while typing in form fields. */
export function stopSpaceEnterBubblingFromFormFields(e: React.KeyboardEvent): void {
  if ((e.key === " " || e.key === "Enter") && isKeyboardEventFromEditableField(e)) {
    e.stopPropagation();
  }
}

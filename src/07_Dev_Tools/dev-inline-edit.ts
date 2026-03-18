/**
 * Dev inline editing — click-to-edit text on /dev pages.
 * Persists edits in window.__DEV_TEXT_OVERRIDES__ for the session.
 */

const SELECTORS = "h1,h2,h3,h4,h5,h6,p,span,button,label";

declare global {
  interface Window {
    __DEV_TEXT_OVERRIDES__?: Record<string, string>;
  }
}

function attachBlurHandler(el: Element): void {
  el.addEventListener("blur", () => {
    const id =
      el.getAttribute("data-node-id") ||
      (el as HTMLElement).innerText.slice(0, 40).replace(/\s+/g, "-").toLowerCase();

    window.__DEV_TEXT_OVERRIDES__ = window.__DEV_TEXT_OVERRIDES__ || {};
    window.__DEV_TEXT_OVERRIDES__[id] = (el as HTMLElement).innerText;
  });
}

export function enableDevInlineEditing(): void {
  if (typeof window === "undefined") return;
  if (!window.location.pathname.startsWith("/dev")) return;

  document.querySelectorAll(SELECTORS).forEach((el) => {
    el.setAttribute("contenteditable", "true");
    el.classList.add("dev-inline-edit");
    attachBlurHandler(el);
  });
}

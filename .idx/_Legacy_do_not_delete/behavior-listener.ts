"use client";
/**
 * GLOBAL BEHAVIOR LISTENER — v1.1-restored (LOCKED CORE)
 * Single execution bridge between JSON intent and runtime behavior.
 *
 * ⚠️ NO DOMAIN LOGIC
 * ⚠️ NO JOURNAL KNOWLEDGE
 * ⚠️ PURE EVENT ROUTER
 */
let installed = false;


export function installBehaviorListener(
  navigate: (to: string) => void
) {
  if (installed) return;
  installed = true;


  /* =========================
     NAVIGATION
  ========================= */
  window.addEventListener("navigate", (e: any) => {
    const to = e.detail?.to;
    if (!to) {
      console.warn("[navigate] Missing destination");
      return;
    }
    navigate(to);
  });


  /* =========================
     ACTION → STATE / NAV
  ========================= */
  window.addEventListener("action", (e: any) => {
    // 🔑 IMPORTANT: behavior object is the detail
    const behavior = e.detail || {};
    const params = behavior.params || {};
    const actionName = params.name;
    const target = params.target;


    console.log("[action]", actionName, params);


    // STATE MUTATION BRIDGE
    if (actionName && actionName.startsWith("state:")) {
      const mutation = actionName.replace("state:", "");
      const { name: _drop, ...payload } = params;


      window.dispatchEvent(
        new CustomEvent("state-mutate", {
          detail: {
            name: mutation,
            ...payload,
          },
        })
      );
      return;
    }


    if (!actionName) {
      console.warn("[action] Missing action name");
      return;
    }


    // ACTION → NAVIGATE
    if (actionName === "navigate") {
      const to = params.to;
      if (!to) {
        console.warn("[action:navigate] Missing 'to'");
        return;
      }
      navigate(to);
      return;
    }


    // DEV VISUAL PROOF (optional)
    if (actionName === "visual-proof") {
      if (!target) return;
      const el = document.querySelector(
        `[data-node-id="${target}"]`
      ) as HTMLElement | null;
      if (!el) return;
      el.textContent = "IT WORKED";
      el.style.background = "green";
      el.style.color = "white";
      return;
    }


    console.warn("[action] Unhandled action:", actionName);
  });


  /* =========================
     INTERACTION (RESERVED)
  ========================= */
  window.addEventListener("interaction", () => {});
}



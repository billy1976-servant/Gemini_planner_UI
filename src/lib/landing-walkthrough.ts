/** Walkthrough / gated-step helpers for `LandingDeckRenderer` (JSON `walkthrough` + legacy `inlineControls`). */

export type WalkthroughInputDef =
  | {
      id: string;
      type: "select";
      label: string;
      options?: { value: string; label: string }[];
    }
  | {
      id: string;
      type: "number";
      label: string;
      min?: number;
      max?: number;
      step?: number;
      placeholder?: string;
    }
  | { id: string; type: "boolean"; label: string; trueLabel?: string }
  | { id: string; type: "text"; label: string; placeholder?: string };

export type WalkthroughScreenConfig = {
  inputs?: WalkthroughInputDef[];
  gate?: {
    required?: string[];
    message?: string;
  };
};

type ScreenGateSource = {
  walkthrough?: WalkthroughScreenConfig;
  inlineControls?: readonly string[];
};

export function mergeLandingWalkthroughValues(
  stepInputs: Record<string, unknown>,
  walkthroughExtra: Record<string, unknown>
): Record<string, unknown> {
  return { ...stepInputs, ...walkthroughExtra };
}

function legacyInlineSatisfied(control: string, stepInputs: Record<string, unknown>): boolean {
  switch (control) {
    case "containerLength":
      return stepInputs.containerLength != null && String(stepInputs.containerLength).length > 0;
    case "roofRibHeight":
      return typeof stepInputs.roofRibHeight === "number" && !Number.isNaN(stepInputs.roofRibHeight);
    case "ventFitVerified":
      return stepInputs.ventFitVerified === true;
    case "ventCount":
      return typeof stepInputs.ventCount === "number" && !Number.isNaN(stepInputs.ventCount);
    case "orderSizeConfirmed":
      return stepInputs.orderSizeConfirmed === true;
    default:
      return true;
  }
}

export function canAdvanceWalkthroughScreen(args: {
  screen: ScreenGateSource;
  stepInputs: Record<string, unknown>;
  walkthroughExtra: Record<string, unknown>;
}): { ok: true } | { ok: false; message: string } {
  const merged = mergeLandingWalkthroughValues(args.stepInputs, args.walkthroughExtra);
  const wt = args.screen.walkthrough;

  if (wt?.gate?.required?.length) {
    for (const id of wt.gate.required) {
      const v = merged[id];
      if (v == null || v === "" || v === false) {
        return {
          ok: false,
          message: wt.gate.message ?? "Please complete the required fields before continuing.",
        };
      }
    }
  }

  if (wt?.inputs?.length) {
    return { ok: true };
  }

  const controls = args.screen.inlineControls ?? [];
  for (const c of controls) {
    if (!legacyInlineSatisfied(c, args.stepInputs)) {
      return { ok: false, message: "Please complete this step before continuing." };
    }
  }

  return { ok: true };
}

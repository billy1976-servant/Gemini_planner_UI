import type { LandingDeckScreen } from "@/lib/landing-deck/schema";
import type { OutlineQuizSelect } from "@/lib/landing-deck/outline/types";

export function extractQuizSelectFromScreen(screen: LandingDeckScreen): OutlineQuizSelect | undefined {
  const w = screen.walkthrough;
  if (!w?.inputs?.length) return undefined;
  const first = w.inputs[0];
  if (first.type !== "select") return undefined;
  return {
    inputId: first.id,
    label: first.label,
    options: first.options,
    gateMessage: w.gate?.message,
  };
}

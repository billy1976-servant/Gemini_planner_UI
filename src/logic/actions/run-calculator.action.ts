import { getCalculator } from "@/logic/registries/calculator.registry";
import { runCalculators } from "@/logic/engines/calculator/calculator.engine";
import { dispatchState } from "@/state/state-store";


export function runCalculator(action: any, state: Record<string, any>) {
  const { calculatorId, inputKey, outputKey } = action;


  const calculator = getCalculator(calculatorId);
  if (!calculator) {
    console.error("[runCalculator] Calculator not found:", calculatorId);
    return;
  }


  const inputState = state[inputKey] ?? {};
  const results = runCalculators([calculator], inputState);


  // 🔴 EXISTING RESULT WRITE (unchanged)
  dispatchState("state.update", {
    key: outputKey,
    value: results[calculator.output],
  });


  // 🟢 PROOF MUTATION (NEW, ISOLATED, NON-DESTRUCTIVE)
  // This proves: JSON click → verb → action → state-store
  dispatchState("state.update", {
    key: "__proof.lastCalculatorRun",
    value: {
      calculatorId,
      inputKey,
      outputKey,
      timestamp: Date.now(),
    },
  });
}



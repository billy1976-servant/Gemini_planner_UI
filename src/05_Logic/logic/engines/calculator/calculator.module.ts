// src/logic/modules/calculator.module.ts
import { getCalculator } from "@/logic/registries/calculator.registry";
import { runCalculators } from "@/logic/engines/calculator/calculator.engine";


export function runCalculatorModule(config: {
  calculatorIds: string[];
  state: Record<string, any>;
}) {
  const calculators = config.calculatorIds.flatMap(id => {
    const cfg = getCalculator(id);
    return cfg.calculators;
  });


  return runCalculators(calculators, config.state);
}

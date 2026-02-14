// src/logic/modules/calculator.module.ts
import { getCalculator } from "@/logic/registries/calculator.registry";
import { runCalculators } from "@/logic/engines/calculator/calculator.engine";


type CalculatorConfig = { calculators: Array<{ id: string; output: string; [key: string]: any }> };

export function runCalculatorModule(config: {
  calculatorIds: string[];
  state: Record<string, any>;
}) {
  const calculators = config.calculatorIds.flatMap(id => {
    const cfg = getCalculator(id) as CalculatorConfig;
    return cfg.calculators;
  });


  return runCalculators(calculators, config.state);
}

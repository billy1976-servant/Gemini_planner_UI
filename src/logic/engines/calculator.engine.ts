// src/logic/engines/calculator.engine.ts


export type CalculatorDefinition = {
  id: string;
  inputs: string[];
  formula: string;
  output: string;
};


type CalculatorWrapper = {
  calculators: CalculatorDefinition[];
};


export function runCalculators(
  calculators: (CalculatorDefinition | CalculatorWrapper)[],
  state: Record<string, any>
): Record<string, number> {
  const results: Record<string, number> = {};


  for (const entry of calculators) {
    // 🔑 UNWRAP IF NEEDED
    const list: CalculatorDefinition[] =
      "calculators" in entry ? entry.calculators : [entry];


    for (const calc of list) {
      try {
        const args = calc.inputs.map(k => Number(state[k] ?? 0));
        const fn = new Function(...calc.inputs, `return ${calc.formula};`);
        results[calc.output] = Number(fn(...args)) || 0;
      } catch (err) {
        console.error("[calculator.engine] Failed:", calc.id, err);
        results[calc.output] = 0;
      }
    }
  }


  return results;
}



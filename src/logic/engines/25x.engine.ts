// src/logic/engines/25x.engine.ts


/**
 * ============================================================
 * 25X ENGINE — ACTION HANDLER (LOCKED)
 * ============================================================
 * Contract:
 * - Invoked ONLY via action-runner
 * - Mutates shared engine state
 * - NO internal state
 * ============================================================
 */


export function run25X(action: any, state: Record<string, any>) {
  const input = state?.calculatorInput;
  if (!input) return;


  const hours = Number(input.hours ?? 0);
  const wage = Number(input.hourlyWage ?? 0);


  const totalLoss = hours * wage * 25;


  state.calculatorResult = {
    hours,
    wage,
    totalLoss,
  };
}



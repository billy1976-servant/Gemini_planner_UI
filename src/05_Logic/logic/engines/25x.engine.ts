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
  // Try to get input from calculatorInput or directly from state
  const input = state?.calculatorInput ?? state;
  if (!input) {
    return {
      scoring: { score: 0 },
      calculatorResult: null,
    };
  }

  const hours = Number(input.hours ?? 0);
  const wage = Number(input.hourlyWage ?? 0);

  const totalLoss = hours * wage * 25;

  // Calculate intent score based on loss amount
  // Higher loss = higher intent (0-100 scale)
  // Formula: (totalLoss / 10000) * 100, capped at 100
  const intentScore = Math.min(100, Math.floor((totalLoss / 10000) * 100));

  const result = {
    hours,
    wage,
    totalLoss,
  };

  // Update state
  state.calculatorResult = result;

  // ✅ RETURN STRUCTURE with scoring for onboarding router
  return {
    scoring: {
      score: intentScore,
      totalLoss,
    },
    calculatorResult: result,
  };
}



// src/state/state.ts
/**
 * STATE TYPES — CANONICAL CONTRACT
 */


export type StateEvent = {
    id?: string;
    intent: string;
    payload?: any;
  };
  
  
  export type DerivedState = {
    journal: Record<string, string>;
    tasks: Record<string, any>;
    rawCount: number;
  };
  
// state/interaction.reducer.ts


export function reduceInteraction(state: any, payload: any) {
    state.interactions = state.interactions || [];
    state.interactions.push({
      ...payload,
      timestamp: Date.now(),
    });
  }
  
import { create } from 'zustand';

const useGaugeStore = create((set, get) => ({
  hitGauge: { left: 0, right: 0 },
  maxGauge: 100,
  gaugeIncreaseRate: 5,
  gaugeDrainRate: 1,
  headChargeDistance: 3.2,

  updateGauge: (hand, isCharging) => {
    set((state) => {
      let newGauge = { ...state.hitGauge };

      if (isCharging) {
        newGauge[hand] = Math.min(state.maxGauge, newGauge[hand] + state.gaugeIncreaseRate);
      } else {
        newGauge[hand] = Math.max(0, newGauge[hand] - state.gaugeDrainRate);
      }

      console.log(`${hand} gauge: ${newGauge[hand]}`);

      return { hitGauge: newGauge };
    });
  },

  resetGauge: (hand) => set((state) => ({
    hitGauge: { ...state.hitGauge, [hand]: 0 }
  })),

  getGaugeDamage: (hand) => {
    const state = get();
    return state.hitGauge[hand] / 10;
  },
}));

export default useGaugeStore;
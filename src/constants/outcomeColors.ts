// Colours for the verdict's "out of 100 worlds" split. A diverging scheme: good pole
// (the site accent), neutral grey midpoint, bad pole. The green/orange pair was checked
// with the dataviz palette validator and stays distinct under protanopia/deuteranopia
// (ΔE ≈ 15); the orange's low contrast on paper is covered by the visible count labels.
export const OUTCOME_COLORS = {
  better: '#2e6a31',
  less: '#b9b3a8',
  worse: '#d9822b',
} as const;

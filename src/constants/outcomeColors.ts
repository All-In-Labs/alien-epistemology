// Colours for the verdict's "out of 100 worlds" split. A diverging scheme: good pole
// (the site accent), neutral grey midpoint, bad pole. The green/orange pair was checked
// with the dataviz palette validator and stays distinct under protanopia/deuteranopia.
// All three clear the 3:1 non-text contrast minimum against the paper (#faf6ec):
// green 6.0, grey 3.1, orange 3.7.
export const OUTCOME_COLORS = {
  better: '#2e6a31',
  less: '#938c80',
  worse: '#c06a17',
} as const;

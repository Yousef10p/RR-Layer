/* Number formatting shared by charts and tables. Kept out of the chart module
   so that importing a formatter never pulls Recharts into the main bundle. */

/** Test MSE, always four decimals so columns line up. */
export const fmtMSE = (v) => (v === 0 ? "0.0000" : v.toFixed(4));

/** Log-axis tick: 0.001 -> "1e-3". */
export const logTick = (v) => {
  if (v >= 0.1) return v.toString();
  return `1e${Math.round(Math.log10(v))}`;
};

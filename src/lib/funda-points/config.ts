/**
 * Funda Puan business config.
 *
 * `earnRateBasisPoints` is 10% expressed as basis-points-of-10,000 (1000)
 * so `calculateEarnedPoints` (service.ts) never has to multiply by a
 * floating-point rate — see that file for the integer math.
 *
 * `redemptionValue` (the TL value of 1 Funda Puan when spent) has not been
 * decided by the business yet. Leave it undefined until it is — nothing in
 * this module may hard-code "1 point = 1 TL".
 */
export type FundaPointsConfig = {
  earnRateBasisPoints: number;
  redemptionValue?: number;
};

export const FUNDA_POINTS_CONFIG: FundaPointsConfig = {
  earnRateBasisPoints: 1000, // 10.00%
  redemptionValue: undefined,
};

export function getFundaPointsConfig(): FundaPointsConfig {
  return FUNDA_POINTS_CONFIG;
}

/** "10" — for display only ("%10 kazanım"), never used in the point math. */
export const FUNDA_POINTS_EARN_RATE_PERCENT_DISPLAY =
  FUNDA_POINTS_CONFIG.earnRateBasisPoints / 100;

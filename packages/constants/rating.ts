export const RATING_CONFIG = {
  INITIAL_RATING: 1500,
  INITIAL_RD: 350,
  INITIAL_VOLATILITY: 0.06,

  MIN_RATING: 1000,
  MIN_RD: 100,
  MAX_RD: 350,

  TAU: 0.5,
} as const;

export const TIERS = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'MASTER'] as const;
export type TierName = (typeof TIERS)[number];

// 브론즈: 400점 (하위 티어 넓게), 나머지: 200점씩
export const TIER_THRESHOLDS = {
  BRONZE: { min: 1000, max: 1399, divisionSize: 100 },
  SILVER: { min: 1400, max: 1599, divisionSize: 50 }, // 시작 점수 1500 = SILVER 2
  GOLD: { min: 1600, max: 1799, divisionSize: 50 },
  PLATINUM: { min: 1800, max: 1999, divisionSize: 50 },
  DIAMOND: { min: 2000, max: 2199, divisionSize: 50 },
  MASTER: { min: 2200, max: Infinity, divisionSize: 0 },
} as const;

export const DIVISIONS = [4, 3, 2, 1] as const;
export type Division = (typeof DIVISIONS)[number];

export function getTierFromRating(rating: number): { tier: TierName; division: Division } {
  const clampedRating = clampRating(rating);

  // 티어 찾기
  let tierName: TierName = 'BRONZE';
  for (const tier of TIERS) {
    const threshold = TIER_THRESHOLDS[tier];
    if (clampedRating >= threshold.min && clampedRating <= threshold.max) {
      tierName = tier;
      break;
    }
  }

  // Master 티어는 division 1 고정
  if (tierName === 'MASTER') {
    return { tier: 'MASTER', division: 1 };
  }

  // 4가 가장 낮고 1이 가장 높음
  const threshold = TIER_THRESHOLDS[tierName];
  const positionInTier = clampedRating - threshold.min;
  const divisionIndex = Math.min(3, Math.floor(positionInTier / threshold.divisionSize));
  const division = DIVISIONS[divisionIndex] as Division;

  return { tier: tierName, division };
}

// 레이팅 최저값 제한
export function clampRating(rating: number): number {
  return Math.max(RATING_CONFIG.MIN_RATING, rating);
}

export function getTierDisplayString(tier: TierName, division: Division): string {
  if (tier === 'MASTER') {
    return 'MASTER';
  }
  return `${tier} ${division}`;
}

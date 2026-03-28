import { UserScores } from '../models/Score';
import { User } from '../models/User';

/**
 * Generate 5 random numbers between 1-45 (no repeats)
 */
export function generateRandomDraw(): number[] {
  const pool = Array.from({ length: 45 }, (_, i) => i + 1);
  const result: number[] = [];
  for (let i = 0; i < 5; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result.sort((a, b) => a - b);
}

/**
 * Algorithmic draw: weighted by least/most frequent scores across all active users.
 * Numbers with fewer occurrences are MORE likely to be drawn (fairness model).
 */
export async function generateAlgorithmicDraw(): Promise<number[]> {
  const activeUsers = await User.find({ 'subscription.status': 'active' }).select('_id');
  const userIds = activeUsers.map((u) => u._id);

  const allScores = await UserScores.find({ user: { $in: userIds } });

  // Count frequency of each number (1-45)
  const freq: Record<number, number> = {};
  for (let i = 1; i <= 45; i++) freq[i] = 0;

  for (const userScore of allScores) {
    for (const s of userScore.scores) {
      freq[s.value] = (freq[s.value] || 0) + 1;
    }
  }

  // Invert frequency: less common = higher weight
  const maxFreq = Math.max(...Object.values(freq)) + 1;
  const weights = Object.entries(freq).map(([num, count]) => ({
    num: parseInt(num),
    weight: maxFreq - count,
  }));

  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  const drawn: number[] = [];

  while (drawn.length < 5) {
    let rand = Math.random() * totalWeight;
    for (const w of weights) {
      if (drawn.includes(w.num)) continue;
      rand -= w.weight;
      if (rand <= 0) {
        drawn.push(w.num);
        break;
      }
    }
  }

  return drawn.sort((a, b) => a - b);
}

/**
 * Calculate matches between a user's scores and drawn numbers.
 * Returns match count (0-5).
 */
export function calculateMatches(userScores: number[], drawnNumbers: number[]): number {
  const drawnSet = new Set(drawnNumbers);
  return userScores.filter((s) => drawnSet.has(s)).length;
}

/**
 * Calculate prize pool tiers from total amount.
 */
export function calculatePrizeTiers(total: number, jackpotRollover: number = 0) {
  return {
    total,
    jackpot: total * 0.4 + jackpotRollover,
    fourMatch: total * 0.35,
    threeMatch: total * 0.25,
    jackpotRolledOver: 0,
  };
}

/**
 * Subscription price per plan (in pence/cents).
 */
export const SUBSCRIPTION_PRICES = {
  monthly: 1999, // £19.99
  yearly: 19999, // £199.99 (~£16.67/month)
};

/**
 * Charity contribution from subscription price.
 */
export function calculateCharityContribution(subscriptionAmount: number, percentage: number): number {
  return Math.floor((subscriptionAmount * percentage) / 100);
}

/**
 * Prize pool contribution per subscriber (fixed % of subscription).
 */
export const PRIZE_POOL_PERCENTAGE = 0.3; // 30% goes to prize pool

export function calculatePrizePoolContribution(subscriptionAmount: number): number {
  return Math.floor(subscriptionAmount * PRIZE_POOL_PERCENTAGE);
}

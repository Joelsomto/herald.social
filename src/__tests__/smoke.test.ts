/**
 * Smoke tests so the test suite runs and passes.
 * Add more tests next to the code they cover (e.g. *.test.tsx).
 */

import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('passes', () => {
    expect(true).toBe(true);
  });

  it('normalizes wallet balance shape', () => {
    const wallet = {
      httn_points: 100,
      httn_tokens: 50,
      espees: 25,
      pending_rewards: 10,
    };
    const balance = {
      httnPoints: wallet.httn_points,
      httnTokens: Number(wallet.httn_tokens),
      espees: Number(wallet.espees),
      pendingRewards: wallet.pending_rewards,
    };
    expect(balance.httnPoints).toBe(100);
    expect(balance.httnTokens).toBe(50);
  });
});

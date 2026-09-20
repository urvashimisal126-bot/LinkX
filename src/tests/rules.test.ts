import { describe, it, expect } from 'vitest';
import {
  getLinkStrength,
  canMerge,
  calcRiskScore,
  getRiskTier,
  calcFreezeScore,
  getFreezeTier,
  RISK_SIGNAL_WEIGHTS,
  FREEZE_WEIGHTS,
} from '../domain/rules';
import type { IdentityLink } from '../domain/types';

// ─── getLinkStrength ────────────────────────────────────────
describe('getLinkStrength', () => {
  it('returns Strong for shared-imei', () => {
    expect(getLinkStrength('shared-imei')).toBe('Strong');
  });
  it('returns Strong for shared-upi-vpa', () => {
    expect(getLinkStrength('shared-upi-vpa')).toBe('Strong');
  });
  it('returns Moderate for same-public-ip-10min', () => {
    expect(getLinkStrength('same-public-ip-10min')).toBe('Moderate');
  });
  it('returns Moderate for identical-fanout-timing', () => {
    expect(getLinkStrength('identical-fanout-timing')).toBe('Moderate');
  });
  it('returns Weak for same-subnet-24', () => {
    expect(getLinkStrength('same-subnet-24')).toBe('Weak');
  });
  it('returns Weak for fuzzy-name-similarity', () => {
    expect(getLinkStrength('fuzzy-name-similarity')).toBe('Weak');
  });
  it('returns Weak for unknown rules', () => {
    expect(getLinkStrength('some-unknown-rule')).toBe('Weak');
  });
});

// ─── canMerge ───────────────────────────────────────────────
function makeLink(id: string, strength: IdentityLink['strength'], sourceA: string, sourceB: string, decision: IdentityLink['decision'] = 'candidate'): IdentityLink {
  return {
    id, entityA: 'A', entityB: 'B', strength,
    confidence: 0.9, rule: 'test', reason: 'test',
    evidenceRefs: [
      { exhibitId: sourceA, row: 1, field: 'test', excerpt: 'test' },
      { exhibitId: sourceB, row: 1, field: 'test', excerpt: 'test' },
    ],
    independentSources: 2, decision, decisionNote: null, decisionTime: null,
  };
}

describe('canMerge', () => {
  it('merges on a single Strong link', () => {
    const links = [makeLink('L1', 'Strong', 'E01', 'E02')];
    expect(canMerge(links)).toBe(true);
  });

  it('does NOT merge on a single Moderate link', () => {
    const links = [makeLink('L1', 'Moderate', 'E01', 'E02')];
    expect(canMerge(links)).toBe(false);
  });

  it('merges on two independent Moderate links from different sources', () => {
    const links = [
      makeLink('L1', 'Moderate', 'E01', 'E03'),
      makeLink('L2', 'Moderate', 'E02', 'E04'),
    ];
    expect(canMerge(links)).toBe(true);
  });

  it('does NOT merge on two Moderate links from the SAME source', () => {
    const links = [
      makeLink('L1', 'Moderate', 'E01', 'E01'),
      makeLink('L2', 'Moderate', 'E01', 'E01'),
    ];
    // Both exhibit IDs are 'E01' — not independent
    // After dedup, only 1 unique source
    expect(canMerge(links)).toBe(false);
  });

  it('does NOT merge on Weak links only', () => {
    const links = [
      makeLink('L1', 'Weak', 'E01', 'E02'),
      makeLink('L2', 'Weak', 'E03', 'E04'),
      makeLink('L3', 'Weak', 'E05', 'E06'),
    ];
    expect(canMerge(links)).toBe(false);
  });

  it('excludes dismissed links from merge consideration', () => {
    const strong = makeLink('L1', 'Strong', 'E01', 'E02', 'dismissed');
    expect(canMerge([strong])).toBe(false);
  });
});

// ─── calcRiskScore ──────────────────────────────────────────
describe('calcRiskScore', () => {
  it('returns 0 for no signals', () => {
    expect(calcRiskScore([])).toBe(0);
  });

  it('sums known signal weights correctly', () => {
    const score = calcRiskScore(['multi_hop_10min', 'passthrough_ratio_95']);
    expect(score).toBe(RISK_SIGNAL_WEIGHTS['multi_hop_10min'] + RISK_SIGNAL_WEIGHTS['passthrough_ratio_95']);
  });

  it('caps at 100', () => {
    const allSignals = Object.keys(RISK_SIGNAL_WEIGHTS);
    const score = calcRiskScore(allSignals);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('ignores unknown signal keys', () => {
    const score = calcRiskScore(['unknown_signal_xyz']);
    expect(score).toBe(0);
  });
});

// ─── getRiskTier ───────────────────────────────────────────
describe('getRiskTier', () => {
  it('Critical at 80+', () => expect(getRiskTier(80)).toBe('Critical'));
  it('Critical at 100', () => expect(getRiskTier(100)).toBe('Critical'));
  it('High at 60', () => expect(getRiskTier(60)).toBe('High'));
  it('High at 79', () => expect(getRiskTier(79)).toBe('High'));
  it('Medium at 40', () => expect(getRiskTier(40)).toBe('Medium'));
  it('Medium at 59', () => expect(getRiskTier(59)).toBe('Medium'));
  it('Low at 39', () => expect(getRiskTier(39)).toBe('Low'));
  it('Low at 0', () => expect(getRiskTier(0)).toBe('Low'));
});

// ─── calcFreezeScore ────────────────────────────────────────
describe('calcFreezeScore', () => {
  it('returns 100 for all-max inputs', () => {
    const score = calcFreezeScore({
      recoverability: 1, timeCriticality: 1,
      chainPosition: 1, linkConfidence: 1, activity: 1,
    });
    expect(score).toBe(100);
  });

  it('returns 0 for all-zero inputs', () => {
    const score = calcFreezeScore({
      recoverability: 0, timeCriticality: 0,
      chainPosition: 0, linkConfidence: 0, activity: 0,
    });
    expect(score).toBe(0);
  });

  it('weights sum to 100', () => {
    const sum = Object.values(FREEZE_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBe(100);
  });

  it('M3 score is highest (88 expected from mock)', () => {
    // Input values that produce ~88 for M3
    const score = calcFreezeScore({
      recoverability: 1,    // 35/35
      timeCriticality: 1,   // 25/25
      chainPosition: 0.8,   // 16/20
      linkConfidence: 0.8,  // 8/10
      activity: 0.4,        // 4/10
    });
    expect(score).toBeGreaterThan(80);
    expect(score).toBeLessThanOrEqual(100);
  });
});

// ─── getFreezeTier ─────────────────────────────────────────
describe('getFreezeTier', () => {
  it('Freeze now at 70+', () => expect(getFreezeTier(70)).toBe('Freeze now'));
  it('Freeze now at 100', () => expect(getFreezeTier(100)).toBe('Freeze now'));
  it('Freeze today at 40', () => expect(getFreezeTier(40)).toBe('Freeze today'));
  it('Freeze today at 69', () => expect(getFreezeTier(69)).toBe('Freeze today'));
  it('Monitor at 39', () => expect(getFreezeTier(39)).toBe('Monitor'));
  it('Monitor at 0', () => expect(getFreezeTier(0)).toBe('Monitor'));
});

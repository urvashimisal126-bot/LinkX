// ============================================================
// LinkX Rules Engine – pure functions, fully testable
// PRD sections 7.2, 7.3, 7.4, 7.5
// ============================================================

import type {
  IdentityLink,
  LinkStrength,
  LinkDecision,
  RiskTier,
  FreezeTier,
  RiskSignal,
  FreezeScoreFactor,
} from './types';

// ─── 7.2 Link strength ─────────────────────────────────────
/**
 * Classify an identity link's strength from its rule name.
 * Strong  = exact stable identifier match
 * Moderate = same public IP within ±10 min, or behavioural pattern
 * Weak    = /24 subnet, fuzzy name, same tower, similar amounts
 */
export function getLinkStrength(rule: string): LinkStrength {
  const strongRules = new Set([
    'shared-imei', 'shared-imsi', 'shared-upi-vpa',
    'shared-mac', 'shared-account-number', 'shared-registered-mobile',
  ]);
  const moderateRules = new Set([
    'same-public-ip-10min', 'identical-fanout-timing',
    'same-public-ip-session-overlap',
  ]);
  if (strongRules.has(rule)) return 'Strong';
  if (moderateRules.has(rule)) return 'Moderate';
  return 'Weak';
}

// ─── 7.3 Merge rule ────────────────────────────────────────
/**
 * Entities merge into a cluster only when:
 *   - at least one Strong link exists, OR
 *   - at least two independent Moderate links from different sources.
 * Weak links NEVER cause a merge.
 */
export function canMerge(links: IdentityLink[]): boolean {
  const relevant = links.filter(
    (l): l is IdentityLink & { decision: 'merged' | 'candidate' | 'accepted_lead' } =>
      l.decision !== 'dismissed'
  );

  const hasStrong = relevant.some(l => l.strength === 'Strong');
  if (hasStrong) return true;

  const moderates = relevant.filter(l => l.strength === 'Moderate');
  const hasIndependentModerates = moderates.length >= 2
    && new Set(moderates.flatMap(l => l.evidenceRefs.map(r => r.exhibitId))).size >= 2;

  return hasIndependentModerates;
}

/**
 * Return the decision a link should receive given its strength and context.
 * Only for computing initial decisions; overrides come from analyst actions.
 */
export function computeLinkDecision(
  strength: LinkStrength,
  allLinksForPair: IdentityLink[]
): LinkDecision {
  if (strength === 'Weak') return 'candidate';
  if (canMerge(allLinksForPair)) return 'merged';
  return 'candidate';
}

// ─── 7.4 Risk score ────────────────────────────────────────
export const RISK_SIGNAL_WEIGHTS: Record<string, number> = {
  multi_hop_10min:         25,
  passthrough_ratio_95:    20,
  sim_switch_3_in_7days:   15,
  spoofed_email_header:    15,
  spoofed_inbound_call:    10,
  proximity_to_cashout:    10,
  atm_withdrawal_rapid:    10,
  upi_passthrough:         10,
  high_tx_velocity:         8,
  linked_to_confirmed_mule: 7,
};

/**
 * Calculate a risk score (0–100) from an array of active signal keys.
 * Returns the score capped at 100.
 */
export function calcRiskScore(activeSignals: string[]): number {
  const sum = activeSignals.reduce(
    (acc, key) => acc + (RISK_SIGNAL_WEIGHTS[key] ?? 0),
    0
  );
  return Math.min(100, sum);
}

export function getRiskTier(score: number): RiskTier {
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

export function buildRiskSignals(activeSignalKeys: string[]): RiskSignal[] {
  return activeSignalKeys
    .filter(k => RISK_SIGNAL_WEIGHTS[k] !== undefined)
    .map(k => ({
      label: signalLabel(k),
      score: RISK_SIGNAL_WEIGHTS[k],
      detail: signalDetail(k),
    }));
}

function signalLabel(key: string): string {
  const labels: Record<string, string> = {
    multi_hop_10min:         'Multi-hop routing within 10 minutes',
    passthrough_ratio_95:    'Pass-through ratio above 95%',
    sim_switch_3_in_7days:   'SIM switching (3+ SIMs on one IMEI, 7 days)',
    spoofed_email_header:    'Spoofed email header (SPF fail)',
    spoofed_inbound_call:    'Spoofed inbound call',
    proximity_to_cashout:    'Proximity to cash-out node',
    atm_withdrawal_rapid:    'Rapid ATM withdrawals',
    upi_passthrough:         'UPI pass-through pattern',
    high_tx_velocity:        'High transaction velocity',
    linked_to_confirmed_mule: 'Linked to confirmed mule',
  };
  return labels[key] ?? key;
}

function signalDetail(key: string): string {
  const details: Record<string, string> = {
    multi_hop_10min:         'Funds forwarded through 2+ accounts within 10 minutes of receipt',
    passthrough_ratio_95:    'Debits exceed 95% of credits — typical pass-through mule behaviour',
    sim_switch_3_in_7days:   '4 different SIM cards observed on IMEI-1 in the 7 days before the fraud',
    spoofed_email_header:    'From address and Return-Path differ; SPF = fail',
    spoofed_inbound_call:    'Caller ID spoofed to appear as a known institution',
    proximity_to_cashout:    'One or two hops from a confirmed cash-out point',
    atm_withdrawal_rapid:    '₹2,00,000 withdrawn over two ATM transactions within minutes',
    upi_passthrough:         'UPI credit immediately followed by a larger debit',
    high_tx_velocity:        'More than 5 transactions in 15 minutes',
    linked_to_confirmed_mule: 'Shares a Strong identity link with a confirmed mule account',
  };
  return details[key] ?? '';
}

// ─── 7.5 Freeze priority score ─────────────────────────────
/**
 * Freeze score = 35×recoverability + 25×timeCriticality
 *              + 20×chainPosition + 10×linkConfidence + 10×activity
 * All inputs are 0–1 proportions; output is 0–100.
 */
export interface FreezeScoreInput {
  recoverability:   number;   // 0–1 (funds still in account / total at stake)
  timeCriticality:  number;   // 0–1 (recent outflow activity in last 15 min)
  chainPosition:    number;   // 0–1 (proximity to cashout, hub score)
  linkConfidence:   number;   // 0–1 (lowest confidence link to this case)
  activity:         number;   // 0–1 (tx velocity normalised)
}

export const FREEZE_WEIGHTS = {
  recoverability:  35,
  timeCriticality: 25,
  chainPosition:   20,
  linkConfidence:  10,
  activity:        10,
} as const;

export function calcFreezeScore(input: FreezeScoreInput): number {
  const raw =
    FREEZE_WEIGHTS.recoverability  * input.recoverability  +
    FREEZE_WEIGHTS.timeCriticality * input.timeCriticality +
    FREEZE_WEIGHTS.chainPosition   * input.chainPosition   +
    FREEZE_WEIGHTS.linkConfidence  * input.linkConfidence  +
    FREEZE_WEIGHTS.activity        * input.activity;
  return Math.round(Math.min(100, raw));
}

export function getFreezeTier(score: number): FreezeTier {
  if (score >= 70) return 'Freeze now';
  if (score >= 40) return 'Freeze today';
  return 'Monitor';
}

export function buildFreezeFactors(input: FreezeScoreInput): FreezeScoreFactor[] {
  return [
    {
      name: 'Recoverability',
      weight: FREEZE_WEIGHTS.recoverability,
      value: Math.round(FREEZE_WEIGHTS.recoverability * input.recoverability),
      description: 'Estimated funds remaining as proportion of amount at stake',
    },
    {
      name: 'Time-criticality',
      weight: FREEZE_WEIGHTS.timeCriticality,
      value: Math.round(FREEZE_WEIGHTS.timeCriticality * input.timeCriticality),
      description: 'Recent credit or outflow activity in the last 15 minutes',
    },
    {
      name: 'Chain position',
      weight: FREEZE_WEIGHTS.chainPosition,
      value: Math.round(FREEZE_WEIGHTS.chainPosition * input.chainPosition),
      description: 'Proximity to cash-out; hub receiving multiple victims',
    },
    {
      name: 'Link confidence',
      weight: FREEZE_WEIGHTS.linkConfidence,
      value: Math.round(FREEZE_WEIGHTS.linkConfidence * input.linkConfidence),
      description: 'Lowest confidence among links tying this entity to the case',
    },
    {
      name: 'Activity',
      weight: FREEZE_WEIGHTS.activity,
      value: Math.round(FREEZE_WEIGHTS.activity * input.activity),
      description: 'Transaction velocity score',
    },
  ];
}

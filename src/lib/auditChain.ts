// ============================================================
// Hash-chained append-only audit log
// ============================================================

import { hashString } from './sha256';
import type { AuditEntry } from '../domain/types';

let chain: AuditEntry[] = [];
let sequence = 0;

/**
 * Append a new entry to the audit chain.
 * Each entry includes a hash of the previous entry (chain linkage).
 */
export async function appendAudit(
  actor: 'system' | 'analyst',
  action: string,
  target: string,
  detail: string
): Promise<AuditEntry> {
  const previousHash = chain.length > 0 ? chain[chain.length - 1].hash : '0'.repeat(64);
  const time = new Date().toISOString();
  const payload = `${sequence}|${time}|${actor}|${action}|${target}|${detail}|${previousHash}`;
  const hash = await hashString(payload);

  const entry: AuditEntry = {
    sequence: sequence++,
    time,
    actor,
    action,
    target,
    detail,
    previousHash,
    hash,
  };
  chain.push(entry);
  return entry;
}

/**
 * Return a copy of the full audit chain.
 */
export function getAuditChain(): AuditEntry[] {
  return [...chain];
}

/**
 * Verify chain integrity: recompute each entry's hash and check linkage.
 * Returns true if intact.
 */
export async function checkChain(): Promise<{ intact: boolean; brokenAt: number | null }> {
  for (let i = 0; i < chain.length; i++) {
    const e = chain[i];
    const prevHash = i === 0 ? '0'.repeat(64) : chain[i - 1].hash;
    if (e.previousHash !== prevHash) {
      return { intact: false, brokenAt: e.sequence };
    }
    const payload = `${e.sequence}|${e.time}|${e.actor}|${e.action}|${e.target}|${e.detail}|${e.previousHash}`;
    const computed = await hashString(payload);
    if (computed !== e.hash) {
      return { intact: false, brokenAt: e.sequence };
    }
  }
  return { intact: true, brokenAt: null };
}

/**
 * Seed the chain from a pre-built array (used by MockApi to initialise system events).
 */
export function seedAuditChain(entries: AuditEntry[]): void {
  chain = [...entries];
  sequence = entries.length > 0 ? entries[entries.length - 1].sequence + 1 : 0;
}

export function clearAuditChain(): void {
  chain = [];
  sequence = 0;
}

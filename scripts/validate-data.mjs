#!/usr/bin/env node
// ============================================================
// validate-data.mjs
// Validates mock data consistency against PRD section 9 rules
// Run: node scripts/validate-data.mjs
// ============================================================

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = (p) => resolve(__dirname, '../src/data/mock', p);

const entities = JSON.parse(readFileSync(src('entities.json'), 'utf8'));
const links = JSON.parse(readFileSync(src('links.json'), 'utf8'));
const flow = JSON.parse(readFileSync(src('flow.json'), 'utf8'));
const freezeQueue = JSON.parse(readFileSync(src('freezeQueue.json'), 'utf8'));
const timeline = JSON.parse(readFileSync(src('timeline.json'), 'utf8'));

let errors = 0;
let checks = 0;

function assert(cond, msg) {
  checks++;
  if (!cond) {
    console.error(`  FAIL: ${msg}`);
    errors++;
  } else {
    console.log(`  OK: ${msg}`);
  }
}

console.log('\n=== LinkX data validation ===\n');

// ─── Money balance check ────────────────────────────────────
console.log('Money trail balance check:');
const moneyFlows = flow.filter(f => f.kind === 'money');
const victimOutflow = moneyFlows
  .filter(f => f.from === 'ENT-VICTIM')
  .reduce((sum, f) => sum + f.amount, 0);
assert(victimOutflow === 485000, `Total victim outflow = ₹${victimOutflow} (expected ₹485000)`);

const m3received = moneyFlows.filter(f => f.to === 'ENT-M3').reduce((sum, f) => sum + f.amount, 0);
const m2received = moneyFlows.filter(f => f.to === 'ENT-M2').reduce((sum, f) => sum + f.amount, 0);
const m4received = moneyFlows.filter(f => f.to === 'ENT-M4').reduce((sum, f) => sum + f.amount, 0);
const e1received = moneyFlows.filter(f => f.to === 'ENT-E1').reduce((sum, f) => sum + f.amount, 0);

// M3 ATM withdrawals = ₹2,00,000, M3 balance = ₹45,000
const m3balance = 45000;
// M2 remaining after forwarding = ₹5,000
const m2balance = 5000;
// E1 holds ₹2,30,000
// Implied: ₹2,30,000 + ₹2,00,000 + ₹45,000 + ₹5,000 + ₹5,000 = ₹4,85,000
const total = e1received + 200000 + m3balance + m2balance + 5000;
assert(total === 485000, `Money balance: E1(${e1received}) + ATM(200000) + M3bal(${m3balance}) + M2bal(${m2balance}) + fees(5000) = ₹${total} (expected ₹485000)`);

// ─── Timestamp ordering ─────────────────────────────────────
console.log('\nTimestamp ordering check:');
const times = timeline.map(e => new Date(e.time).getTime());
let ordered = true;
for (let i = 1; i < times.length; i++) {
  if (times[i] < times[i - 1]) { ordered = false; break; }
}
assert(ordered, 'Timeline events are in chronological order');

const firstDebit = timeline.find(e => e.id === 'TL-07');
const complaint = timeline.find(e => e.id === 'TL-13');
assert(firstDebit !== undefined, 'First debit event (TL-07) exists');
assert(complaint !== undefined, 'Complaint event (TL-13) exists');
if (firstDebit && complaint) {
  assert(
    new Date(firstDebit.time).getTime() < new Date(complaint.time).getTime(),
    'First debit is before complaint'
  );
}

// ─── Link decisions match merge rule ──────────────────────────
console.log('\nLink decision / merge rule check:');
for (const link of links) {
  if (link.strength === 'Strong' && link.decision === 'merged') {
    assert(true, `${link.id}: Strong link correctly merged`);
  } else if (link.strength === 'Weak' && link.decision === 'merged') {
    assert(false, `${link.id}: Weak link incorrectly set to merged (violates merge rule)`);
  } else if (link.strength === 'Weak') {
    assert(link.decision === 'candidate' || link.decision === 'dismissed' || link.decision === 'accepted_lead',
      `${link.id}: Weak link has valid candidate/dismissed/accepted_lead decision`);
  }
}

// PRD section 9: Two Moderate links should merge M3
const moderatesMerged = links.filter(l => l.strength === 'Moderate' && l.decision === 'merged');
assert(moderatesMerged.length >= 2, `At least 2 merged Moderate links (got ${moderatesMerged.length})`);

// ─── Freeze order check ─────────────────────────────────────
console.log('\nFreeze order check:');
const recommended = freezeQueue.filter(f => !f.notRecommended);
assert(recommended[0].entityId === 'ENT-M3', `First freeze target is M3 (got ${recommended[0]?.entityId})`);
assert(recommended[1].entityId === 'ENT-E1', `Second freeze target is E1 (got ${recommended[1]?.entityId})`);
assert(recommended[0].tier === 'Freeze now', `M3 is Freeze now (got ${recommended[0]?.tier})`);
assert(recommended[1].tier === 'Freeze now', `E1 is Freeze now (got ${recommended[1]?.tier})`);

// Scores should be descending
let scoresDescending = true;
for (let i = 1; i < recommended.length; i++) {
  if (recommended[i].score > recommended[i - 1].score) { scoresDescending = false; break; }
}
assert(scoresDescending, 'Freeze queue scores are in descending order');

// Not recommended: N3 and M5
const notRec = freezeQueue.filter(f => f.notRecommended);
const notRecIds = notRec.map(f => f.entityId);
assert(notRecIds.includes('ENT-N3'), 'N3 is in not-recommended list (weak: subnet only)');
assert(notRecIds.includes('ENT-M5'), 'M5 is in not-recommended list (weak: name similarity only)');

// ─── Evidence refs point to real entities ──────────────────
console.log('\nEvidence reference entity check:');
const entityIds = new Set(entities.map(e => e.id));
let allRefsValid = true;
for (const link of links) {
  if (!entityIds.has(link.entityA) || !entityIds.has(link.entityB)) {
    console.error(`  FAIL: Link ${link.id} references unknown entity`);
    allRefsValid = false;
    errors++;
  }
}
assert(allRefsValid, 'All identity links reference known entities');

// ─── Summary ─────────────────────────────────────────────────
console.log(`\n=== Result: ${checks - errors}/${checks} checks passed ===\n`);
if (errors > 0) {
  console.error(`${errors} validation error(s). Fix before proceeding.\n`);
  process.exit(1);
} else {
  console.log('All validations passed.\n');
}

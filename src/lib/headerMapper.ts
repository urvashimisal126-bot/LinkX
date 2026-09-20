// ============================================================
// Header mapper: source columns → canonical LinkX fields
// Uses synonym dict first, then fuzzy Levenshtein fallback
// ============================================================

import type { ColumnMapping } from '../domain/types';
import { CANONICAL_FIELDS } from '../domain/types';

// ─── Synonym dictionary ─────────────────────────────────────
// key = canonical field, values = known aliases (case-insensitive)
const SYNONYMS: Record<string, string[]> = {
  timestamp:        ['call_start', 'start time', 'txn date', 'value time', 'txn_ts', 'session_start', 'date', 'time', 'start_time'],
  party_a:          ['calling_no', 'msisdn', 'payer_vpa', 'from', 'a-party'],
  party_b:          ['called_no', 'b-party', 'payee_vpa', 'to', 'dest'],
  duration:         ['duration_sec', 'dur(s)', 'dur_s', 'duration_seconds', 'call_duration'],
  imei:             ['device imei', 'device_imei', 'imei_number'],
  imsi:             ['imsi_number'],
  cell_id:          ['cell_id', 'tower', 'cell id', 'site_id'],
  msisdn:           ['mobile_no', 'phone', 'mob_no', 'mobile'],
  public_ip:        ['public_ip', 'wan_ip', 'external_ip'],
  private_ip:       ['private_ip', 'lan_ip', 'internal_ip'],
  destination_ip:   ['dest_ip', 'dst_ip', 'destination'],
  payer_vpa:        ['payer_vpa', 'from_vpa', 'sender_vpa'],
  payee_vpa:        ['payee_vpa', 'to_vpa', 'receiver_vpa'],
  account_number:   ['account_no', 'acct_no', 'acc_no', 'account'],
  amount:           ['amt', 'amt_inr', 'amount_inr', 'debit', 'credit', 'value'],
  direction:        ['dr_cr', 'type', 'txn_type', 'debit_credit'],
  utr_rrn:          ['utr', 'rrn', 'ref_no', 'reference', 'txn_ref'],
  registered_mobile: ['reg_mobile', 'linked_mobile', 'linked_phone'],
  mac:              ['mac_address', 'mac_addr'],
  email_from:       ['from', 'sender', 'from_address'],
  return_path:      ['return-path', 'return_path', 'reply_to'],
  received_ip:      ['received_from_ip', 'originating_ip', 'received_ip'],
  spf_result:       ['spf', 'spf_check', 'spf_status'],
  package_name:     ['pkg_name', 'app_package', 'application_id'],
  permission:       ['permissions', 'perm', 'app_permissions'],
  install_time:     ['install_ts', 'installed_at', 'first_install'],
  narration:        ['remarks', 'description', 'particulars', 'narration_text'],
  balance:          ['closing_balance', 'bal', 'running_balance'],
  status:           ['txn_status', 'call_status', 'state'],
  session_start:    ['start_time', 'session_begin'],
  bytes:            ['data_vol', 'bytes_transferred', 'volume'],
};

// ─── Levenshtein distance ───────────────────────────────────
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[_\- ]/g, ' ').trim();
}

// ─── Map a single source column ─────────────────────────────
export function mapColumn(sourceCol: string, exhibitId: string, sampleValue = ''): ColumnMapping {
  const norm = normalize(sourceCol);

  // 1. Exact match on canonical field name
  for (const field of CANONICAL_FIELDS) {
    if (normalize(field) === norm) {
      return { evidenceId: exhibitId, sourceColumn: sourceCol, canonicalField: field, confidence: 1, method: 'exact', sampleValue };
    }
  }

  // 2. Synonym match
  for (const [field, synonyms] of Object.entries(SYNONYMS)) {
    for (const syn of synonyms) {
      if (normalize(syn) === norm) {
        return { evidenceId: exhibitId, sourceColumn: sourceCol, canonicalField: field as string, confidence: 0.95, method: 'synonym', sampleValue };
      }
    }
  }

  // 3. Fuzzy: find the canonical field with the smallest edit distance
  let bestField: string | null = null;
  let bestDist = Infinity;
  for (const field of CANONICAL_FIELDS) {
    const dist = levenshtein(norm, normalize(field));
    if (dist < bestDist) { bestDist = dist; bestField = field; }
  }
  // Also check synonym strings
  for (const [field, synonyms] of Object.entries(SYNONYMS)) {
    for (const syn of synonyms) {
      const dist = levenshtein(norm, normalize(syn));
      if (dist < bestDist) { bestDist = dist; bestField = field; }
    }
  }

  const maxLen = Math.max(norm.length, (bestField ? normalize(bestField).length : 1));
  const confidence = bestField ? Math.max(0, 1 - bestDist / maxLen) : 0;

  if (bestDist <= 3 && confidence >= 0.5) {
    return {
      evidenceId: exhibitId,
      sourceColumn: sourceCol,
      canonicalField: bestField,
      confidence: Math.round(confidence * 100) / 100,
      method: 'fuzzy',
      sampleValue,
    };
  }

  return { evidenceId: exhibitId, sourceColumn: sourceCol, canonicalField: null, confidence: 0, method: 'unmatched', sampleValue };
}

/**
 * Map all columns in a file header row.
 */
export function mapAllColumns(
  headers: string[],
  sampleRow: Record<string, string>,
  exhibitId: string
): ColumnMapping[] {
  return headers.map(h => mapColumn(h, exhibitId, sampleRow[h] ?? ''));
}

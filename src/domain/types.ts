// ============================================================
// LinkX Domain Types – from PRD section 8
// ============================================================

export type EntityType =
  | 'victim'
  | 'account'
  | 'phone'
  | 'device'
  | 'ip'
  | 'email_origin'
  | 'cash_out';

export type LinkStrength = 'Strong' | 'Moderate' | 'Weak';
export type LinkDecision = 'merged' | 'candidate' | 'accepted_lead' | 'dismissed';
export type RiskTier = 'Critical' | 'High' | 'Medium' | 'Low';
export type FreezeTier = 'Freeze now' | 'Freeze today' | 'Monitor';
export type FreezeAction = 'account_freeze' | 'exchange_hold' | 'sim_block' | 'imei_block';
export type FlowKind = 'money' | 'call' | 'sms' | 'session';
export type SourceType = 'cdr' | 'ipdr' | 'bank' | 'upi' | 'email' | 'android' | 'apk';
export type IntegrityStatus = 'verified' | 'mismatch' | 'pending' | 'tampered';
export type StepperStage =
  | 'Ingest' | 'Normalize' | 'Link' | 'Explain'
  | 'Graph' | 'Risk' | 'Freeze' | 'Timeline' | 'Verify' | 'Report';

// ─── Case ─────────────────────────────────────────────────
export interface Case {
  id: string;                     // e.g. LX-2026-0918-A
  title: string;
  complaintTime: string;          // ISO 8601 string
  caseClock: string;              // ISO 8601 reference time for the demo
  firstFraudulentDebitTime: string;
  amountAtStake: number;          // in INR paise? No – rupees (integer)
  narrative: string;              // 2–4 sentence generated summary
}

// ─── Evidence file ─────────────────────────────────────────
export interface EvidenceFile {
  exhibitId: string;              // E01, E02 …
  name: string;
  sourceType: SourceType;
  provider: string;               // Telecom A, Bank X …
  size: number;                   // bytes
  recordedHash: string;           // SHA-256 from manifest
  computedHash: string | null;    // computed by browser, null until verified
  status: IntegrityStatus;
  recordsParsed: number;
  recordsRejected: number;
  columns: ColumnMapping[];
}

// ─── Column mapping ────────────────────────────────────────
export interface ColumnMapping {
  evidenceId: string;
  sourceColumn: string;
  canonicalField: string | null;  // null = unmapped
  confidence: number;             // 0–1
  method: 'exact' | 'synonym' | 'fuzzy' | 'unmatched';
  sampleValue: string;
}

// ─── Entity ────────────────────────────────────────────────
export interface RiskSignal {
  label: string;
  score: number;       // points this signal contributes
  detail: string;
}

export interface Entity {
  id: string;
  type: EntityType;
  label: string;
  identifiers: Record<string, string>;   // e.g. { imei: '…', msisdn: '…' }
  clusterId: string | null;
  riskScore: number;   // 0–100
  riskTier: RiskTier;
  signals: RiskSignal[];
  evidenceRefs: EvidenceRef[];
  graphX?: number;
  graphY?: number;
}

// ─── Flow edge ─────────────────────────────────────────────
export interface FlowEdge {
  id: string;
  from: string;        // entity ID
  to: string;          // entity ID
  kind: FlowKind;
  amount?: number;     // INR, for money flows
  time: string;        // ISO 8601
  reference?: string;  // UTR / RRN / call ID
  evidenceRefs: EvidenceRef[];
}

// ─── Identity link ─────────────────────────────────────────
export interface IdentityLink {
  id: string;
  entityA: string;     // entity ID
  entityB: string;     // entity ID
  strength: LinkStrength;
  confidence: number;  // 0–1
  rule: string;        // e.g. 'shared-imei', 'same-public-ip-10min'
  reason: string;      // one-sentence human explanation
  evidenceRefs: EvidenceRef[];
  independentSources: number;
  decision: LinkDecision;
  decisionNote: string | null;
  decisionTime: string | null;
}

// ─── Cluster ────────────────────────────────────────────────
export interface Cluster {
  id: string;
  name: string;
  members: string[];   // entity IDs
  basisLinkIds: string[];
}

// ─── Freeze item ────────────────────────────────────────────
export interface FreezeScoreFactor {
  name: string;
  weight: number;      // e.g. 35
  value: number;       // actual value (0–weight)
  description: string;
}

export interface FreezeItem {
  entityId: string;
  action: FreezeAction;
  score: number;       // 0–100
  tier: FreezeTier;
  estimatedRemaining: number | null;  // INR, null if unknown
  lastOutflowTime: string | null;
  factors: FreezeScoreFactor[];
  reasons: string[];   // top 3 human-readable reasons
  status: 'pending' | 'drafted' | 'submitted';
  draftText?: string;
  notRecommended?: boolean;
  notRecommendedReason?: string;
}

// ─── Timeline event ─────────────────────────────────────────
export interface TimelineEvent {
  id: string;
  time: string;          // ISO 8601
  source: SourceType;
  entityIds: string[];
  title: string;
  detail: string;
  isKeyMoment: boolean;
  evidenceRefs: EvidenceRef[];
}

// ─── Audit entry ────────────────────────────────────────────
export interface AuditEntry {
  sequence: number;
  time: string;
  actor: string;         // 'system' | 'analyst'
  action: string;        // e.g. 'file_hashed', 'link_accepted', 'link_dismissed'
  target: string;        // entity ID or exhibit ID
  detail: string;
  previousHash: string;
  hash: string;
}

// ─── Evidence reference ─────────────────────────────────────
export interface EvidenceRef {
  exhibitId: string;
  row?: number;
  field?: string;
  excerpt?: string;
}

// ─── Graph data ─────────────────────────────────────────────
export interface GraphData {
  entities: Entity[];
  flowEdges: FlowEdge[];
  identityLinks: IdentityLink[];
}

// ─── API response types ──────────────────────────────────────
export interface IngestProgress {
  exhibitId: string;
  stage: 'hashing' | 'parsing' | 'normalizing' | 'extracting' | 'done' | 'error';
  percent: number;
  message: string;
}

export interface MappingResult {
  exhibitId: string;
  mappings: ColumnMapping[];
}

export interface RiskData {
  entities: Entity[];
  freezeQueue: FreezeItem[];
  notRecommended: FreezeItem[];
}

export interface BriefData {
  generator: string;
  case: Case;
  narrative: string;
  suspects: Entity[];
  clusters: Cluster[];
  freezeQueue: FreezeItem[];
  keyEvents: TimelineEvent[];
  evidenceFiles: EvidenceFile[];
  auditStatus: 'intact' | 'broken';
  generatedAt: string;
}

// ─── Canonical field names ───────────────────────────────────
export const CANONICAL_FIELDS = [
  'timestamp', 'party_a', 'party_b', 'duration', 'imei', 'imsi',
  'cell_id', 'msisdn', 'public_ip', 'private_ip', 'destination_ip',
  'payer_vpa', 'payee_vpa', 'account_number', 'amount', 'direction',
  'utr_rrn', 'registered_mobile', 'mac', 'email_from', 'return_path',
  'received_ip', 'spf_result', 'package_name', 'permission',
  'install_time', 'narration', 'balance', 'status',
] as const;

export type CanonicalField = typeof CANONICAL_FIELDS[number];

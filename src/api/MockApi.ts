// ============================================================
// MockApi – implements LinkXApi with pre-built mock data
// All async operations simulate realistic delays.
// ============================================================

import type { LinkXApi } from './LinkXApi';
import type {
  Case, EvidenceFile, ColumnMapping, Entity, IdentityLink,
  FlowEdge, Cluster, FreezeItem, TimelineEvent, AuditEntry,
  IngestProgress, GraphData, RiskData, BriefData,
} from '../domain/types';
import { appendAudit, getAuditChain } from '../lib/auditChain';
import { hashFile } from '../lib/sha256';

// Pre-import mock data
import caseData from '../data/mock/case.json';
import entitiesData from '../data/mock/entities.json';
import linksData from '../data/mock/links.json';
import flowData from '../data/mock/flow.json';
import freezeQueueData from '../data/mock/freezeQueue.json';
import timelineData from '../data/mock/timeline.json';
import evidenceFilesData from '../data/mock/evidenceFiles.json';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// State that changes during a session
let evidenceFiles: EvidenceFile[] = JSON.parse(JSON.stringify(evidenceFilesData));
let links: IdentityLink[] = JSON.parse(JSON.stringify(linksData));
let tamperActive = false;
let tamperedExhibitId: string | null = null;
let originalHash: string | null = null;

const CLUSTERS: Cluster[] = [
  {
    id: 'CLUSTER-OPERATOR',
    name: 'Operator cluster (N1/N2/M3/M4/E1)',
    members: ['ENT-N1', 'ENT-N2', 'ENT-M3', 'ENT-M4', 'ENT-E1', 'ENT-DEVICE', 'ENT-IP1', 'ENT-EMAIL'],
    basisLinkIds: ['LINK-N1-N2', 'LINK-M4-N2', 'LINK-M3-IP', 'LINK-M3-TIMING'],
  },
];

// ─── Real SHA-256 hashing of sample evidence files ────────
async function computeRealHashes(): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const fileNames = [
    'cdr_telecom_a_victim.csv', 'ipdr_telecom_a.csv',
    'bank_x_ledger_m1.csv', 'bank_z_ledger_m3.csv',
    'phish_email_header.eml', 'android_dump_victim.json',
    'apk_metadata.json',
  ];
  const exhibitIds = ['E01', 'E03', 'E04', 'E05', 'E07', 'E08', 'E09'];

  for (let i = 0; i < fileNames.length; i++) {
    try {
      const resp = await fetch(`./sample-evidence/${fileNames[i]}`);
      const buf = await resp.arrayBuffer();
      result[exhibitIds[i]] = await hashFile(buf);
    } catch {
      result[exhibitIds[i]] = 'fetch-error-' + exhibitIds[i];
    }
  }
  // XLSX files (E02, E06) – approximated
  result['E02'] = 'xlsx-not-fetched-e02';
  result['E06'] = 'xlsx-not-fetched-e06';
  return result;
}

export const MockApi: LinkXApi = {
  async loadSampleCase(onProgress) {
    tamperActive = false;
    tamperedExhibitId = null;
    originalHash = null;
    evidenceFiles = JSON.parse(JSON.stringify(evidenceFilesData));
    links = JSON.parse(JSON.stringify(linksData));

    // Compute real SHA-256 hashes
    const realHashes = await computeRealHashes();

    const stages: Array<[string, IngestProgress['stage'], number, string]> = [];
    for (const ef of evidenceFiles) {
      stages.push([ef.exhibitId, 'hashing',     20, `Computing SHA-256 for ${ef.name}`]);
      stages.push([ef.exhibitId, 'parsing',     50, `Parsing ${ef.name}`]);
      stages.push([ef.exhibitId, 'normalizing', 80, `Normalizing columns in ${ef.name}`]);
      stages.push([ef.exhibitId, 'extracting', 100, `Extracting entities from ${ef.name}`]);
    }

    for (const [exhibitId, stage, percent, message] of stages) {
      await delay(120);
      onProgress({ exhibitId, stage, percent, message });

      if (stage === 'hashing') {
        const ef = evidenceFiles.find(e => e.exhibitId === exhibitId);
        if (ef && realHashes[exhibitId]) {
          ef.recordedHash = realHashes[exhibitId];
          ef.computedHash = realHashes[exhibitId];
          ef.status = 'verified';
        }
      }
      if (stage === 'done' || stage === 'extracting') {
        await appendAudit('system', 'file_processed', exhibitId, `${exhibitId} ingested and entity extraction complete`);
      }
    }

    await appendAudit('system', 'case_loaded', 'LX-2026-0918-A', 'Sample case loaded: 9 exhibit files ingested');
    return caseData as Case;
  },

  async ingest(files, onProgress) {
    const newFiles: EvidenceFile[] = [];
    for (const file of files) {
      const exhibitId = `E${String(evidenceFiles.length + newFiles.length + 1).padStart(2, '0')}`;
      onProgress({ exhibitId, stage: 'hashing', percent: 20, message: `Hashing ${file.name}` });
      await delay(200);
      const hash = await hashFile(file);
      onProgress({ exhibitId, stage: 'parsing', percent: 50, message: `Parsing ${file.name}` });
      await delay(300);
      onProgress({ exhibitId, stage: 'normalizing', percent: 80, message: `Normalizing ${file.name}` });
      await delay(200);
      onProgress({ exhibitId, stage: 'extracting', percent: 100, message: `Done: ${file.name}` });

      const ef: EvidenceFile = {
        exhibitId,
        name: file.name,
        sourceType: 'bank',
        provider: 'User upload',
        size: file.size,
        recordedHash: hash,
        computedHash: hash,
        status: 'verified',
        recordsParsed: 0,
        recordsRejected: 0,
        columns: [],
      };
      newFiles.push(ef);
      await appendAudit('analyst', 'file_uploaded', exhibitId, `${file.name} uploaded and hashed`);
    }
    evidenceFiles = [...evidenceFiles, ...newFiles];
    return newFiles;
  },

  async getMappings() {
    await delay(50);
    return evidenceFiles.flatMap(ef => ef.columns) as ColumnMapping[];
  },

  async getEntities() {
    await delay(50);
    return entitiesData as unknown as Entity[];
  },

  async getLinks() {
    await delay(50);
    return links as IdentityLink[];
  },

  async decideLink(linkId, decision, note) {
    await delay(100);
    const link = links.find(l => l.id === linkId);
    if (!link) throw new Error(`Link ${linkId} not found`);
    link.decision = decision;
    link.decisionNote = note;
    link.decisionTime = new Date().toISOString();
    await appendAudit('analyst', `link_${decision}`, linkId, `Analyst ${decision} link ${linkId}: ${note}`);
    return link;
  },

  async getFlow() {
    await delay(50);
    return {
      entities: entitiesData as unknown as Entity[],
      flowEdges: flowData as unknown as FlowEdge[],
      identityLinks: links as unknown as IdentityLink[],
    } as GraphData;
  },

  async getRisk() {
    await delay(50);
    const all = freezeQueueData as unknown as FreezeItem[];
    return {
      entities: entitiesData as unknown as Entity[],
      freezeQueue: all.filter(f => !f.notRecommended),
      notRecommended: all.filter(f => f.notRecommended),
    } as RiskData;
  },

  async getFreezeQueue() {
    await delay(50);
    return (freezeQueueData as unknown as FreezeItem[]).filter(f => !f.notRecommended);
  },

  async draftFreezeRequest(entityId) {
    await delay(200);
    const ef = evidenceFiles;
    const entity = (entitiesData as unknown as Entity[]).find(e => e.id === entityId);
    const item = (freezeQueueData as unknown as FreezeItem[]).find(f => f.entityId === entityId);
    if (!entity || !item) return 'Entity not found';

    const fileHashes = ef.slice(0, 3).map(e => `  ${e.exhibitId}: ${e.name} — SHA-256: ${e.recordedHash}`).join('\n');
    const draft = `FREEZE REQUEST DRAFT — Case LX-2026-0918-A
Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
Status: DRAFT — NOT SENT

To: Nodal Officer, ${entity.label}
Re: Urgent Account Freeze / Hold Request under CrPC Section 102

Case Reference: LX-2026-0918-A
Target: ${entity.label}
Identifiers: ${Object.entries(entity.identifiers).map(([k, v]) => `${k}=${v}`).join(', ')}
Action Requested: ${item.action.replace('_', ' ').toUpperCase()}
Freeze Score: ${item.score}/100 (Tier: ${item.tier})
Estimated Remaining: ${item.estimatedRemaining != null ? `₹${item.estimatedRemaining.toLocaleString('en-IN')}` : 'Unknown'}

Grounds:
${item.reasons.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Supporting Evidence (SHA-256 verified):
${fileHashes}

This is a system-generated draft. The investigating officer must review, sign and submit through official channels. Nothing has been sent automatically.
`;
    await appendAudit('analyst', 'freeze_drafted', entityId, `Freeze request drafted for ${entity.label}`);
    return draft;
  },

  async getTimeline() {
    await delay(50);
    return timelineData as TimelineEvent[];
  },

  async verifyIntegrity() {
    await delay(300);
    const realHashes = await computeRealHashes();
    for (const ef of evidenceFiles) {
      const computed = realHashes[ef.exhibitId] ?? ef.computedHash;
      ef.computedHash = computed;
      if (tamperActive && ef.exhibitId === tamperedExhibitId) {
        ef.computedHash = 'tampered-hash-' + ef.exhibitId;
        ef.status = 'mismatch';
      } else if (computed && ef.recordedHash && computed !== 'xlsx-not-fetched-' + ef.exhibitId.toLowerCase()) {
        ef.status = computed === ef.recordedHash ? 'verified' : 'mismatch';
      }
    }
    await appendAudit('analyst', 'integrity_verified', 'ALL', 'SHA-256 recomputed for all evidence files');
    return [...evidenceFiles];
  },

  async getAudit() {
    await delay(50);
    return getAuditChain();
  },

  async buildBrief() {
    await delay(200);
    return {
      generator: 'LinkX',
      case: caseData as unknown as Case,
      narrative: (caseData as unknown as Case).narrative,
      suspects: (entitiesData as unknown as Entity[]).filter(e => e.clusterId === 'CLUSTER-OPERATOR'),
      clusters: CLUSTERS,
      freezeQueue: (freezeQueueData as unknown as FreezeItem[]).filter(f => !f.notRecommended),
      keyEvents: (timelineData as unknown as TimelineEvent[]).filter(e => e.isKeyMoment),
      evidenceFiles: [...evidenceFiles],
      auditStatus: 'intact' as const,
      generatedAt: new Date().toISOString(),
    } as BriefData;
  },

  async getEvidenceFiles() {
    await delay(50);
    return [...evidenceFiles];
  },
};

// ─── Tamper simulation helpers (used by Integrity screen) ──
export function simulateTamper(exhibitId: string): void {
  const ef = evidenceFiles.find(e => e.exhibitId === exhibitId);
  if (!ef) return;
  tamperActive = true;
  tamperedExhibitId = exhibitId;
  originalHash = ef.recordedHash;
}

export function restoreTamper(): void {
  if (!tamperedExhibitId || !originalHash) return;
  const ef = evidenceFiles.find(e => e.exhibitId === tamperedExhibitId);
  if (ef) {
    ef.computedHash = originalHash;
    ef.status = 'verified';
  }
  tamperActive = false;
  tamperedExhibitId = null;
  originalHash = null;
}

export function isTamperActive(): boolean {
  return tamperActive;
}

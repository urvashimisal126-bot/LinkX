// ============================================================
// HttpApi – stub that calls the FastAPI backend
// Swap MockApi for HttpApi in src/main.tsx to connect to backend.
// REST base URL configured via VITE_API_URL env variable.
// ============================================================

import type { LinkXApi } from './LinkXApi';
import type {
  Case, EvidenceFile, ColumnMapping, Entity, IdentityLink,
  FlowEdge, Cluster, FreezeItem, TimelineEvent, AuditEntry,
  IngestProgress, GraphData, RiskData, BriefData,
} from '../domain/types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

export const HttpApi: LinkXApi = {
  async loadSampleCase(onProgress) {
    // POST /api/cases/sample — SSE stream for progress
    onProgress({ exhibitId: 'E01', stage: 'hashing', percent: 0, message: 'Connecting to engine…' });
    return api<Case>('/api/cases/sample', { method: 'POST' });
  },

  async ingest(files, onProgress) {
    const form = new FormData();
    for (const f of files) form.append('files', f);
    onProgress({ exhibitId: 'upload', stage: 'hashing', percent: 0, message: 'Uploading…' });
    return api<EvidenceFile[]>('/api/ingest', { method: 'POST', body: form, headers: {} });
  },

  async getMappings() {
    return api<ColumnMapping[]>('/api/mappings');
  },

  async getEntities() {
    return api<Entity[]>('/api/entities');
  },

  async getLinks() {
    return api<IdentityLink[]>('/api/links');
  },

  async decideLink(linkId, decision, note) {
    return api<IdentityLink>(`/api/links/${linkId}/decision`, {
      method: 'PATCH',
      body: JSON.stringify({ decision, note }),
    });
  },

  async getFlow() {
    return api<GraphData>('/api/graph');
  },

  async getRisk() {
    return api<RiskData>('/api/risk');
  },

  async getFreezeQueue() {
    return api<FreezeItem[]>('/api/freeze-queue');
  },

  async draftFreezeRequest(entityId) {
    const res = await api<{ text: string }>(`/api/freeze-queue/${entityId}/draft`, { method: 'POST' });
    return res.text;
  },

  async getTimeline() {
    return api<TimelineEvent[]>('/api/timeline');
  },

  async verifyIntegrity() {
    return api<EvidenceFile[]>('/api/integrity/verify', { method: 'POST' });
  },

  async getAudit() {
    return api<AuditEntry[]>('/api/audit');
  },

  async buildBrief() {
    return api<BriefData>('/api/brief');
  },

  async getEvidenceFiles() {
    return api<EvidenceFile[]>('/api/evidence');
  },
};

// Suppress unused import warnings for type-only exports
export type { FlowEdge, Cluster };

// ============================================================
// LinkXApi – the API boundary between UI and engine
// All methods are async. UI screens call ONLY these methods.
//
// Replace MockApi with HttpApi to connect to the FastAPI backend.
// REST endpoint documented per method below.
// ============================================================

import type {
  Case,
  EvidenceFile,
  ColumnMapping,
  Entity,
  IdentityLink,
  FlowEdge,
  Cluster,
  FreezeItem,
  TimelineEvent,
  AuditEntry,
  IngestProgress,
  GraphData,
  RiskData,
  BriefData,
} from '../domain/types';

export interface LinkXApi {
  /**
   * Load the built-in sample case from public/sample-evidence/.
   * Runs ingest → normalize → link pipeline on mock data.
   * Calls onProgress for each file as it is processed.
   * REST: POST /api/cases/sample
   */
  loadSampleCase(
    onProgress: (p: IngestProgress) => void
  ): Promise<Case>;

  /**
   * Ingest one or more user-dropped files.
   * REST: POST /api/ingest  (multipart/form-data)
   */
  ingest(
    files: File[],
    onProgress: (p: IngestProgress) => void
  ): Promise<EvidenceFile[]>;

  /**
   * Get column mappings for the current case's evidence files.
   * REST: GET /api/mappings
   */
  getMappings(): Promise<ColumnMapping[]>;

  /**
   * Get all extracted entities.
   * REST: GET /api/entities
   */
  getEntities(): Promise<Entity[]>;

  /**
   * Get all identity links (merged and candidates).
   * REST: GET /api/links
   */
  getLinks(): Promise<IdentityLink[]>;

  /**
   * Analyst decision on a weak link: accept as lead or dismiss.
   * Writes to the audit log.
   * REST: PATCH /api/links/:id/decision
   */
  decideLink(
    linkId: string,
    decision: 'accepted_lead' | 'dismissed',
    note: string
  ): Promise<IdentityLink>;

  /**
   * Get graph data (entities + flow edges + identity links).
   * REST: GET /api/graph
   */
  getFlow(): Promise<GraphData>;

  /**
   * Get risk data: scored entities, freeze queue, not-recommended list.
   * REST: GET /api/risk
   */
  getRisk(): Promise<RiskData>;

  /**
   * Get the freeze queue ordered by freeze score.
   * REST: GET /api/freeze-queue
   */
  getFreezeQueue(): Promise<FreezeItem[]>;

  /**
   * Draft a freeze/hold/block request for an entity.
   * Returns the draft text; does NOT send anything.
   * REST: POST /api/freeze-queue/:entityId/draft
   */
  draftFreezeRequest(entityId: string): Promise<string>;

  /**
   * Get the unified chronological timeline.
   * REST: GET /api/timeline
   */
  getTimeline(): Promise<TimelineEvent[]>;

  /**
   * Verify SHA-256 of all evidence files.
   * REST: POST /api/integrity/verify
   */
  verifyIntegrity(): Promise<EvidenceFile[]>;

  /**
   * Get the hash-chained audit log.
   * REST: GET /api/audit
   */
  getAudit(): Promise<AuditEntry[]>;

  /**
   * Build the investigative brief (for report screen).
   * REST: GET /api/brief
   */
  buildBrief(): Promise<BriefData>;

  /**
   * Get a specific evidence file by exhibit ID.
   * REST: GET /api/evidence/:exhibitId
   */
  getEvidenceFiles(): Promise<EvidenceFile[]>;
}

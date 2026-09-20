// ============================================================
// Global Zustand store — case state shared across all screens
// ============================================================

import { create } from 'zustand';
import type {
  Case, EvidenceFile, Entity, IdentityLink, FlowEdge,
  FreezeItem, TimelineEvent, AuditEntry, IngestProgress, StepperStage,
} from '../domain/types';
import { MockApi } from '../api/MockApi';

export const API = MockApi; // swap to HttpApi for backend

interface CaseStore {
  // Loading state
  isLoaded: boolean;
  isLoading: boolean;
  loadError: string | null;
  ingestProgress: IngestProgress[];
  activeStage: StepperStage;

  // Case data
  caseData: Case | null;
  evidenceFiles: EvidenceFile[];
  entities: Entity[];
  links: IdentityLink[];
  flowEdges: FlowEdge[];
  freezeQueue: FreezeItem[];
  notRecommended: FreezeItem[];
  timeline: TimelineEvent[];
  auditChain: AuditEntry[];

  // UI state
  selectedEntityId: string | null;
  selectedLinkId: string | null;
  inspectorOpen: boolean;
  systemDrawerOpen: boolean;

  // Actions
  loadSampleCase: () => Promise<void>;
  refreshLinks: () => Promise<void>;
  refreshFreezeQueue: () => Promise<void>;
  refreshAudit: () => Promise<void>;
  refreshEvidence: () => Promise<void>;
  setSelectedEntity: (id: string | null) => void;
  setSelectedLink: (id: string | null) => void;
  setInspectorOpen: (open: boolean) => void;
  setSystemDrawerOpen: (open: boolean) => void;
  setActiveStage: (stage: StepperStage) => void;
}

export const useCaseStore = create<CaseStore>((set, get) => ({
  isLoaded: false,
  isLoading: false,
  loadError: null,
  ingestProgress: [],
  activeStage: 'Ingest',

  caseData: null,
  evidenceFiles: [],
  entities: [],
  links: [],
  flowEdges: [],
  freezeQueue: [],
  notRecommended: [],
  timeline: [],
  auditChain: [],

  selectedEntityId: null,
  selectedLinkId: null,
  inspectorOpen: false,
  systemDrawerOpen: false,

  loadSampleCase: async () => {
    set({ isLoading: true, loadError: null, ingestProgress: [], activeStage: 'Ingest' });
    try {
      const caseData = await API.loadSampleCase((p) => {
        set(s => ({
          ingestProgress: [
            ...s.ingestProgress.filter(x => !(x.exhibitId === p.exhibitId && x.stage === p.stage)),
            p,
          ],
        }));
      });
      set({ activeStage: 'Normalize' });
      const [entities, links, flow, risk, timeline, auditChain, evidenceFiles] = await Promise.all([
        API.getEntities(),
        API.getLinks(),
        API.getFlow(),
        API.getRisk(),
        API.getTimeline(),
        API.getAudit(),
        API.getEvidenceFiles(),
      ]);
      set({
        caseData,
        entities,
        links,
        flowEdges: flow.flowEdges,
        freezeQueue: risk.freezeQueue,
        notRecommended: risk.notRecommended,
        timeline,
        auditChain,
        evidenceFiles,
        isLoaded: true,
        isLoading: false,
        activeStage: 'Report',
      });
    } catch (e) {
      set({ loadError: String(e), isLoading: false });
    }
  },

  refreshLinks: async () => {
    const links = await API.getLinks();
    set({ links });
  },

  refreshFreezeQueue: async () => {
    const risk = await API.getRisk();
    set({ freezeQueue: risk.freezeQueue, notRecommended: risk.notRecommended });
  },

  refreshAudit: async () => {
    const auditChain = await API.getAudit();
    set({ auditChain });
  },

  refreshEvidence: async () => {
    const evidenceFiles = await API.getEvidenceFiles();
    set({ evidenceFiles });
  },

  setSelectedEntity: (id) => set({ selectedEntityId: id, selectedLinkId: null, inspectorOpen: id !== null }),
  setSelectedLink: (id) => set({ selectedLinkId: id, selectedEntityId: null, inspectorOpen: id !== null }),
  setInspectorOpen: (open) => set({ inspectorOpen: open }),
  setSystemDrawerOpen: (open) => set({ systemDrawerOpen: open }),
  setActiveStage: (stage) => set({ activeStage: stage }),
}));

// External request counter (for System panel)
export function getExternalRequestCount(): number {
  try {
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    return entries.filter(e => {
      try {
        const url = new URL(e.name);
        return url.origin !== window.location.origin &&
          !url.hostname.includes('w3.org') &&
          !url.hostname.includes('localhost');
      } catch { return false; }
    }).length;
  } catch { return 0; }
}

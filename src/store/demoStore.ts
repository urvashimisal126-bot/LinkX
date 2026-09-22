import { create } from 'zustand';
import { sampleCase, exhibits, entities, flowEdges, freezeQueue, timelineEvents } from '../data/sampleCase';

export const caseBundle = { ...sampleCase, exhibits, entities, flowEdges, freezeQueue, timelineEvents };
type DemoStore = {
  caseData: typeof caseBundle | null;
  recommendations: string[];
  loadSampleCase: () => void;
  recommend: (id: string) => void;
};
export const useDemoStore = create<DemoStore>((set) => ({
  caseData: null, recommendations: [],
  loadSampleCase: () => set({ caseData: caseBundle, recommendations: [] }),
  recommend: (id) => set(s => ({ recommendations: [...new Set([...s.recommendations, id])] })),
}));

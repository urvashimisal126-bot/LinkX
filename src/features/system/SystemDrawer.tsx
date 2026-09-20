import { useEffect, useState } from 'react';
import { getExternalRequestCount } from '../../store/caseStore';

const PIPELINE = [
  { name: 'Parser', desc: 'CSV/XLSX/EML/JSON → normalized rows', tech: 'papaparse, xlsx, custom EML parser' },
  { name: 'Normalizer', desc: 'Column mapping → canonical schema', tech: 'Synonym dict + Levenshtein fuzzy match' },
  { name: 'Linker', desc: 'Entity extraction + identity link scoring', tech: 'Rule engine (rules.ts), 6 link rules' },
  { name: 'Graph builder', desc: 'Cytoscape.js node/edge elements', tech: 'cytoscape, custom layout' },
  { name: 'Scorer', desc: 'Risk score + freeze priority ranking', tech: 'calcRiskScore, calcFreezeScore (rules.ts)' },
  { name: 'Brief generator', desc: 'A4 report + JSON export', tech: 'window.print(), Blob API' },
];

export default function SystemDrawer() {
  const [extCount, setExtCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setExtCount(getExternalRequestCount());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ padding: 16 }}>
      {/* Local mode statement */}
      <div style={{ padding: '10px 12px', background: 'var(--verified-tint)', border: '1px solid var(--verified)', borderRadius: 2, marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--verified)', marginBottom: 4 }}>Running locally</div>
        <div style={{ fontSize: 12, color: 'var(--ink)', lineHeight: 1.5 }}>
          LinkX runs entirely in your browser. No case data, evidence files, or analyst decisions
          are transmitted to any server. All computation (hashing, scoring, graph layout) runs offline.
        </div>
      </div>

      {/* External request counter */}
      <div style={{ padding: '10px 12px', background: extCount === 0 ? 'var(--canvas)' : 'var(--critical-tint)', border: `1px solid ${extCount === 0 ? 'var(--border)' : 'var(--critical)'}`, borderRadius: 2, marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: extCount === 0 ? 'var(--ink)' : 'var(--critical)', marginBottom: 4 }}>
          External network requests this session: {extCount}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          {extCount === 0
            ? 'No cross-origin requests detected. Tool is operating offline as expected.'
            : `${extCount} cross-origin requests detected. Review browser network tab for details.`}
        </div>
      </div>

      {/* Pipeline overview */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Processing pipeline</div>
        {PIPELINE.map((stage, i) => (
          <div key={stage.name} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
            <div style={{
              width: 24, height: 24, borderRadius: 2, background: 'var(--accent)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0,
            }}>{i + 1}</div>
            <div>
              <div style={{ fontWeight: 500, fontSize: 13 }}>{stage.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{stage.desc}</div>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{stage.tech}</div>
            </div>
            {i < PIPELINE.length - 1 && (
              <div style={{ width: 24, display: 'flex', justifyContent: 'center', paddingTop: 24, flexShrink: 0 }}>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


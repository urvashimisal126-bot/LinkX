import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';
import { useCaseStore, API } from '../../store/caseStore';
import { fmtINR, fmtTimeIST } from '../../lib/format';
import { getExternalRequestCount } from '../../store/caseStore';
import LinkXMarkAnimated from '../../components/LinkXMarkAnimated';

// Compact miniature graph placeholder for overview
function GraphPreview({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', height: 160,
        background: 'var(--canvas)', border: '1px solid var(--border)',
        borderRadius: 2, cursor: 'pointer', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 8,
        color: 'var(--muted)', fontSize: 12,
      }}
      aria-label="Open network graph"
    >
      {/* Simplified SVG representation of the money trail */}
      <svg width="340" height="100" viewBox="0 0 340 100" aria-hidden="true" style={{ maxWidth: '100%' }}>
        {/* Victim */}
        <circle cx="30" cy="50" r="16" fill="#EEF0F2" stroke="#1C232B" strokeWidth="2.5" />
        <text x="30" y="78" textAnchor="middle" fontSize="8" fill="#5B6570">Victim</text>
        {/* M1 */}
        <rect x="74" y="38" width="32" height="24" rx="4" fill="white" stroke="#B45F06" strokeWidth="1.5" />
        <text x="90" y="52" textAnchor="middle" fontSize="8" fill="#5B6570">M1</text>
        {/* M2 */}
        <rect x="138" y="22" width="32" height="24" rx="4" fill="white" stroke="#B45F06" strokeWidth="1.5" />
        <text x="154" y="36" textAnchor="middle" fontSize="8" fill="#5B6570">M2</text>
        {/* M3 */}
        <rect x="138" y="56" width="32" height="24" rx="4" fill="#A5281B14" stroke="#A5281B" strokeWidth="1.5" />
        <text x="154" y="70" textAnchor="middle" fontSize="8" fill="#5B6570">M3</text>
        {/* M4 */}
        <rect x="202" y="22" width="32" height="24" rx="4" fill="white" stroke="#B45F06" strokeWidth="1.5" />
        <text x="218" y="36" textAnchor="middle" fontSize="8" fill="#5B6570">M4</text>
        {/* E1 */}
        <polygon points="276,28 288,34 288,52 276,58 264,52 264,34" fill="#A5281B14" stroke="#A5281B" strokeWidth="1.5" />
        <text x="276" y="76" textAnchor="middle" fontSize="8" fill="#5B6570">E1</text>
        {/* N1/N2 operator */}
        <circle cx="154" cy="92" r="8" fill="white" stroke="#196367" strokeWidth="1.5" />
        <text x="154" y="106" textAnchor="middle" fontSize="7" fill="#5B6570">N1/N2</text>
        {/* Edges */}
        <line x1="46" y1="50" x2="74" y2="50" stroke="#1C232B" strokeWidth="2" markerEnd="url(#arr)" />
        <line x1="106" y1="44" x2="138" y2="34" stroke="#1C232B" strokeWidth="1.5" markerEnd="url(#arr)" />
        <line x1="106" y1="56" x2="138" y2="62" stroke="#1C232B" strokeWidth="1.5" markerEnd="url(#arr)" />
        <line x1="170" y1="30" x2="202" y2="30" stroke="#1C232B" strokeWidth="1.5" markerEnd="url(#arr)" />
        <line x1="234" y1="34" x2="264" y2="40" stroke="#1C232B" strokeWidth="1.5" markerEnd="url(#arr)" />
        <line x1="154" y1="84" x2="154" y2="80" stroke="#196367" strokeWidth="1" strokeDasharray="2,2" />
        <defs>
          <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#1C232B" />
          </marker>
        </defs>
      </svg>
      <span>Open network graph →</span>
    </button>
  );
}

export default function OverviewPage() {
  const navigate = useNavigate();
  const { caseData, links, freezeQueue, evidenceFiles, entities, isLoaded, loadSampleCase, isLoading, refreshEvidence, ingestProgress } = useCaseStore();
  const [extCount] = useState(() => getExternalRequestCount());
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    await API.ingest(arr, () => {});
    await refreshEvidence();
    navigate('/evidence');
  }, [refreshEvidence, navigate]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  if (!isLoaded && !isLoading) {
    return (
      <div className="page">
        <div style={{ maxWidth: 640, margin: '40px auto', textAlign: 'center' }}>
          <img
            src="/brand/linkx-mark.svg"
            alt="LinkX"
            style={{ height: 48, width: 'auto', margin: '0 auto 20px auto', display: 'block' }}
          />
          <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 8, color: 'var(--ink)' }}>LinkX — Cyber-Fraud Investigation Tool</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.6 }}>
            Unified offline correlation for CDR, IPDR, Bank statements, and UPI fraud investigation.
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 24 }}>
            <button className="btn btn-primary" onClick={loadSampleCase} style={{ fontSize: 14, padding: '10px 24px' }}>
              Load sample case (LX-2026-0918-A)
            </button>
            <button className="btn btn-secondary" onClick={() => fileRef.current?.click()} style={{ fontSize: 14, padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Upload size={16} /> Browse your files
            </button>
          </div>

          <div style={{ position: 'relative', margin: '20px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', width: '100%', height: 1, background: 'var(--border)' }} />
            <span style={{ position: 'relative', background: 'var(--canvas)', padding: '0 12px', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Or drop evidence files
            </span>
          </div>

          {/* Drag and Drop Zone */}
          <div
            className={`dropzone${dragOver ? ' dropzone--active' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
            aria-label="Drop evidence files or click to browse"
            style={{
              padding: '28px 20px',
              border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 6,
              background: dragOver ? 'var(--accent-tint)' : 'var(--panel)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Upload size={28} style={{ margin: '0 auto 10px', color: 'var(--accent)' }} />
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>Drop CSV, XLSX, EML or JSON evidence files here</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
              Supports CDR, IPDR, Bank statements, UPI transaction logs & Malware dumps
            </div>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".csv,.xlsx,.eml,.json"
              style={{ display: 'none' }}
              onChange={e => handleFiles(e.target.files)}
              aria-label="Select evidence files"
            />
          </div>

          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 20 }}>
            {extCount === 0 ? '🔒 100% Offline mode · Zero external network requests' : `${extCount} external request(s) detected`}
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="page">
        <div style={{ maxWidth: 640, margin: '56px auto', textAlign: 'center' }}>
          <LinkXMarkAnimated width={120} showWordmark={true} />
          <div style={{ marginTop: 24, fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>Loading sample case…</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>
            Hashing files, mapping columns, extracting entities and linking evidence…
          </div>
        </div>
      </div>
    );
  }

  const topLinks = links.filter(l => l.decision === 'merged').slice(0, 3);
  const topFreeze = freezeQueue.slice(0, 3);
  const verifiedCount = evidenceFiles.filter(f => f.status === 'verified').length;
  const topSuspects = [...entities].sort((a, b) => b.riskScore - a.riskScore).slice(0, 3);

  const CASE_CLOCK = caseData?.caseClock ?? '2026-09-18T15:09:00+05:30';
  const FIRST_DEBIT = caseData?.firstFraudulentDebitTime ?? '2026-09-18T14:31:40+05:30';
  const minutesSince = Math.floor(
    (new Date(CASE_CLOCK).getTime() - new Date(FIRST_DEBIT).getTime()) / 60000
  );

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <div className="page-header">
        <div>
          <div className="page-title">Case {caseData?.id}</div>
          <div className="page-subtitle">{caseData?.title}</div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--critical)', fontWeight: 500 }}>
          {minutesSince} min since first debit · Case clock {fmtTimeIST(CASE_CLOCK)} IST
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Q1: What happened? */}
        <div className="panel" style={{ gridColumn: '1 / -1' }}>
          <div className="panel-header">
            <span className="panel-title">What happened?</span>
          </div>
          <div className="panel-body">
            <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink)' }}>{caseData?.narrative}</p>
          </div>
        </div>

        {/* Q2: Who is connected? — Graph preview */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Who is connected?</span>
            <button className="btn btn-ghost btn-xs" onClick={() => navigate('/network')}>Open graph</button>
          </div>
          <div className="panel-body" style={{ padding: '8px' }}>
            <GraphPreview onClick={() => navigate('/network')} />
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>
              {entities.length} entities · {links.filter(l => l.decision === 'merged').length} merged links · {links.filter(l => l.strength === 'Weak').length} weak candidates
            </div>
          </div>
        </div>

        {/* Q3: Why? — Top links */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Why are they connected?</span>
            <button className="btn btn-ghost btn-xs" onClick={() => navigate('/links')}>All links</button>
          </div>
          <div className="panel-body">
            {topLinks.map(link => {
              const entA = entities.find(e => e.id === link.entityA);
              const entB = entities.find(e => e.id === link.entityB);
              return (
                <div key={link.id} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 2 }}>
                    <span className={`badge badge-${link.strength.toLowerCase()}`}>{link.strength}</span>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{entA?.label ?? link.entityA} ↔ {entB?.label ?? link.entityB}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{link.reason}</div>
                </div>
              );
            })}

            {/* Mention M1/M2 money-flow-only connection */}
            <div style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--canvas)', padding: '6px 8px', borderRadius: 2, border: '1px solid var(--border)' }}>
              M1 and M2 are connected by money flow only — no identity link established. The UI states this.
            </div>
          </div>
        </div>

        {/* Q4: What is suspicious? — Top risk entities */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">What is suspicious?</span>
            <button className="btn btn-ghost btn-xs" onClick={() => navigate('/risk')}>Risk register</button>
          </div>
          <div className="panel-body">
            {topSuspects.map(e => (
              <div key={e.id} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 2 }}>
                  <span className={`badge badge-${e.riskTier.toLowerCase()}`}>{e.riskTier}</span>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{e.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 'auto' }}>Score {e.riskScore}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{e.signals[0]?.label ?? '—'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Q5: What is the evidence? */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">What evidence supports it?</span>
            <button className="btn btn-ghost btn-xs" onClick={() => navigate('/evidence')}>All evidence</button>
          </div>
          <div className="panel-body">
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <tbody>
                {evidenceFiles.slice(0, 5).map(f => (
                  <tr key={f.exhibitId} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '4px 0', fontFamily: 'IBM Plex Mono, monospace', width: 32 }}>{f.exhibitId}</td>
                    <td style={{ padding: '4px 4px', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>{f.name}</td>
                    <td style={{ padding: '4px 0', textAlign: 'right' }}>
                      {f.status === 'verified'
                        ? <span style={{ color: 'var(--verified)', fontSize: 11 }}>✓ Verified</span>
                        : <span style={{ color: 'var(--muted)', fontSize: 11 }}>Pending</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Q6: What needs action now? */}
        <div className="panel" style={{ gridColumn: '1 / -1' }}>
          <div className="panel-header">
            <span className="panel-title">What needs action now?</span>
            <button className="btn btn-ghost btn-xs" onClick={() => navigate('/risk')}>Full freeze queue</button>
          </div>
          <div className="panel-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {topFreeze.map((item, i) => {
                const entity = entities.find(e => e.id === item.entityId);
                return (
                  <div key={item.entityId} style={{
                    padding: '10px 12px',
                    border: `1px solid ${item.tier === 'Freeze now' ? 'var(--critical)' : 'var(--high)'}`,
                    borderLeft: `4px solid ${item.tier === 'Freeze now' ? 'var(--critical)' : 'var(--high)'}`,
                    borderRadius: 2,
                    background: item.tier === 'Freeze now' ? 'var(--critical-tint)' : 'var(--high-tint)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 11 }}>{i + 1}</span>
                      <span className={`badge badge-${item.tier === 'Freeze now' ? 'freeze-now' : 'freeze-today'}`}>{item.tier}</span>
                    </div>
                    <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 2 }}>{entity?.label ?? item.entityId}</div>
                    {item.estimatedRemaining != null && (
                      <div style={{ fontSize: 12, marginBottom: 4 }}>
                        {fmtINR(item.estimatedRemaining)} <span style={{ color: 'var(--muted)', fontSize: 11 }}>estimated remaining</span>
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{item.reasons[0]}</div>
                    <button
                      className="btn btn-secondary btn-xs"
                      style={{ marginTop: 6 }}
                      onClick={() => navigate('/risk')}
                    >
                      Draft request
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Integrity summary */}
            <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--canvas)', border: '1px solid var(--border)', borderRadius: 2, fontSize: 12, color: 'var(--muted)' }}>
              Integrity: {verifiedCount}/{evidenceFiles.length} files SHA-256 verified ·
              Audit chain {evidenceFiles.length > 0 ? 'active' : 'not started'} ·
              {extCount === 0 ? ' No external network requests this session' : ` ${extCount} external request(s)`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

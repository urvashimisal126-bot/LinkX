import { useState } from 'react';
import { Printer, Download } from 'lucide-react';
import { useCaseStore, API } from '../../store/caseStore';
import type { BriefData } from '../../domain/types';
import { fmtINR, fmtIST, fmtHash } from '../../lib/format';
import { checkChain } from '../../lib/auditChain';

export default function ReportPage() {
  const { isLoaded } = useCaseStore();
  const [brief, setBrief] = useState<BriefData | null>(null);
  const [loading, setLoading] = useState(false);
  const [auditIntact, setAuditIntact] = useState<boolean | null>(null);

  const generate = async () => {
    setLoading(true);
    const [data, chainRes] = await Promise.all([
      API.buildBrief(),
      checkChain(),
    ]);
    setAuditIntact(chainRes.intact);
    setBrief(data);
    setLoading(false);
  };

  const downloadJSON = () => {
    if (!brief) return;
    const blob = new Blob([JSON.stringify(brief, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LinkX-brief-${brief.case.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isLoaded) {
    return (
      <div className="page">
        <div className="page-header"><div className="page-title">Report</div></div>
        <div className="empty-state"><div className="empty-state__title">No case loaded</div></div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header no-print">
        <div>
          <div className="page-title">Investigative brief</div>
          <div className="page-subtitle">A4 preview · printable offline · JSON export</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!brief && (
            <button className="btn btn-secondary btn-sm" onClick={generate} disabled={loading}>
              {loading ? 'Generating…' : 'Generate brief'}
            </button>
          )}
          {brief && (
            <>
              <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
                <Printer size={14} /> Print / Save as PDF
              </button>
              <button className="btn btn-secondary btn-sm" onClick={downloadJSON}>
                <Download size={14} /> Download JSON
              </button>
            </>
          )}
        </div>
      </div>

      {!brief && !loading && (
        <div className="empty-state">
          <div className="empty-state__title">Brief not generated</div>
          <div className="empty-state__desc">Click "Generate brief" to build the A4 investigative brief from the current case data.</div>
        </div>
      )}

      {brief && (
        <div id="report-preview" style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          maxWidth: 800,
          margin: '0 auto',
          padding: '40px 48px',
          boxShadow: 'var(--shadow-drawer)',
        }}>
          {/* Header */}
          <div style={{ borderBottom: '2px solid var(--ink)', paddingBottom: 12, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--ink)' }}>
                  Investigative Brief
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                  Case {brief.case.id} · Generated {fmtIST(brief.generatedAt)}
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--muted)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <img
                    src="/brand/linkx-mark.svg"
                    alt="LinkX"
                    style={{ height: 20, width: 'auto', display: 'block' }}
                  />
                  <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>LinkX</span>
                </div>
                <div>Forensic integrity verified</div>
                <div>Local mode — no cloud services</div>
              </div>
            </div>
          </div>

          {/* Case summary */}
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>Case summary</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12, fontSize: 13 }}>
              <div><span style={{ color: 'var(--muted)' }}>Case ID: </span>{brief.case.id}</div>
              <div><span style={{ color: 'var(--muted)' }}>Complaint time: </span>{fmtIST(brief.case.complaintTime)}</div>
              <div><span style={{ color: 'var(--muted)' }}>Amount at stake: </span><strong>{fmtINR(brief.case.amountAtStake)}</strong></div>
              <div><span style={{ color: 'var(--muted)' }}>First fraudulent debit: </span>{fmtIST(brief.case.firstFraudulentDebitTime)}</div>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink)' }}>{brief.narrative}</p>
          </section>

          {/* Prime suspects */}
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>
              Prime suspects ({brief.suspects.length})
            </h2>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--muted)', fontWeight: 600, fontSize: 11 }}>Entity</th>
                  <th style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--muted)', fontWeight: 600, fontSize: 11 }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--muted)', fontWeight: 600, fontSize: 11 }}>Risk</th>
                  <th style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--muted)', fontWeight: 600, fontSize: 11 }}>Top signal</th>
                </tr>
              </thead>
              <tbody>
                {brief.suspects.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '4px 8px', fontWeight: 500 }}>{s.label}</td>
                    <td style={{ padding: '4px 8px', color: 'var(--muted)', textTransform: 'capitalize' }}>{s.type.replace('_', ' ')}</td>
                    <td style={{ padding: '4px 8px' }}>
                      <span style={{ fontWeight: 600 }}>{s.riskScore}</span>
                      <span style={{ marginLeft: 4, color: 'var(--muted)' }}>({s.riskTier})</span>
                    </td>
                    <td style={{ padding: '4px 8px', color: 'var(--muted)', fontSize: 11 }}>{s.signals[0]?.label ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Clusters */}
          {brief.clusters.map(cluster => (
            <section key={cluster.id} style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>
                Cluster: {cluster.name}
              </h2>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                Members: {cluster.members.length} entities · Basis links: {cluster.basisLinkIds.join(', ')}
              </div>
            </section>
          ))}

          {/* Freeze recommendations */}
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>
              Freeze recommendations
            </h2>
            {brief.freezeQueue.map((item, i) => (
              <div key={item.entityId} style={{ marginBottom: 8, padding: '6px 10px', background: item.tier === 'Freeze now' ? 'var(--critical-tint)' : item.tier === 'Freeze today' ? 'var(--high-tint)' : 'var(--canvas)', borderRadius: 2, borderLeft: `3px solid ${item.tier === 'Freeze now' ? 'var(--critical)' : item.tier === 'Freeze today' ? 'var(--high)' : 'var(--border-s)'}`, fontSize: 12 }}>
                <span style={{ fontWeight: 600 }}>{i + 1}. {item.entityId}</span>
                <span style={{ marginLeft: 8, color: 'var(--muted)' }}>{item.tier} · Score {item.score}</span>
                {item.estimatedRemaining != null && (
                  <span style={{ marginLeft: 8 }}>Est. remaining: <strong>{fmtINR(item.estimatedRemaining)}</strong></span>
                )}
                <div style={{ color: 'var(--muted)', marginTop: 2 }}>{item.reasons[0]}</div>
              </div>
            ))}
          </section>

          {/* Key event timeline */}
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>
              Key events
            </h2>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--muted)', fontWeight: 600, fontSize: 11, width: 120 }}>Time (IST)</th>
                  <th style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--muted)', fontWeight: 600, fontSize: 11 }}>Event</th>
                </tr>
              </thead>
              <tbody>
                {brief.keyEvents.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '4px 8px', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>{fmtIST(e.time)}</td>
                    <td style={{ padding: '4px 8px' }}>{e.title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Integrity block */}
          <section style={{ marginBottom: 0, padding: '12px 16px', background: 'var(--canvas)', border: '1px solid var(--border)', borderRadius: 2 }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Evidence integrity</h2>
            <div style={{ fontSize: 12, marginBottom: 8 }}>
              <span style={{ color: auditIntact ? 'var(--verified)' : 'var(--critical)', fontWeight: 500 }}>
                Audit chain: {auditIntact ? 'Intact' : 'Broken — integrity suspect'}
              </span>
            </div>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', fontFamily: 'IBM Plex Mono, monospace' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', color: 'var(--muted)', fontWeight: 600, padding: '2px 6px' }}>Exhibit</th>
                  <th style={{ textAlign: 'left', color: 'var(--muted)', fontWeight: 600, padding: '2px 6px' }}>File</th>
                  <th style={{ textAlign: 'left', color: 'var(--muted)', fontWeight: 600, padding: '2px 6px' }}>SHA-256 (recorded)</th>
                  <th style={{ textAlign: 'left', color: 'var(--muted)', fontWeight: 600, padding: '2px 6px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {brief.evidenceFiles.map(f => (
                  <tr key={f.exhibitId}>
                    <td style={{ padding: '2px 6px' }}>{f.exhibitId}</td>
                    <td style={{ padding: '2px 6px' }}>{f.name}</td>
                    <td style={{ padding: '2px 6px' }}>{fmtHash(f.recordedHash)}</td>
                    <td style={{ padding: '2px 6px', color: f.status === 'verified' ? 'var(--verified)' : f.status === 'mismatch' ? 'var(--critical)' : 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
                      {f.status === 'verified' ? 'Verified' : f.status === 'mismatch' ? 'Mismatch' : 'Pending'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </div>
  );
}

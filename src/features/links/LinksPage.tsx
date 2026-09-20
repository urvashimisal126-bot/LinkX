import { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useCaseStore, API } from '../../store/caseStore';
import type { IdentityLink } from '../../domain/types';
import { appendAudit } from '../../lib/auditChain';

function StrengthBadge({ strength }: { strength: IdentityLink['strength'] }) {
  const cls = strength === 'Strong' ? 'badge-strong' : strength === 'Moderate' ? 'badge-moderate' : 'badge-weak';
  return <span className={`badge ${cls}`}>{strength}</span>;
}

function DecisionBadge({ decision }: { decision: IdentityLink['decision'] }) {
  if (decision === 'merged') return <span className="badge badge-verified">Merged</span>;
  if (decision === 'accepted_lead') return <span className="badge badge-strong">Analyst-confirmed lead</span>;
  if (decision === 'dismissed') return <span className="badge badge-low">Dismissed</span>;
  return <span className="badge badge-moderate">Candidate</span>;
}

function LinkRow({ link, onDecide }: { link: IdentityLink; onDecide: (id: string, d: 'accepted_lead' | 'dismissed', note: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [note, setNote] = useState('');
  const { entities } = useCaseStore();

  const entA = entities.find(e => e.id === link.entityA);
  const entB = entities.find(e => e.id === link.entityB);

  const isWeak = link.strength === 'Weak';
  const isPending = link.decision === 'candidate';

  const handleDecide = (d: 'accepted_lead' | 'dismissed') => {
    if (!note.trim() && d === 'accepted_lead') { alert('Please enter a note for the record.'); return; }
    onDecide(link.id, d, note || 'No note');
    setDeciding(false);
  };

  return (
    <>
      <tr
        className={expanded ? 'expanded' : ''}
        style={{ cursor: 'pointer' }}
        onClick={() => setExpanded(p => !p)}
        aria-expanded={expanded}
      >
        <td>{expanded ? <ChevronDown size={14} color="var(--muted)" /> : <ChevronRight size={14} color="var(--muted)" />}</td>
        <td><StrengthBadge strength={link.strength} /></td>
        <td>
          <span style={{ fontWeight: 500 }}>{entA?.label ?? link.entityA}</span>
          <span style={{ color: 'var(--muted)', margin: '0 6px' }}>↔</span>
          <span style={{ fontWeight: 500 }}>{entB?.label ?? link.entityB}</span>
        </td>
        <td style={{ color: 'var(--muted)', fontSize: 12 }}>{link.rule}</td>
        <td style={{ fontSize: 12 }}>{Math.round(link.confidence * 100)}%</td>
        <td style={{ fontSize: 12 }}>{link.evidenceRefs.length}</td>
        <td style={{ fontSize: 12 }}>{link.independentSources}</td>
        <td><DecisionBadge decision={link.decision} /></td>
      </tr>
      {expanded && (
        <tr className="expand-row">
          <td colSpan={8} style={{ padding: 0 }}>
            <div style={{ padding: '12px 16px', background: 'var(--canvas)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 12 }}>
                {/* Why linked */}
                <div>
                  <div className="inspector-section-label">Why linked</div>
                  <p style={{ fontSize: 13, lineHeight: 1.5 }}>{link.reason}</p>
                </div>
                {/* Evidence */}
                <div>
                  <div className="inspector-section-label">Evidence</div>
                  {link.evidenceRefs.map((ref, i) => (
                    <div key={i} style={{ fontSize: 12, marginBottom: 4, background: 'var(--panel)', padding: '6px 8px', borderRadius: 2, border: '1px solid var(--border)' }}>
                      <span className="mono">{ref.exhibitId}</span>
                      {ref.row && <span style={{ color: 'var(--muted)', marginLeft: 6 }}>row {ref.row}</span>}
                      {ref.field && <span style={{ color: 'var(--muted)', marginLeft: 6 }}>· {ref.field}</span>}
                      {ref.excerpt && <div style={{ color: 'var(--ink)', marginTop: 2 }}>{ref.excerpt}</div>}
                    </div>
                  ))}
                </div>
                {/* Merge logic */}
                <div>
                  <div className="inspector-section-label">Merge logic</div>
                  {link.strength === 'Strong' && (
                    <div style={{ color: 'var(--verified)', fontSize: 12 }}>
                      Strong link (stable identifier) — entities merged into cluster automatically.
                    </div>
                  )}
                  {link.strength === 'Moderate' && link.decision === 'merged' && (
                    <div style={{ color: 'var(--accent)', fontSize: 12 }}>
                      Two independent Moderate links from different sources — merge rule satisfied.
                    </div>
                  )}
                  {link.strength === 'Moderate' && link.decision === 'candidate' && (
                    <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                      Moderate link — requires a second independent Moderate or one Strong link to merge.
                    </div>
                  )}
                  {link.strength === 'Weak' && (
                    <div style={{ color: 'var(--high)', fontSize: 12 }}>
                      Weak evidence — not merged. An analyst may accept as a lead for further investigation.
                      <br /><strong>Not merged: weak evidence only.</strong>
                    </div>
                  )}
                  {link.decisionNote && (
                    <div style={{ marginTop: 8, padding: '6px 8px', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 2, fontSize: 12 }}>
                      Analyst note: {link.decisionNote}
                    </div>
                  )}
                </div>
              </div>

              {/* Analyst action for weak + pending */}
              {isWeak && isPending && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  {!deciding ? (
                    <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); setDeciding(true); }}>
                      Review decision
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Analyst note (required for accept):</label>
                        <input
                          type="text"
                          value={note}
                          onChange={e => setNote(e.target.value)}
                          style={{ width: '100%', padding: '4px 8px', border: '1px solid var(--border-s)', borderRadius: 4, fontSize: 12 }}
                          placeholder="Enter reason for accepting or dismissing…"
                        />
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={() => handleDecide('accepted_lead')}>
                        <CheckCircle size={12} /> Accept as lead
                      </button>
                      <button className="btn btn-critical btn-sm" onClick={() => handleDecide('dismissed')}>
                        <XCircle size={12} /> Dismiss
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setDeciding(false)}>Cancel</button>
                    </div>
                  )}
                </div>
              )}

              {link.decision === 'accepted_lead' && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, fontSize: 12, color: 'var(--accent)' }}>
                  <CheckCircle size={12} style={{ display: 'inline', marginRight: 4 }} />
                  Analyst-confirmed lead — recorded in audit log at {link.decisionTime ? new Date(link.decisionTime).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) : '—'} IST
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function LinksPage() {
  const { links, isLoaded, refreshLinks } = useCaseStore();

  const mergedLinks = links.filter(l => l.decision === 'merged' || l.decision === 'accepted_lead');
  const candidateLinks = links.filter(l => l.decision === 'candidate' || l.decision === 'dismissed');

  const handleDecide = async (linkId: string, d: 'accepted_lead' | 'dismissed', note: string) => {
    await API.decideLink(linkId, d, note);
    await appendAudit('analyst', `link_${d}`, linkId, note);
    await refreshLinks();
  };

  const TABLE_HEADER = (
    <thead>
      <tr>
        <th style={{ width: 28 }}></th>
        <th>Strength</th>
        <th>Entities</th>
        <th>Rule</th>
        <th>Confidence</th>
        <th>Evidence</th>
        <th>Sources</th>
        <th>Decision</th>
      </tr>
    </thead>
  );

  if (!isLoaded) {
    return (
      <div className="page">
        <div className="page-header"><div className="page-title">Links</div></div>
        <div className="empty-state">
          <Clock size={32} className="empty-state__icon" />
          <div className="empty-state__title">No case loaded</div>
          <div className="empty-state__desc">Load the sample case from the Evidence screen to view identity links.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Links</div>
          <div className="page-subtitle">Identity links with explainable rules — expand a row to see why, evidence, and merge logic</div>
        </div>
      </div>

      {/* Merged clusters */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Merged into clusters ({mergedLinks.length})</span>
          <span className="text-muted text-12">Satisfy merge rule: ≥1 Strong or ≥2 independent Moderate from different sources</span>
        </div>
        <table className="lx-table" aria-label="Merged identity links">
          {TABLE_HEADER}
          <tbody>
            {mergedLinks.map(link => (
              <LinkRow key={link.id} link={link} onDecide={handleDecide} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Candidates not merged */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Candidates not merged ({candidateLinks.length})</span>
          <span className="text-muted text-12">Weak links require analyst review — accept as lead or dismiss</span>
        </div>
        <table className="lx-table" aria-label="Candidate identity links not merged">
          {TABLE_HEADER}
          <tbody>
            {candidateLinks.map(link => (
              <LinkRow key={link.id} link={link} onDecide={handleDecide} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

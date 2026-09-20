import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, FileText, X } from 'lucide-react';
import { useCaseStore, API } from '../../store/caseStore';
import type { FreezeItem, Entity } from '../../domain/types';
import { fmtINR, fmtTimeIST, fmtAgo } from '../../lib/format';
import { FREEZE_WEIGHTS } from '../../domain/rules';

function FreezeTierBadge({ tier }: { tier: FreezeItem['tier'] }) {
  if (tier === 'Freeze now') return <span className="badge badge-freeze-now">Freeze now</span>;
  if (tier === 'Freeze today') return <span className="badge badge-freeze-today">Freeze today</span>;
  return <span className="badge badge-monitor">Monitor</span>;
}

function ActionLabel({ action }: { action: FreezeItem['action'] }) {
  const labels: Record<string, string> = {
    account_freeze: 'Account freeze',
    exchange_hold: 'Exchange hold request',
    sim_block: 'SIM block request',
    imei_block: 'IMEI block request',
  };
  return <span>{labels[action] ?? action}</span>;
}

function ScoreBar({ value, max }: { value: number; max: number }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <span style={{ fontSize: 11, color: 'var(--muted)', minWidth: 36 }}>{value}/{max}</span>
    </div>
  );
}

function DraftPanel({ item, entity, onClose }: { item: FreezeItem; entity: Entity | undefined; onClose: () => void }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    API.draftFreezeRequest(item.entityId).then(t => {
      setText(t);
      setLoading(false);
    });
  }, [item.entityId]);

  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(28,35,43,0.3)', zIndex: 999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--panel)', width: 600, maxHeight: '80vh',
        boxShadow: 'var(--shadow-drawer)', borderRadius: 4, display: 'flex', flexDirection: 'column',
      }} role="dialog" aria-modal="true" aria-label="Draft freeze request">
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontWeight: 600, fontSize: 15 }}>Draft request</span>
            <span style={{ marginLeft: 8, color: 'var(--muted)', fontSize: 12 }}>— {entity?.label}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close draft"><X size={14} /></button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {loading ? (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Generating draft…</div>
          ) : (
            <pre style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--ink)' }}>
              {text}
            </pre>
          )}
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={copy}>
            <FileText size={14} /> {copied ? 'Copied' : 'Copy text'}
          </button>
          <span style={{ fontSize: 11, color: 'var(--muted)', alignSelf: 'center' }}>
            This draft has not been sent. Review and submit through official channels.
          </span>
        </div>
      </div>
    </div>
  );
}

function FreezeRow({ item, entity, rank }: { item: FreezeItem; entity: Entity | undefined; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const [draftOpen, setDraftOpen] = useState(false);
  const CASE_CLOCK = '2026-09-18T15:09:00+05:30';

  return (
    <>
      <tr
        className={expanded ? 'expanded' : ''}
        style={{ cursor: 'pointer' }}
        onClick={() => setExpanded(p => !p)}
        aria-expanded={expanded}
      >
        <td style={{ width: 28, color: 'var(--muted)', fontSize: 12, fontWeight: 600 }}>{rank}</td>
        <td>{expanded ? <ChevronDown size={14} color="var(--muted)" /> : <ChevronRight size={14} color="var(--muted)" />}</td>
        <td>
          <div style={{ fontWeight: 500, fontSize: 13 }}>{entity?.label ?? item.entityId}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}><ActionLabel action={item.action} /></div>
        </td>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 18, fontWeight: 600 }}>{item.score}</span>
            <FreezeTierBadge tier={item.tier} />
          </div>
        </td>
        <td style={{ fontSize: 13 }}>
          {item.estimatedRemaining != null
            ? <span style={{ fontWeight: 500 }}>{fmtINR(item.estimatedRemaining)} <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>estimated</span></span>
            : <span style={{ color: 'var(--muted)' }}>—</span>}
        </td>
        <td style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'IBM Plex Mono, monospace' }}>
          {item.lastOutflowTime ? fmtAgo(item.lastOutflowTime, CASE_CLOCK) : '—'}
        </td>
        <td style={{ fontSize: 12 }}>
          {item.reasons.slice(0, 2).map((r, i) => (
            <div key={i} style={{ marginBottom: 2 }}>· {r}</div>
          ))}
        </td>
        <td>
          <button
            className="btn btn-secondary btn-sm"
            onClick={e => { e.stopPropagation(); setDraftOpen(true); }}
            aria-label={`Draft freeze request for ${entity?.label}`}
          >
            Draft request
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="expand-row">
          <td colSpan={8} style={{ padding: 0 }}>
            <div style={{ padding: '12px 16px', background: 'var(--canvas)', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 8 }}>
                Score breakdown — formula: 35×recoverability + 25×time-criticality + 20×chain position + 10×link confidence + 10×activity
              </div>
              <table className="lx-table lx-table--compact" style={{ background: 'var(--panel)' }}>
                <thead>
                  <tr><th>Factor</th><th>Weight</th><th>Value scored</th><th>Description</th></tr>
                </thead>
                <tbody>
                  {item.factors.map(f => (
                    <tr key={f.name}>
                      <td style={{ fontWeight: 500 }}>{f.name}</td>
                      <td>{f.weight}</td>
                      <td><ScoreBar value={f.value} max={f.weight} /></td>
                      <td style={{ color: 'var(--muted)', fontSize: 12 }}>{f.description}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '2px solid var(--border-s)' }}>
                    <td colSpan={2} style={{ fontWeight: 600 }}>Total</td>
                    <td style={{ fontWeight: 600 }}>{item.score} / 100</td>
                    <td />
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop: 8, fontSize: 12 }}>
                <span style={{ fontWeight: 600 }}>All reasons:</span>
                {item.reasons.map((r, i) => <div key={i} style={{ color: 'var(--muted)', marginTop: 2 }}>{i + 1}. {r}</div>)}
              </div>
            </div>
          </td>
        </tr>
      )}
      {draftOpen && <DraftPanel item={item} entity={entity} onClose={() => setDraftOpen(false)} />}
    </>
  );
}

export default function RiskPage() {
  const { freezeQueue, notRecommended, entities, isLoaded, caseData } = useCaseStore();

  const CASE_CLOCK = caseData?.caseClock ?? '2026-09-18T15:09:00+05:30';
  const FIRST_DEBIT = caseData?.firstFraudulentDebitTime ?? '2026-09-18T14:31:40+05:30';
  const LAST_OUTFLOW = '2026-09-18T14:52:00+05:30';

  const minutesSinceDebit = Math.floor(
    (new Date(CASE_CLOCK).getTime() - new Date(FIRST_DEBIT).getTime()) / 60000
  );
  const minutesSinceOutflow = Math.floor(
    (new Date(CASE_CLOCK).getTime() - new Date(LAST_OUTFLOW).getTime()) / 60000
  );

  if (!isLoaded) {
    return (
      <div className="page">
        <div className="page-header"><div className="page-title">Risk and freeze</div></div>
        <div className="empty-state">
          <div className="empty-state__title">No case loaded</div>
        </div>
      </div>
    );
  }

  const TABLE_HEADER = (
    <thead>
      <tr>
        <th style={{ width: 28 }}>#</th>
        <th style={{ width: 28 }}></th>
        <th>Target</th>
        <th>Score / Tier</th>
        <th>Estimated remaining</th>
        <th>Last outflow</th>
        <th>Top reasons</th>
        <th></th>
      </tr>
    </thead>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Risk and freeze</div>
          <div className="page-subtitle">Freeze queue ranked by score · Expand a row for score breakdown · Draft request generates copy-ready text</div>
        </div>
      </div>

      {/* Window statement */}
      <div className="window-statement" role="alert">
        {minutesSinceDebit} minutes since first fraudulent debit ({fmtTimeIST(FIRST_DEBIT)} IST). Last outflow {minutesSinceOutflow} minutes ago.
        Amount at stake: {fmtINR(caseData?.amountAtStake ?? 0)}.
      </div>

      {/* Freeze queue */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Freeze queue ({freezeQueue.length})</span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Ranked by freeze score · Expand for score breakdown</span>
        </div>
        <table className="lx-table" aria-label="Freeze queue">
          {TABLE_HEADER}
          <tbody>
            {freezeQueue.map((item, i) => (
              <FreezeRow
                key={item.entityId}
                item={item}
                entity={entities.find(e => e.id === item.entityId)}
                rank={i + 1}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Risk register */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Risk register — all entities</span>
        </div>
        <table className="lx-table lx-table--compact" aria-label="Risk register">
          <thead>
            <tr>
              <th>Entity</th><th>Type</th><th>Risk score</th><th>Tier</th><th>Top signal</th><th>Cluster</th>
            </tr>
          </thead>
          <tbody>
            {[...entities].sort((a, b) => b.riskScore - a.riskScore).map(e => (
              <tr key={e.id}>
                <td style={{ fontWeight: 500 }}>{e.label}</td>
                <td><span className="tag" style={{ textTransform: 'capitalize' }}>{e.type.replace('_', ' ')}</span></td>
                <td><span style={{ fontWeight: 600 }}>{e.riskScore}</span></td>
                <td><span className={`badge badge-${e.riskTier.toLowerCase()}`}>{e.riskTier}</span></td>
                <td style={{ fontSize: 12, color: 'var(--muted)' }}>{e.signals[0]?.label ?? '—'}</td>
                <td style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'IBM Plex Mono, monospace' }}>{e.clusterId ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Not recommended */}
      {notRecommended.length > 0 && (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Not recommended — insufficient evidence</span>
          </div>
          <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--muted)' }}>
            These entities appear only through weak links and do not satisfy the merge rule. No action recommended.
          </div>
          <table className="lx-table lx-table--compact" aria-label="Not recommended for action">
            <thead>
              <tr><th>Entity</th><th>Action considered</th><th>Score</th><th>Reason not recommended</th></tr>
            </thead>
            <tbody>
              {notRecommended.map(item => {
                const entity = entities.find(e => e.id === item.entityId);
                return (
                  <tr key={item.entityId}>
                    <td style={{ fontWeight: 500 }}>{entity?.label ?? item.entityId}</td>
                    <td><ActionLabel action={item.action} /></td>
                    <td>{item.score}</td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>{item.notRecommendedReason}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Score formula reference */}
      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, padding: '8px 0' }}>
        Freeze score formula: {Object.entries(FREEZE_WEIGHTS).map(([k, w]) => `${w}×${k.replace('_', '-')}`).join(' + ')} = 0–100
      </div>
    </div>
  );
}

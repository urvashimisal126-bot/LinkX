import { useState } from 'react';
import { useCaseStore } from '../../store/caseStore';
import type { TimelineEvent } from '../../domain/types';
import { fmtTimeIST, fmtRelTime } from '../../lib/format';

const SOURCE_LABELS: Record<string, string> = {
  cdr: 'CDR', ipdr: 'IPDR', bank: 'Bank', upi: 'UPI',
  email: 'Email', android: 'Android', apk: 'APK',
};

function KeyMomentBadge() {
  return (
    <span style={{
      display: 'inline-block',
      width: 8, height: 8, borderRadius: 2,
      background: 'var(--medium)', marginRight: 4,
    }} aria-label="Key moment" />
  );
}

function EventDetail({ event }: { event: TimelineEvent }) {
  const { entities } = useCaseStore();
  return (
    <div style={{ padding: '12px 16px', background: 'var(--canvas)', borderTop: '1px solid var(--border)' }}>
      <div style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 8 }}>{event.detail}</div>
      {event.entityIds.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)' }}>Entities: </span>
          {event.entityIds.map(id => {
            const e = entities.find(x => x.id === id);
            return <span key={id} className="tag" style={{ marginRight: 4 }}>{e?.label ?? id}</span>;
          })}
        </div>
      )}
      {event.evidenceRefs.length > 0 && (
        <div>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)' }}>Evidence: </span>
          {event.evidenceRefs.map((ref, i) => (
            <span key={i} style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, marginRight: 8, color: 'var(--muted)' }}>
              {ref.exhibitId}{ref.row ? ` row ${ref.row}` : ''}{ref.field ? ` · ${ref.field}` : ''}
              {ref.excerpt && <span style={{ color: 'var(--ink)', fontFamily: 'Inter, sans-serif' }}> — {ref.excerpt}</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TimelinePage() {
  const { timeline, caseData, isLoaded } = useCaseStore();
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterKey, setFilterKey] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const FIRST_DEBIT = caseData?.firstFraudulentDebitTime ?? '2026-09-18T14:31:40+05:30';

  const sources = ['all', ...Array.from(new Set(timeline.map(e => e.source)))];

  const filtered = timeline.filter(e => {
    if (filterSource !== 'all' && e.source !== filterSource) return false;
    if (filterKey && !e.isKeyMoment) return false;
    return true;
  });

  if (!isLoaded) {
    return (
      <div className="page">
        <div className="page-header"><div className="page-title">Timeline</div></div>
        <div className="empty-state"><div className="empty-state__title">No case loaded</div></div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Timeline</div>
          <div className="page-subtitle">
            Unified chronological events across all sources · {timeline.filter(e => e.isKeyMoment).length} key moments highlighted
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>Source:</span>
        {sources.map(s => (
          <button
            key={s}
            className={`btn btn-sm ${filterSource === s ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterSource(s)}
            aria-pressed={filterSource === s}
          >
            {s === 'all' ? 'All' : SOURCE_LABELS[s] ?? s.toUpperCase()}
          </button>
        ))}
        <button
          className={`btn btn-sm ${filterKey ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilterKey(p => !p)}
          aria-pressed={filterKey}
          style={{ marginLeft: 8 }}
        >
          Key moments only
        </button>
        <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 'auto' }}>
          {filtered.length} events
        </span>
      </div>

      <div className="panel">
        <table className="lx-table" aria-label="Unified timeline">
          <thead>
            <tr>
              <th style={{ width: 140 }}>Time (IST)</th>
              <th style={{ width: 100 }}>Relative</th>
              <th style={{ width: 70 }}>Source</th>
              <th>Event</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(event => (
              <>
                <tr
                  key={event.id}
                  className={event.isKeyMoment ? 'timeline-key' : ''}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setExpanded(p => p === event.id ? null : event.id)}
                  aria-expanded={expanded === event.id}
                >
                  <td style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>
                    {fmtTimeIST(event.time)}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'IBM Plex Mono, monospace' }}>
                    {fmtRelTime(event.time, FIRST_DEBIT)}
                  </td>
                  <td>
                    <span className="tag">{SOURCE_LABELS[event.source] ?? event.source.toUpperCase()}</span>
                  </td>
                  <td>
                    {event.isKeyMoment && <KeyMomentBadge />}
                    <span style={{ fontWeight: event.isKeyMoment ? 500 : 400 }}>{event.title}</span>
                  </td>
                </tr>
                {expanded === event.id && (
                  <tr key={event.id + '-detail'}>
                    <td colSpan={4} style={{ padding: 0 }}>
                      <EventDetail event={event} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
        Relative time is offset from first fraudulent debit at {fmtTimeIST(FIRST_DEBIT)} IST.
        Key moments shown with <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'var(--medium)', verticalAlign: 'middle', margin: '0 4px' }} aria-hidden="true" />marker.
      </div>
    </div>
  );
}

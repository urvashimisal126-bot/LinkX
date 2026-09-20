import { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape, { Core, NodeSingular, EdgeSingular } from 'cytoscape';
import { Maximize2, List, Eye, EyeOff, Search, X } from 'lucide-react';
import { useCaseStore } from '../../store/caseStore';
import type { Entity, IdentityLink, FlowEdge } from '../../domain/types';
import { fmtINR, fmtTimeIST } from '../../lib/format';

// Node shape by entity type (PRD 4.5)
function entityShape(type: Entity['type']): string {
  switch (type) {
    case 'victim':     return 'ellipse';        // circle with heavy outline
    case 'account':    return 'roundrectangle'; // rounded rectangle
    case 'phone':      return 'ellipse';        // small circle
    case 'device':     return 'hexagon';
    case 'ip':         return 'diamond';
    case 'cash_out':   return 'octagon';
    case 'email_origin': return 'diamond';
    default:           return 'roundrectangle';
  }
}

function nodeColor(type: Entity['type'], riskTier: string): string {
  if (type === 'victim') return '#EEF0F2';
  if (riskTier === 'Critical') return '#A5281B14';
  if (riskTier === 'High') return '#B45F0614';
  if (riskTier === 'Medium') return '#8A6D0014';
  return '#FFFFFF';
}

function nodeBorderColor(type: Entity['type'], riskTier: string): string {
  if (type === 'victim') return '#1C232B';
  if (riskTier === 'Critical') return '#A5281B';
  if (riskTier === 'High') return '#B45F06';
  if (riskTier === 'Medium') return '#8A6D00';
  return '#AEB5BD';
}

function edgeStyle(kind: FlowEdge['kind']) {
  if (kind === 'money') return { lineColor: '#1C232B', lineStyle: 'solid', width: 2 };
  if (kind === 'call' || kind === 'sms') return { lineColor: '#196367', lineStyle: 'solid', width: 1 };
  return { lineColor: '#5B6570', lineStyle: 'dashed', width: 1 };
}

function identityEdgeStyle(strength: IdentityLink['strength']) {
  if (strength === 'Strong') return { lineColor: '#1C232B', lineStyle: 'solid', width: 2 };
  if (strength === 'Moderate') return { lineColor: '#5B6570', lineStyle: 'solid', width: 1.5 };
  return { lineColor: '#B45F06', lineStyle: 'dashed', width: 1 };
}

function buildElements(
  entities: Entity[],
  flowEdges: FlowEdge[],
  links: IdentityLink[],
  showWeak: boolean
) {
  const nodes = entities.map(e => ({
    data: {
      id: e.id,
      label: e.label,
      type: e.type,
      riskTier: e.riskTier,
      riskScore: e.riskScore,
      clusterId: e.clusterId,
    },
  }));

  const flowEl = flowEdges.map(f => {
    const s = edgeStyle(f.kind);
    return {
      data: {
        id: f.id,
        source: f.from,
        target: f.to,
        kind: f.kind,
        label: f.kind === 'money' && f.amount ? fmtINR(f.amount) : '',
        lineColor: s.lineColor,
        lineStyle: s.lineStyle,
        width: s.width,
        edgeType: 'flow',
      },
    };
  });

  const idLinks = links
    .filter(l => l.decision !== 'dismissed' && (showWeak || l.strength !== 'Weak'))
    .map(l => {
      const s = identityEdgeStyle(l.strength);
      return {
        data: {
          id: l.id,
          source: l.entityA,
          target: l.entityB,
          kind: 'identity',
          label: l.strength,
          lineColor: s.lineColor,
          lineStyle: s.lineStyle,
          width: s.width,
          edgeType: 'identity',
          strength: l.strength,
        },
      };
    });

  return [...nodes, ...flowEl, ...idLinks];
}

function Inspector({ entityId, linkId, entities, links, flowEdges, onClose }: {
  entityId: string | null;
  linkId: string | null;
  entities: Entity[];
  links: IdentityLink[];
  flowEdges: FlowEdge[];
  onClose: () => void;
}) {
  if (!entityId && !linkId) return null;

  const entity = entityId ? entities.find(e => e.id === entityId) : null;
  const link = linkId ? links.find(l => l.id === linkId) : null;

  return (
    <div className="inspector" style={{ width: 'var(--inspector-w)', flexShrink: 0, borderLeft: '1px solid var(--border)' }}>
      <div className="inspector-header">
        <span className="inspector-title">{entity ? entity.label : link ? 'Identity link' : 'Inspector'}</span>
        <button className="btn btn-ghost btn-xs" onClick={onClose} aria-label="Close inspector"><X size={14} /></button>
      </div>
      <div className="inspector-body">
        {entity && (
          <>
            <div className="inspector-section">
              <div className="inspector-section-label">Type and identifiers</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4, textTransform: 'capitalize' }}>{entity.type.replace('_', ' ')}</div>
              {Object.entries(entity.identifiers).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 8, fontSize: 12, marginBottom: 2 }}>
                  <span style={{ color: 'var(--muted)', minWidth: 100 }}>{k}</span>
                  <span className="mono">{v}</span>
                </div>
              ))}
            </div>
            <div className="inspector-section">
              <div className="inspector-section-label">Risk</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 22, fontWeight: 600 }}>{entity.riskScore}</span>
                <span className={`badge badge-${entity.riskTier.toLowerCase()}`}>{entity.riskTier}</span>
              </div>
              {entity.signals.map(s => (
                <div key={s.label} style={{ fontSize: 12, marginBottom: 4 }}>
                  <div style={{ fontWeight: 500 }}>{s.label} <span style={{ color: 'var(--accent)', fontWeight: 600 }}>+{s.score}</span></div>
                  <div style={{ color: 'var(--muted)' }}>{s.detail}</div>
                </div>
              ))}
            </div>
            {entity.clusterId && (
              <div className="inspector-section">
                <div className="inspector-section-label">Cluster</div>
                <span className="tag">{entity.clusterId}</span>
              </div>
            )}
            <div className="inspector-section">
              <div className="inspector-section-label">Identity links</div>
              {links.filter(l => l.entityA === entity.id || l.entityB === entity.id).map(l => {
                const other = entities.find(e => e.id === (l.entityA === entity.id ? l.entityB : l.entityA));
                return (
                  <div key={l.id} style={{ fontSize: 12, marginBottom: 6, padding: '6px 8px', background: 'var(--canvas)', borderRadius: 2, border: '1px solid var(--border)' }}>
                    <span className={`badge badge-${l.strength.toLowerCase()} text-11`}>{l.strength}</span>
                    <span style={{ marginLeft: 8 }}>↔ {other?.label}</span>
                    <div style={{ color: 'var(--muted)', marginTop: 2 }}>{l.reason}</div>
                  </div>
                );
              })}
            </div>
            <div className="inspector-section">
              <div className="inspector-section-label">Evidence references</div>
              {entity.evidenceRefs.slice(0, 4).map((ref, i) => (
                <div key={i} style={{ fontSize: 12, marginBottom: 4, fontFamily: 'IBM Plex Mono, monospace' }}>
                  {ref.exhibitId}{ref.row ? ` row ${ref.row}` : ''}{ref.field ? ` · ${ref.field}` : ''}
                  {ref.excerpt && <div style={{ color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>{ref.excerpt}</div>}
                </div>
              ))}
            </div>
          </>
        )}
        {link && (
          <>
            <div className="inspector-section">
              <div className="inspector-section-label">Link details</div>
              <div style={{ marginBottom: 8 }}>
                <span className={`badge badge-${link.strength.toLowerCase()}`}>{link.strength}</span>
                <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--muted)' }}>{Math.round(link.confidence * 100)}% confidence</span>
              </div>
              <div style={{ fontSize: 12 }}>{link.reason}</div>
            </div>
            <div className="inspector-section">
              <div className="inspector-section-label">Rule</div>
              <span className="mono" style={{ fontSize: 12 }}>{link.rule}</span>
            </div>
            <div className="inspector-section">
              <div className="inspector-section-label">Evidence</div>
              {link.evidenceRefs.map((ref, i) => (
                <div key={i} style={{ fontSize: 12, marginBottom: 4 }}>
                  <span className="mono">{ref.exhibitId}</span>
                  {ref.excerpt && <span style={{ color: 'var(--muted)', marginLeft: 6 }}>{ref.excerpt}</span>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// List view alternative (for keyboard/screen reader)
function ListView({ entities, flowEdges, onSelect }: {
  entities: Entity[];
  flowEdges: FlowEdge[];
  onSelect: (id: string) => void;
}) {
  return (
    <div style={{ overflow: 'auto', flex: 1, padding: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 8 }}>
        Entities ({entities.length})
      </div>
      <table className="lx-table lx-table--compact">
        <thead>
          <tr>
            <th>Label</th><th>Type</th><th>Risk</th><th>Cluster</th>
          </tr>
        </thead>
        <tbody>
          {entities.map(e => (
            <tr key={e.id} style={{ cursor: 'pointer' }} onClick={() => onSelect(e.id)}>
              <td style={{ fontWeight: 500 }}>{e.label}</td>
              <td><span className="tag" style={{ textTransform: 'capitalize' }}>{e.type.replace('_', ' ')}</span></td>
              <td><span className={`badge badge-${e.riskTier.toLowerCase()}`}>{e.riskScore}</span></td>
              <td style={{ fontSize: 11, color: 'var(--muted)' }}>{e.clusterId ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', margin: '16px 0 8px' }}>
        Money trail ({flowEdges.filter(f => f.kind === 'money').length} flows)
      </div>
      <table className="lx-table lx-table--compact">
        <thead>
          <tr><th>From</th><th>To</th><th>Amount</th><th>Time</th></tr>
        </thead>
        <tbody>
          {flowEdges.filter(f => f.kind === 'money').map(f => {
            const from = entities.find(e => e.id === f.from);
            const to = entities.find(e => e.id === f.to);
            return (
              <tr key={f.id}>
                <td style={{ fontWeight: 500 }}>{from?.label ?? f.from}</td>
                <td style={{ fontWeight: 500 }}>{to?.label ?? f.to}</td>
                <td>{f.amount ? fmtINR(f.amount) : '—'}</td>
                <td style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>{fmtTimeIST(f.time)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function NetworkPage() {
  const { entities, links, flowEdges, isLoaded, setSelectedEntity, setSelectedLink } = useCaseStore();
  const cyRef = useRef<HTMLDivElement>(null);
  const cyInstance = useRef<Core | null>(null);
  const [showWeak, setShowWeak] = useState(false);
  const [listView, setListView] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);

  const weakCount = links.filter(l => l.strength === 'Weak' && l.decision !== 'dismissed').length;

  const initGraph = useCallback(() => {
    if (!cyRef.current || cyInstance.current) return;
    const elements = buildElements(entities, flowEdges, links, showWeak);

    const cy = cytoscape({
      container: cyRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 4,
            'font-size': 11,
            'font-family': 'Inter, sans-serif',
            'color': '#1C232B',
            'text-max-width': 100,
            'text-wrap': 'wrap',
            shape: (ele: NodeSingular) => entityShape(ele.data('type') as Entity['type']),
            'background-color': (ele: NodeSingular) => nodeColor(ele.data('type'), ele.data('riskTier')),
            'border-color': (ele: NodeSingular) => nodeBorderColor(ele.data('type'), ele.data('riskTier')),
            'border-width': (ele: NodeSingular) => ele.data('type') === 'victim' ? 3 : 1.5,
            width: (ele: NodeSingular) => ele.data('type') === 'phone' ? 28 : 44,
            height: (ele: NodeSingular) => ele.data('type') === 'phone' ? 28 : 44,
          } as never,
        },
        {
          selector: 'node:selected',
          style: {
            'border-color': '#196367',
            'border-width': 3,
            'outline-color': '#196367',
            'outline-width': 2,
            'outline-offset': 2,
          } as never,
        },
        {
          selector: 'edge',
          style: {
            'line-color': 'data(lineColor)',
            'line-style': 'data(lineStyle)',
            width: 'data(width)',
            'curve-style': 'bezier',
            'target-arrow-shape': (ele: EdgeSingular) => ele.data('kind') === 'identity' ? 'none' : 'triangle',
            'target-arrow-color': 'data(lineColor)',
            label: 'data(label)',
            'font-size': 10,
            'font-family': 'Inter, sans-serif',
            color: '#5B6570',
            'text-rotation': 'autorotate',
            'text-margin-y': -6,
          } as never,
        },
        {
          selector: 'edge:selected',
          style: { 'line-color': '#196367', width: 3 } as never,
        },
      ],
      layout: {
        name: 'breadthfirst',
        roots: ['ENT-VICTIM'],
        directed: true,
        spacingFactor: 1.5,
        padding: 40,
      },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      minZoom: 0.3,
      maxZoom: 3,
    });

    cy.on('tap', 'node', (e) => {
      const id = e.target.id() as string;
      setSelectedEntityId(id);
      setSelectedLinkId(null);
      setSelectedEntity(id);
    });
    cy.on('tap', 'edge', (e) => {
      const id = e.target.id() as string;
      setSelectedLinkId(id);
      setSelectedEntityId(null);
      setSelectedLink(id);
    });
    cy.on('tap', (e) => {
      if (e.target === cy) {
        setSelectedEntityId(null);
        setSelectedLinkId(null);
        setSelectedEntity(null);
        setSelectedLink(null);
      }
    });

    cyInstance.current = cy;
  }, [entities, links, flowEdges, showWeak, setSelectedEntity, setSelectedLink]);

  useEffect(() => {
    if (!listView && isLoaded) {
      const t = setTimeout(initGraph, 50);
      return () => {
        clearTimeout(t);
        cyInstance.current?.destroy();
        cyInstance.current = null;
      };
    }
    return undefined;
  }, [listView, isLoaded, initGraph]);

  useEffect(() => {
    if (!cyInstance.current) return;
    const elements = buildElements(entities, flowEdges, links, showWeak);
    cyInstance.current.elements().remove();
    cyInstance.current.add(elements as never);
    cyInstance.current.layout({ name: 'breadthfirst', roots: ['ENT-VICTIM'], directed: true, spacingFactor: 1.5, padding: 40 } as never).run();
  }, [showWeak, entities, flowEdges, links]);

  const fitView = () => cyInstance.current?.fit();

  const handleSearch = (q: string) => {
    setSearchQ(q);
    if (!cyInstance.current || !q) return;
    const match = cyInstance.current.nodes().filter(n =>
      (n.data('label') as string).toLowerCase().includes(q.toLowerCase())
    );
    if (match.length > 0) {
      cyInstance.current.animate({ fit: { eles: match, padding: 60 } } as never, { duration: 400 });
      match.select();
    }
  };

  if (!isLoaded) {
    return (
      <div className="page">
        <div className="page-header"><div className="page-title">Network</div></div>
        <div className="empty-state">
          <div className="empty-state__title">No case loaded</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', background: 'var(--panel)', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        <button
          className={`btn btn-secondary btn-sm ${showWeak ? 'btn-primary' : ''}`}
          onClick={() => setShowWeak(p => !p)}
          aria-pressed={showWeak}
        >
          {showWeak ? <EyeOff size={14} /> : <Eye size={14} />}
          {showWeak ? 'Hide' : 'Show'} weak links ({weakCount})
        </button>
        <button
          className={`btn ${listView ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setListView(p => !p)}
          aria-pressed={listView}
        >
          <List size={14} />
          List view
        </button>
        {!listView && (
          <button className="btn btn-secondary btn-sm" onClick={fitView}>
            <Maximize2 size={14} /> Fit
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
          <Search size={14} color="var(--muted)" />
          <input
            type="search"
            value={searchQ}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search entities…"
            style={{ padding: '3px 8px', border: '1px solid var(--border-s)', borderRadius: 4, fontSize: 12, width: 180 }}
            aria-label="Search entities in graph"
          />
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--muted)', borderLeft: '1px solid var(--border)', paddingLeft: 12 }}>
          <span>○ Victim</span>
          <span>▭ Account</span>
          <span>◆ Phone</span>
          <span>⬡ Device</span>
          <span>◇ IP</span>
          <span>⬡ Cash-out</span>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Graph / list area */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {listView
            ? <ListView entities={entities} flowEdges={flowEdges} onSelect={id => { setSelectedEntityId(id); setSelectedEntity(id); }} />
            : <div ref={cyRef} style={{ width: '100%', height: '100%', background: 'var(--canvas)' }} aria-label="Fraud network graph" />
          }
        </div>

        {/* Inspector */}
        {(selectedEntityId || selectedLinkId) && (
          <Inspector
            entityId={selectedEntityId}
            linkId={selectedLinkId}
            entities={entities}
            links={links}
            flowEdges={flowEdges}
            onClose={() => {
              setSelectedEntityId(null);
              setSelectedLinkId(null);
              setSelectedEntity(null);
              setSelectedLink(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

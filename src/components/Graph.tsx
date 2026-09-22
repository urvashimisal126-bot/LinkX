import { useEffect, useRef, useState } from 'react';
import cytoscape, { type Core, type ElementDefinition } from 'cytoscape';
import { ArrowRight, Crosshair, Route, ZoomIn, ZoomOut, X, ShieldCheck, MousePointer2 } from 'lucide-react';
import { useDemoStore } from '../store/demoStore';
import { identifiers, support, money, time } from '../data/presentation';

const positions: Record<string, { x: number; y: number }> = {
  apk: { x: 100, y: 70 }, attacker_phone: { x: 350, y: 70 },
  victim: { x: 100, y: 300 }, mule1: { x: 350, y: 300 },
  mule2: { x: 610, y: 210 }, mule3: { x: 610, y: 440 },
  vpa_fraud: { x: 870, y: 210 }, exchange: { x: 1130, y: 210 }, atm_cashout: { x: 1130, y: 440 },
};
const labels: Record<string, string> = {
  victim: 'Victim account\n••4471', attacker_phone: 'Attacker number\nIMEI linked', apk: 'SMS-forwarder\nMalicious APK',
  mule1: 'HDFC ••3321\nLayer 1', mule2: 'PNB ••7790\nLayer 2 · Risk 96', mule3: 'Canara ••1190\nLayer 2 · Risk 61',
  vpa_fraud: 'fraud••@examplebank\nUPI VPA', exchange: 'CoinRamp ••221\nExchange wallet', atm_cashout: 'ATM cash-out\n3 locations',
};
const pathNodes = ['victim', 'mule1', 'mule2', 'vpa_fraud', 'exchange'];
const pathEdges = ['flow-1', 'flow-2', 'flow-4', 'flow-6'];

export default function Graph({ compact = false }: { compact?: boolean }) {
  const data = useDemoStore(s => s.caseData)!;
  const host = useRef<HTMLDivElement>(null);
  const graph = useRef<Core | null>(null);
  const [selection, setSelection] = useState<{ type: 'node' | 'edge'; id: string } | null>(null);
  const [highlighted, setHighlighted] = useState(false);
  const [tab, setTab] = useState('all');
  useEffect(() => {
    if (!host.current || !data) return;
    const elements: ElementDefinition[] = data.entities.map(e => ({ data: { ...e, label: labels[e.id] }, position: positions[e.id] }));
    data.flowEdges.forEach((e, i) => elements.push({ data: { id: `flow-${i}`, source: e.from, target: e.to, label: e.amount ? `${money(e.amount)}\n18 Sep ${time(e.timestamp).slice(0, 5)}` : 'OTP intercepted', kind: e.amount ? 'money' : 'evidence' } }));
    elements.push({ data: { id: 'identity', source: 'apk', target: 'attacker_phone', label: 'SMS forwarding · E06', kind: 'evidence' } });
    const cy = cytoscape({
      container: host.current, elements, layout: { name: 'preset' }, minZoom: .25, maxZoom: 2.2,
      userZoomingEnabled: !compact, userPanningEnabled: !compact, boxSelectionEnabled: false,
      autoungrabify: compact, wheelSensitivity: .18,
      style: [
        { selector: 'node', style: { 'shape': 'round-rectangle', 'width': 166, 'height': 68, 'background-color': '#FFFFFF', 'border-color': '#B8C7CD', 'border-width': 1.4, 'label': 'data(label)', 'text-wrap': 'wrap', 'text-valign': 'center', 'text-halign': 'center', 'font-family': 'IBM Plex Mono', 'font-size': 12, 'line-height': 1.65, 'color': '#0F1D2E' } },
        { selector: 'node[type="victim"]', style: { 'border-color': '#0E7C7B', 'border-width': 2.5 } },
        { selector: 'node[type="offramp"]', style: { 'border-color': '#4B5768', 'border-width': 2 } },
        { selector: 'node[type="malware"], node[type="attacker"]', style: { 'border-style': 'dashed', 'shape': 'round-rectangle' } },
        { selector: 'edge', style: { 'width': 1.8, 'line-color': '#94A8AD', 'target-arrow-color': '#94A8AD', 'target-arrow-shape': 'triangle', 'curve-style': 'bezier', 'label': 'data(label)', 'text-wrap': 'wrap', 'font-size': 10, 'font-family': 'IBM Plex Mono', 'color': '#4B5768', 'text-background-color': '#F5F6F4', 'text-background-opacity': 1, 'text-background-padding': '5px', 'text-margin-y': -13, 'line-height': 1.4 } },
        { selector: 'edge[kind="evidence"]', style: { 'line-style': 'dashed', 'line-color': '#A8AFB9', 'target-arrow-color': '#A8AFB9', 'font-family': 'Inter', 'font-size': 10 } },
        { selector: '.dim', style: { 'opacity': .17 } },
        { selector: 'edge.path', style: { 'width': 4, 'line-color': '#0E7C7B', 'target-arrow-color': '#0E7C7B', 'color': '#0E7C7B', 'font-weight': 600 } },
        { selector: 'node.path', style: { 'border-width': 3, 'border-color': '#0E7C7B' } },
        { selector: ':selected', style: { 'border-color': '#0E7C7B', 'border-width': 3, 'overlay-opacity': 0 } },
        { selector: '.hidden', style: { display: 'none' } },
      ],
    });
    graph.current = cy;
    cy.fit(undefined, compact ? 28 : 60);
    if (!compact) {
      cy.on('tap', 'node', e => setSelection({ type: 'node', id: e.target.id() }));
      cy.on('tap', 'edge', e => setSelection({ type: 'edge', id: e.target.id() }));
      cy.on('tap', e => { if (e.target === cy) setSelection(null); });
    }
    const resize = new ResizeObserver(() => { cy.resize(); cy.fit(cy.elements(':visible'), compact ? 28 : 60); });
    resize.observe(host.current);
    return () => { resize.disconnect(); cy.destroy(); graph.current = null; };
  }, [data, compact]);
  useEffect(() => {
    const cy = graph.current;
    if (!cy) return;
    cy.elements().removeClass('dim path hidden');
    if (tab === 'money') cy.elements().filter(e => e.isNode() ? ['apk', 'attacker_phone'].includes(e.id()) : e.data('kind') === 'evidence').addClass('hidden');
    if (highlighted) {
      cy.elements().addClass('dim');
      [...pathNodes, ...pathEdges].forEach(id => cy.getElementById(id).removeClass('dim').addClass('path'));
    }
  }, [highlighted, tab]);
  const node = selection?.type === 'node' ? data.entities.find(e => e.id === selection.id) : null;
  const edge = selection?.type === 'edge' ? data.flowEdges[Number(selection.id.replace('flow-', ''))] : null;
  const risk = node && data.freezeQueue.find(r => r.entityId === node.id);
  return <div className={`graph-workspace ${compact ? 'compact' : ''}`}>
    {!compact && <div className="graph-toolbar"><div className="segmented"><button className={tab === 'all' ? 'selected' : ''} onClick={() => setTab('all')}>All connections</button><button className={tab === 'money' ? 'selected' : ''} onClick={() => setTab('money')}>Money trail</button></div><div className="toolbar-right"><span className="muted">9 entities · 7 case events</span><button className={highlighted ? 'button active' : 'button primary'} onClick={() => setHighlighted(v => !v)} aria-pressed={highlighted}><Route size={16}/>{highlighted ? 'Clear highlighted path' : 'Highlight full path'}</button></div></div>}
    <div className="graph-body"><div className="graph-stage">
      {!compact && <div className="graph-tiers"><span>Origin & compromise</span><span>First recipient</span><span>Layering</span><span>Off-ramp</span></div>}
      <div ref={host} className="cy-canvas" aria-label="Interactive money-flow graph" role="img" />
      {!compact && <><div className="graph-controls"><button aria-label="Zoom in" title="Zoom in" onClick={() => graph.current?.zoom(graph.current.zoom() * 1.2)}><ZoomIn size={18}/></button><button aria-label="Zoom out" title="Zoom out" onClick={() => graph.current?.zoom(graph.current.zoom() / 1.2)}><ZoomOut size={18}/></button><button aria-label="Fit graph" title="Fit graph" onClick={() => graph.current?.fit(graph.current.elements(':visible'), 60)}><Crosshair size={18}/></button></div><div className="graph-legend"><span><i className="line-key"/>Fund transfer</span><span><i className="line-key dashed"/>Evidence link</span><span><MousePointer2 size={13}/>Drag to pan · Scroll to zoom</span></div></>}
    </div>
    {!compact && <aside className="inspector">
      <div className="inspector-title"><span>Entity inspector</span>{selection && <button aria-label="Close inspector" onClick={() => setSelection(null)}><X size={16}/></button>}</div>
      {node ? <><span className="eyebrow">{node.type}</span><h3>{node.label}</h3><label>Identifiers</label>{identifiers[node.id].map(id => <p className="mono wrap" key={id}>{id}</p>)}<label>Supporting exhibits</label><div className="tags">{support[node.id].map(e => <a href="#/evidence" className="tag mono" key={e}>{e}</a>)}</div>{risk && <><label>Freeze priority score</label><div className={`risk-number ${risk.score > 80 ? 'red' : 'amber'}`}>{risk.score}<small>/ 100</small></div><p>{risk.reason}</p><a href="#/risk" className="text-link">Review freeze queue <ArrowRight size={14}/></a></>}<div className="inspector-note"><ShieldCheck size={17}/><span>Linked to the sample evidence record. All identifiers are fictional.</span></div></> : edge ? <><span className="eyebrow">Transaction detail</span><h3>{edge.amount ? money(edge.amount) : edge.label}</h3><label>From</label><p>{data.entities.find(e => e.id === edge.from)?.label}</p><label>To</label><p>{data.entities.find(e => e.id === edge.to)?.label}</p><label>Recorded at</label><p className="mono">18 Sep 2026 · {time(edge.timestamp)} IST</p><label>Source exhibit</label><a className="tag mono" href="#/evidence">{edge.exhibit || 'E06'}</a></> : selection?.id === 'identity' ? <><span className="eyebrow">Evidence link</span><h3>SMS forwarding destination</h3><p>Malware manifest links the SMS-forwarder APK to the attacker-controlled number.</p><a className="tag mono" href="#/evidence">E06</a></> : <><div className="inspector-symbol"><MousePointer2 size={27}/></div><h3>Follow the money.</h3><p>Select any account or connection to inspect the evidence behind it.</p><div className="inspector-note"><Route size={20}/><span>Trace the victim’s funds through three layers to the final exchange wallet.</span></div><label>Jump to an entity</label><select aria-label="Inspect entity" value="" onChange={e => setSelection({ type: 'node', id: e.target.value })}><option value="" disabled>Select an account or device</option>{data.entities.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}</select></>}
    </aside>}
    </div>
    {!compact && <div className={`path-summary ${highlighted ? 'is-highlighted' : ''}`}><Route size={18}/><div><strong>{highlighted ? 'Victim → HDFC ••3321 → PNB ••7790 → VPA → CoinRamp ••221' : 'One complaint. A complete trail.'}</strong><span>{highlighted ? '4 transfers · ₹4,85,000 at origin → ₹2,40,000 at exchange · E02, E04, E05' : 'Click “Highlight full path” to isolate the route from victim to exchange.'}</span></div><a href="#/risk">Prioritize recovery <ArrowRight size={15}/></a></div>}
  </div>;
}

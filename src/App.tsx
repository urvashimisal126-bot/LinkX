import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Link2, Share2, AlertTriangle,
  Clock, ShieldCheck, FileOutput, Settings, X
} from 'lucide-react';
import { useCaseStore } from './store/caseStore';
import OverviewPage from './features/overview/OverviewPage';
import EvidencePage from './features/evidence/EvidencePage';
import LinksPage from './features/links/LinksPage';
import NetworkPage from './features/network/NetworkPage';
import RiskPage from './features/risk/RiskPage';
import TimelinePage from './features/timeline/TimelinePage';
import IntegrityPage from './features/integrity/IntegrityPage';
import ReportPage from './features/report/ReportPage';
import SystemDrawer from './features/system/SystemDrawer';
import SplashScreen from './features/splash/SplashScreen';

const NAV_ITEMS = [
  { path: '/',          label: 'Overview',       icon: LayoutDashboard },
  { path: '/evidence',  label: 'Evidence',        icon: FileText },
  { path: '/links',     label: 'Links',           icon: Link2 },
  { path: '/network',   label: 'Network',         icon: Share2 },
  { path: '/risk',      label: 'Risk and freeze', icon: AlertTriangle },
  { path: '/timeline',  label: 'Timeline',        icon: Clock },
  { path: '/integrity', label: 'Integrity',       icon: ShieldCheck },
  { path: '/report',    label: 'Report',          icon: FileOutput },
];

function Shell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { caseData, evidenceFiles, systemDrawerOpen, setSystemDrawerOpen } = useCaseStore();

  const [showSplash, setShowSplash] = useState(true);

  // Replay shortcut: Shift + L on empty screen or anywhere
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'L' || e.key === 'l')) {
        // Allow replaying splash
        setShowSplash(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const hasMismatch = evidenceFiles.some(e => e.status === 'mismatch');
  const allVerified = evidenceFiles.length > 0 && evidenceFiles.every(e => e.status === 'verified');

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <div className="shell" role="application">
        {/* Topbar */}
        <header className="topbar shell-topbar" role="banner">
          <div className="topbar-wordmark" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img
              src="/brand/linkx-mark-white.svg"
              alt="LinkX"
              style={{ height: 26, width: 'auto', display: 'block' }}
            />
            <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 600, fontSize: 14, color: '#FFFFFF', letterSpacing: '-0.01em' }}>LinkX</span>
          </div>
        <div className="topbar-sep" aria-hidden="true" />
        <span className="topbar-case">{caseData ? caseData.id : 'No case loaded'}</span>
        <div className="topbar-right">
          <span className="topbar-badge topbar-badge--local" role="status">
            <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true"><circle cx="4" cy="4" r="4" fill="currentColor"/></svg>
            Local mode
          </span>
          {hasMismatch ? (
            <span className="topbar-badge topbar-badge--mismatch" role="alert">⚠ Hash mismatch</span>
          ) : allVerified ? (
            <span className="topbar-badge topbar-badge--verified">✓ Verified</span>
          ) : null}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/report')}
            aria-label="Go to export report"
          >
            Export brief
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setSystemDrawerOpen(true)}
            aria-label="Open system panel"
            aria-expanded={systemDrawerOpen}
          >
            <Settings size={14} />
            System
          </button>
        </div>
      </header>


      {/* Left rail */}
      <nav className="rail shell-rail" aria-label="Screen navigation">
        <div className="rail-section-label">Investigation</div>
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
          return (
            <button
              key={path}
              className={`nav-item ${active ? 'nav-item--active' : ''}`}
              onClick={() => navigate(path)}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={16} className="nav-item__icon" aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Main content area */}
      <main className="shell-main" role="main">
        <div className="shell-content" id="main-content" tabIndex={-1}>
          <Routes>
            <Route path="/"          element={<OverviewPage />} />
            <Route path="/evidence"  element={<EvidencePage />} />
            <Route path="/links"     element={<LinksPage />} />
            <Route path="/network"   element={<NetworkPage />} />
            <Route path="/risk"      element={<RiskPage />} />
            <Route path="/timeline"  element={<TimelinePage />} />
            <Route path="/integrity" element={<IntegrityPage />} />
            <Route path="/report"    element={<ReportPage />} />
          </Routes>
        </div>
      </main>

      {/* System drawer */}
      {systemDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="System information"
          style={{
            position: 'fixed', inset: 0, zIndex: 999,
            display: 'flex', justifyContent: 'flex-end',
          }}
        >
          <div
            style={{ flex: 1, background: 'rgba(28,35,43,0.3)' }}
            onClick={() => setSystemDrawerOpen(false)}
            aria-label="Close system panel"
          />
          <div style={{ width: 420, background: 'var(--panel)', boxShadow: 'var(--shadow-drawer)', overflow: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src="/brand/linkx-mark.svg" alt="LinkX" style={{ height: 22, width: 'auto', display: 'block' }} />
                <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>System</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSystemDrawerOpen(false)} aria-label="Close">
                <X size={14} />
              </button>
            </div>
            <SystemDrawer />
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}

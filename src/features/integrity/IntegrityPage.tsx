import { useState } from 'react';
import { CheckCircle, AlertCircle, Shield, ShieldOff, RotateCcw, Link } from 'lucide-react';
import { useCaseStore, API } from '../../store/caseStore';
import type { AuditEntry, EvidenceFile } from '../../domain/types';
import { fmtHash, fmtIST } from '../../lib/format';
import { checkChain } from '../../lib/auditChain';
import { simulateTamper, restoreTamper, isTamperActive } from '../../api/MockApi';

function FileStatusIcon({ status }: { status: EvidenceFile['status'] }) {
  if (status === 'verified') return <CheckCircle size={14} color="var(--verified)" />;
  if (status === 'mismatch' || status === 'tampered') return <AlertCircle size={14} color="var(--critical)" />;
  return <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--border-s)', display: 'inline-block' }} />;
}

export default function IntegrityPage() {
  const { evidenceFiles, auditChain, isLoaded, refreshEvidence, refreshAudit } = useCaseStore();
  const [verifying, setVerifying] = useState(false);
  const [checkResult, setCheckResult] = useState<{ intact: boolean; brokenAt: number | null } | null>(null);
  const [tamperActive, setTamperActive] = useState(false);
  const [tamperedId, setTamperedId] = useState<string | null>(null);

  const handleVerifyAll = async () => {
    setVerifying(true);
    await API.verifyIntegrity();
    await refreshEvidence();
    await refreshAudit();
    setVerifying(false);
  };

  const handleTamper = (exhibitId: string) => {
    simulateTamper(exhibitId);
    setTamperActive(true);
    setTamperedId(exhibitId);
  };

  const handleRestore = async () => {
    restoreTamper();
    setTamperActive(false);
    setTamperedId(null);
    await handleVerifyAll();
  };

  const handleCheckChain = async () => {
    const result = await checkChain();
    setCheckResult(result);
  };

  const mismatchCount = evidenceFiles.filter(f => f.status === 'mismatch').length;

  if (!isLoaded) {
    return (
      <div className="page">
        <div className="page-header"><div className="page-title">Integrity and audit</div></div>
        <div className="empty-state"><div className="empty-state__title">No case loaded</div></div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Integrity and audit</div>
          <div className="page-subtitle">SHA-256 verification of all exhibit files · Hash-chained audit log</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary btn-sm" onClick={handleVerifyAll} disabled={verifying} aria-busy={verifying}>
            <Shield size={14} />
            {verifying ? 'Verifying…' : 'Verify all'}
          </button>
          {!tamperActive ? (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleTamper('E04')}
              title="Demo: simulate tampering of E04"
            >
              <ShieldOff size={14} />
              Simulate tampering
            </button>
          ) : (
            <button className="btn btn-critical btn-sm" onClick={handleRestore}>
              <RotateCcw size={14} />
              Restore
            </button>
          )}
        </div>
      </div>

      {tamperActive && (
        <div className="window-statement" role="alert">
          Tampering simulated on exhibit {tamperedId}. Click Restore to revert and re-verify.
          This is a demo control only.
        </div>
      )}

      {mismatchCount > 0 && (
        <div style={{ background: 'var(--critical-tint)', border: '1px solid var(--critical)', borderLeft: '4px solid var(--critical)', borderRadius: 2, padding: '8px 12px', marginBottom: 12, fontSize: 13, color: 'var(--critical)' }} role="alert">
          {mismatchCount} file{mismatchCount !== 1 ? 's' : ''} with hash mismatch detected. Recorded and computed hashes differ — these files may have been modified after seizure.
        </div>
      )}

      {/* File hash table */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Evidence file hashes</span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            {evidenceFiles.filter(f => f.status === 'verified').length}/{evidenceFiles.length} verified
          </span>
        </div>
        <table className="lx-table" aria-label="Evidence file integrity status">
          <thead>
            <tr>
              <th>Exhibit</th>
              <th>File name</th>
              <th>Recorded (seizure) SHA-256</th>
              <th>Computed SHA-256</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {evidenceFiles.map(file => (
              <tr key={file.exhibitId} style={file.status === 'mismatch' ? { background: 'var(--critical-tint)' } : {}}>
                <td><span className="mono">{file.exhibitId}</span></td>
                <td style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>{file.name}</td>
                <td>
                  <span className="mono" style={{ fontSize: 12 }}>
                    {file.recordedHash.startsWith('PLACEHOLDER') ? '(hash computed on load)' : fmtHash(file.recordedHash)}
                  </span>
                </td>
                <td>
                  {file.computedHash ? (
                    <span className="mono" style={{ fontSize: 12, color: file.status === 'mismatch' ? 'var(--critical)' : 'inherit' }}>
                      {fmtHash(file.computedHash)}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--muted)', fontSize: 12 }}>Not yet computed — click Verify all</span>
                  )}
                </td>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <FileStatusIcon status={file.status} />
                    {file.status === 'verified' ? 'Verified against seizure hash' :
                     file.status === 'mismatch' ? 'Hash mismatch — file integrity suspect' :
                     'Pending verification'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Audit chain */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Chain-of-custody audit log ({auditChain.length} entries)</span>
          <button className="btn btn-secondary btn-sm" onClick={handleCheckChain}>
            <Link size={14} /> Check chain
          </button>
        </div>
        {checkResult && (
          <div style={{
            padding: '8px 12px', fontSize: 12, borderBottom: '1px solid var(--border)',
            background: checkResult.intact ? 'var(--verified-tint)' : 'var(--critical-tint)',
            color: checkResult.intact ? 'var(--verified)' : 'var(--critical)',
          }} role="status">
            {checkResult.intact
              ? 'Audit chain intact — all entries linked and hash-verified.'
              : `Chain broken at entry ${checkResult.brokenAt} — possible tampering of audit log.`}
          </div>
        )}
        <table className="lx-table lx-table--compact" style={{ fontFamily: 'inherit' }} aria-label="Audit log">
          <thead>
            <tr>
              <th>#</th>
              <th style={{ width: 160 }}>Time (IST)</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Target</th>
              <th>Detail</th>
              <th>Entry hash</th>
            </tr>
          </thead>
          <tbody>
            {auditChain.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: 16 }}>No audit entries yet. Load sample case to generate entries.</td></tr>
            ) : (
              auditChain.map(entry => (
                <tr key={entry.sequence}>
                  <td style={{ color: 'var(--muted)' }}>{entry.sequence}</td>
                  <td style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>{fmtIST(entry.time)}</td>
                  <td><span className="tag">{entry.actor}</span></td>
                  <td style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>{entry.action}</td>
                  <td style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>{entry.target}</td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{entry.detail}</td>
                  <td>
                    <span className="mono" style={{ fontSize: 11 }}>{fmtHash(entry.hash)}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

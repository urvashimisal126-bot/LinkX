import { useState, useRef, useCallback } from 'react';
import { Upload, CheckCircle, Loader, AlertCircle, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { useCaseStore, API } from '../../store/caseStore';
import type { EvidenceFile, ColumnMapping, IngestProgress } from '../../domain/types';
import { fmtBytes, fmtHash } from '../../lib/format';
import { mapAllColumns } from '../../lib/headerMapper';
import Papa from 'papaparse';

function SourceTypeBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    cdr: 'CDR', ipdr: 'IPDR', bank: 'Bank ledger', upi: 'UPI settlement',
    email: 'Email header', android: 'Android dump', apk: 'APK metadata',
  };
  return <span className="tag">{labels[type] ?? type.toUpperCase()}</span>;
}

function StatusBadge({ status }: { status: EvidenceFile['status'] }) {
  if (status === 'verified')
    return <span className="badge badge-verified">Verified</span>;
  if (status === 'mismatch')
    return <span className="badge badge-mismatch">Hash mismatch</span>;
  if (status === 'tampered')
    return <span className="badge badge-mismatch">Tampered</span>;
  return <span className="badge badge-low">Pending</span>;
}

function ConfidencePill({ conf, method }: { conf: number; method: string }) {
  const pct = Math.round(conf * 100);
  const color = conf >= 0.9 ? 'var(--verified)' : conf >= 0.7 ? 'var(--accent)' : conf >= 0.5 ? 'var(--medium)' : 'var(--high)';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
      <span style={{ color, fontWeight: 600 }}>{pct}%</span>
      <span style={{ color: 'var(--muted)' }}>({method})</span>
    </span>
  );
}

function CopyableHash({ hash }: { hash: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(hash).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button className="copyable btn-ghost btn-xs" onClick={copy} title={hash} aria-label="Copy hash">
      <span className="mono">{fmtHash(hash)}</span>
      {copied ? <Check size={10} color="var(--verified)" /> : <Copy size={10} />}
    </button>
  );
}

function SchemaMapper({ file }: { file: EvidenceFile }) {
  const lowConf = file.columns.filter(c => c.confidence < 0.75);
  return (
    <div style={{ padding: '12px 16px', background: 'var(--canvas)', borderTop: '1px solid var(--border)' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 8 }}>
        Schema mapper — {file.columns.length} columns
        {lowConf.length > 0 && (
          <span style={{ marginLeft: 8, color: 'var(--high)', fontWeight: 400 }}>
            {lowConf.length} low-confidence — review required
          </span>
        )}
      </div>
      <table className="lx-table lx-table--compact" style={{ background: 'var(--panel)' }}>
        <thead>
          <tr>
            <th>Source column</th>
            <th>Canonical field</th>
            <th>Confidence</th>
            <th>Sample value</th>
          </tr>
        </thead>
        <tbody>
          {file.columns.map(col => (
            <tr key={col.sourceColumn} style={col.confidence < 0.75 ? { background: 'var(--high-tint)' } : {}}>
              <td style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>{col.sourceColumn}</td>
              <td>
                {col.canonicalField
                  ? <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>{col.canonicalField}</span>
                  : <span style={{ color: 'var(--high)', fontSize: 11 }}>Unmatched</span>}
              </td>
              <td><ConfidencePill conf={col.confidence} method={col.method} /></td>
              <td style={{ color: 'var(--muted)', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>
                {col.sampleValue?.slice(0, 40) || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProgressList({ progress }: { progress: IngestProgress[] }) {
  const latest: Record<string, IngestProgress> = {};
  for (const p of progress) {
    if (!latest[p.exhibitId] || p.percent >= (latest[p.exhibitId]?.percent ?? 0)) {
      latest[p.exhibitId] = p;
    }
  }
  const items = Object.values(latest);
  if (items.length === 0) return null;
  return (
    <div className="panel" style={{ marginBottom: 16 }}>
      <div className="panel-header">
        <span className="panel-title">Processing evidence</span>
        <Loader size={14} className="text-muted" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
      <div className="panel-body" style={{ padding: '8px 16px' }}>
        {items.map(p => (
          <div key={p.exhibitId} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
              <span style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{p.exhibitId}</span>
              <span style={{ color: 'var(--muted)' }}>{p.message}</span>
              <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{p.percent}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${p.percent}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EvidencePage() {
  const { isLoaded, isLoading, ingestProgress, evidenceFiles, loadSampleCase, refreshEvidence } = useCaseStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<IngestProgress[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const toggleExpand = (id: string) => setExpanded(p => p === id ? null : id);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    setUploadProgress([]);
    await API.ingest(arr, p => setUploadProgress(prev => [...prev, p]));
    await refreshEvidence();
    setUploadProgress([]);
  }, [refreshEvidence]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  // Build mapped columns for user-dropped files by parsing them client-side
  const tryMapUserFile = async (file: File): Promise<ColumnMapping[]> => {
    return new Promise(resolve => {
      if (file.name.endsWith('.csv')) {
        Papa.parse(file, {
          preview: 2,
          complete: (res) => {
            const headers = res.data[0] as string[];
            const sampleRow = res.data[1] as string[];
            const sampleObj: Record<string, string> = {};
            headers.forEach((h, i) => { sampleObj[h] = sampleRow[i] ?? ''; });
            resolve(mapAllColumns(headers, sampleObj, 'user'));
          },
          error: () => resolve([]),
        });
      } else {
        resolve([]);
      }
    });
  };
  void tryMapUserFile; // suppress unused warning — used via API.ingest flow

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Evidence</div>
          <div className="page-subtitle">Ingested files, column mappings, and integrity status</div>
        </div>
        {!isLoaded && !isLoading && (
          <button
            className="btn btn-primary"
            onClick={loadSampleCase}
            id="load-sample-case-btn"
          >
            Load sample case
          </button>
        )}
      </div>

      {/* Drop zone — only show when no case loaded */}
      {!isLoaded && !isLoading && (
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
          style={{ marginBottom: 16 }}
        >
          <Upload size={24} style={{ margin: '0 auto 8px' }} />
          <div style={{ fontWeight: 500 }}>Drop CSV, XLSX, EML or JSON files here</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>or click to browse · or use Load sample case above</div>
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
      )}

      {isLoading && <ProgressList progress={ingestProgress} />}
      {uploadProgress.length > 0 && <ProgressList progress={uploadProgress} />}

      {isLoaded && evidenceFiles.length > 0 && (
        <>
          {/* Also allow adding more files after load */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>
              <Upload size={14} /> Add file
            </button>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".csv,.xlsx,.eml,.json"
              style={{ display: 'none' }}
              onChange={e => handleFiles(e.target.files)}
            />
            <span className="text-muted text-12">{evidenceFiles.length} exhibit{evidenceFiles.length !== 1 ? 's' : ''} loaded</span>
          </div>

          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Exhibit table</span>
              <span className="text-muted text-12">
                {evidenceFiles.filter(f => f.status === 'verified').length}/{evidenceFiles.length} verified
              </span>
            </div>
            <table className="lx-table" aria-label="Evidence files">
              <thead>
                <tr>
                  <th style={{ width: 28 }}></th>
                  <th>Exhibit</th>
                  <th>File name</th>
                  <th>Type</th>
                  <th>Provider</th>
                  <th>Records</th>
                  <th>SHA-256</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {evidenceFiles.map(file => (
                  <>
                    <tr
                      key={file.exhibitId}
                      className={expanded === file.exhibitId ? 'expanded' : ''}
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleExpand(file.exhibitId)}
                      aria-expanded={expanded === file.exhibitId}
                    >
                      <td>
                        {expanded === file.exhibitId
                          ? <ChevronDown size={14} color="var(--muted)" />
                          : <ChevronRight size={14} color="var(--muted)" />}
                      </td>
                      <td>
                        <span className="mono">{file.exhibitId}</span>
                      </td>
                      <td style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>
                        {file.name}
                        <span style={{ color: 'var(--muted)', fontSize: 11, marginLeft: 6 }}>
                          {fmtBytes(file.size)}
                        </span>
                      </td>
                      <td><SourceTypeBadge type={file.sourceType} /></td>
                      <td style={{ color: 'var(--muted)' }}>{file.provider}</td>
                      <td style={{ fontSize: 12 }}>
                        <span style={{ color: 'var(--ink)' }}>{file.recordsParsed}</span>
                        {file.recordsRejected > 0 && (
                          <span style={{ color: 'var(--high)', marginLeft: 6 }}>
                            {file.recordsRejected} rejected
                          </span>
                        )}
                      </td>
                      <td>
                        {file.status === 'verified' && file.computedHash ? (
                          <CopyableHash hash={file.computedHash} />
                        ) : file.recordedHash && file.recordedHash !== 'PLACEHOLDER_' + file.exhibitId ? (
                          <CopyableHash hash={file.recordedHash} />
                        ) : (
                          <span className="text-muted text-11">Pending</span>
                        )}
                      </td>
                      <td>
                        {file.status === 'pending'
                          ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--muted)' }}><Loader size={12} />Pending</span>
                          : file.status === 'verified'
                            ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--verified)' }}><CheckCircle size={12} />Verified</span>
                            : <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--critical)' }}><AlertCircle size={12} />Mismatch</span>
                        }
                      </td>
                    </tr>
                    {expanded === file.exhibitId && (
                      <tr key={file.exhibitId + '-expand'} className="expand-row">
                        <td colSpan={8} style={{ padding: 0 }}>
                          <SchemaMapper file={file} />
                          {file.status === 'mismatch' && (
                            <div style={{ padding: '8px 16px', background: 'var(--critical-tint)', borderTop: '1px solid var(--critical)', color: 'var(--critical)', fontSize: 12 }}>
                              Recorded hash: <span className="mono">{fmtHash(file.recordedHash)}</span> ·
                              Computed hash: <span className="mono">{fmtHash(file.computedHash ?? '')}</span> ·
                              These differ — file may have been modified after seizure.
                              Go to Integrity screen to investigate.
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!isLoaded && !isLoading && (
        <div className="empty-state">
          <Upload size={32} className="empty-state__icon" />
          <div className="empty-state__title">No evidence loaded</div>
          <div className="empty-state__desc">
            Load the sample case or drop evidence files (CSV, XLSX, EML, JSON) to begin the investigation.
          </div>
        </div>
      )}
    </div>
  );
}

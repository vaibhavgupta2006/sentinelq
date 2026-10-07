import { useState, useEffect, useMemo, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../store/useToastStore';
import {
  Database, Search, Download, Shield, CheckCircle, AlertOctagon,
  Clock, X, ChevronDown, Activity, Lock, RefreshCw, AlertTriangle, ExternalLink
} from 'lucide-react';
import {
  buildLedger, verifyChain, truncateHash
} from '../services/ledgerService';
import type { LedgerEntry } from '../services/ledgerService';
import { exportLedgerCSV, generateForensicReportHTML, openPrintableReport } from '../services/exportService';

const ACTION_COLOR: Record<string, string> = {
  AUTO_BLOCK:              'text-accent-danger',
  CONFIRM_BLOCK_SAR:       'text-accent-danger',
  WHITELIST_FALSE_POSITIVE:'text-accent-safe',
  STATUS_UNDER_REVIEW:     'text-accent-neutral',
  CLOSE_CASE_CLOSED_FRAUD: 'text-accent-danger',
  CLOSE_CASE_CONFIRMED_FRAUD: 'text-accent-danger',
  CLOSE_CASE:              'text-slate-400',
};

const DECISION_COLOR: Record<string, string> = {
  PRE_SETTLEMENT_BLOCKED: 'text-accent-danger',
  REVIEW:                 'text-orange-500',
  APPROVED:               'text-accent-safe',
};

type VerifyState = 'idle' | 'verifying' | 'valid' | 'invalid';

export const Ledger = () => {
  const navigate = useNavigate();
  const auditRecords  = useStore(s => s.auditRecords);
  const transactions  = useStore(s => s.transactions);
  const fraudCases    = useStore(s => s.fraudCases);
  const toast = useToastStore(s => s.push);

  const [entries, setEntries]         = useState<LedgerEntry[]>([]);
  const [building, setBuilding]       = useState(true);
  const [verifyState, setVerifyState] = useState<VerifyState>('idle');
  const [failedAt, setFailedAt]       = useState<number | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);

  // Filters
  const [search,      setSearch]      = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [riskThreshold, setRiskThreshold] = useState(0);

  // Build ledger from store data
  useEffect(() => {
    let isCurrent = true;
    buildLedger(auditRecords, transactions).then(built => {
      if (isCurrent) {
        setEntries(built);
        setBuilding(false);
      }
    });
    return () => { isCurrent = false; };
  }, [auditRecords, transactions]);

  const allActions = useMemo(() =>
    ['ALL', ...Array.from(new Set(entries.map(e => e.action)))],
  [entries]);

  const filtered = useMemo(() => entries.filter(e => {
    if (actionFilter !== 'ALL' && e.action !== actionFilter) return false;
    if (riskThreshold > 0 && e.anomalyScore < riskThreshold) return false;
    if (search) {
      const t = search.toLowerCase();
      if (!e.transactionId.toLowerCase().includes(t) && !e.ledgerHash.includes(t) && !e.action.toLowerCase().includes(t)) return false;
    }
    return true;
  }), [entries, actionFilter, riskThreshold, search]);

  const handleVerify = useCallback(async () => {
    setVerifyState('verifying');
    setFailedAt(null);
    const result = await verifyChain([...entries].reverse());
    if (result.valid) {
      setVerifyState('valid');
      toast(`Ledger integrity verified — ${entries.length} records confirmed unmodified`, 'success');
    } else {
      setVerifyState('invalid');
      setFailedAt(result.failedAt ?? null);
      toast('Ledger integrity failure — potential tampering detected. Escalate immediately.', 'danger');
    }
  }, [entries, toast]);

  const exportCSV = useCallback(() => {
    const dataToExport = filtered.length > 0 ? filtered : entries;
    exportLedgerCSV(dataToExport);
    toast(`Exported ${dataToExport.length} ledger records to CSV`, 'success');
  }, [filtered, entries, toast]);

  const exportEntryReport = useCallback((entry: LedgerEntry) => {
    const tx = transactions.find(t => t.id === entry.transactionId);
    const linkedCase = fraudCases.find(c => c.relatedTransactions.includes(entry.transactionId) || c.id === entry.transactionId);
    const html = generateForensicReportHTML({
      caseId: linkedCase?.id,
      caseTitle: linkedCase?.title || `Audit Verification: ${entry.transactionId}`,
      caseStatus: linkedCase?.status || 'CONFIRMED_FRAUD',
      caseSeverity: (entry.anomalyScore >= 80 || entry.networkScore >= 80) ? 'CRITICAL' : 'HIGH',
      transaction: tx || null,
      ledgerEntry: entry,
    });
    openPrintableReport(html, `SentinelQ_Audit_${entry.transactionId}`);
    toast('Audit Forensic Certificate generated', 'success');
  }, [transactions, fraudCases, toast]);

  return (
    <div className="flex h-full gap-4 relative text-slate-200">
      <div className={`flex-1 flex flex-col gap-4 transition-all duration-300 ${selectedEntry ? 'pr-[440px]' : ''}`}>

        {/* Header */}
        <header className="mb-2">
          <h1 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-slate-400" /> Cryptographic Audit Ledger
          </h1>
          <p className="text-sm text-slate-400">Hash-Chained Audit Registry — immutable record of all system decisions and analyst actions.</p>
        </header>

        {/* Status Bar */}
        <div className="bg-panel border border-panel-border rounded p-3 flex flex-wrap items-center gap-6 text-xs font-medium">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-accent-safe" />
            <span className="text-slate-500">Ledger Status:</span>
            <span className={`font-bold ${verifyState === 'invalid' ? 'text-accent-danger' : 'text-accent-safe'}`}>
              {verifyState === 'invalid' ? 'INTEGRITY FAILURE' : 'VALID'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Algorithm:</span>
            <span className="font-mono text-slate-300">SHA-256</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Records:</span>
            <span className="font-bold text-slate-200">{entries.length.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500">Last Verification:</span>
            <span className="text-slate-300">{verifyState === 'idle' ? 'Not run' : 'Just now'}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleVerify}
              disabled={verifyState === 'verifying' || building}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-panel-border rounded text-xs font-semibold transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-neutral"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${verifyState === 'verifying' ? 'animate-spin' : ''}`} />
              {verifyState === 'verifying' ? 'Verifying…' : 'Verify Ledger Integrity'}
            </button>
          </div>
        </div>

        {/* Verification Result Banner */}
        {verifyState === 'valid' && (
          <div className="flex items-center gap-3 px-4 py-3 bg-accent-safe/10 border border-accent-safe/30 rounded">
            <Shield className="w-5 h-5 text-accent-safe shrink-0" />
            <div>
              <div className="text-sm font-bold text-accent-safe">Tamper-Proof Audit Seal Validated</div>
              <div className="text-xs text-slate-400">SHA-256 chain integrity verified — {entries.length} records confirmed unmodified.</div>
            </div>
          </div>
        )}
        {verifyState === 'invalid' && (
          <div className="flex items-center gap-3 px-4 py-3 bg-accent-danger/10 border border-accent-danger/40 rounded">
            <AlertTriangle className="w-5 h-5 text-accent-danger shrink-0" />
            <div>
              <div className="text-sm font-bold text-accent-danger">Ledger Integrity Failure — Potential Tampering Detected</div>
              <div className="text-xs text-slate-400">
                Hash mismatch at record sequence {failedAt !== null ? failedAt + 1 : 'unknown'}.
                Escalate to Compliance immediately.
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Records', value: entries.length, icon: Database, color: 'text-slate-200' },
            { label: 'Auto-Blocked', value: entries.filter(e => e.action === 'AUTO_BLOCK').length, icon: AlertOctagon, color: 'text-accent-danger' },
            { label: 'SAR Issued', value: entries.filter(e => e.action === 'CONFIRM_BLOCK_SAR').length, icon: Shield, color: 'text-orange-500' },
            { label: 'Whitelisted', value: entries.filter(e => e.action === 'WHITELIST_FALSE_POSITIVE').length, icon: CheckCircle, color: 'text-accent-safe' },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-panel border border-panel-border rounded p-3 flex items-center gap-3">
                <Icon className={`w-5 h-5 shrink-0 ${s.color}`} />
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{s.label}</div>
                  <div className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-panel border border-panel-border rounded p-3 flex flex-wrap items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-2 flex-1 min-w-[180px]">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              className="bg-transparent outline-none flex-1 placeholder-slate-500 text-slate-200"
              placeholder="Search by TX ID, hash, action..."
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="h-4 w-px bg-panel-border" />
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Action:</span>
            <select className="bg-slate-800 border border-panel-border rounded px-2 py-1 outline-none" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
              {allActions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Min Anomaly:</span>
            <select className="bg-slate-800 border border-panel-border rounded px-2 py-1 outline-none" value={riskThreshold} onChange={e => setRiskThreshold(+e.target.value)}>
              <option value={0}>Any</option>
              <option value={40}>≥ 40 Medium</option>
              <option value={65}>≥ 65 High</option>
              <option value={85}>≥ 85 Critical</option>
            </select>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-panel-border rounded transition-colors ml-auto"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>

        {/* Main Table */}
        <div className="bg-panel border border-panel-border rounded flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between px-4 py-2 border-b border-panel-border shrink-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-safe" />
              {building ? 'Building ledger…' : `${filtered.length} records · Hash-chained SHA-256`}
            </span>
            {building && <Activity className="w-4 h-4 text-slate-500 animate-spin" />}
          </div>

          <div className="overflow-auto flex-1 text-[11px]">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1000px]">
              <thead className="bg-slate-900/60 text-slate-400 sticky top-0 backdrop-blur-sm border-b border-panel-border z-10">
                <tr>
                  <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Seq</th>
                  <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Timestamp</th>
                  <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">TX / Resource</th>
                  <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Action</th>
                  <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-center">Anomaly</th>
                  <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-center">Network</th>
                  <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Decision</th>
                  <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">PII Hash</th>
                  <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Ledger Hash</th>
                  <th className="py-2.5 px-3 font-semibold uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panel-border">
                {filtered.map((entry) => (
                  <tr
                    key={entry.ledgerHash}
                    onClick={() => setSelectedEntry(entry)}
                    className={`cursor-pointer transition-colors ${selectedEntry?.ledgerHash === entry.ledgerHash ? 'bg-slate-800/80' : 'hover:bg-slate-800/40'} ${failedAt !== null && (entries.length - entry.seq) === failedAt ? 'bg-accent-danger/5 border-l-2 border-l-accent-danger' : ''}`}
                  >
                    <td className="py-2.5 px-3 font-mono text-slate-500">#{entry.seq}</td>
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300 max-w-[140px] truncate">{entry.transactionId.slice(0, 20)}…</td>
                    <td className="py-2.5 px-3">
                      <span className={`font-bold ${ACTION_COLOR[entry.action] || 'text-slate-300'}`}>{entry.action}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      <span className={entry.anomalyScore >= 85 ? 'text-accent-danger font-bold' : entry.anomalyScore >= 65 ? 'text-orange-500' : 'text-slate-400'}>
                        {entry.anomalyScore}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400">{entry.networkScore}</td>
                    <td className="py-2.5 px-3">
                      <span className={`font-semibold ${DECISION_COLOR[entry.decision] || 'text-slate-400'}`}>
                        {entry.decision || '—'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{truncateHash(entry.piiHash)}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{truncateHash(entry.ledgerHash)}</td>
                    <td className="py-2.5 px-3">
                      <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                    </td>
                  </tr>
                ))}
                {!building && filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center">
                        <Database className="w-8 h-8 text-slate-700 mb-2" />
                        <p>No records match your filters.</p>
                        <p className="text-slate-600 mt-1 text-xs">Audit records are generated automatically by system and analyst actions.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Drawer */}
      {selectedEntry && (
        <div className="absolute right-0 top-0 bottom-0 w-full md:w-[440px] bg-panel border-l border-panel-border shadow-lg flex flex-col z-20 text-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-panel-border bg-slate-900/50 shrink-0">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-400" /> Record #{selectedEntry.seq}
            </h3>
            <button 
              onClick={() => setSelectedEntry(null)} 
              className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-neutral"
              aria-label="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Verification badge */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded border text-xs font-bold ${verifyState === 'invalid' && failedAt !== null && (entries.length - selectedEntry.seq) === failedAt ? 'bg-accent-danger/10 border-accent-danger/30 text-accent-danger' : 'bg-accent-safe/10 border-accent-safe/30 text-accent-safe'}`}>
              <Shield className="w-4 h-4" />
              {verifyState === 'invalid' && failedAt !== null && (entries.length - selectedEntry.seq) === failedAt
                ? 'HASH MISMATCH — Integrity Failure'
                : 'Record Integrity: OK'}
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <InfoBlock label="Seq" value={`#${selectedEntry.seq}`} mono />
              <InfoBlock label="Actor" value={selectedEntry.actor} />
              <InfoBlock label="Action" value={selectedEntry.action} color={ACTION_COLOR[selectedEntry.action]} />
              <InfoBlock label="Decision" value={selectedEntry.decision || '—'} color={DECISION_COLOR[selectedEntry.decision]} />
              <InfoBlock label="Anomaly Score" value={String(selectedEntry.anomalyScore)} />
              <InfoBlock label="Network Score" value={String(selectedEntry.networkScore)} />
            </div>

            {/* Hashes */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-panel-border pb-1">Cryptographic Hashes</h4>
              <HashBlock label="Ledger Hash (this record)" hash={selectedEntry.ledgerHash} />
              <HashBlock label="Previous Ledger Hash" hash={selectedEntry.previousLedgerHash} />
              <HashBlock label="PII Hash (synthetic)" hash={selectedEntry.piiHash} />
            </div>

            {/* Payload */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-panel-border pb-1 mb-2">Record Payload</h4>
              <pre className="text-[10px] font-mono text-slate-400 bg-slate-950 border border-panel-border rounded p-3 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(selectedEntry.payload, null, 2)}
              </pre>
            </div>

            <div className="p-3 bg-slate-900 border border-panel-border rounded text-[10px] text-slate-500 leading-relaxed">
              <strong className="text-slate-400">Note:</strong> This is a hash-chained audit registry — not a blockchain.
              The SHA-256 chain ensures records cannot be silently altered.
              PII Hash is derived from synthetic/masked identifiers only; no raw PII is stored.
            </div>
          </div>
          
          {/* Drawer footer navigation */}
          <div className="border-t border-panel-border px-5 py-3 bg-slate-900/60 flex flex-col gap-2 shrink-0">
            <button
              onClick={() => exportEntryReport(selectedEntry)}
              className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-panel-border text-xs font-semibold rounded transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-accent-neutral" /> Export Audit Report (PDF)
            </button>
            <button
              onClick={() => { navigate('/interceptions'); setSelectedEntry(null); }}
              className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-semibold rounded transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> View Transaction in Interceptions
            </button>
            {selectedEntry.action === 'CONFIRM_BLOCK_SAR' && (
              <button
                onClick={() => { navigate('/cases'); setSelectedEntry(null); }}
                className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-transparent hover:bg-slate-800 text-slate-400 text-xs font-medium rounded transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Related Case
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-components
const InfoBlock = ({ label, value, mono, color }: { label: string; value: string; mono?: boolean; color?: string }) => (
  <div className="bg-slate-900 p-2.5 rounded border border-panel-border">
    <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-1">{label}</div>
    <div className={`text-xs font-semibold truncate ${color || 'text-slate-200'} ${mono ? 'font-mono' : ''}`}>{value}</div>
  </div>
);

const HashBlock = ({ label, hash }: { label: string; hash: string }) => (
  <div>
    <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-1">{label}</div>
    <div className="font-mono text-[10px] text-slate-300 bg-slate-950 border border-panel-border rounded px-2.5 py-1.5 break-all leading-relaxed">{hash}</div>
  </div>
);

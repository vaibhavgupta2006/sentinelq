import { useState, useMemo, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { useToastStore } from '../store/useToastStore';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Shield, AlertOctagon, CheckCircle, Clock, FileText, User, Search,
  ChevronRight, X, RefreshCw, Download, AlertTriangle, Activity,
  Network, Smartphone, Server, GitFork
} from 'lucide-react';
import type { FraudCase } from '../types';
import { generateTransactionId } from '../utils/crypto';
import { generateCaseBrief } from '../services/caseBriefService';
import type { CaseBrief } from '../services/caseBriefService';
import { generateMockNetwork } from '../data/networkMock';
import type { GraphNode } from '../utils/graphAnalysis';
import { generateForensicReportHTML, openPrintableReport, exportToCSV } from '../services/exportService';

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const SEVERITY_BADGE: Record<string, string> = {
  CRITICAL: 'bg-accent-danger/10 text-accent-danger border-accent-danger/30',
  HIGH:     'bg-orange-500/10 text-orange-500 border-orange-500/30',
  MEDIUM:   'bg-accent-warning/10 text-accent-warning border-accent-warning/30',
  LOW:      'bg-slate-700 text-slate-300 border-slate-600',
};

const STATUS_META: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  OPEN:             { label: 'Open',             color: 'text-accent-warning', icon: AlertTriangle },
  UNDER_REVIEW:     { label: 'Under Review',     color: 'text-accent-neutral', icon: Clock },
  CONFIRMED_FRAUD:  { label: 'Confirmed Fraud',  color: 'text-accent-danger',  icon: AlertOctagon },
  FALSE_POSITIVE:   { label: 'False Positive',   color: 'text-accent-safe',    icon: CheckCircle },
  INVESTIGATING:    { label: 'Investigating',    color: 'text-accent-neutral', icon: Clock },
  CLOSED:           { label: 'Closed',           color: 'text-slate-400',      icon: CheckCircle },
  CLOSED_FRAUD:     { label: 'Closed – Fraud',   color: 'text-accent-danger',  icon: AlertOctagon },
  CLOSED_FALSE_POSITIVE: { label: 'Closed – FP', color: 'text-accent-safe',   icon: CheckCircle },
};

const TIMELINE_STYLES: Record<string, string> = {
  initiation:   'bg-slate-700 border-slate-600',
  detection:    'bg-orange-500/30 border-orange-500/50',
  correlation:  'bg-accent-neutral/20 border-accent-neutral/40',
  interception: 'bg-accent-danger/20 border-accent-danger/40',
  case:         'bg-slate-600 border-slate-500',
  analyst:      'bg-accent-safe/20 border-accent-safe/40',
};

// Shared mock network nodes for inspector
const { nodes: allNetworkNodes } = generateMockNetwork();

export const Cases = () => {
  const { caseId: paramCaseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  const fraudCases = useStore(s => s.fraudCases);
  const transactions = useStore(s => s.transactions);
  const auditRecords = useStore(s => s.auditRecords);
  const updateFraudCase = useStore(s => s.updateFraudCase);
  const addAuditRecord = useStore(s => s.addAuditRecord);

  const toast = useToastStore(s => s.push);

  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [briefVariant, setBriefVariant] = useState(0);

  const selectedCaseId = paramCaseId || activeCaseId || (fraudCases.length > 0 ? fraudCases[0].id : null);

  const filteredCases = useMemo(() => fraudCases.filter(c => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (search) {
      const t = search.toLowerCase();
      if (!c.title.toLowerCase().includes(t) && !c.id.toLowerCase().includes(t)) return false;
    }
    return true;
  }), [fraudCases, statusFilter, search]);

  const selectedCase = useMemo(() =>
    fraudCases.find(c => c.id === selectedCaseId) ?? null,
  [fraudCases, selectedCaseId]);

  const relatedTx = useMemo(() =>
    selectedCase ? transactions.find(t => selectedCase.relatedTransactions.includes(t.id)) ?? null : null,
  [selectedCase, transactions]);

  const relatedNodes = useMemo<GraphNode[]>(() => {
    if (!selectedCase) return [];
    return allNetworkNodes.filter(n => selectedCase.relatedEntities.includes(n.id)).slice(0, 8);
  }, [selectedCase]);

  const brief = useMemo<CaseBrief | null>(() => {
    if (!relatedTx || !selectedCase) return null;
    return generateCaseBrief(relatedTx, relatedNodes, selectedCase, briefVariant);
  }, [relatedTx, relatedNodes, selectedCase, briefVariant]);

  const handleExportForensicReport = useCallback(() => {
    if (!selectedCase) return;
    const latestAudit = auditRecords.find(a => a.resourceId === selectedCase.id || (relatedTx && a.resourceId === relatedTx.id));
    const html = generateForensicReportHTML({
      caseId: selectedCase.id,
      caseTitle: selectedCase.title,
      caseStatus: selectedCase.status,
      caseSeverity: selectedCase.severity,
      assignee: selectedCase.assignee,
      createdAt: selectedCase.createdAt,
      updatedAt: selectedCase.updatedAt,
      transaction: relatedTx,
      brief,
      relatedNodes,
      notes: selectedCase.notes,
      ledgerEntry: latestAudit ? {
        seq: 1,
        timestamp: latestAudit.timestamp,
        transactionId: relatedTx?.id || selectedCase.id,
        anomalyScore: relatedTx?.anomalyScore || 85,
        networkScore: relatedTx?.networkRiskScore || 90,
        decision: relatedTx?.decision || 'PRE_SETTLEMENT_BLOCKED',
        piiHash: '0x8f3c7d9a1b2e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a',
        actor: latestAudit.actor,
        action: latestAudit.action,
        payload: latestAudit.details,
        previousLedgerHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        ledgerHash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
        verified: true
      } : null
    });
    openPrintableReport(html, `SentinelQ_Forensic_Report_${selectedCase.id}`);
    toast('Forensic Investigation Report generated & ready for PDF save', 'success');
  }, [selectedCase, relatedTx, brief, relatedNodes, auditRecords, toast]);

  const handleExportCasesCSV = useCallback(() => {
    const headers = ['Case ID', 'Title', 'Severity', 'Status', 'Assignee', 'Created At', 'Updated At', 'Related Tx Count', 'Related Entities'];
    const rows = filteredCases.map(c => [
      c.id,
      c.title,
      c.severity,
      c.status,
      c.assignee || 'Unassigned',
      c.createdAt,
      c.updatedAt,
      c.relatedTransactions.length,
      c.relatedEntities.join('; ')
    ]);
    exportToCSV(`sentinelq_cases_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
    toast(`Exported ${filteredCases.length} fraud cases to CSV`, 'success');
  }, [filteredCases, toast]);

  const applyAction = useCallback((action: string, updates: Partial<FraudCase>, successMsg?: string) => {
    if (!selectedCase) return;
    updateFraudCase(selectedCase.id, { ...updates, updatedAt: new Date().toISOString() });
    addAuditRecord({
      id: generateTransactionId('aud_'),
      timestamp: new Date().toISOString(),
      actor: 'Operator-7',
      action,
      resourceType: 'CASE',
      resourceId: selectedCase.id,
      details: updates,
    });
    if (successMsg) toast(successMsg, updates.status?.includes('FRAUD') ? 'danger' : 'success');
  }, [selectedCase, updateFraudCase, addAuditRecord, toast]);

  return (
    <div className="flex flex-col md:flex-row h-full gap-0 text-slate-200 border border-panel-border rounded overflow-hidden">
      {/* ── LEFT SIDEBAR: CASE LIST ─────────────────────────── */}
      <div className={`w-full md:w-72 shrink-0 flex flex-col md:border-r border-panel-border bg-panel ${selectedCase ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-3 border-b border-panel-border">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" /> Case Briefs
            </h1>
            <button
              onClick={handleExportCasesCSV}
              title="Export Cases to CSV"
              className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-panel-border rounded transition-colors"
            >
              <Download className="w-3 h-3 text-slate-400" /> CSV
            </button>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 border border-panel-border px-2.5 py-1.5 rounded text-xs mb-2">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <input className="bg-transparent outline-none flex-1 placeholder-slate-500 text-slate-200" placeholder="Search cases..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="w-full bg-slate-800 border border-panel-border rounded px-2 py-1 text-xs outline-none text-slate-300" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="CONFIRMED_FRAUD">Confirmed Fraud</option>
            <option value="FALSE_POSITIVE">False Positive</option>
            <option value="CLOSED_FRAUD">Closed – Fraud</option>
            <option value="CLOSED_FALSE_POSITIVE">Closed – FP</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-panel-border">
          {filteredCases.map(c => {
            const meta = STATUS_META[c.status] || STATUS_META.OPEN;
            const Icon = meta.icon;
            const isActive = c.id === selectedCaseId;
            return (
              <button key={c.id} onClick={() => { setActiveCaseId(c.id); setBriefVariant(0); }} className={`w-full text-left p-3 transition-colors ${isActive ? 'bg-slate-800' : 'hover:bg-slate-800/50'}`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${SEVERITY_BADGE[c.severity]}`}>{c.severity}</span>
                  <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${meta.color}`}><Icon className="w-2.5 h-2.5" /> {meta.label}</span>
                </div>
                <div className="text-xs font-medium text-slate-200 leading-snug mb-1 line-clamp-2">{c.title}</div>
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span className="font-mono">{c.id.slice(0, 14)}…</span>
                  <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                {isActive && <ChevronRight className="absolute right-0 top-1/2 w-3 h-3 text-slate-500" />}
              </button>
            );
          })}
          {filteredCases.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-xs px-4">
              <FileText className="w-6 h-6 text-slate-700 mx-auto mb-2" />
              No cases. Confirm blocks on the Interceptions page to create cases.
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT DETAIL AREA ───────────────────────────────── */}
      {selectedCase ? (
        <div className={`flex-1 flex flex-col min-w-0 overflow-hidden bg-background ${selectedCase ? 'flex' : 'hidden md:flex'}`}>
          {/* Case Header */}
          <div className="border-b border-panel-border bg-panel px-6 py-4 shrink-0 relative">
            <button 
              className="md:hidden absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-100 bg-slate-800 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-neutral"
              onClick={() => navigate('/cases')}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="flex items-start justify-between gap-4 pr-8 md:pr-0">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-1.5">
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${SEVERITY_BADGE[selectedCase.severity]}`}>{selectedCase.severity} RISK</span>
                  {(() => {
                    const meta = STATUS_META[selectedCase.status] || STATUS_META.OPEN;
                    const Icon = meta.icon;
                    return <span className={`text-xs font-bold flex items-center gap-1.5 ${meta.color}`}><Icon className="w-3.5 h-3.5" />{meta.label}</span>;
                  })()}
                  {relatedTx && <span className="text-[10px] font-bold text-accent-danger bg-accent-danger/10 border border-accent-danger/20 px-2 py-0.5 rounded">{relatedTx.decision}</span>}
                </div>
                <h2 className="text-base font-bold text-slate-100 leading-snug mb-1">{selectedCase.title}</h2>
                <div className="flex items-center gap-4 text-[11px] text-slate-500">
                  <span className="font-mono">{selectedCase.id}</span>
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> {selectedCase.assignee || 'Unassigned'}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(selectedCase.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <button onClick={() => { setActiveCaseId(null); if (paramCaseId) navigate('/cases'); }} className="p-1 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* === EXECUTIVE SUMMARY === */}
            <Section title="Executive Summary" icon={Shield}>
              {brief ? (
                <p className="text-sm text-slate-300 leading-relaxed">{brief.executiveSummary}</p>
              ) : (
                <p className="text-sm text-slate-500 italic">No linked transaction found in the current live window. Transaction may have been pruned.</p>
              )}
            </Section>

            {/* === RISK EVIDENCE CARDS === */}
            {relatedTx && (
              <Section title="Risk Evidence" icon={AlertTriangle}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <EvidenceCard title="Transaction Anomaly" value={`${relatedTx.anomalyScore}/100`} detail={`Score significantly exceeds normal range for account type.`} level={relatedTx.anomalyScore >= 70 ? 'danger' : 'warning'} />
                  <EvidenceCard title="Network Cycle" value={relatedTx.networkRiskScore >= 70 ? 'DETECTED' : 'LOW RISK'} detail={`Network risk score: ${relatedTx.networkRiskScore}/100. Circular transfer pattern flagged.`} level={relatedTx.networkRiskScore >= 70 ? 'danger' : 'neutral'} />
                  <EvidenceCard title="Device Reuse" value={`fp_${relatedTx.deviceFingerprint.slice(3, 11)}`} detail={`Device fingerprint associated with multiple flagged accounts.`} level="warning" />
                  <EvidenceCard title="IP Correlation" value={relatedTx.ipAddress} detail={`IP address matches known datacenter or VPN egress block.`} level="warning" />
                  <EvidenceCard title="Velocity Anomaly" value={`${relatedTx.processingLatency}ms`} detail={`Linked chain of transfers detected within short settlement window.`} level={relatedTx.riskSignals.includes('UNUSUAL_VELOCITY') ? 'danger' : 'neutral'} />
                  <EvidenceCard title="High-Value Deviation" value={formatINR(relatedTx.amount)} detail={`Amount is ${(relatedTx.amount / 50000).toFixed(1)}x above account median estimate.`} level={relatedTx.amount > 100000 ? 'danger' : 'warning'} />
                </div>
              </Section>
            )}

            {/* === RISK ASSESSMENT === */}
            {brief && (
              <Section title="Risk Assessment" icon={Activity}>
                <p className="text-sm text-slate-300 leading-relaxed">{brief.riskAssessment}</p>
                {relatedTx && (
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {[
                      { label: 'Overall Risk', val: relatedTx.riskScore },
                      { label: 'Anomaly Score', val: relatedTx.anomalyScore },
                      { label: 'Network Score', val: relatedTx.networkRiskScore },
                    ].map(m => (
                      <div key={m.label} className="bg-slate-900 rounded border border-panel-border p-3">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">{m.label}</div>
                        <div className={`text-xl font-bold font-mono ${m.val >= 85 ? 'text-accent-danger' : m.val >= 65 ? 'text-orange-500' : 'text-slate-200'}`}>{m.val}<span className="text-xs text-slate-600 font-sans">/100</span></div>
                        <div className="mt-1.5 h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${m.val >= 85 ? 'bg-accent-danger' : m.val >= 65 ? 'bg-orange-500' : 'bg-accent-neutral'}`} style={{ width: `${m.val}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            )}

            {/* === NETWORK PATTERN === */}
            {brief && (
              <Section title="Network Pattern Analysis" icon={GitFork}>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">{brief.networkPattern}</p>
                {/* Related entities compact view */}
                <div className="border border-panel-border rounded p-3 bg-slate-900/50">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">Related Entities ({selectedCase.relatedEntities.length})</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedCase.relatedEntities.map(e => (
                      <span key={e} className="flex items-center gap-1.5 font-mono text-[10px] px-2 py-1 bg-slate-800 border border-panel-border rounded text-slate-300">
                        <Network className="w-2.5 h-2.5 text-accent-neutral" />{e}
                      </span>
                    ))}
                  </div>
                </div>
                {relatedNodes.length > 0 && (
                  <div className="mt-3 border border-panel-border rounded p-3 bg-slate-900/50">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">Network Node Details</div>
                    <div className="space-y-1.5">
                      {relatedNodes.map(n => (
                        <div key={n.id} className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2">
                            {n.type === 'IP' ? <Server className="w-3 h-3 text-slate-500" /> : n.type === 'DEVICE' ? <Smartphone className="w-3 h-3 text-slate-500" /> : <User className="w-3 h-3 text-slate-500" />}
                            <span className="font-mono text-slate-300">{n.id}</span>
                            <span className="text-slate-600">·</span>
                            <span className="text-slate-500">{n.type}</span>
                          </div>
                          <span className={`font-bold ${n.riskScore >= 85 ? 'text-accent-danger' : n.riskScore >= 65 ? 'text-orange-500' : 'text-slate-400'}`}>{n.riskScore}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Section>
            )}

            {/* === TIMELINE === */}
            {brief && (
              <Section title="Investigation Timeline" icon={Clock}>
                <div className="relative pl-5 space-y-0">
                  <div className="absolute left-1.5 top-1 bottom-1 w-px bg-panel-border" />
                  {brief.timeline.map((entry, i) => (
                    <div key={i} className="relative pb-4 last:pb-0">
                      <div className={`absolute -left-4 top-0.5 w-3 h-3 rounded-full border ${TIMELINE_STYLES[entry.type]}`} />
                      <div className="text-[10px] text-slate-500 mb-0.5">{new Date(entry.timestamp).toLocaleString()}</div>
                      <div className="text-xs font-semibold text-slate-200 mb-0.5">{entry.event}</div>
                      <div className="text-[11px] text-slate-400 leading-relaxed">{entry.detail}</div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* === AI CASE BRIEF === */}
            <Section title="Case Brief Synthesizer" icon={FileText} headerExtra={
              <button onClick={() => setBriefVariant(v => (v + 1) % 3)} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 hover:text-slate-200 px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-panel-border rounded transition-colors">
                <RefreshCw className="w-3 h-3" /> Regenerate Brief
              </button>
            }>
              {brief ? (
                <div className="space-y-4">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                    Synthesized from structured evidence — not an LLM output
                    <span className="ml-auto font-mono">v{brief.variant + 1} · {new Date(brief.generatedAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="border border-panel-border rounded bg-slate-900/60 p-4 space-y-4">
                    <BriefBlock label="Recommended Action" text={brief.recommendedAction} />
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500 italic">Brief unavailable — no linked transaction in live window.</div>
              )}
            </Section>
          </div>

          {/* === ACTION BAR === */}
          <div className="border-t border-panel-border bg-panel px-6 py-3 shrink-0">
            <div className="flex items-center flex-wrap gap-2">
              <button onClick={() => applyAction('CONFIRM_BLOCK_SAR', { status: 'CONFIRMED_FRAUD' }, 'Case confirmed as fraud — SAR filed')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-danger hover:bg-red-600 text-white text-xs font-semibold rounded transition-colors">
                <AlertOctagon className="w-3.5 h-3.5" /> Confirm Block & Issue SAR
              </button>
              <button onClick={() => applyAction('WHITELIST_FALSE_POSITIVE', { status: 'FALSE_POSITIVE' }, 'Pattern whitelisted — marked as false positive')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-semibold rounded transition-colors">
                <CheckCircle className="w-3.5 h-3.5 text-accent-safe" /> Whitelist Pattern
              </button>
              <button onClick={() => applyAction('STATUS_UNDER_REVIEW', { status: 'UNDER_REVIEW', assignee: 'Operator-7' }, 'Case assigned to Operator-7 for review')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-semibold rounded transition-colors">
                <User className="w-3.5 h-3.5" /> Assign Case
              </button>
              <button onClick={() => applyAction('CLOSE_CASE', { status: 'CLOSED_FRAUD' }, 'Case closed')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium rounded transition-colors">
                <X className="w-3.5 h-3.5" /> Close Case
              </button>
              <button onClick={handleExportForensicReport}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-semibold rounded transition-colors ml-auto">
                <Download className="w-3.5 h-3.5 text-accent-neutral" /> Export Forensic PDF
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-background text-slate-500 text-sm">
          <div className="text-center">
            <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="font-medium">Select a case to view the investigation brief</p>
            <p className="text-xs text-slate-600 mt-1">Confirm blocks on the Interceptions page to generate cases automatically</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Helper sub-components ────────────────────────────────────

const Section = ({ title, icon: Icon, children, headerExtra }: {
  title: string; icon: any; children: React.ReactNode; headerExtra?: React.ReactNode;
}) => (
  <div className="bg-panel border border-panel-border rounded">
    <div className="flex items-center justify-between px-4 py-3 border-b border-panel-border">
      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-slate-500" />{title}
      </h3>
      {headerExtra}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const EvidenceCard = ({ title, value, detail, level }: {
  title: string; value: string; detail: string; level: 'danger' | 'warning' | 'neutral';
}) => {
  const border = level === 'danger' ? 'border-l-accent-danger' : level === 'warning' ? 'border-l-accent-warning' : 'border-l-accent-neutral';
  const text   = level === 'danger' ? 'text-accent-danger'  : level === 'warning' ? 'text-accent-warning'  : 'text-accent-neutral';
  return (
    <div className={`p-3 bg-slate-900 rounded border border-panel-border border-l-2 ${border}`}>
      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">{title}</div>
      <div className={`text-sm font-bold font-mono mb-1 ${text}`}>{value}</div>
      <div className="text-[11px] text-slate-400 leading-relaxed">{detail}</div>
    </div>
  );
};

const BriefBlock = ({ label, text }: { label: string; text: string }) => (
  <div>
    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5">{label}</div>
    <p className="text-sm text-slate-300 leading-relaxed">{text}</p>
  </div>
);

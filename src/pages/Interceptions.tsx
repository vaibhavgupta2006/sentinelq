import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useToastStore } from '../store/useToastStore';
import { Search, Filter, ShieldAlert, CheckCircle, Clock, AlertTriangle, FileText, Download, X, AlertOctagon } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Transaction, FraudCase } from '../types';
import { generateTransactionId } from '../utils/crypto';
import { exportTransactionsCSV, generateForensicReportHTML, openPrintableReport } from '../services/exportService';

const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

export const Interceptions = () => {
  const navigate = useNavigate();
  const transactions = useStore(state => state.transactions);
  const fraudCases = useStore(state => state.fraudCases);
  const auditRecords = useStore(state => state.auditRecords);
  const updateTransaction = useStore(state => state.updateTransaction);
  const addFraudCase = useStore(state => state.addFraudCase);
  const addAuditRecord = useStore(state => state.addAuditRecord);
  const toast = useToastStore(s => s.push);

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(useStore.getState().selectedTransaction || null);
  
  // Filters
  const [searchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [riskFilter, setRiskFilter] = useState<string>('All');
  const [timeFilter, setTimeFilter] = useState<string>('Today');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const queryParam = searchParams.get('q') || '';
  const search = searchTerm !== '' ? searchTerm : queryParam;

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (statusFilter !== 'All') {
        const txStatus = tx.decision === 'PRE_SETTLEMENT_BLOCKED' ? 'Blocked' : tx.decision === 'REVIEW' ? 'Review' : 'Approved';
        if (statusFilter !== txStatus) return false;
      }
      
      if (riskFilter !== 'All') {
        if (riskFilter === 'Critical' && tx.riskScore < 85) return false;
        if (riskFilter === 'High' && tx.riskScore < 65) return false;
      }
      
      if (search) {
        const term = search.toLowerCase();
        if (!tx.id.toLowerCase().includes(term) && !tx.senderId.toLowerCase().includes(term) && !tx.receiverId.toLowerCase().includes(term)) {
          return false;
        }
      }
      
      // Basic time filter simulation
      const now = new Date().getTime();
      const txTime = new Date(tx.timestamp).getTime();
      if (timeFilter === 'Last 15m' && (now - txTime) > 15 * 60 * 1000) return false;
      if (timeFilter === 'Last hour' && (now - txTime) > 60 * 60 * 1000) return false;
      
      return true;
    });
  }, [transactions, statusFilter, riskFilter, timeFilter, search]);

  const handleConfirmBlock = (tx: Transaction) => {
    const caseId = generateTransactionId('case_');
    const newCase: FraudCase = {
      id: caseId,
      title: `Confirmed Fraud: ${tx.riskSignals[0]?.replace(/_/g, ' ') || 'High Risk Transfer'}`,
      status: 'INVESTIGATING',
      severity: tx.riskScore >= 85 ? 'CRITICAL' : 'HIGH',
      assignee: 'Operator-7',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      relatedTransactions: [tx.id],
      relatedEntities: [tx.senderId, tx.receiverId],
      notes: ['Auto-generated from interception queue. SAR filed. Block confirmed by Operator-7.'],
    };

    addFraudCase(newCase);
    updateTransaction(tx.id, { linkedCaseId: caseId });
    addAuditRecord({
      id: generateTransactionId('aud_'),
      timestamp: new Date().toISOString(),
      actor: 'Operator-7',
      action: 'CONFIRM_BLOCK_SAR',
      resourceType: 'TRANSACTION',
      resourceId: tx.id,
      details: { caseId, riskScore: tx.riskScore },
    });

    toast(`Case created — ${newCase.title.slice(0, 50)}`, 'danger');
    setSelectedTx(null);
    // Navigate to the new case
    navigate(`/cases/${caseId}`);
  };

  const handleFalsePositive = (tx: Transaction) => {
    updateTransaction(tx.id, { decision: 'APPROVED', status: 'COMPLETED', riskScore: 10 });
    addAuditRecord({
      id: generateTransactionId('aud_'),
      timestamp: new Date().toISOString(),
      actor: 'Operator-7',
      action: 'WHITELIST_FALSE_POSITIVE',
      resourceType: 'TRANSACTION',
      resourceId: tx.id,
      details: { originalScore: tx.riskScore, newDecision: 'APPROVED' },
    });
    toast('Pattern whitelisted — transaction reclassified as approved', 'success');
    setSelectedTx(null);
  };

  const handleExportFilteredTransactions = () => {
    const dataToExport = filteredTransactions.length > 0 ? filteredTransactions : transactions;
    exportTransactionsCSV(dataToExport, 'sentinelq_interceptions');
    toast(`Exported ${dataToExport.length} transactions to CSV`, 'success');
  };

  const handleExportTxReport = (tx: Transaction) => {
    const linkedCase = fraudCases.find(c => c.relatedTransactions.includes(tx.id) || c.id === tx.linkedCaseId);
    const latestAudit = auditRecords.find(a => a.resourceId === tx.id);
    const html = generateForensicReportHTML({
      caseId: linkedCase?.id,
      caseTitle: linkedCase?.title || `Interception Investigation: ${tx.id}`,
      caseStatus: linkedCase?.status || (tx.decision === 'PRE_SETTLEMENT_BLOCKED' ? 'CONFIRMED_FRAUD' : 'UNDER_REVIEW'),
      caseSeverity: tx.riskScore >= 85 ? 'CRITICAL' : tx.riskScore >= 65 ? 'HIGH' : 'MEDIUM',
      transaction: tx,
      ledgerEntry: latestAudit ? {
        seq: 1,
        timestamp: latestAudit.timestamp,
        transactionId: tx.id,
        anomalyScore: tx.anomalyScore,
        networkScore: tx.networkRiskScore,
        decision: tx.decision,
        piiHash: '0x3c7d9a1b2e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
        actor: latestAudit.actor,
        action: latestAudit.action,
        payload: latestAudit.details,
        previousLedgerHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        ledgerHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
        verified: true
      } : null
    });
    openPrintableReport(html, `SentinelQ_Investigation_${tx.id}`);
    toast(`Forensic report generated for transaction ${tx.id}`, 'success');
  };

  return (
    <div className="flex h-full gap-4 relative text-slate-200">
      <div className={`flex-1 flex flex-col gap-4 transition-all duration-300 ${selectedTx ? 'w-2/3 pr-[450px]' : 'w-full'}`}>
        <header className="mb-2">
          <h1 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-accent-warning" /> Fraud Interceptions
          </h1>
          <p className="text-sm text-slate-400">Transactions intercepted before settlement based on statistical and network intelligence.</p>
        </header>

        {/* Filter Bar */}
        <div className="bg-panel border border-panel-border rounded p-3 flex flex-wrap items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search Transaction ID / User / Account" 
              className="bg-transparent border-none outline-none w-full text-slate-200 placeholder-slate-500"
              value={search}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="h-4 w-px bg-panel-border"></div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500">Status:</span>
            <select className="bg-slate-800 border border-panel-border rounded px-2 py-1 outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option>All</option>
              <option>Blocked</option>
              <option>Review</option>
              <option>Approved</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Risk:</span>
            <select className="bg-slate-800 border border-panel-border rounded px-2 py-1 outline-none" value={riskFilter} onChange={e => setRiskFilter(e.target.value)}>
              <option>All</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Time:</span>
            <select className="bg-slate-800 border border-panel-border rounded px-2 py-1 outline-none" value={timeFilter} onChange={e => setTimeFilter(e.target.value)}>
              <option>Today</option>
              <option>Last hour</option>
              <option>Last 15m</option>
            </select>
          </div>

          <button
            onClick={handleExportFilteredTransactions}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-panel-border rounded transition-colors ml-auto"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" /> Export CSV
          </button>
        </div>

        {/* Main Table */}
        <div className="bg-panel border border-panel-border rounded flex flex-col flex-1 min-h-[400px]">
          <div className="overflow-auto flex-1 text-xs">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1000px]">
              <thead className="bg-slate-900/50 text-slate-400 sticky top-0 backdrop-blur-sm z-10 border-b border-panel-border">
                <tr>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Timestamp</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Transaction</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Sender</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-right">Amount</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-center">Risk</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-center">Anomaly</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-center">Network</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Primary Signal</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Decision</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panel-border">
                {filteredTransactions.map(tx => (
                  <tr 
                    key={tx.id} 
                    onClick={() => setSelectedTx(tx)}
                    className={`cursor-pointer transition-colors ${selectedTx?.id === tx.id ? 'bg-slate-800/80' : 'hover:bg-slate-800/40'}`}
                  >
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                      {new Date(tx.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-300">{tx.id}</td>
                    <td className="py-3 px-4 text-slate-300">{tx.maskedUserId}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatINR(tx.amount)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold 
                        ${tx.riskScore >= 85 ? 'bg-accent-danger/20 text-accent-danger border border-accent-danger/30' : 
                          tx.riskScore >= 65 ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' : 
                          tx.riskScore >= 40 ? 'bg-accent-neutral/20 text-accent-neutral border border-accent-neutral/30' : 
                          'bg-accent-safe/20 text-accent-safe border border-accent-safe/30'}`
                      }>
                        {tx.riskScore}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-400">{tx.anomalyScore}</td>
                    <td className="py-3 px-4 text-center text-slate-400">{tx.networkRiskScore}</td>
                    <td className="py-3 px-4 text-slate-300 truncate max-w-[150px] font-medium text-[10px]">
                      {tx.riskSignals[0]?.replace(/_/g, ' ') || 'NONE'}
                    </td>
                    <td className="py-3 px-4">
                      {tx.decision === 'PRE_SETTLEMENT_BLOCKED' && <span className="flex items-center gap-1 text-[10px] font-bold text-accent-danger bg-accent-danger/10 px-1.5 py-0.5 rounded border border-accent-danger/20 w-max"><AlertOctagon className="w-3 h-3"/> BLOCKED</span>}
                      {tx.decision === 'REVIEW' && <span className="flex items-center gap-1 text-[10px] font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20 w-max"><AlertTriangle className="w-3 h-3"/> REVIEW</span>}
                      {tx.decision === 'APPROVED' && <span className="flex items-center gap-1 text-[10px] font-bold text-accent-safe bg-accent-safe/10 px-1.5 py-0.5 rounded border border-accent-safe/20 w-max"><CheckCircle className="w-3 h-3"/> APPROVED</span>}
                    </td>
                    <td className="py-3 px-4">
                       <button className="text-slate-400 hover:text-slate-100 uppercase tracking-wider text-[10px] font-semibold flex items-center gap-1">
                          Investigate <Clock className="w-3 h-3"/>
                       </button>
                    </td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-slate-700 mb-2" />
                        <p>No interceptions match your filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Case Detail Panel */}
      {selectedTx && (
        <div className="absolute right-0 top-0 bottom-0 w-full md:w-[450px] bg-panel border-l border-panel-border shadow-lg flex flex-col z-20">
          <div className="flex items-center justify-between p-4 border-b border-panel-border bg-slate-900/50">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-slate-400" /> Interception Analysis
            </h3>
            <button 
              onClick={() => setSelectedTx(null)} 
              className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-neutral"
              aria-label="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Header info */}
            <div>
              <div className="flex justify-between items-start mb-2">
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Transaction ID</div>
                <div className={`text-[10px] font-bold px-2 py-0.5 rounded border ${selectedTx.decision === 'PRE_SETTLEMENT_BLOCKED' ? 'bg-accent-danger/10 text-accent-danger border-accent-danger/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>
                  {selectedTx.decision}
                </div>
              </div>
              <div className="font-mono text-xs text-slate-300 bg-slate-900 p-2 border border-panel-border rounded mb-4">
                {selectedTx.id}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 p-3 rounded border border-panel-border">
                  <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-semibold">Value</div>
                  <div className="text-lg font-bold font-mono tracking-tight text-slate-100">{formatINR(selectedTx.amount)}</div>
                </div>
                <div className="bg-slate-900 p-3 rounded border border-panel-border">
                  <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-semibold">Risk Score</div>
                  <div className={`text-lg font-bold font-mono tracking-tight ${selectedTx.riskScore >= 85 ? 'text-accent-danger' : selectedTx.riskScore >= 65 ? 'text-orange-500' : 'text-slate-100'}`}>
                    {selectedTx.riskScore} <span className="text-xs text-slate-500 font-sans">/ 100</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Explanations */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Why was this intercepted?</h4>
              <div className="space-y-3">
                {selectedTx.riskSignals.map(sig => (
                  <div key={sig} className="p-3 bg-slate-900/50 border border-panel-border rounded-md border-l-2 border-l-accent-danger">
                    <div className="text-xs font-bold text-slate-200 mb-1">{sig.replace(/_/g, ' ')}</div>
                    <div className="text-[11px] text-slate-400">
                      {sig.includes('VELOCITY') && "Multiple linked transfers occurred within an exceptionally short timeframe."}
                      {sig.includes('HIGH_VALUE') && `Transaction amount is highly elevated compared to the account's historical median.`}
                      {(sig.includes('NETWORK') || sig.includes('RING')) && "Sender participates in a confirmed circular transfer pattern or known fraud network."}
                      {sig.includes('IP_ANOMALY') && "Connection originates from a datacenter, VPN, or geofenced risk zone."}
                      {!['VELOCITY', 'HIGH_VALUE', 'NETWORK', 'RING', 'IP_ANOMALY'].some(k => sig.includes(k)) && "Anomalous behavior detected by the statistical scoring model."}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Raw Metrics */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-panel-border/50">
                <span className="text-slate-500">Stat Anomaly</span>
                <span className="font-mono">{selectedTx.anomalyScore}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-panel-border/50">
                <span className="text-slate-500">Network Risk</span>
                <span className="font-mono">{selectedTx.networkRiskScore}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-panel-border/50">
                <span className="text-slate-500">Device Risk</span>
                <span className="font-mono">{Math.floor(selectedTx.riskScore * 0.4)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-panel-border/50">
                <span className="text-slate-500">IP Risk</span>
                <span className="font-mono">{Math.floor(selectedTx.riskScore * 0.6)}</span>
              </div>
              <div className="col-span-2 flex justify-between py-1 border-b border-panel-border/50">
                <span className="text-slate-500">Device FP</span>
                <span className="font-mono text-[10px]">{selectedTx.deviceFingerprint}</span>
              </div>
              <div className="col-span-2 flex justify-between py-1">
                <span className="text-slate-500">IP Address</span>
                <span className="font-mono text-[10px]">{selectedTx.ipAddress}</span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="p-4 border-t border-panel-border bg-slate-900/80 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => handleConfirmBlock(selectedTx)}
                className="flex items-center justify-center gap-2 py-2 px-3 bg-accent-danger hover:bg-red-600 text-white text-xs font-semibold rounded transition-colors shadow-sm"
              >
                <ShieldAlert className="w-3.5 h-3.5" /> Confirm Block & Issue SAR
              </button>
              <button 
                onClick={() => handleFalsePositive(selectedTx)}
                className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-semibold rounded transition-colors shadow-sm"
              >
                <CheckCircle className="w-3.5 h-3.5 text-accent-safe" /> False Positive
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button 
                onClick={() => navigate(`/cases`)}
                className="flex items-center justify-center gap-2 py-1.5 px-3 bg-transparent hover:bg-slate-800 text-slate-300 text-xs font-medium rounded transition-colors"
              >
                <FileText className="w-3.5 h-3.5" /> Open Cases View
              </button>
              <button 
                onClick={() => handleExportTxReport(selectedTx)}
                className="flex items-center justify-center gap-2 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-panel-border text-xs font-medium rounded transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-accent-neutral" /> Export Forensic Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

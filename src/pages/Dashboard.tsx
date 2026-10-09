import { useMemo, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { useToastStore } from '../store/useToastStore';
import { Activity, ShieldAlert, IndianRupee, Clock, Server, Zap, Database, ExternalLink, ShieldCheck, X, PlaySquare, RefreshCw, Download, ShieldOff } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useDemoScenario } from '../hooks/useDemoScenario';
import { exportTransactionsCSV, generateForensicReportHTML, openPrintableReport } from '../services/exportService';
import { FraudSimulationModal } from '../components/dashboard/FraudSimulationModal';
import { SimulationStatusPanel } from '../components/dashboard/SimulationStatusPanel';
import { useSimulationStore } from '../store/useSimulationStore';
import { useThemeStore } from '../store/useThemeStore';

const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const { runDemo, isRunning } = useDemoScenario();
  const transactions = useStore(state => state.transactions);
  const fraudCases = useStore(state => state.fraudCases);
  const auditRecords = useStore(state => state.auditRecords);
  const systemStatus = useStore(state => state.systemStatus);
  const isStreamPaused = useStore(state => state.isStreamPaused);
  const isDemoMode = useStore(state => state.isDemoMode);
  const resetStore = useStore(state => state.resetStore);
  const toggleStreamPause = useStore(state => state.toggleStreamPause);
  const selectedTx = useStore(state => state.selectedTransaction);
  const setSelectedTx = useStore(state => state.setSelectedTransaction);
  const toast = useToastStore(s => s.push);
  const openSimModal = useSimulationStore(s => s.openModal);
  const simIsRunning = useSimulationStore(s => s.isRunning);
  const theme = useThemeStore(s => s.theme);
  const isLight = theme === 'light';

  // Derived Metrics
  const metrics = useMemo(() => {
    const totalVolume = transactions.reduce((acc, tx) => acc + tx.amount, 0);
    const highRiskBlocked = transactions.filter(tx => tx.decision === 'PRE_SETTLEMENT_BLOCKED').length;
    const fundsProtected = transactions.filter(tx => tx.decision === 'PRE_SETTLEMENT_BLOCKED').reduce((acc, tx) => acc + tx.amount, 0);
    
    // Chart data (24h trend derived deterministically)
    const baseHour = new Date().getHours();
    const chartData = Array.from({ length: 24 }).map((_, i) => {
      const h = (baseHour - (23 - i) + 24) % 24;
      const hourStr = `${h.toString().padStart(2, '0')}:00`;
      const txCount = transactions.length || 20;
      const factor = 0.7 + 0.6 * Math.sin((i / 24) * Math.PI * 2);
      return {
        time: hourStr,
        Total: Math.round(1000 + txCount * 12 * factor),
        Suspicious: Math.round(25 + highRiskBlocked * 3 * factor),
        Blocked: Math.round(5 + highRiskBlocked * factor),
      };
    });

    // Risk distribution
    const riskDist = {
      LOW: transactions.filter(t => t.riskScore < 40).length,
      MEDIUM: transactions.filter(t => t.riskScore >= 40 && t.riskScore < 65).length,
      HIGH: transactions.filter(t => t.riskScore >= 65 && t.riskScore < 85).length,
      CRITICAL: transactions.filter(t => t.riskScore >= 85).length,
    };
    
    return { totalVolume, highRiskBlocked, fundsProtected, chartData, riskDist };
  }, [transactions]);

  const highRiskStream = useMemo(() => {
    return transactions.filter(tx => tx.riskScore > 65).slice(0, 50);
  }, [transactions]);

  const handleExportStreamCSV = useCallback(() => {
    exportTransactionsCSV(highRiskStream, 'sentinelq_high_risk_stream');
    toast(`Exported ${highRiskStream.length} high-risk transactions to CSV`, 'success');
  }, [highRiskStream, toast]);

  const handleExportSelectedTx = useCallback(() => {
    if (!selectedTx) return;
    const linkedCase = fraudCases.find(c => c.relatedTransactions.includes(selectedTx.id) || c.id === selectedTx.linkedCaseId);
    const latestAudit = auditRecords.find(a => a.resourceId === selectedTx.id);
    const html = generateForensicReportHTML({
      caseId: linkedCase?.id,
      caseTitle: linkedCase?.title || `Interception Summary: ${selectedTx.id}`,
      caseStatus: linkedCase?.status || (selectedTx.decision === 'PRE_SETTLEMENT_BLOCKED' ? 'CONFIRMED_FRAUD' : 'UNDER_REVIEW'),
      caseSeverity: selectedTx.riskScore >= 85 ? 'CRITICAL' : selectedTx.riskScore >= 65 ? 'HIGH' : 'MEDIUM',
      transaction: selectedTx,
      ledgerEntry: latestAudit ? {
        seq: 1,
        timestamp: latestAudit.timestamp,
        transactionId: selectedTx.id,
        anomalyScore: selectedTx.anomalyScore,
        networkScore: selectedTx.networkRiskScore,
        decision: selectedTx.decision,
        piiHash: '0x3c7d9a1b2e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
        actor: latestAudit.actor,
        action: latestAudit.action,
        payload: latestAudit.details,
        previousLedgerHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        ledgerHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
        verified: true
      } : null
    });
    openPrintableReport(html, `SentinelQ_Investigation_${selectedTx.id}`);
    toast(`Forensic investigation report generated for ${selectedTx.id}`, 'success');
  }, [selectedTx, fraudCases, auditRecords, toast]);

  return (
    <div className="flex h-full gap-4 relative">
      {/* Main Dashboard Content */}
      <div className={`flex-1 flex flex-col gap-4 transition-all duration-300 ${selectedTx ? 'w-2/3 pr-80 xl:pr-[400px]' : 'w-full'}`}>
        
        <header className="mb-2 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-semibold text-slate-100 flex items-center gap-3">
              Fraud Operations Overview
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-800 rounded border border-panel-border">
                <div className={`w-1.5 h-1.5 rounded-full ${isStreamPaused ? 'bg-slate-500' : 'bg-accent-danger animate-pulse'}`}></div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-300">Live</span>
              </div>
            </h1>
            <p className="text-sm text-slate-400">Real-time monitoring of transaction risk, interception activity and network intelligence.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="simulate-fraud-btn"
              onClick={openSimModal}
              disabled={simIsRunning}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 text-xs font-semibold rounded border border-slate-600 transition-colors uppercase tracking-wider"
              title="Open Fraud Simulation control panel"
            >
              <ShieldOff className="w-3.5 h-3.5 text-slate-400" />
              {simIsRunning ? 'Simulation Running' : 'Simulate Fraud'}
            </button>
            <button 
              onClick={() => toggleStreamPause()}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded border border-panel-border transition-colors uppercase tracking-wider"
            >
              {isStreamPaused ? 'Resume Stream' : 'Pause Stream'}
            </button>
          </div>
        </header>

        {/* Demo Mode Controls */}
        {isDemoMode && (
          <div className="flex items-center justify-between p-3 bg-accent-neutral/10 border border-accent-neutral/30 rounded mb-2">
            <div className="flex items-center gap-2 text-accent-neutral text-sm font-semibold">
              <PlaySquare className="w-4 h-4" />
              Presentation Demo Mode Active
            </div>
            <div className="flex gap-3">
              <button
                onClick={runDemo}
                disabled={isRunning}
                className="flex items-center gap-2 px-4 py-1.5 bg-accent-neutral text-background font-bold text-xs rounded hover:bg-accent-neutral/90 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-neutral"
              >
                {isRunning ? 'Running...' : 'Start Investigation Sequence'}
              </button>
              <button
                onClick={resetStore}
                disabled={isRunning}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-slate-300 font-bold text-xs border border-panel-border rounded hover:bg-slate-700 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                <RefreshCw className="w-3 h-3" /> Reset Demo
              </button>
            </div>
          </div>
        )}

        {/* System Status Bar */}
        <div className="flex items-center gap-6 p-3 bg-panel border border-panel-border rounded text-xs text-slate-300 font-medium">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-safe animate-pulse"></div>
            WebSocket: Connected
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-accent-warning" />
            Transaction Stream: 12,450 TPS
          </div>
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-accent-neutral" />
            Pipeline: {systemStatus.pipeline}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Avg Decision Latency: {systemStatus.latency}ms
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-accent-safe" />
            Ledger: {systemStatus.ledgerVerified ? 'Verified' : 'Pending'}
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <MetricCard title="Total Volume Scanned" value={formatINR(metrics.totalVolume)} icon={IndianRupee} status="up" comparison="+12% vs last 1h" />
          <MetricCard title="High-Risk Blocked" value={metrics.highRiskBlocked.toLocaleString()} icon={ShieldAlert} status="warning" comparison="Stable" />
          <MetricCard title="Funds Protected" value={formatINR(metrics.fundsProtected)} icon={ShieldCheck} status="safe" comparison="+4% vs yesterday" />
          <MetricCard title="Avg Processing Latency" value="42ms" icon={Clock} status="neutral" comparison="Target: <50ms" />
          <MetricCard title="False Positive Rate" value="0.12%" icon={Activity} status="safe" comparison="-0.03% this week" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Chart */}
          <div className="lg:col-span-3 bg-panel border border-panel-border rounded p-4 flex flex-col">
            <h2 className="text-sm font-semibold text-slate-200 mb-4 uppercase tracking-wider">Transaction Activity (24h)</h2>
            <div className="flex-1 min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isLight ? '#CBD5E1' : '#334155'} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={isLight ? '#CBD5E1' : '#334155'} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#E2E8F0' : '#334155'} vertical={false} />
                  <XAxis dataKey="time" stroke={isLight ? '#94A3B8' : '#64748B'} fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke={isLight ? '#94A3B8' : '#64748B'} fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: isLight ? '#FFFFFF' : '#1E293B',
                      borderColor: isLight ? '#E2E8F0' : '#334155',
                      fontSize: '12px',
                      color: isLight ? '#0F172A' : '#F8FAFC',
                      borderRadius: '4px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="Total" stroke={isLight ? '#64748B' : '#94A3B8'} fillOpacity={1} fill="url(#colorTotal)" />
                  <Area type="monotone" dataKey="Blocked" stroke="#EF4444" fillOpacity={1} fill="url(#colorBlocked)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="bg-panel border border-panel-border rounded p-4 flex flex-col">
            <h2 className="text-sm font-semibold text-slate-200 mb-4 uppercase tracking-wider">Risk Distribution</h2>
            <div className="flex-1 flex flex-col justify-center gap-3 text-xs">
              {(() => { const maxVal = Math.max(metrics.riskDist.LOW, metrics.riskDist.MEDIUM, metrics.riskDist.HIGH, metrics.riskDist.CRITICAL, 1); return (<>
              <RiskDistRow label="LOW" value={metrics.riskDist.LOW} max={maxVal} color="bg-slate-600" />
              <RiskDistRow label="MEDIUM" value={metrics.riskDist.MEDIUM} max={maxVal} color="bg-accent-warning" />
              <RiskDistRow label="HIGH" value={metrics.riskDist.HIGH} max={maxVal} color="bg-orange-500" />
              <RiskDistRow label="CRITICAL" value={metrics.riskDist.CRITICAL} max={maxVal} color="bg-accent-danger" />
              </>); })()}
            </div>
          </div>
        </div>

        {/* Live Stream Table */}
        <div className="bg-panel border border-panel-border rounded flex flex-col flex-1 min-h-[300px]">
          <div className="p-3 border-b border-panel-border flex justify-between items-center">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-accent-danger rounded-full animate-pulse"></div>
              Live High-Risk Stream
            </h2>
            <button
              onClick={handleExportStreamCSV}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-panel-border rounded text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" /> Export CSV
            </button>
          </div>
          <div className="overflow-auto flex-1 text-xs">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
              <thead className="bg-slate-900/50 text-slate-400 sticky top-0 backdrop-blur-sm z-10">
                <tr>
                  <th className="py-2 px-4 font-medium">Timestamp</th>
                  <th className="py-2 px-4 font-medium">Transaction ID</th>
                  <th className="py-2 px-4 font-medium">Masked User</th>
                  <th className="py-2 px-4 font-medium text-right">Amount</th>
                  <th className="py-2 px-4 font-medium text-center">Risk Score</th>
                  <th className="py-2 px-4 font-medium">Primary Signal</th>
                  <th className="py-2 px-4 font-medium">Decision</th>
                  <th className="py-2 px-4 font-medium text-right">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panel-border">
                {highRiskStream.map(tx => (
                  <tr 
                    key={tx.id} 
                    onClick={() => setSelectedTx(tx)}
                    className="hover:bg-slate-800/80 cursor-pointer transition-colors"
                  >
                    <td className="py-2 px-4 whitespace-nowrap text-slate-400">
                      {new Date(tx.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-2 px-4 font-mono text-[10px] text-slate-300">{tx.id}</td>
                    <td className="py-2 px-4">{tx.maskedUserId}</td>
                    <td className="py-2 px-4 text-right font-medium">{formatINR(tx.amount)}</td>
                    <td className="py-2 px-4 text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${tx.riskScore > 85 ? 'bg-accent-danger/20 text-accent-danger' : 'bg-orange-500/20 text-orange-500'}`}>
                        {tx.riskScore}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-slate-300 truncate max-w-[120px]" title={tx.riskSignals[0] || 'Unknown'}>
                      {tx.riskSignals[0] || 'Unknown'}
                    </td>
                    <td className="py-2 px-4">
                      <span className={`text-[10px] font-semibold uppercase ${tx.decision === 'PRE_SETTLEMENT_BLOCKED' ? 'text-accent-danger' : 'text-accent-warning'}`}>
                        {tx.decision.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-right text-slate-400">{tx.processingLatency}ms</td>
                  </tr>
                ))}
                {highRiskStream.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">No high-risk transactions detected recently.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Side Detail View */}
      {selectedTx && (
        <div className="absolute right-0 top-0 bottom-0 w-full md:w-80 xl:w-[400px] bg-panel border-l border-panel-border shadow-lg flex flex-col z-20">
          <div className="flex items-center justify-between p-4 border-b border-panel-border">
            <h3 className="font-semibold text-sm">Transaction Analysis</h3>
            <button 
              onClick={() => setSelectedTx(null)} 
              className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-neutral"
              aria-label="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6 text-sm">
            <div>
              <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-semibold">Amount</div>
              <div className="text-2xl font-bold font-mono tracking-tight">{formatINR(selectedTx.amount)}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-semibold">Sender</div>
                <div className="font-mono text-xs text-slate-300">{selectedTx.senderId}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-semibold">Receiver</div>
                <div className="font-mono text-xs text-slate-300">{selectedTx.receiverId}</div>
              </div>
            </div>

            <div className="p-3 bg-slate-900 rounded border border-panel-border">
              <div className="text-xs font-semibold uppercase text-slate-400 mb-3">Risk Assessment</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Overall Score</span>
                  <span className={`font-bold ${selectedTx.riskScore > 85 ? 'text-accent-danger' : selectedTx.riskScore > 65 ? 'text-accent-warning' : 'text-accent-safe'}`}>{selectedTx.riskScore}/100</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Network Score</span>
                  <span className="text-slate-200">{selectedTx.networkRiskScore}/100</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Anomaly Score</span>
                  <span className="text-slate-200">{selectedTx.anomalyScore}/100</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t border-panel-border pt-4">
              <div className="flex justify-between">
                <span className="text-slate-500 text-xs uppercase font-semibold">IP Address</span>
                <span className="font-mono text-xs">{selectedTx.ipAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-xs uppercase font-semibold">Device FP</span>
                <span className="font-mono text-xs">{selectedTx.deviceFingerprint}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-xs uppercase font-semibold">Decision</span>
                <span className={`text-xs font-bold ${selectedTx.decision === 'PRE_SETTLEMENT_BLOCKED' ? 'text-accent-danger' : 'text-accent-warning'}`}>
                  {selectedTx.decision}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-xs uppercase font-semibold">Latency</span>
                <span className="text-xs">{selectedTx.processingLatency}ms</span>
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">Risk Signals</div>
              <div className="flex flex-wrap gap-2">
                {selectedTx.riskSignals.map(sig => (
                  <span key={sig} className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-[10px] font-medium border border-panel-border">
                    {sig}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="pt-4 space-y-2">
              <button 
                onClick={handleExportSelectedTx}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-panel-border rounded text-xs font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5 text-accent-neutral" /> Export Forensic Report (PDF)
              </button>
              <button 
                onClick={() => navigate('/interceptions')}
                className="w-full py-2 bg-accent-danger/10 hover:bg-accent-danger/20 text-accent-danger border border-accent-danger/30 rounded text-xs font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Investigate in Interceptions
              </button>
              <button 
                onClick={() => {
                  if (selectedTx?.linkedCaseId) navigate(`/cases/${selectedTx.linkedCaseId}`);
                  else navigate('/cases');
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-panel-border rounded text-xs font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Database className="w-3.5 h-3.5" /> Open Case Brief
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulation Modal and Status Panel */}
      <FraudSimulationModal />
      <SimulationStatusPanel />
    </div>
  );
};

// Sub-components
const MetricCard = ({ title, value, icon: Icon, status, comparison }: { title: string, value: string | number, icon: any, status: 'safe' | 'warning' | 'danger' | 'neutral' | 'up', comparison: string }) => {
  return (
    <div className="bg-panel border border-panel-border rounded p-3 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-tight">{title}</h3>
        <Icon className={`w-4 h-4 ${status === 'safe' ? 'text-accent-safe' : status === 'warning' ? 'text-accent-warning' : status === 'danger' ? 'text-accent-danger' : status === 'up' ? 'text-blue-400' : 'text-slate-500'}`} />
      </div>
      <div>
        <div className="text-xl font-bold tracking-tight text-slate-100">{value}</div>
        <div className="text-[10px] text-slate-500 mt-1">{comparison}</div>
      </div>
    </div>
  );
};

const RiskDistRow = ({ label, value, max, color }: { label: string, value: number, max: number, color: string }) => (
  <div>
    <div className="flex justify-between mb-1">
      <span className="font-medium text-slate-400">{label}</span>
      <span className="text-slate-200">{value.toLocaleString()}</span>
    </div>
    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all duration-300`} style={{ width: `${max > 0 ? Math.min((value / max) * 100, 100) : 0}%` }}></div>
    </div>
  </div>
);

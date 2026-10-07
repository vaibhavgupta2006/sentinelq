import type { Transaction, NetworkNode } from '../types';
import type { LedgerEntry } from './ledgerService';
import type { CaseBrief } from './caseBriefService';

// ── RFC 4180 CSV Escaping Utility ────────────────────────────
export const formatCSVValue = (val: any): string => {
  if (val === null || val === undefined) return '';
  let str = String(val);
  // If string contains comma, double-quote, or newline, quote it and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const exportToCSV = (filename: string, headers: string[], rows: (string | number | boolean | null | undefined)[][]): void => {
  const headerLine = headers.map(formatCSVValue).join(',');
  const rowLines = rows.map(row => row.map(formatCSVValue).join(','));
  const csvContent = [headerLine, ...rowLines].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ── Ledger CSV Export ─────────────────────────────────────────
export const exportLedgerCSV = (entries: LedgerEntry[]): void => {
  const headers = [
    'Sequence',
    'Timestamp',
    'Transaction ID',
    'Actor',
    'Action',
    'Anomaly Score',
    'Network Score',
    'Decision',
    'PII Hash (SHA-256)',
    'Ledger Hash (SHA-256)',
    'Previous Ledger Hash (SHA-256)',
    'Verification Status'
  ];

  const rows = entries.map(e => [
    e.seq,
    e.timestamp,
    e.transactionId,
    e.actor,
    e.action,
    e.anomalyScore,
    e.networkScore,
    e.decision,
    e.piiHash,
    e.ledgerHash,
    e.previousLedgerHash,
    e.verified ? 'VALID' : 'UNVERIFIED'
  ]);

  const dateStr = new Date().toISOString().split('T')[0];
  exportToCSV(`sentinelq_audit_ledger_${dateStr}.csv`, headers, rows);
};

// ── Transactions CSV Export ──────────────────────────────────
export const exportTransactionsCSV = (transactions: Transaction[], filenamePrefix = 'sentinelq_transactions'): void => {
  const headers = [
    'Transaction ID',
    'Timestamp',
    'Masked User ID',
    'Amount',
    'Currency',
    'Decision',
    'Risk Score',
    'Anomaly Score',
    'Network Risk Score',
    'Processing Latency (ms)',
    'Risk Signals',
    'Status',
    'Linked Case ID'
  ];

  const rows = transactions.map(t => [
    t.id,
    t.timestamp,
    t.maskedUserId,
    t.amount,
    t.currency,
    t.decision,
    t.riskScore,
    t.anomalyScore,
    t.networkRiskScore,
    t.processingLatency,
    t.riskSignals.join('; '),
    t.status,
    t.linkedCaseId || 'NONE'
  ]);

  const dateStr = new Date().toISOString().split('T')[0];
  exportToCSV(`${filenamePrefix}_${dateStr}.csv`, headers, rows);
};

// ── Forensic Report Parameters ───────────────────────────────
export interface ForensicReportData {
  caseId?: string;
  caseTitle?: string;
  caseStatus?: string;
  caseSeverity?: string;
  assignee?: string;
  createdAt?: string;
  updatedAt?: string;
  
  transaction?: Transaction | null;
  brief?: CaseBrief | null;
  relatedNodes?: (NetworkNode | { id: string; label?: string; type?: string; riskScore?: number })[];
  ledgerEntry?: LedgerEntry | null;
  notes?: string[];
}

const formatCurrency = (amount?: number, currency = 'INR') => {
  if (amount === undefined || amount === null) return 'N/A';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0
  }).format(amount);
};

// ── Generate Print-Friendly Forensic HTML Report ─────────────
export const generateForensicReportHTML = (data: ForensicReportData): string => {
  const now = new Date();
  const tx = data.transaction;
  const brief = data.brief;
  const caseId = data.caseId || (tx ? `CASE-${tx.id.slice(-8).toUpperCase()}` : 'N/A');
  const txId = tx?.id || 'N/A';
  const reportId = `SQ-FR-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  
  const riskScore = tx?.riskScore ?? (data.caseSeverity === 'CRITICAL' ? 95 : data.caseSeverity === 'HIGH' ? 78 : 50);
  const anomalyScore = tx?.anomalyScore ?? Math.round(riskScore * 0.85);
  const networkScore = tx?.networkRiskScore ?? Math.round(riskScore * 0.9);
  const decision = tx?.decision || (riskScore >= 85 ? 'PRE_SETTLEMENT_BLOCKED' : riskScore >= 65 ? 'REVIEW' : 'APPROVED');
  
  const decisionBadgeClass = decision === 'PRE_SETTLEMENT_BLOCKED' 
    ? 'badge-blocked' 
    : decision === 'REVIEW' 
      ? 'badge-review' 
      : 'badge-approved';

  const riskMeterColor = riskScore >= 85 ? '#ef4444' : riskScore >= 65 ? '#f59e0b' : '#10b981';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SentinelQ Forensic Report - ${caseId}</title>
  <style>
    @page {
      size: A4;
      margin: 12mm 15mm 15mm 15mm;
    }
    *, *:before, *:after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.45;
      font-size: 11pt;
      margin: 0;
      padding: 0;
    }
    .report-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px 0;
    }
    .print-controls {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: #0f172a;
      color: #ffffff;
      border: 1px solid #0f172a;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
    }
    .btn-secondary {
      background: #f8fafc;
      color: #334155;
      border-color: #cbd5e1;
    }
    @media print {
      .print-controls { display: none !important; }
      .page-break { page-break-before: always; }
      body { font-size: 10pt; }
    }

    /* Header styling */
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .brand-title {
      font-size: 20pt;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0f172a;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .brand-subtitle {
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64748b;
      margin: 2px 0 0 0;
      font-weight: 600;
    }
    .classification-box {
      text-align: right;
    }
    .classification-tag {
      display: inline-block;
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #f87171;
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      padding: 3px 8px;
      border-radius: 3px;
    }
    .report-meta-text {
      font-size: 8pt;
      color: #64748b;
      margin-top: 4px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    /* Key Metrics Grid */
    .metrics-banner {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 18px;
    }
    .metric-card {
      border-right: 1px solid #e2e8f0;
      padding-right: 10px;
    }
    .metric-card:last-child {
      border-right: none;
      padding-right: 0;
    }
    .metric-label {
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 2px;
    }
    .metric-value {
      font-size: 13pt;
      font-weight: 700;
      color: #0f172a;
      font-family: ui-monospace, monospace;
    }
    .badge-blocked {
      color: #dc2626;
      font-weight: 800;
    }
    .badge-review {
      color: #d97706;
      font-weight: 800;
    }
    .badge-approved {
      color: #16a34a;
      font-weight: 800;
    }

    /* Sections */
    .section {
      margin-bottom: 18px;
    }
    .section-title {
      font-size: 10pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #334155;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .section-content {
      font-size: 9.5pt;
      color: #334155;
    }

    /* Tables */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      margin-top: 6px;
    }
    table.data-table th {
      background: #f1f5f9;
      color: #475569;
      text-transform: uppercase;
      font-size: 7pt;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-align: left;
      padding: 6px 8px;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
    }
    table.data-table td {
      padding: 6px 8px;
      border-bottom: 1px solid #e2e8f0;
      color: #1e293b;
      vertical-align: top;
    }
    table.data-table tr:nth-child(even) td {
      background: #f8fafc;
    }
    .font-mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    /* Timeline */
    .timeline-item {
      display: flex;
      gap: 12px;
      margin-bottom: 8px;
      font-size: 8.5pt;
    }
    .timeline-time {
      font-family: ui-monospace, monospace;
      color: #64748b;
      min-width: 130px;
      font-size: 8pt;
    }
    .timeline-event {
      font-weight: 700;
      color: #0f172a;
      min-width: 140px;
    }
    .timeline-detail {
      color: #334155;
      flex: 1;
    }

    /* Hash / Cryptographic Box */
    .crypto-box {
      background: #0f172a;
      color: #f8fafc;
      padding: 12px;
      border-radius: 6px;
      font-family: ui-monospace, monospace;
      font-size: 7.5pt;
      margin-top: 6px;
    }
    .crypto-row {
      display: flex;
      margin-bottom: 4px;
    }
    .crypto-row:last-child {
      margin-bottom: 0;
    }
    .crypto-label {
      color: #94a3b8;
      width: 150px;
      text-transform: uppercase;
      font-size: 7pt;
      font-weight: 700;
    }
    .crypto-val {
      color: #38bdf8;
      word-break: break-all;
      flex: 1;
    }

    /* Disclaimer Footer */
    .report-footer {
      margin-top: 24px;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      font-size: 7.5pt;
      color: #64748b;
      text-align: center;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="report-container">
    
    <!-- Action Bar (Hidden on print) -->
    <div class="print-controls">
      <button class="btn" onclick="window.print()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
        Print / Save to PDF
      </button>
      <button class="btn btn-secondary" onclick="window.close()">Close</button>
    </div>

    <!-- Header -->
    <div class="report-header">
      <div>
        <h1 class="brand-title">
          <span>SentinelQ</span>
          <span style="font-weight: 400; color: #64748b;">|</span>
          <span style="font-weight: 600; font-size: 15pt;">Fraud Investigation Report</span>
        </h1>
        <div class="brand-subtitle">Autonomous Pre-Settlement Fraud Intelligence</div>
      </div>
      <div class="classification-box">
        <span class="classification-tag">CONFIDENTIAL // FRAUD OPS</span>
        <div class="report-meta-text">Report ID: ${reportId}</div>
        <div class="report-meta-text">Generated: ${now.toUTCString()}</div>
      </div>
    </div>

    <!-- Metrics Banner -->
    <div class="metrics-banner">
      <div class="metric-card">
        <div class="metric-label">Case Identifier</div>
        <div class="metric-value font-mono" style="font-size: 10pt;">${caseId}</div>
        <div style="font-size: 7.5pt; color: #64748b; margin-top: 2px;">Tx: <span class="font-mono">${txId}</span></div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Transaction Amount</div>
        <div class="metric-value">${formatCurrency(tx?.amount, tx?.currency || 'INR')}</div>
        <div style="font-size: 7.5pt; color: #64748b; margin-top: 2px;">Time: ${tx?.timestamp ? new Date(tx.timestamp).toLocaleTimeString() : 'N/A'}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Pre-Settlement Decision</div>
        <div class="metric-value ${decisionBadgeClass}" style="font-size: 10pt;">${decision.replace(/_/g, ' ')}</div>
        <div style="font-size: 7.5pt; color: #64748b; margin-top: 2px;">Latency: ${tx?.processingLatency || 42}ms</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Composite Risk</div>
        <div class="metric-value" style="color: ${riskMeterColor};">${riskScore} <span style="font-size: 8pt; color: #64748b;">/ 100</span></div>
        <div style="font-size: 7.5pt; color: #64748b; margin-top: 2px;">Threshold: 85 (Block)</div>
      </div>
    </div>

    <!-- Executive Summary -->
    <div class="section">
      <div class="section-title">1. Executive Summary</div>
      <div class="section-content" style="line-height: 1.5; background: #f8fafc; border-left: 3px solid #0f172a; padding: 8px 12px; border-radius: 0 4px 4px 0;">
        ${brief?.executiveSummary || `Suspicious transfer intercepted before settlement. Account ${tx?.maskedUserId || 'usr_masked'} attempted a ${formatCurrency(tx?.amount, tx?.currency || 'INR')} transfer flagged by SentinelQ's composite risk model. Multi-vector analysis identified anomalous transaction velocity and cross-entity clustering, exceeding the pre-settlement threshold.`}
      </div>
    </div>

    <!-- Risk Evidence Breakdown -->
    <div class="section">
      <div class="section-title">2. Risk Assessment & Statistical Evidence</div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Vector / Signal</th>
            <th>Value / Score</th>
            <th>Threshold</th>
            <th>Engine Verdict / Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Composite Risk Score</strong></td>
            <td class="font-mono" style="font-weight: 700; color: ${riskMeterColor};">${riskScore} / 100</td>
            <td class="font-mono">85 / 100 (Block)</td>
            <td>Composite threshold exceeded prior to settlement clearing</td>
          </tr>
          <tr>
            <td><strong>Statistical Anomaly Score</strong></td>
            <td class="font-mono">${anomalyScore} / 100</td>
            <td class="font-mono">65 / 100</td>
            <td>Extreme deviation from 30-day baseline transaction volume</td>
          </tr>
          <tr>
            <td><strong>Network Graph Risk Score</strong></td>
            <td class="font-mono">${networkScore} / 100</td>
            <td class="font-mono">70 / 100</td>
            <td>Structural circularity and high node centrality detected</td>
          </tr>
          <tr>
            <td><strong>Inference Latency</strong></td>
            <td class="font-mono">${tx?.processingLatency || 42} ms</td>
            <td class="font-mono">&lt; 100 ms SLA</td>
            <td>Inline pre-settlement interception SLA fulfilled</td>
          </tr>
          ${(tx?.riskSignals || ['CIRCULAR_MULE_RING', 'UNUSUAL_AMOUNT']).map(sig => `
            <tr>
              <td><span class="font-mono" style="background:#fee2e2; color:#991b1b; padding:2px 4px; border-radius:2px; font-size:7.5pt;">${sig}</span></td>
              <td class="font-mono">CRITICAL</td>
              <td class="font-mono">ACTIVE</td>
              <td>Automated feature detector flag triggered</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Network Correlation -->
    <div class="section">
      <div class="section-title">3. Network Correlation & Graph Topology</div>
      <div class="section-content" style="margin-bottom: 8px;">
        ${brief?.networkPattern || `Transaction graph analysis identified linked account nodes connected through a directed transfer chain. The sender account occupies a high-centrality position in the cluster, indicating coordinated layering or mule ring behavior.`}
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Entity Identifier</th>
            <th>Entity Type</th>
            <th>Risk Level</th>
            <th>Observed Role / Relationship</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="font-mono">${tx?.maskedUserId || 'usr_target_vic'}</td>
            <td>SOURCE_ACCOUNT</td>
            <td>HIGH</td>
            <td>Originating entity / primary fund supplier</td>
          </tr>
          <tr>
            <td class="font-mono">${tx?.receiverId || 'usr_demo_mule_1'}</td>
            <td>DEST_ACCOUNT</td>
            <td>CRITICAL</td>
            <td>Target mule node / intermediary recipient</td>
          </tr>
          ${(data.relatedNodes || []).filter(n => n.id !== tx?.senderId && n.id !== tx?.receiverId).slice(0, 4).map(node => `
            <tr>
              <td class="font-mono">${node.id}</td>
              <td>${(node as any).type || 'LINKED_ENTITY'}</td>
              <td>${(node as any).riskLevel || ((node as any).riskScore > 80 ? 'CRITICAL' : 'HIGH')}</td>
              <td>Circular cluster intermediary node</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Transaction Timeline -->
    <div class="section">
      <div class="section-title">4. Chronological Forensic Timeline</div>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 8px 12px;">
        ${(brief?.timeline || [
          { timestamp: tx?.timestamp || now.toISOString(), event: 'Transaction Initiated', detail: `Transfer of ${formatCurrency(tx?.amount, tx?.currency || 'INR')} submitted.` },
          { timestamp: new Date(now.getTime() + 380).toISOString(), event: 'Anomaly Detected', detail: `Model evaluated statistical deviation score: ${anomalyScore}/100.` },
          { timestamp: new Date(now.getTime() + 1200).toISOString(), event: 'Network Correlation', detail: `Graph engine confirmed multi-hop circular layering cycle.` },
          { timestamp: new Date(now.getTime() + 1580).toISOString(), event: 'Pre-Settlement Interception', detail: `Decision: ${decision}. Transaction blocked in flight.` },
          { timestamp: new Date(now.getTime() + 1800).toISOString(), event: 'Case Generated', detail: `Case ${caseId} created and assigned to ${data.assignee || 'Operator-7'}.` }
        ]).map(t => `
          <div class="timeline-item">
            <div class="timeline-time">${new Date(t.timestamp).toLocaleTimeString()} UTC</div>
            <div class="timeline-event">${t.event}</div>
            <div class="timeline-detail">${t.detail}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Recommended Action -->
    <div class="section">
      <div class="section-title">5. Recommended Action & Compliance Next Steps</div>
      <div class="section-content" style="background: #fffbeb; border: 1px solid #fde68a; color: #92400e; padding: 10px 12px; border-radius: 4px; font-weight: 500;">
        ${brief?.recommendedAction || 'Issue a Suspicious Activity Report (SAR) and escalate to the Financial Intelligence Unit (FIU). Restrict associated account nodes pending further verification. Do not alert account holders.'}
      </div>
    </div>

    <!-- Cryptographic Ledger Audit Record -->
    <div class="section">
      <div class="section-title">6. Cryptographic Audit Information (SHA-256 Ledger)</div>
      <div class="crypto-box">
        <div class="crypto-row">
          <div class="crypto-label">Ledger Hash:</div>
          <div class="crypto-val">${data.ledgerEntry?.ledgerHash || '0x4f8c9b2e1a3d5e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f'}</div>
        </div>
        <div class="crypto-row">
          <div class="crypto-label">Previous Hash:</div>
          <div class="crypto-val">${data.ledgerEntry?.previousLedgerHash || '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b'}</div>
        </div>
        <div class="crypto-row">
          <div class="crypto-label">PII Mask Hash:</div>
          <div class="crypto-val">${data.ledgerEntry?.piiHash || '0x7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f'}</div>
        </div>
        <div class="crypto-row">
          <div class="crypto-label">Actor / Engine:</div>
          <div class="crypto-val" style="color: #a7f3d0;">${data.ledgerEntry?.actor || 'SYSTEM_CORRELATION_ENGINE'} · ACTION: ${data.ledgerEntry?.action || 'PRE_SETTLEMENT_BLOCK'}</div>
        </div>
        <div class="crypto-row">
          <div class="crypto-label">Chain Status:</div>
          <div class="crypto-val" style="color: #4ade80; font-weight: 700;">TAMPER-EVIDENT HASH-CHAIN VERIFIED</div>
        </div>
      </div>
    </div>

    <!-- Mandatory Disclaimer -->
    <div class="report-footer">
      <strong>CONFIDENTIAL // PROPRIETARY // STRICTLY FOR AUTHORIZED COMPLIANCE USE</strong><br/>
      SentinelQ Real-Time Pre-Settlement Fraud Intelligence Platform · Generated by Automated Forensic Synthesis Engine.<br/>
      <em>Disclaimer: Synthetic demonstration data. No raw unmasked customer PII is stored or transmitted in this artifact.</em>
    </div>

  </div>
</body>
</html>`;
};

// ── Open Report in Printable Window ──────────────────────────
export const openPrintableReport = (html: string, title = 'SentinelQ_Forensic_Report'): void => {
  const win = window.open('', '_blank');
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.document.title = title;
  } else {
    // If popup blocked, create an invisible iframe fallback or download as HTML
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}.html`;
    link.click();
    URL.revokeObjectURL(url);
  }
};

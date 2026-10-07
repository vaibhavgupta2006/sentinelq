import type { Transaction, FraudCase } from '../types';
import type { GraphNode } from '../utils/graphAnalysis';

export interface CaseBrief {
  executiveSummary: string;
  riskAssessment: string;
  networkPattern: string;
  timeline: TimelineEntry[];
  recommendedAction: string;
  generatedAt: string;
  variant: number;
}

export interface TimelineEntry {
  timestamp: string;
  event: string;
  detail: string;
  type: 'initiation' | 'detection' | 'correlation' | 'interception' | 'case' | 'analyst';
}

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const pick = <T>(arr: T[], seed: number): T => arr[seed % arr.length];

const SUMMARY_TEMPLATES = [
  (tx: Transaction, networkCount: number, windowMs: number) =>
    `Suspicious transfer intercepted before settlement. Account ${tx.maskedUserId} initiated a ${formatINR(tx.amount)} transfer that ${networkCount > 2 ? `formed a ${networkCount}-node circular layering pattern` : 'matched a known velocity anomaly profile'}. The associated accounts exchanged funds within a ${Math.round(windowMs / 1000)}-second window. Risk score: ${tx.riskScore}/100 — exceeds the PRE_SETTLEMENT_BLOCKED threshold of 85.`,

  (tx: Transaction, networkCount: number, windowMs: number) =>
    `High-value transaction flagged by the statistical risk engine. ${formatINR(tx.amount)} transfer originating from ${tx.maskedUserId} on device ${tx.deviceFingerprint.slice(0, 12)} was correlated with ${networkCount} linked entities over a ${Math.round(windowMs / 1000)}-second settlement window. Network analysis confirms structural anomalies consistent with layering activity.`,

  (tx: Transaction, networkCount: number, windowMs: number) =>
    `Pre-settlement interception triggered. The transaction of ${formatINR(tx.amount)} from ${tx.maskedUserId} was blocked after composite risk scoring identified a ${tx.riskSignals[0]?.replace(/_/g, ' ')} pattern. ${networkCount} related accounts were active during the same ${Math.round(windowMs / 1000)}-second window on overlapping IP infrastructure.`,
];

const NETWORK_TEMPLATES = [
  (tx: Transaction, nodeCount: number) =>
    `Transaction graph analysis identified ${nodeCount} account nodes connected through a directed transfer chain. The sender ${tx.maskedUserId} occupies a high-centrality position in the subgraph with ${nodeCount - 1} downstream recipients, indicating potential layering coordination. IP address ${tx.ipAddress} is shared across at least 3 account nodes in this cluster.`,

  (tx: Transaction, nodeCount: number) =>
    `Network correlation engine detected a ${nodeCount}-node cluster sharing device fingerprint ${tx.deviceFingerprint}. Edges in the transfer graph form a closed cycle — funds re-enter the originating account after ${nodeCount} intermediate hops. This is structurally consistent with circular smurfing operations.`,
];

const RISK_TEMPLATES = [
  (tx: Transaction) =>
    `Composite risk score of ${tx.riskScore}/100 derived from: statistical anomaly (${tx.anomalyScore}/100), network topology risk (${tx.networkRiskScore}/100), and device/IP correlation. Primary driver: ${tx.riskSignals[0]?.replace(/_/g, ' ') || 'UNKNOWN_SIGNAL'}. Transaction amount is ${(tx.amount / 50000).toFixed(1)}x the account's estimated 30-day median.`,

  (tx: Transaction) =>
    `Risk engine flagged ${tx.riskSignals.length} distinct anomaly signals. Dominant signal: ${tx.riskSignals[0]?.replace(/_/g, ' ')}. Statistical deviation score: ${tx.anomalyScore}/100. Network exposure: ${tx.networkRiskScore}/100. Processing latency of ${tx.processingLatency}ms is within normal inference bounds; no model degradation detected.`,
];

const RECOMMENDED_ACTIONS = [
  'Issue a Suspicious Activity Report (SAR) and escalate to the Financial Intelligence Unit. Freeze linked accounts pending investigation. Do not alert account holders.',
  'Initiate KYC re-verification on all linked account nodes. Escalate to SAR within 24 hours per PMLA obligations. Log all associated device fingerprints in the fraud registry.',
  'Recommend immediate account restriction on sender and known intermediary nodes. Cross-reference with existing SAR filings. Coordinate with correspondent banks if cross-border exposure is confirmed.',
];

export const generateCaseBrief = (
  tx: Transaction,
  relatedNodes: GraphNode[],
  fraudCase: FraudCase,
  variant: number = 0
): CaseBrief => {
  const nodeCount = relatedNodes.length || 4;
  const windowMs = 14000 + (variant * 3000); // slight variation per regeneration

  const now = new Date();
  const txTime = new Date(tx.timestamp);
  const detectionTime = new Date(txTime.getTime() + 380);
  const correlationTime = new Date(txTime.getTime() + 1200);
  const interceptionTime = new Date(txTime.getTime() + 1580);
  const caseTime = new Date(fraudCase.createdAt);

  const timeline: TimelineEntry[] = [
    { timestamp: txTime.toISOString(), event: 'Transaction Initiated', detail: `${formatINR(tx.amount)} transfer from ${tx.maskedUserId} to ${tx.receiverId}.`, type: 'initiation' },
    { timestamp: detectionTime.toISOString(), event: 'Risk Detected', detail: `Statistical engine scored ${tx.riskScore}/100. Anomaly signals: ${tx.riskSignals.join(', ')}.`, type: 'detection' },
    { timestamp: correlationTime.toISOString(), event: 'Network Correlation Completed', detail: `Graph engine identified ${nodeCount} linked entities. Circular pattern confirmed.`, type: 'correlation' },
    { timestamp: interceptionTime.toISOString(), event: 'Transaction Intercepted', detail: `Decision: PRE_SETTLEMENT_BLOCKED. Processing latency: ${tx.processingLatency}ms.`, type: 'interception' },
    { timestamp: caseTime.toISOString(), event: 'Case Created', detail: `Case ${fraudCase.id.slice(0, 20)} opened. Assigned to ${fraudCase.assignee || 'Unassigned'}.`, type: 'case' },
  ];

  if (fraudCase.status !== 'OPEN') {
    timeline.push({
      timestamp: fraudCase.updatedAt,
      event: 'Analyst Action',
      detail: `Status updated to ${fraudCase.status.replace(/_/g, ' ')}.`,
      type: 'analyst',
    });
  }

  return {
    executiveSummary: pick(SUMMARY_TEMPLATES, variant)(tx, nodeCount, windowMs),
    riskAssessment: pick(RISK_TEMPLATES, variant)(tx),
    networkPattern: pick(NETWORK_TEMPLATES, variant)(tx, nodeCount),
    timeline,
    recommendedAction: pick(RECOMMENDED_ACTIONS, variant),
    generatedAt: now.toISOString(),
    variant,
  };
};

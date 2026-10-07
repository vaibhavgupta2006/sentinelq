import type { Transaction, NetworkNode, NetworkEdge, FraudCase } from '../types';
import { generateTransactionId, maskPII } from '../utils/crypto';
import { determineRiskLevel, generateRiskSignals } from '../utils/risk';

const generateTx = (overrides: Partial<Transaction>): Transaction => {
  const id = overrides.id || generateTransactionId();
  const riskScore = overrides.riskScore ?? Math.floor(Math.random() * 30);
  const decision = overrides.decision || (riskScore > 85 ? 'PRE_SETTLEMENT_BLOCKED' : riskScore > 65 ? 'REVIEW' : 'APPROVED');
  
  return {
    id,
    timestamp: overrides.timestamp || new Date().toISOString(),
    amount: overrides.amount || Math.floor(Math.random() * 1000) + 10,
    currency: overrides.currency || 'USD',
    senderId: overrides.senderId || `usr_${Math.random().toString(36).slice(2,8)}`,
    receiverId: overrides.receiverId || `merch_${Math.random().toString(36).slice(2,8)}`,
    maskedUserId: maskPII(overrides.senderId || 'usr_unknown'),
    ipAddress: overrides.ipAddress || `203.0.113.${Math.floor(Math.random() * 255)}`,
    deviceFingerprint: overrides.deviceFingerprint || `fp_${Math.random().toString(36).slice(2,10)}`,
    riskScore,
    anomalyScore: overrides.anomalyScore ?? Math.floor(riskScore * 0.9),
    networkRiskScore: overrides.networkRiskScore ?? Math.floor(riskScore * 0.8),
    decision,
    processingLatency: overrides.processingLatency || Math.floor(Math.random() * 50) + 10,
    riskSignals: overrides.riskSignals || generateRiskSignals(riskScore, overrides.amount || 100, overrides.ipAddress || ''),
    status: overrides.status || (decision === 'PRE_SETTLEMENT_BLOCKED' ? 'REJECTED' : 'COMPLETED'),
    linkedCaseId: overrides.linkedCaseId,
  };
};

// 1. Normal Transactions
const normalTxs = Array.from({ length: 5 }).map(() => generateTx({ riskScore: 12, amount: 45 }));

// 2. Suspicious Transactions (Review)
const suspiciousTxs = Array.from({ length: 3 }).map(() => generateTx({ riskScore: 75, amount: 4500 }));

// 3. Blocked Transactions (High Risk)
const blockedTxs = Array.from({ length: 2 }).map(() => generateTx({ riskScore: 95, amount: 85000 }));

// 4. Mule Accounts & Circular Transfers (Network)
const muleRingTxs = [
  generateTx({ senderId: 'usr_A', receiverId: 'usr_B', amount: 10000, riskScore: 88 }),
  generateTx({ senderId: 'usr_B', receiverId: 'usr_C', amount: 9800, riskScore: 92 }),
  generateTx({ senderId: 'usr_C', receiverId: 'usr_A', amount: 9500, riskScore: 96 }), // Circular
];

// 5. Shared Device / Shared IP
const sharedDeviceTxs = [
  generateTx({ senderId: 'usr_D', deviceFingerprint: 'fp_SHARED01', ipAddress: '198.51.100.1', riskScore: 80 }),
  generateTx({ senderId: 'usr_E', deviceFingerprint: 'fp_SHARED01', ipAddress: '198.51.100.1', riskScore: 82 }),
];

// 6. Geographic Anomalies (High velocity)
const geoAnomalyTxs = [
  generateTx({ senderId: 'usr_F', ipAddress: '91.198.174.192', riskScore: 90, riskSignals: ['IMPOSSIBLE_TRAVEL_VELOCITY'] }),
];

export const mockTransactions: Transaction[] = [
  ...normalTxs, ...suspiciousTxs, ...blockedTxs, ...muleRingTxs, ...sharedDeviceTxs, ...geoAnomalyTxs
];

// Generate Network from Txs
export const mockNodes: NetworkNode[] = [];
export const mockEdges: NetworkEdge[] = [];

mockTransactions.forEach((tx) => {
  // Simple unique node addition
  if (!mockNodes.find(n => n.id === tx.senderId)) {
    mockNodes.push({ id: tx.senderId, label: maskPII(tx.senderId), type: 'ACCOUNT', riskLevel: determineRiskLevel(tx.riskScore) });
  }
  if (!mockNodes.find(n => n.id === tx.receiverId)) {
    mockNodes.push({ id: tx.receiverId, label: maskPII(tx.receiverId), type: 'ACCOUNT', riskLevel: determineRiskLevel(tx.riskScore) });
  }
  mockEdges.push({ id: `edge_${tx.id}`, source: tx.senderId, target: tx.receiverId, type: 'TRANSFERRED_TO', weight: tx.amount });
});

export const mockCases: FraudCase[] = [
  {
    id: 'case_MULE_RING_1',
    title: 'Suspected Circular Mule Ring (usr_A, usr_B, usr_C)',
    status: 'INVESTIGATING',
    severity: 'CRITICAL',
    assignee: 'Operator-7',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    relatedTransactions: muleRingTxs.map(t => t.id),
    relatedEntities: ['usr_A', 'usr_B', 'usr_C'],
    notes: ['Funds circulated within 24h with 2-5% skimming. High confidence of synthetic identity ring.'],
  }
];

export const mockAuditRecords = [
  {
    id: 'aud_1',
    timestamp: new Date().toISOString(),
    actor: 'SYSTEM_MODEL_V4',
    action: 'PRE_SETTLEMENT_BLOCK',
    resourceType: 'TRANSACTION',
    resourceId: blockedTxs[0].id,
    details: { reason: 'Score 95 > Threshold 85' }
  }
];

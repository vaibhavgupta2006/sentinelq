/**
 * fraudScenarioGenerator.ts
 *
 * Generates deterministic synthetic fraud scenario data.
 * All identifiers are prefixed with SIM/ACC-SIM/DEV-SIM/IP-SIM so they
 * are unmistakably synthetic and cannot be mistaken for real data.
 */

import type { Transaction, NetworkNode, NetworkEdge, FraudCase, AuditRecord } from '../types';
import type { ScenarioType, SimSeverity, SimulationConfig } from '../store/useSimulationStore';
import { maskPII } from '../utils/crypto';

// ─── Synthetic ID helpers ──────────────────────────────────────────────────
let simCounter = 1000;
const nextCounter = () => ++simCounter;

export const simTxId   = (n: number) => `TX-SIM-${String(n).padStart(5, '0')}`;
export const simAccId  = (n: number) => `ACC-SIM-${String(n).padStart(5, '0')}`;
export const simDevId  = (n: number) => `DEV-SIM-${String(n).padStart(2, '0')}`;
export const simIpId   = (n: number) => `IP-SIM-${String(n).padStart(2, '0')}`;
export const simMerchId = (n: number) => `MRC-SIM-${String(n).padStart(3, '0')}`;
export const simCaseId  = () => `CASE-SIM-${String(nextCounter()).padStart(4, '0')}`;
export const simAuditId = () => `AUD-SIM-${String(nextCounter()).padStart(5, '0')}`;

const INR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

// ─── Risk score ranges per severity ───────────────────────────────────────
const severityBaseScore = (sev: SimSeverity): number =>
  sev === 'CRITICAL' ? 92 : sev === 'HIGH' ? 74 : 55;

// ─── Scenario metadata ─────────────────────────────────────────────────────
export interface ScenarioMeta {
  id: ScenarioType;
  label: string;
  description: string;
  expectedDetection: string;
  icon: string;
}

export const SCENARIO_DEFINITIONS: ScenarioMeta[] = [
  {
    id: 'MULE_RING',
    label: 'Mule Ring',
    description: 'Coordinated network of accounts moving funds through multiple intermediary accounts in a layered chain.',
    expectedDetection: 'Mule Network Correlation + Transaction Chain',
    icon: 'Users',
  },
  {
    id: 'ACCOUNT_TAKEOVER',
    label: 'Account Takeover',
    description: 'Compromised account exhibiting anomalous login, new device/IP, and sudden high-value transactions.',
    expectedDetection: 'Account Takeover / Behavioral Anomaly',
    icon: 'UserX',
  },
  {
    id: 'VELOCITY_ATTACK',
    label: 'Transaction Velocity Attack',
    description: '15–30 transactions from the same account/device within seconds, indicating card-testing or credential-stuffing.',
    expectedDetection: 'High Velocity / Transaction Burst',
    icon: 'Zap',
  },
  {
    id: 'STRUCTURING',
    label: 'Structuring (Smurfing)',
    description: 'Multiple transactions intentionally below reporting thresholds designed to avoid AML detection.',
    expectedDetection: 'Potential Structuring / Sub-threshold Aggregation',
    icon: 'BarChart2',
  },
  {
    id: 'CIRCULAR_FUNDING',
    label: 'Circular Funding',
    description: 'Funds cycle through several accounts and return to the originator — a classic layering signature.',
    expectedDetection: 'Circular Funding / Suspicious Network Cycle',
    icon: 'RefreshCcw',
  },
];

// ─── Per-scenario transaction factories ────────────────────────────────────

interface GeneratedTx extends Transaction {
  _simScenario: ScenarioType;
  _detectionReasons: string[];
}

export interface ScenarioBundle {
  transactions: GeneratedTx[];
  networkNodes: NetworkNode[];
  networkEdges: NetworkEdge[];
  caseTitle: string;
  caseNotes: string[];
  involvedAccounts: string[];
}

// Shared: build a single synthetic transaction
function makeTx(
  seq: number,
  senderId: string,
  receiverId: string,
  amount: number,
  riskScore: number,
  anomalyScore: number,
  networkRiskScore: number,
  ipId: number,
  devId: number,
  signals: string[],
  decision: Transaction['decision'],
  scenario: ScenarioType,
  detectionReasons: string[],
): GeneratedTx {
  const txId = simTxId(seq);
  return {
    id: txId,
    timestamp: new Date().toISOString(),
    amount,
    currency: 'INR',
    senderId,
    receiverId,
    maskedUserId: maskPII(senderId),
    ipAddress: simIpId(ipId),
    deviceFingerprint: simDevId(devId),
    riskScore: Math.min(riskScore, 100),
    anomalyScore: Math.min(anomalyScore, 100),
    networkRiskScore: Math.min(networkRiskScore, 100),
    decision,
    processingLatency: 18 + Math.floor(Math.random() * 28),
    riskSignals: signals,
    status: decision === 'PRE_SETTLEMENT_BLOCKED' ? 'REJECTED' : 'PENDING',
    _simScenario: scenario,
    _detectionReasons: detectionReasons,
  };
}

// ── MULE RING ──────────────────────────────────────────────────────────────
function generateMuleRing(config: SimulationConfig): ScenarioBundle {
  const base = severityBaseScore(config.severity);
  const count = config.transactionCount;
  const accounts = [10042, 10087, 10193, 10261, 10388, 10441, 10512];
  const victim = simAccId(accounts[0]);
  const mules = accounts.slice(1, 5).map(simAccId);
  const cashOut = simAccId(accounts[5]);
  const sharedIp = 7;
  const sharedDev = 4;

  const txs: GeneratedTx[] = [];

  // First transaction: victim → mule A (large amount, slightly suspicious)
  txs.push(makeTx(
    9001 + txs.length, victim, mules[0],
    87400, base - 3, base - 5, base - 8,
    sharedIp, sharedDev,
    ['HIGH_VALUE_TRANSFER', 'MULE_RING_CORRELATION'],
    base >= 85 ? 'PRE_SETTLEMENT_BLOCKED' : 'REVIEW',
    'MULE_RING', ['Mule network correlation detected', 'Shared device fingerprint'],
  ));

  // Intermediary mule-to-mule transfers
  for (let i = 0; i < Math.min(count - 3, mules.length - 1); i++) {
    const score = Math.min(base + i * 2, 100);
    txs.push(makeTx(
      9001 + txs.length, mules[i], mules[i + 1] ?? cashOut,
      Math.floor(85000 - i * 7200),
      score, score - 4, score + 2,
      sharedIp, sharedDev,
      ['UNUSUAL_VELOCITY', 'SHARED_DEVICE', 'MULE_RING_CORRELATION'],
      score >= 85 ? 'PRE_SETTLEMENT_BLOCKED' : 'REVIEW',
      'MULE_RING', ['Shared device across mule chain', 'Rapid transfer velocity'],
    ));
  }

  // Cash-out transaction
  txs.push(makeTx(
    9001 + txs.length, mules[mules.length - 1], cashOut,
    62300, Math.min(base + 5, 100), base, base + 4,
    sharedIp, sharedDev + 1,
    ['CASH_OUT_PATTERN', 'MULE_RING_CORRELATION', 'HIGH_VALUE_TRANSFER'],
    'PRE_SETTLEMENT_BLOCKED',
    'MULE_RING', ['Cash-out account identified', 'Terminal node in mule chain'],
  ));

  // Fill remaining with supporting mule transfers
  while (txs.length < count) {
    const muleIdx = txs.length % mules.length;
    const score = Math.min(base + 3, 100);
    txs.push(makeTx(
      9001 + txs.length, mules[muleIdx], simAccId(10600 + txs.length),
      Math.floor(10000 + Math.random() * 20000),
      score, score - 6, score + 1,
      sharedIp, sharedDev,
      ['UNUSUAL_VELOCITY', 'SHARED_IP'],
      score >= 85 ? 'PRE_SETTLEMENT_BLOCKED' : 'REVIEW',
      'MULE_RING', ['Shared IP across mule accounts'],
    ));
  }

  // Network graph
  const allAccounts = [victim, ...mules, cashOut];
  const nodes: NetworkNode[] = allAccounts.map((id, i) => ({
    id,
    label: id,
    type: 'ACCOUNT',
    riskLevel: i === 0 ? 'HIGH' : i === allAccounts.length - 1 ? 'CRITICAL' : 'CRITICAL',
    metadata: { riskScore: base - i * 2 + 10, role: i === 0 ? 'Victim' : i === allAccounts.length - 1 ? 'Cash-Out' : `Mule-${i}`, synthetic: true },
  }));
  nodes.push(
    { id: simIpId(sharedIp), label: simIpId(sharedIp), type: 'IP', riskLevel: 'CRITICAL', metadata: { country: 'NG', vpn: true, synthetic: true } },
    { id: simDevId(sharedDev), label: simDevId(sharedDev), type: 'DEVICE', riskLevel: 'CRITICAL', metadata: { type: 'MOBILE', sharedAcross: 5, synthetic: true } },
  );

  const edges: NetworkEdge[] = [];
  for (let i = 0; i < allAccounts.length - 1; i++) {
    edges.push({
      id: `SIM-E-${i}`,
      source: allAccounts[i],
      target: allAccounts[i + 1],
      type: 'TRANSFERRED_TO',
      weight: 0.9,
    });
  }
  // Shared IP & device edges
  allAccounts.slice(1).forEach((acc, i) => {
    edges.push({ id: `SIM-IP-${i}`, source: acc, target: simIpId(sharedIp), type: 'LOGGED_IN_FROM', weight: 0.7 });
    edges.push({ id: `SIM-DEV-${i}`, source: acc, target: simDevId(sharedDev), type: 'USES_DEVICE', weight: 0.8 });
  });

  return {
    transactions: txs.slice(0, count),
    networkNodes: nodes,
    networkEdges: edges,
    caseTitle: 'Potential Mule Network — Synthetic Simulation',
    caseNotes: [
      '[SIMULATION] Coordinated mule ring detected across 5 linked accounts.',
      `Shared device ${simDevId(sharedDev)} and IP ${simIpId(sharedIp)} across all mule nodes.`,
      `Victim account ${victim} initiated chain. Cash-out via ${cashOut}.`,
      'Network correlation: 4-hop layering chain confirmed.',
    ],
    involvedAccounts: allAccounts,
  };
}

// ── ACCOUNT TAKEOVER ───────────────────────────────────────────────────────
function generateAccountTakeover(config: SimulationConfig): ScenarioBundle {
  const base = severityBaseScore(config.severity);
  const count = config.transactionCount;
  const victimAcc = simAccId(20541);
  const normalDev = simDevId(11);
  const attackDev = simDevId(99);
  const normalIp = simIpId(3);
  const attackIp = simIpId(17);
  const txs: GeneratedTx[] = [];

  // Normal transactions before takeover
  const normalCount = Math.min(3, Math.floor(count * 0.25));
  for (let i = 0; i < normalCount; i++) {
    txs.push(makeTx(
      8001 + i, victimAcc, simAccId(20600 + i),
      1500 + i * 300, 12, 10, 8, 3, 11,
      ['NOMINAL_BEHAVIOR'],
      'APPROVED', 'ACCOUNT_TAKEOVER', [],
    ));
  }

  // Takeover moment: new device, new IP, geo anomaly
  const ato1 = makeTx(
    8010, victimAcc, simAccId(20700),
    base >= 85 ? 98500 : 45000,
    base + 2, base - 4, base - 6,
    17, 99,
    ['NEW_DEVICE', 'NEW_IP', 'GEO_ANOMALY', 'BEHAVIORAL_DEVIATION'],
    base >= 85 ? 'PRE_SETTLEMENT_BLOCKED' : 'REVIEW',
    'ACCOUNT_TAKEOVER',
    ['New device fingerprint not seen in 90 days', 'IP originates from different country', 'Geographic anomaly: 1,840km from last session'],
  );
  txs.push(ato1);

  // Rapid subsequent attempts
  const remaining = count - txs.length;
  for (let i = 0; i < remaining; i++) {
    const score = Math.min(base + 1 + i, 100);
    txs.push(makeTx(
      8011 + i, victimAcc, simAccId(20701 + i),
      Math.floor(30000 + Math.random() * 50000),
      score, score - 3, score - 5,
      17, 99,
      ['NEW_DEVICE', 'RAPID_SUCCESSION', 'BEHAVIORAL_DEVIATION'],
      score >= 85 ? 'PRE_SETTLEMENT_BLOCKED' : 'REVIEW',
      'ACCOUNT_TAKEOVER',
      ['Rapid successive attempts from same device', 'Account behavioral profile deviation'],
    ));
  }

  const nodes: NetworkNode[] = [
    { id: victimAcc, label: `${victimAcc} (Victim)`, type: 'ACCOUNT', riskLevel: 'HIGH', metadata: { synthetic: true, role: 'Compromised Account' } },
    { id: attackIp, label: attackIp, type: 'IP', riskLevel: 'CRITICAL', metadata: { country: 'RU', vpn: true, synthetic: true } },
    { id: attackDev, label: attackDev, type: 'DEVICE', riskLevel: 'CRITICAL', metadata: { type: 'UNKNOWN', synthetic: true } },
    { id: normalIp, label: `${normalIp} (Legitimate)`, type: 'IP', riskLevel: 'LOW', metadata: { synthetic: true } },
    { id: normalDev, label: `${normalDev} (Legitimate)`, type: 'DEVICE', riskLevel: 'LOW', metadata: { synthetic: true } },
  ];
  const edges: NetworkEdge[] = [
    { id: 'SIM-ATO-1', source: victimAcc, target: attackIp, type: 'LOGGED_IN_FROM', weight: 0.95 },
    { id: 'SIM-ATO-2', source: victimAcc, target: attackDev, type: 'USES_DEVICE', weight: 0.95 },
    { id: 'SIM-ATO-3', source: victimAcc, target: normalIp, type: 'LOGGED_IN_FROM', weight: 0.3 },
    { id: 'SIM-ATO-4', source: victimAcc, target: normalDev, type: 'USES_DEVICE', weight: 0.3 },
  ];

  return {
    transactions: txs.slice(0, count),
    networkNodes: nodes,
    networkEdges: edges,
    caseTitle: 'Account Takeover — Behavioral Anomaly — Synthetic Simulation',
    caseNotes: [
      '[SIMULATION] Account takeover detected for account ' + victimAcc + '.',
      `Attacker device ${attackDev} and IP ${attackIp} introduced at session boundary.`,
      'Geographic jump: ~1,840km from last authenticated session.',
      'Behavioral deviation score exceeds threshold for 90-day profile.',
    ],
    involvedAccounts: [victimAcc],
  };
}

// ── VELOCITY ATTACK ────────────────────────────────────────────────────────
function generateVelocityAttack(config: SimulationConfig): ScenarioBundle {
  const base = severityBaseScore(config.severity);
  const count = Math.max(config.transactionCount, 10);
  const attacker = simAccId(30841);
  const sharedDev = simDevId(5);
  const sharedIp = simIpId(12);
  const txs: GeneratedTx[] = [];

  for (let i = 0; i < count; i++) {
    const score = Math.min(base + Math.floor(i * 1.5), 100);
    const amount = 950 + (i * 7);   // small amounts — card testing
    txs.push(makeTx(
      7001 + i, attacker, simAccId(30900 + i),
      amount, score, score - 2, score - 4,
      12, 5,
      ['UNUSUAL_VELOCITY', 'HIGH_FREQUENCY_BURST', 'SHARED_DEVICE', 'CARD_TESTING_PATTERN'],
      score >= 85 ? 'PRE_SETTLEMENT_BLOCKED' : 'REVIEW',
      'VELOCITY_ATTACK',
      [`Transaction ${i + 1} of ${count} from same device in <60s window`, 'Transaction burst pattern consistent with automated testing'],
    ));
  }

  const nodes: NetworkNode[] = [
    { id: attacker, label: attacker, type: 'ACCOUNT', riskLevel: 'CRITICAL', metadata: { synthetic: true, role: 'Attacker Account' } },
    { id: sharedIp, label: sharedIp, type: 'IP', riskLevel: 'CRITICAL', metadata: { vpn: true, synthetic: true } },
    { id: sharedDev, label: sharedDev, type: 'DEVICE', riskLevel: 'CRITICAL', metadata: { type: 'SERVER', synthetic: true } },
  ];
  const edges: NetworkEdge[] = [
    { id: 'SIM-VEL-1', source: attacker, target: sharedIp, type: 'LOGGED_IN_FROM', weight: 0.99 },
    { id: 'SIM-VEL-2', source: attacker, target: sharedDev, type: 'USES_DEVICE', weight: 0.99 },
  ];

  return {
    transactions: txs.slice(0, count),
    networkNodes: nodes,
    networkEdges: edges,
    caseTitle: 'Transaction Velocity Attack — Synthetic Simulation',
    caseNotes: [
      '[SIMULATION] Velocity attack detected: ' + count + ' transactions from ' + attacker + ' in under 60 seconds.',
      `All transactions originate from device ${sharedDev} and IP ${sharedIp}.`,
      'Pattern consistent with automated card-testing or credential-stuffing tools.',
    ],
    involvedAccounts: [attacker],
  };
}

// ── STRUCTURING ────────────────────────────────────────────────────────────
function generateStructuring(config: SimulationConfig): ScenarioBundle {
  const base = severityBaseScore(config.severity);
  const count = config.transactionCount;
  const structurer = simAccId(40327);
  const THRESHOLD = 10000; // ₹10,000 reporting threshold
  const txs: GeneratedTx[] = [];

  const subThresholdAmounts = [9800, 9700, 9950, 9600, 9850, 9750, 9500, 9900, 9650, 9800, 9550, 9780];

  for (let i = 0; i < count; i++) {
    const amount = subThresholdAmounts[i % subThresholdAmounts.length];
    const score = Math.min(base - 10 + i * 2, 100);  // risk grows as pattern emerges
    txs.push(makeTx(
      6001 + i, structurer, simAccId(40400 + i),
      amount, score, score - 5, score - 8,
      6 + (i % 3), 8,
      ['STRUCTURING_PATTERN', 'SUB_THRESHOLD_REPEAT', 'UNUSUAL_FREQUENCY'],
      score >= 85 ? 'PRE_SETTLEMENT_BLOCKED' : score >= 65 ? 'REVIEW' : 'APPROVED',
      'STRUCTURING',
      [
        `Amount ₹${amount.toLocaleString('en-IN')} is below ₹${THRESHOLD.toLocaleString('en-IN')} reporting threshold`,
        `Transaction ${i + 1} of ${count} in sub-threshold range`,
        `Aggregate total: ${INR(subThresholdAmounts.slice(0, i + 1).reduce((a, b) => a + b, 0))}`,
      ],
    ));
  }

  const nodes: NetworkNode[] = [
    { id: structurer, label: structurer, type: 'ACCOUNT', riskLevel: base >= 85 ? 'CRITICAL' : 'HIGH', metadata: { synthetic: true, role: 'Structurer Account' } },
    { id: simMerchId(1), label: simMerchId(1), type: 'DEVICE', riskLevel: 'MEDIUM', metadata: { synthetic: true } },
  ];
  const edges: NetworkEdge[] = [
    { id: 'SIM-STR-1', source: structurer, target: simMerchId(1), type: 'RELATED_TO', weight: 0.6 },
  ];

  return {
    transactions: txs.slice(0, count),
    networkNodes: nodes,
    networkEdges: edges,
    caseTitle: 'Structuring (Smurfing) — Sub-Threshold Aggregation — Synthetic Simulation',
    caseNotes: [
      '[SIMULATION] Structuring pattern detected from account ' + structurer + '.',
      `${count} transactions all below ₹${THRESHOLD.toLocaleString('en-IN')} reporting threshold.`,
      `Aggregate total: ${INR(subThresholdAmounts.slice(0, count).reduce((a, b) => a + b, 0))}.`,
      'Pattern consistent with intentional sub-threshold structuring to avoid AML reporting.',
    ],
    involvedAccounts: [structurer],
  };
}

// ── CIRCULAR FUNDING ───────────────────────────────────────────────────────
function generateCircularFunding(config: SimulationConfig): ScenarioBundle {
  const base = severityBaseScore(config.severity);
  const count = config.transactionCount;
  const ringAccounts = [50141, 50287, 50393, 50461].map(simAccId);
  const sharedIp = simIpId(9);
  const sharedDev = simDevId(7);
  const txs: GeneratedTx[] = [];

  // A → B → C → D → A (circular)
  const circleLength = ringAccounts.length;
  for (let i = 0; i < count; i++) {
    const src = ringAccounts[i % circleLength];
    const dst = ringAccounts[(i + 1) % circleLength];
    const score = Math.min(base + Math.floor(i / circleLength) * 3, 100);
    const amount = 54000 - (i % circleLength) * 3000;
    txs.push(makeTx(
      5001 + i, src, dst,
      amount, score, score - 3, score + 2,
      9, 7,
      ['CIRCULAR_FUNDING_PATTERN', 'FUNDS_RETURN_TO_ORIGIN', 'NETWORK_CYCLE_DETECTED'],
      score >= 85 ? 'PRE_SETTLEMENT_BLOCKED' : 'REVIEW',
      'CIRCULAR_FUNDING',
      ['Graph cycle detected: funds returning to originating account', `Hop ${(i % circleLength) + 1} of ${circleLength}-node cycle`],
    ));
  }

  const nodes: NetworkNode[] = ringAccounts.map((id, i) => ({
    id,
    label: id,
    type: 'ACCOUNT' as const,
    riskLevel: 'CRITICAL' as const,
    metadata: { synthetic: true, role: `Ring Node ${i + 1}`, cyclePosition: i },
  }));
  nodes.push(
    { id: sharedIp, label: sharedIp, type: 'IP', riskLevel: 'CRITICAL', metadata: { synthetic: true } },
    { id: sharedDev, label: sharedDev, type: 'DEVICE', riskLevel: 'HIGH', metadata: { synthetic: true } },
  );

  const edges: NetworkEdge[] = ringAccounts.map((acc, i) => ({
    id: `SIM-CIR-${i}`,
    source: acc,
    target: ringAccounts[(i + 1) % circleLength],
    type: 'TRANSFERRED_TO' as const,
    weight: 0.95,
  }));
  ringAccounts.forEach((acc, i) => {
    edges.push({ id: `SIM-CIR-IP-${i}`, source: acc, target: sharedIp, type: 'LOGGED_IN_FROM', weight: 0.8 });
  });

  return {
    transactions: txs.slice(0, count),
    networkNodes: nodes,
    networkEdges: edges,
    caseTitle: 'Circular Funding — Network Cycle Detected — Synthetic Simulation',
    caseNotes: [
      '[SIMULATION] Circular funding cycle detected across ' + ringAccounts.length + ' linked accounts.',
      `Cycle: ${ringAccounts.join(' → ')} → ${ringAccounts[0]}`,
      `Shared IP ${sharedIp} across all nodes confirms coordination.`,
      'Graph cycle analysis confirms closed-loop layering structure.',
    ],
    involvedAccounts: ringAccounts,
  };
}

// ─── Main generator ────────────────────────────────────────────────────────
export function generateScenarioBundle(config: SimulationConfig): ScenarioBundle {
  switch (config.scenario) {
    case 'MULE_RING':         return generateMuleRing(config);
    case 'ACCOUNT_TAKEOVER':  return generateAccountTakeover(config);
    case 'VELOCITY_ATTACK':   return generateVelocityAttack(config);
    case 'STRUCTURING':       return generateStructuring(config);
    case 'CIRCULAR_FUNDING':  return generateCircularFunding(config);
    default:                  return generateMuleRing(config);
  }
}

// ─── Build simulation case ─────────────────────────────────────────────────
export function buildSimulationCase(
  bundle: ScenarioBundle,
  config: SimulationConfig,
  txIds: string[],
  simulationId: string,
): FraudCase {
  const meta = SCENARIO_DEFINITIONS.find(s => s.id === config.scenario)!;
  return {
    id: simCaseId(),
    title: bundle.caseTitle,
    status: 'INVESTIGATING',
    severity: config.severity,
    assignee: 'Operator-7',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    relatedTransactions: txIds,
    relatedEntities: bundle.involvedAccounts,
    notes: [
      ...bundle.caseNotes,
      `[SIMULATION ID: ${simulationId}] — ${meta.expectedDetection}`,
      `[SYNTHETIC DATA ONLY — NOT A REAL INVESTIGATION]`,
    ],
  };
}

// ─── Build simulation audit records ───────────────────────────────────────
export function buildSimAuditRecord(
  action: string,
  resourceId: string,
  details: Record<string, unknown>,
  simulationId: string,
): AuditRecord {
  return {
    id: simAuditId(),
    timestamp: new Date().toISOString(),
    actor: `SIMULATION_ENGINE[${simulationId}]`,
    action,
    resourceType: 'TRANSACTION',
    resourceId,
    details: { ...details, synthetic: true, simulationId },
  };
}

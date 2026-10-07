export type TransactionDecision = 'APPROVED' | 'REVIEW' | 'PRE_SETTLEMENT_BLOCKED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REJECTED';

export interface RiskSignal {
  id: string;
  name: string;
  description: string;
  level: RiskLevel;
  weight: number;
}

export interface TransactionRisk {
  score: number;
  anomalyScore: number;
  networkRiskScore: number;
  level: RiskLevel;
  signals: RiskSignal[];
}

export interface Transaction {
  id: string;
  timestamp: string;
  amount: number;
  currency: string;
  senderId: string;
  receiverId: string;
  maskedUserId: string;
  ipAddress: string;
  deviceFingerprint: string;
  merchantId?: string;
  riskScore: number;
  anomalyScore: number;
  networkRiskScore: number;
  decision: TransactionDecision;
  processingLatency: number;
  riskSignals: string[]; // references to RiskSignal names or IDs
  status: TransactionStatus;
  linkedCaseId?: string;
}

export interface AccountEntity {
  id: string;
  type: 'USER' | 'MERCHANT' | 'MULE';
  createdAt: string;
  riskLevel: RiskLevel;
  balance?: number;
}

export interface DeviceEntity {
  fingerprint: string;
  type: 'MOBILE' | 'DESKTOP' | 'SERVER' | 'UNKNOWN';
  riskScore: number;
  lastSeenIp: string;
}

export interface IPEntity {
  address: string;
  country: string;
  isp: string;
  riskScore: number;
  isVpnOrProxy: boolean;
}

export interface NetworkNode {
  id: string;
  label: string;
  type: 'ACCOUNT' | 'DEVICE' | 'IP' | 'TRANSACTION';
  riskLevel: RiskLevel;
  metadata?: Record<string, any>;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  type: 'TRANSFERRED_TO' | 'LOGGED_IN_FROM' | 'USES_DEVICE' | 'SHARES_IP' | 'RELATED_TO';
  weight: number;
}

export interface FraudCase {
  id: string;
  title: string;
  status: 'OPEN' | 'INVESTIGATING' | 'UNDER_REVIEW' | 'CONFIRMED_FRAUD' | 'FALSE_POSITIVE' | 'CLOSED_FRAUD' | 'CLOSED_FALSE_POSITIVE' | 'CLOSED';
  severity: RiskLevel;
  assignee?: string;
  createdAt: string;
  updatedAt: string;
  relatedTransactions: string[];
  relatedEntities: string[];
  notes: string[];
}

export interface CaseBrief {
  id: string;
  title: string;
  severity: RiskLevel;
  status: FraudCase['status'];
  createdAt: string;
  summary: string;
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: Record<string, any>;
}

export interface TelemetryPoint {
  timestamp: string;
  tps: number;
  latencyAvg: number;
  blockRate: number;
  reviewRate: number;
}

export interface SystemStatus {
  pipeline: 'Operational' | 'Degraded' | 'Offline';
  latency: number;
  ledgerVerified: boolean;
  activeConnections: number;
  lastSync: string;
}

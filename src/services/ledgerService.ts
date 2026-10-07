import type { Transaction } from '../types';
import type { AuditRecord } from '../types';

export interface LedgerEntry {
  seq: number;
  timestamp: string;
  transactionId: string;
  anomalyScore: number;
  networkScore: number;
  decision: string;
  piiHash: string;
  actor: string;
  action: string;
  payload: Record<string, any>;
  previousLedgerHash: string;
  ledgerHash: string;
  verified?: boolean;
}

// ── SHA-256 via Web Crypto API ───────────────────────────────
export const sha256 = async (message: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const truncateHash = (hash: string) =>
  hash.length > 12 ? `0x${hash.slice(0, 4)}…${hash.slice(-4)}` : hash;

// ── PII Hashing: hash synthetic data, never raw ──────────────
export const hashPII = async (maskedUserId: string, deviceFingerprint: string): Promise<string> => {
  return sha256(`${maskedUserId}|${deviceFingerprint}`);
};

// ── Build ledger entry from audit record + previous hash ─────
export const buildLedgerEntry = async (
  audit: AuditRecord,
  seq: number,
  previousHash: string,
  transaction?: Transaction
): Promise<LedgerEntry> => {
  const piiHash = transaction
    ? await hashPII(transaction.maskedUserId, transaction.deviceFingerprint)
    : await sha256(`${audit.actor}|${audit.resourceId}`);

  const payload = {
    seq,
    timestamp: audit.timestamp,
    transactionId: audit.resourceId,
    actor: audit.actor,
    action: audit.action,
    anomalyScore: transaction?.anomalyScore ?? 0,
    networkScore: transaction?.networkRiskScore ?? 0,
    decision: transaction?.decision ?? audit.action,
    details: audit.details,
  };

  const ledgerHash = await sha256(
    JSON.stringify(payload) + previousHash
  );

  return {
    seq,
    timestamp: audit.timestamp,
    transactionId: audit.resourceId,
    anomalyScore: transaction?.anomalyScore ?? 0,
    networkScore: transaction?.networkRiskScore ?? 0,
    decision: transaction?.decision ?? audit.action,
    piiHash,
    actor: audit.actor,
    action: audit.action,
    payload,
    previousLedgerHash: previousHash,
    ledgerHash,
    verified: true,
  };
};

// ── Verify full chain integrity ──────────────────────────────
export const verifyChain = async (entries: LedgerEntry[]): Promise<{ valid: boolean; failedAt?: number }> => {
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const expectedHash = await sha256(JSON.stringify(entry.payload) + entry.previousLedgerHash);
    if (expectedHash !== entry.ledgerHash) {
      return { valid: false, failedAt: i };
    }
  }
  return { valid: true };
};

// ── Build full ledger from audit records ─────────────────────
export const buildLedger = async (
  audits: AuditRecord[],
  transactions: Transaction[]
): Promise<LedgerEntry[]> => {
  const txMap = new Map(transactions.map(t => [t.id, t]));
  const entries: LedgerEntry[] = [];
  let prevHash = '0'.repeat(64); // genesis hash

  // Process in chronological order
  const sorted = [...audits].sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  for (let i = 0; i < sorted.length; i++) {
    const audit = sorted[i];
    const tx = txMap.get(audit.resourceId);
    const entry = await buildLedgerEntry(audit, i + 1, prevHash, tx);
    entries.push(entry);
    prevHash = entry.ledgerHash;
  }

  return entries.reverse(); // newest first for display
};

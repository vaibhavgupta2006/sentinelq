import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { useToastStore } from '../store/useToastStore';
import { generateTransactionId, maskPII } from '../utils/crypto';
import {
  calculateStatisticalRisk, calculateNetworkRisk,
  calculateVelocityRisk, calculateCompositeRisk, generateRiskSignals
} from '../utils/risk';
import type { Transaction, AuditRecord } from '../types';

// Rate-limit toasts: no more than 1 blocked notification per N ms
const TOAST_THROTTLE_MS = 6000;
let lastBlockedToast = 0;
let lastReviewToast = 0;

export const useTransactionStream = () => {
  const isPaused    = useStore(state => state.isStreamPaused);
  const addTransaction  = useStore(state => state.addTransaction);
  const addAuditRecord  = useStore(state => state.addAuditRecord);
  const updateTelemetry = useStore(state => state.updateTelemetry);
  const toast = useToastStore(s => s.push);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }

    // Guard against double-mount in StrictMode
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      const rand = Math.random();
      const isBlocked = rand > 0.9;
      const isReview  = !isBlocked && rand > 0.7;

      const amount = isBlocked ? (Math.random() * 800000 + 200000) : (Math.random() * 50000 + 100);
      const isNewAccount    = isBlocked ? Math.random() > 0.3 : Math.random() > 0.9;
      const hasSharedDevice = isBlocked && Math.random() > 0.4;
      const hasSharedIP     = isBlocked && Math.random() > 0.4;
      const isCircular      = isBlocked && Math.random() > 0.6;
      const isRapidChain    = isBlocked && Math.random() > 0.5;
      const geoAnomaly      = isBlocked ? Math.random() > 0.5 : (isReview && Math.random() > 0.5);

      const statRisk = calculateStatisticalRisk(amount, isNewAccount);
      const netRisk  = calculateNetworkRisk(hasSharedDevice, hasSharedIP, isCircular);
      const velRisk  = calculateVelocityRisk(isRapidChain);
      let compRisk   = calculateCompositeRisk(statRisk, netRisk, velRisk, geoAnomaly);

      // Clamp into intended buckets
      if (isBlocked && compRisk < 85) compRisk = 85 + Math.floor(Math.random() * 15);
      if (isReview  && (compRisk < 65 || compRisk >= 85)) compRisk = 65 + Math.floor(Math.random() * 19);
      if (!isBlocked && !isReview && compRisk >= 65) compRisk = Math.floor(Math.random() * 64);

      const decision: Transaction['decision'] = compRisk >= 85 ? 'PRE_SETTLEMENT_BLOCKED' : compRisk >= 65 ? 'REVIEW' : 'APPROVED';
      const senderId = `usr_${Math.random().toString(36).slice(2, 8)}`;
      const txId = generateTransactionId();

      const tx: Transaction = {
        id: txId,
        timestamp: new Date().toISOString(),
        amount,
        currency: 'INR',
        senderId,
        receiverId: `merch_${Math.random().toString(36).slice(2, 8)}`,
        maskedUserId: maskPII(senderId),
        ipAddress: `198.51.100.${Math.floor(Math.random() * 255)}`,
        deviceFingerprint: `fp_${Math.random().toString(36).slice(2, 10)}`,
        riskScore: compRisk,
        anomalyScore: statRisk,
        networkRiskScore: netRisk,
        decision,
        processingLatency: Math.floor(Math.random() * 40) + 12,
        riskSignals: generateRiskSignals(compRisk, amount, '198.51.100.1'),
        status: decision === 'PRE_SETTLEMENT_BLOCKED' ? 'REJECTED' : 'COMPLETED',
      };

      addTransaction(tx);

      if (decision === 'PRE_SETTLEMENT_BLOCKED') {
        const audit: AuditRecord = {
          id: generateTransactionId('aud_'),
          timestamp: new Date().toISOString(),
          actor: 'SENTINELQ_MODEL_V2',
          action: 'AUTO_BLOCK',
          resourceType: 'TRANSACTION',
          resourceId: tx.id,
          details: {
            riskScore: compRisk,
            anomalyScore: statRisk,
            networkScore: netRisk,
            signals: tx.riskSignals,
            reason: 'Exceeded critical threshold (85)',
          },
        };
        addAuditRecord(audit);

        // Throttled toast for blocked transactions
        const now = Date.now();
        if (now - lastBlockedToast > TOAST_THROTTLE_MS) {
          lastBlockedToast = now;
          toast(`Transaction intercepted — ${tx.maskedUserId} · Risk ${compRisk}`, 'danger');
        }
      } else if (decision === 'REVIEW') {
        const now = Date.now();
        if (now - lastReviewToast > TOAST_THROTTLE_MS * 2) {
          lastReviewToast = now;
          toast(`Transaction flagged for review — Risk ${compRisk}`, 'warning');
        }
      }

      updateTelemetry({
        timestamp: new Date().toISOString(),
        tps: 12450 + Math.floor(Math.random() * 500) - 250,
        latencyAvg: 42 + Math.floor(Math.random() * 8) - 4,
        blockRate: 0.1,
        reviewRate: 0.2,
      });

    }, 2000);

    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };
  }, [isPaused, addTransaction, addAuditRecord, updateTelemetry, toast]);
};

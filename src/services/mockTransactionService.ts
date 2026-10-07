import { useStore } from '../store/useStore';
import { generateTransactionId, maskPII } from '../utils/crypto';
import { calculateRiskScore, generateRiskSignals } from '../utils/risk';
import type { Transaction } from '../types';

let simInterval: ReturnType<typeof setInterval>;

export const startTransactionSimulation = () => {
  simInterval = setInterval(() => {
    const isAnomaly = Math.random() > 0.95; // 5% chance of anomaly
    const amount = isAnomaly ? Math.random() * 50000 : Math.random() * 500;
    const score = isAnomaly ? calculateRiskScore({ amount, isVpn: true, distanceVelocity: 600, knownBadIP: false }) : Math.floor(Math.random() * 20);
    const decision = score > 85 ? 'PRE_SETTLEMENT_BLOCKED' : score > 65 ? 'REVIEW' : 'APPROVED';
    const tx: Transaction = {
      id: generateTransactionId(),
      timestamp: new Date().toISOString(),
      amount,
      currency: 'USD',
      senderId: `usr_${Math.random().toString(36).slice(2,8)}`,
      receiverId: `merch_${Math.random().toString(36).slice(2,8)}`,
      maskedUserId: '***',
      ipAddress: `198.51.100.${Math.floor(Math.random() * 255)}`,
      deviceFingerprint: `fp_${Math.random().toString(36).slice(2,10)}`,
      riskScore: score,
      anomalyScore: score * 0.9,
      networkRiskScore: score * 0.8,
      decision,
      processingLatency: Math.floor(Math.random() * 50) + 10,
      riskSignals: generateRiskSignals(score, amount, '198.51.100.1'),
      status: decision === 'PRE_SETTLEMENT_BLOCKED' ? 'REJECTED' : 'COMPLETED',
    };
    tx.maskedUserId = maskPII(tx.senderId);
    useStore.getState().addTransaction(tx);
    
    // Simple telemetry mock
    useStore.getState().updateTelemetry({
      timestamp: new Date().toISOString(),
      tps: Math.floor(Math.random() * 5000) + 10000,
      latencyAvg: Math.floor(Math.random() * 20) + 30,
      blockRate: 0.05,
      reviewRate: 0.1
    });

  }, 2000); // Fire every 2 seconds
};

export const stopTransactionSimulation = () => {
  if(simInterval) clearInterval(simInterval);
};

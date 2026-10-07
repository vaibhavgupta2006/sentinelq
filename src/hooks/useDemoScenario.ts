import { useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { useToastStore } from '../store/useToastStore';
import { generateTransactionId } from '../utils/crypto';
import type { Transaction, FraudCase, NetworkNode } from '../types';

export const useDemoScenario = () => {
  const [isRunning, setIsRunning] = useState(false);
  const store = useStore.getState();
  const toast = useToastStore.getState().push;

  const runDemo = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    
    // Ensure we start from a clean slate
    store.resetStore();
    
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const ringTarget = 'usr_demo_mule_1';
    
    toast('Demo Sequence Initiated: Coordinated Mule Ring', 'info');
    await wait(2000);

    // Step 1: Normal transactions
    toast('Ingesting normal background telemetry...', 'info');
    for (let i = 0; i < 3; i++) {
      store.addTransaction({
        id: generateTransactionId(),
        timestamp: new Date().toISOString(),
        amount: Math.floor(Math.random() * 5000),
        currency: 'INR',
        senderId: `usr_${Math.random().toString(36).substring(2, 8)}`,
        receiverId: `usr_${Math.random().toString(36).substring(2, 8)}`,
        maskedUserId: `us****${Math.random().toString(36).substring(2, 4)}`,
        ipAddress: '103.44.X.X',
        deviceFingerprint: 'dev_mock',
        merchantId: 'M_NIL',
        riskScore: Math.floor(Math.random() * 30),
        anomalyScore: Math.floor(Math.random() * 20),
        networkRiskScore: Math.floor(Math.random() * 20),
        decision: 'APPROVED',
        processingLatency: 35,
        riskSignals: [],
        status: 'COMPLETED'
      });
      await wait(800);
    }

    // Step 2: High value transaction appears
    toast('High-value cross-border transfer detected.', 'warning');
    const suspiciousTxId = generateTransactionId('tx_demo_');
    const suspiciousTx: Transaction = {
      id: suspiciousTxId,
      timestamp: new Date().toISOString(),
      amount: 450000,
      currency: 'INR',
      senderId: 'usr_target_vic',
      receiverId: ringTarget,
      maskedUserId: 'us****ic',
      ipAddress: '185.20.X.X',
      deviceFingerprint: 'dev_new_untrusted',
      merchantId: 'M_NIL',
      riskScore: 68,
      anomalyScore: 82,
      networkRiskScore: 0,
      decision: 'REVIEW',
      processingLatency: 45,
      riskSignals: ['UNUSUAL_AMOUNT', 'NEW_DEVICE'],
      status: 'PENDING'
    };
    store.addTransaction(suspiciousTx);
    await wait(2500);

    // Step 3: Network intelligence correlation
    toast('Network correlation complete: Circular funding pattern detected.', 'danger');
    // Rapidly increase risk
    const updatedTx = { ...suspiciousTx, riskScore: 94, networkRiskScore: 98, riskSignals: ['UNUSUAL_AMOUNT', 'NEW_DEVICE', 'CIRCULAR_MULE_RING'] };
    store.updateTransaction(suspiciousTxId, updatedTx);
    
    // Inject graph nodes for the ring
    const a: NetworkNode = {
      id: ringTarget,
      type: 'ACCOUNT',
      label: ringTarget,
      riskLevel: 'CRITICAL',
      metadata: { riskScore: 95, muleScore: 99, centrality: 4 }
    };
    store.setSelectedNetworkNode(a);
    await wait(2500);

    // Step 4: Intercept
    toast('Pre-settlement interception executed.', 'danger');
    const blockedTx = { ...updatedTx, decision: 'PRE_SETTLEMENT_BLOCKED' as const, status: 'REJECTED' as const };
    store.updateTransaction(suspiciousTxId, blockedTx);
    await wait(2000);

    // Step 5: Case Generation
    toast('Auto-generating Investigation Case...', 'info');
    const caseId = generateTransactionId('cas_demo_');
    const newCase: FraudCase = {
      id: caseId,
      title: 'Coordinated Mule Ring Interception',
      status: 'INVESTIGATING',
      severity: 'CRITICAL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      relatedTransactions: [suspiciousTxId],
      relatedEntities: [ringTarget, 'usr_ring_B', 'usr_ring_C', 'usr_ring_D'],
      assignee: 'Operator-7',
      notes: ['Auto-escalated by Network Correlation Engine: 4-hop circular layering cycle identified.']
    };
    store.addFraudCase(newCase);
    store.updateTransaction(suspiciousTxId, { linkedCaseId: caseId });
    await wait(2000);

    // Step 6: Audit Record
    toast('Cryptographic Audit Record sealed.', 'success');
    store.addAuditRecord({
      id: generateTransactionId('aud_'),
      timestamp: new Date().toISOString(),
      actor: 'SYSTEM_CORRELATION_ENGINE',
      action: 'AUTO_BLOCK',
      resourceType: 'TRANSACTION',
      resourceId: suspiciousTxId,
      details: { reason: 'CIRCULAR_MULE_RING', confidence: 0.98 }
    });

    setIsRunning(false);
    toast('Demo Sequence Complete.', 'success');
  }, [isRunning, store, toast]);

  return { runDemo, isRunning };
};

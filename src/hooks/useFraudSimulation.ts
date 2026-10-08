/**
 * useFraudSimulation.ts
 *
 * Orchestrates the fraud simulation pipeline — feeding generated transactions
 * through the same Zustand stores and audit paths as the real transaction stream.
 *
 * Pipeline per transaction:
 *   INGESTION → PII_MASKING → STATISTICAL_ANALYSIS → NETWORK_CORRELATION
 *   → RISK_SCORING → INTERCEPTION → CASE_GENERATION → AUDIT_LEDGER
 */
import { useCallback, useRef } from 'react';
import { useStore } from '../store/useStore';
import { useToastStore } from '../store/useToastStore';
import { useSimulationStore } from '../store/useSimulationStore';
import {
  generateScenarioBundle,
  buildSimulationCase,
  buildSimAuditRecord,
} from '../services/fraudScenarioGenerator';
import type { SimStage } from '../store/useSimulationStore';
import type { NetworkNode, NetworkEdge } from '../types';

const STAGE_SEQUENCE: SimStage[] = [
  'INGESTION',
  'PII_MASKING',
  'STATISTICAL_ANALYSIS',
  'NETWORK_CORRELATION',
  'RISK_SCORING',
  'INTERCEPTION',
];

const STAGE_LABELS: Record<SimStage, string> = {
  IDLE: 'Idle',
  INGESTION: 'Ingestion',
  PII_MASKING: 'PII Masking',
  STATISTICAL_ANALYSIS: 'Statistical Analysis',
  NETWORK_CORRELATION: 'Network Correlation',
  RISK_SCORING: 'Risk Scoring',
  INTERCEPTION: 'Interception',
  CASE_GENERATION: 'Case Generation',
  AUDIT_LEDGER: 'Audit Ledger',
  COMPLETE: 'Complete',
};

export { STAGE_LABELS };

// How long each pipeline stage "display" step takes (ms)
const STAGE_DISPLAY_MS = 220;

// Speed → delay between transactions (ms)
const speedToDelay = (speed: string): number => {
  if (speed === 'INSTANT') return 0;
  if (speed === '1_PER_SEC') return 1000;
  if (speed === '2_PER_SEC') return 500;
  return 500;
};

export const useFraudSimulation = () => {
  const store = useStore.getState;
  const sim = useSimulationStore.getState;
  const toast = useToastStore.getState().push;

  const abortRef = useRef(false);

  const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

  const addNetworkData = useCallback((nodes: NetworkNode[], edges: NetworkEdge[]) => {
    const state = useStore.getState();
    // Add nodes that don't already exist
    const existingIds = new Set(state.networkNodes.map((n) => n.id));
    const newNodes = nodes.filter((n) => !existingIds.has(n.id));
    if (newNodes.length > 0) {
      // Use individual store updates since we don't have a bulk add
      newNodes.forEach((node) => {
        useStore.setState((s) => ({
          networkNodes: [...s.networkNodes, node],
        }));
      });
    }

    // Add edges
    const existingEdgeIds = new Set(state.networkEdges.map((e) => e.id));
    const newEdges = edges.filter((e) => !existingEdgeIds.has(e.id));
    if (newEdges.length > 0) {
      newEdges.forEach((edge) => {
        useStore.setState((s) => ({
          networkEdges: [...s.networkEdges, edge],
        }));
      });
    }

    const totalLinks = useStore.getState().networkEdges.length;
    useSimulationStore.getState().setGraphLinks(totalLinks);
  }, []);

  const runSimulation = useCallback(async () => {
    const config = useSimulationStore.getState().config;
    const simId = useSimulationStore.getState().simulationId ?? 'SIM-UNKNOWN';
    abortRef.current = false;

    // Pause normal stream during simulation
    if (!useStore.getState().isStreamPaused) {
      useStore.getState().toggleStreamPause();
    }

    toast(`[SIMULATION] Starting: ${config.scenario.replace(/_/g, ' ')} scenario`, 'info');

    // Generate the full bundle up front (deterministic)
    const bundle = generateScenarioBundle(config);

    // Mark how many suspicious accounts
    useSimulationStore.getState().setSuspiciousAccounts(bundle.involvedAccounts.length);

    // ── Audit: simulation started ──────────────────────────────────────────
    useStore.getState().addAuditRecord(
      buildSimAuditRecord(
        'SIMULATION_STARTED',
        simId,
        {
          scenario: config.scenario,
          transactionCount: config.transactionCount,
          severity: config.severity,
          speed: config.speed,
          generatedTransactions: bundle.transactions.map((t) => t.id),
        },
        simId,
      ),
    );

    const interceptedTxIds: string[] = [];

    // ── Process each transaction through the pipeline ─────────────────────
    for (let i = 0; i < bundle.transactions.length; i++) {
      if (abortRef.current) break;

      const tx = bundle.transactions[i];
      const delay = speedToDelay(config.speed);

      // Walk through pipeline stages with display delay
      for (const stage of STAGE_SEQUENCE) {
        if (abortRef.current) break;
        useSimulationStore.getState().setStage(stage);
        if (delay > 0) await wait(STAGE_DISPLAY_MS);
      }

      if (abortRef.current) break;

      // ── INGESTION: commit transaction to store ─────────────────────────
      useStore.getState().addTransaction(tx);
      useSimulationStore.getState().incrementProgress();

      // ── Update telemetry ───────────────────────────────────────────────
      useStore.getState().updateTelemetry({
        timestamp: new Date().toISOString(),
        tps: 12450 + Math.floor(Math.random() * 300),
        latencyAvg: tx.processingLatency,
        blockRate: (interceptedTxIds.length / (i + 1)) * 100,
        reviewRate: 0.15,
      });

      // ── NETWORK: inject graph nodes/edges progressively ────────────────
      // Add a fraction of the graph per transaction
      const nodeSliceEnd = Math.ceil((bundle.networkNodes.length * (i + 1)) / bundle.transactions.length);
      const edgeSliceEnd = Math.ceil((bundle.networkEdges.length * (i + 1)) / bundle.transactions.length);
      addNetworkData(
        bundle.networkNodes.slice(0, nodeSliceEnd),
        bundle.networkEdges.slice(0, edgeSliceEnd),
      );

      // ── INTERCEPTION: handle blocked transactions ───────────────────────
      if (tx.decision === 'PRE_SETTLEMENT_BLOCKED') {
        useSimulationStore.getState().setStage('INTERCEPTION');
        if (delay > 0) await wait(STAGE_DISPLAY_MS);

        useSimulationStore.getState().incrementIntercepted();
        interceptedTxIds.push(tx.id);

        // Audit record for interception
        useStore.getState().addAuditRecord(
          buildSimAuditRecord(
            'SIM_AUTO_BLOCK',
            tx.id,
            {
              riskScore: tx.riskScore,
              anomalyScore: tx.anomalyScore,
              networkScore: tx.networkRiskScore,
              signals: tx.riskSignals,
              detectionReasons: (tx as any)._detectionReasons,
              reason: `Risk score ${tx.riskScore} exceeds PRE_SETTLEMENT threshold (85)`,
            },
            simId,
          ),
        );

        toast(
          `[SIM] INTERCEPTED — ${tx.id} · ₹${Math.round(tx.amount).toLocaleString('en-IN')} · Risk ${tx.riskScore}`,
          'danger',
        );
      } else if (tx.decision === 'REVIEW') {
        toast(`[SIM] REVIEW — ${tx.id} · Risk ${tx.riskScore}`, 'warning');
      }

      // Delay between transactions
      if (delay > 0 && i < bundle.transactions.length - 1) {
        await wait(Math.max(0, delay - STAGE_SEQUENCE.length * STAGE_DISPLAY_MS));
      }
    }

    if (abortRef.current) {
      useSimulationStore.getState().stopSimulation();
      toast('[SIMULATION] Cancelled by operator.', 'warning');
      return;
    }

    // ── CASE GENERATION ────────────────────────────────────────────────────
    useSimulationStore.getState().setStage('CASE_GENERATION');
    if (speedToDelay(config.speed) > 0) await wait(600);

    const fraudCase = buildSimulationCase(
      bundle,
      config,
      bundle.transactions.map((t) => t.id),
      simId,
    );
    useStore.getState().addFraudCase(fraudCase);
    useSimulationStore.getState().setCaseId(fraudCase.id);

    // Link all intercepted transactions to the case
    bundle.transactions.forEach((tx) => {
      if (tx.decision === 'PRE_SETTLEMENT_BLOCKED') {
        useStore.getState().updateTransaction(tx.id, { linkedCaseId: fraudCase.id });
      }
    });

    toast(`[SIM] Case auto-generated: ${fraudCase.id}`, 'info');

    // ── AUDIT LEDGER ───────────────────────────────────────────────────────
    useSimulationStore.getState().setStage('AUDIT_LEDGER');
    if (speedToDelay(config.speed) > 0) await wait(400);

    useStore.getState().addAuditRecord(
      buildSimAuditRecord(
        'SIMULATION_CASE_GENERATED',
        fraudCase.id,
        {
          scenario: config.scenario,
          severity: config.severity,
          totalTransactions: bundle.transactions.length,
          interceptedCount: interceptedTxIds.length,
          involvedAccounts: bundle.involvedAccounts,
          graphNodes: bundle.networkNodes.length,
          graphEdges: bundle.networkEdges.length,
          caseTitle: fraudCase.title,
        },
        simId,
      ),
    );

    // ── COMPLETE ───────────────────────────────────────────────────────────
    useSimulationStore.getState().setStage('COMPLETE');
    toast(`[SIMULATION] Complete — ${interceptedTxIds.length} transactions intercepted. Case: ${fraudCase.id}`, 'success');

    // Resume normal stream after simulation completes
    if (useStore.getState().isStreamPaused) {
      useStore.getState().toggleStreamPause();
    }
  }, [addNetworkData, toast]);

  const cancelSimulation = useCallback(() => {
    abortRef.current = true;
  }, []);

  const startSimulation = useCallback(() => {
    useSimulationStore.getState().startSimulation();
    // Small delay to let state settle before starting the async loop
    setTimeout(() => {
      runSimulation();
    }, 50);
  }, [runSimulation]);

  return { startSimulation, cancelSimulation };
};

import { create } from 'zustand';

export type ScenarioType = 'MULE_RING' | 'ACCOUNT_TAKEOVER' | 'VELOCITY_ATTACK' | 'STRUCTURING' | 'CIRCULAR_FUNDING';
export type SimSeverity = 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SimSpeed = 'INSTANT' | '1_PER_SEC' | '2_PER_SEC';
export type SimStage =
  | 'IDLE'
  | 'INGESTION'
  | 'PII_MASKING'
  | 'STATISTICAL_ANALYSIS'
  | 'NETWORK_CORRELATION'
  | 'RISK_SCORING'
  | 'INTERCEPTION'
  | 'CASE_GENERATION'
  | 'AUDIT_LEDGER'
  | 'COMPLETE';

export interface SimulationConfig {
  scenario: ScenarioType;
  transactionCount: number;
  severity: SimSeverity;
  speed: SimSpeed;
}

export interface SimulationState {
  isOpen: boolean;
  isRunning: boolean;
  config: SimulationConfig;
  progress: number;
  currentStage: SimStage;
  interceptedCount: number;
  suspiciousAccountCount: number;
  graphLinkCount: number;
  generatedCaseId: string | null;
  simulationId: string | null;

  // Actions
  openModal: () => void;
  closeModal: () => void;
  setConfig: (c: Partial<SimulationConfig>) => void;
  startSimulation: () => void;
  stopSimulation: () => void;
  setStage: (stage: SimStage) => void;
  incrementProgress: () => void;
  incrementIntercepted: () => void;
  setSuspiciousAccounts: (n: number) => void;
  setGraphLinks: (n: number) => void;
  setCaseId: (id: string | null) => void;
  resetSimulation: () => void;
}

const DEFAULT_CONFIG: SimulationConfig = {
  scenario: 'MULE_RING',
  transactionCount: 12,
  severity: 'CRITICAL',
  speed: '2_PER_SEC',
};

export const useSimulationStore = create<SimulationState>((set) => ({
  isOpen: false,
  isRunning: false,
  config: { ...DEFAULT_CONFIG },
  progress: 0,
  currentStage: 'IDLE',
  interceptedCount: 0,
  suspiciousAccountCount: 0,
  graphLinkCount: 0,
  generatedCaseId: null,
  simulationId: null,

  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),
  setConfig: (c) => set((s) => ({ config: { ...s.config, ...c } })),

  startSimulation: () =>
    set({
      isRunning: true,
      progress: 0,
      currentStage: 'INGESTION',
      interceptedCount: 0,
      suspiciousAccountCount: 0,
      graphLinkCount: 0,
      generatedCaseId: null,
      simulationId: `SIM-${Date.now().toString(36).toUpperCase()}`,
      isOpen: false,
    }),

  stopSimulation: () =>
    set({
      isRunning: false,
      currentStage: 'IDLE',
    }),

  setStage: (stage) => set({ currentStage: stage }),
  incrementProgress: () => set((s) => ({ progress: s.progress + 1 })),
  incrementIntercepted: () => set((s) => ({ interceptedCount: s.interceptedCount + 1 })),
  setSuspiciousAccounts: (n) => set({ suspiciousAccountCount: n }),
  setGraphLinks: (n) => set({ graphLinkCount: n }),
  setCaseId: (id) => set({ generatedCaseId: id }),

  resetSimulation: () =>
    set({
      isRunning: false,
      progress: 0,
      currentStage: 'IDLE',
      interceptedCount: 0,
      suspiciousAccountCount: 0,
      graphLinkCount: 0,
      generatedCaseId: null,
      simulationId: null,
    }),
}));

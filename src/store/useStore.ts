import { create } from 'zustand';
import type { Transaction, FraudCase, NetworkNode, NetworkEdge, AuditRecord, TelemetryPoint, SystemStatus } from '../types';
import { mockTransactions, mockCases, mockNodes, mockEdges, mockAuditRecords } from '../data/mockData';

interface AppState {
  transactions: Transaction[];
  fraudCases: FraudCase[];
  networkNodes: NetworkNode[];
  networkEdges: NetworkEdge[];
  auditRecords: AuditRecord[];
  telemetry: TelemetryPoint[];
  selectedTransaction: Transaction | null;
  selectedNetworkNode: NetworkNode | null;
  systemStatus: SystemStatus;
  isStreamPaused: boolean;
  isDemoMode: boolean;
  
  // Actions
  addTransaction: (tx: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  setSelectedTransaction: (tx: Transaction | null) => void;
  addFraudCase: (fc: FraudCase) => void;
  updateFraudCase: (id: string, updates: Partial<FraudCase>) => void;
  addAuditRecord: (ar: AuditRecord) => void;
  setSelectedNetworkNode: (node: NetworkNode | null) => void;
  updateTelemetry: (pt: TelemetryPoint) => void;
  updateSystemStatus: (updates: Partial<SystemStatus>) => void;
  toggleStreamPause: () => void;
  setDemoMode: (enabled: boolean) => void;
  resetStore: () => void;
}

const initialState = {
  transactions: mockTransactions,
  fraudCases: mockCases,
  networkNodes: mockNodes,
  networkEdges: mockEdges,
  auditRecords: mockAuditRecords,
  telemetry: [],
  selectedTransaction: null,
  selectedNetworkNode: null,
  isStreamPaused: false,
  isDemoMode: false,
  systemStatus: {
    pipeline: 'Operational' as const,
    latency: 42,
    ledgerVerified: true,
    activeConnections: 1,
    lastSync: new Date().toISOString()
  },
};

export const useStore = create<AppState>((set) => ({
  ...initialState,
  
  addTransaction: (tx) => set((state) => ({ transactions: [tx, ...state.transactions].slice(0, 1000) })), // Keep last 1000 for perf
  updateTransaction: (id, updates) => set((state) => ({
    transactions: state.transactions.map(t => t.id === id ? { ...t, ...updates } : t)
  })),
  setSelectedTransaction: (tx) => set({ selectedTransaction: tx }),
  addFraudCase: (fc) => set((state) => ({ fraudCases: [fc, ...state.fraudCases] })),
  updateFraudCase: (id, updates) => set((state) => ({
    fraudCases: state.fraudCases.map(c => c.id === id ? { ...c, ...updates } : c)
  })),
  addAuditRecord: (ar) => set((state) => ({ auditRecords: [ar, ...state.auditRecords].slice(0, 1000) })),
  setSelectedNetworkNode: (node) => set({ selectedNetworkNode: node }),
  updateTelemetry: (pt) => set((state) => ({ telemetry: [...state.telemetry, pt].slice(-60) })), // keep last 60 ticks
  updateSystemStatus: (updates) => set((state) => ({ systemStatus: { ...state.systemStatus, ...updates } })),
  toggleStreamPause: () => set((state) => ({ isStreamPaused: !state.isStreamPaused })),
  setDemoMode: (enabled) => set({ isDemoMode: enabled, isStreamPaused: enabled }), // Auto-pause normal stream when demo starts
  resetStore: () => set((state) => ({ ...initialState, isDemoMode: state.isDemoMode })), // Keep demo mode enabled when resetting
}));

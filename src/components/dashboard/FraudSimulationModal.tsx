/**
 * FraudSimulationModal.tsx
 *
 * Enterprise-grade configuration modal for the Fraud Simulation feature.
 * Appears when the user clicks "Simulate Fraud" in the Dashboard header.
 */
import { useCallback } from 'react';
import {
  X, Play, Users, UserX, Zap, BarChart2, RefreshCcw, AlertTriangle,
  Info, ShieldOff,
} from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { SCENARIO_DEFINITIONS } from '../../services/fraudScenarioGenerator';
import type { ScenarioType, SimSeverity, SimSpeed } from '../../store/useSimulationStore';
import { useFraudSimulation } from '../../hooks/useFraudSimulation';

const SCENARIO_ICONS: Record<ScenarioType, React.ReactNode> = {
  MULE_RING:        <Users className="w-4 h-4" />,
  ACCOUNT_TAKEOVER: <UserX className="w-4 h-4" />,
  VELOCITY_ATTACK:  <Zap className="w-4 h-4" />,
  STRUCTURING:      <BarChart2 className="w-4 h-4" />,
  CIRCULAR_FUNDING: <RefreshCcw className="w-4 h-4" />,
};

const SEVERITY_COLORS: Record<SimSeverity, string> = {
  MEDIUM:   'border-yellow-600/60 bg-yellow-900/20 text-yellow-400',
  HIGH:     'border-orange-600/60 bg-orange-900/20 text-orange-400',
  CRITICAL: 'border-red-600/60 bg-red-900/20 text-red-400',
};

const SEVERITY_ACTIVE: Record<SimSeverity, string> = {
  MEDIUM:   'border-yellow-500 bg-yellow-900/40 text-yellow-300 ring-1 ring-yellow-500/40',
  HIGH:     'border-orange-500 bg-orange-900/40 text-orange-300 ring-1 ring-orange-500/40',
  CRITICAL: 'border-red-500 bg-red-900/40 text-red-300 ring-1 ring-red-500/40',
};

const TX_COUNT_OPTIONS = [6, 10, 12, 15, 20, 25, 30];

export const FraudSimulationModal = () => {
  const { isOpen, config, setConfig, closeModal } = useSimulationStore();
  const { startSimulation } = useFraudSimulation();

  const handleStart = useCallback(() => {
    startSimulation();
  }, [startSimulation]);

  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) closeModal();
  }, [closeModal]);

  if (!isOpen) return null;

  const selected = SCENARIO_DEFINITIONS.find(s => s.id === config.scenario);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sim-modal-title"
    >
      <div className="w-full max-w-2xl mx-4 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-700/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 border border-slate-700 rounded">
              <ShieldOff className="w-5 h-5 text-slate-300" />
            </div>
            <div>
              <h2 id="sim-modal-title" className="text-base font-semibold text-slate-100 leading-tight">
                Fraud Simulation
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate a controlled synthetic fraud scenario for investigation and demonstration.
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Synthetic data disclaimer */}
        <div className="mx-5 mt-4 flex items-start gap-2 p-3 bg-slate-800/60 border border-slate-700/60 rounded text-xs text-slate-400">
          <Info className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
          <span>
            <strong className="text-slate-300">Synthetic data only.</strong>{' '}
            All identifiers use{' '}
            <span className="font-mono text-slate-300">SIM-</span>,{' '}
            <span className="font-mono text-slate-300">ACC-SIM-</span>,{' '}
            <span className="font-mono text-slate-300">DEV-SIM-</span>,{' '}
            <span className="font-mono text-slate-300">IP-SIM-</span> prefixes.
            No real financial or personally identifiable information is used.
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Scenario Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Scenario
            </label>
            <div className="grid grid-cols-1 gap-2">
              {SCENARIO_DEFINITIONS.map((scenario) => {
                const isSelected = config.scenario === scenario.id;
                return (
                  <button
                    key={scenario.id}
                    onClick={() => setConfig({ scenario: scenario.id })}
                    className={`
                      flex items-start gap-3 p-3 rounded border text-left transition-all
                      ${isSelected
                        ? 'border-slate-500 bg-slate-800 ring-1 ring-slate-500/30'
                        : 'border-slate-700/60 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/60'
                      }
                    `}
                  >
                    <div className={`mt-0.5 shrink-0 ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
                      {SCENARIO_ICONS[scenario.id]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-semibold ${isSelected ? 'text-slate-100' : 'text-slate-300'}`}>
                        {scenario.label}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        {scenario.description}
                      </div>
                      <div className="text-[10px] text-slate-600 mt-1 font-mono">
                        Detection: {scenario.expectedDetection}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Config Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Transaction Count */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Transactions
              </label>
              <select
                value={config.transactionCount}
                onChange={(e) => setConfig({ transactionCount: parseInt(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 outline-none focus:border-slate-500 transition-colors"
              >
                {TX_COUNT_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n} transactions</option>
                ))}
              </select>
            </div>

            {/* Simulation Speed */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Speed
              </label>
              <select
                value={config.speed}
                onChange={(e) => setConfig({ speed: e.target.value as SimSpeed })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 outline-none focus:border-slate-500 transition-colors"
              >
                <option value="INSTANT">Instant</option>
                <option value="1_PER_SEC">1 transaction / sec</option>
                <option value="2_PER_SEC">2 transactions / sec</option>
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Risk Severity
              </label>
              <div className="flex flex-col gap-1.5">
                {(['MEDIUM', 'HIGH', 'CRITICAL'] as SimSeverity[]).map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setConfig({ severity: sev })}
                    className={`
                      px-2.5 py-1 rounded border text-[10px] font-bold tracking-wider uppercase transition-all text-left
                      ${config.severity === sev
                        ? SEVERITY_ACTIVE[sev]
                        : SEVERITY_COLORS[sev] + ' opacity-60 hover:opacity-90'
                      }
                    `}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Selected scenario detail */}
          {selected && (
            <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
                Expected Detection
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {selected.expectedDetection}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {config.transactionCount} synthetic transactions · Severity: {config.severity} ·{' '}
                {config.speed === 'INSTANT' ? 'Instant' : config.speed === '1_PER_SEC' ? '1/sec' : '2/sec'}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-700/80 flex items-center justify-between gap-3 bg-slate-900/80">
          <button
            onClick={closeModal}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            id="start-simulation-btn"
            className="flex items-center gap-2 px-5 py-2 bg-slate-200 hover:bg-white text-slate-900 text-xs font-bold rounded transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            Start Simulation
          </button>
        </div>
      </div>
    </div>
  );
};

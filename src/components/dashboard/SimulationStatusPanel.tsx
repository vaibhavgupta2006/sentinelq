/**
 * SimulationStatusPanel.tsx
 *
 * Compact, enterprise-style status panel displayed while a simulation is running.
 * Floats in the lower-right corner of the Dashboard.
 * Shows: scenario, progress bar, current pipeline stage, risk level, stats, and a cancel button.
 */
import { useNavigate } from 'react-router-dom';
import { X, Activity, StopCircle, ExternalLink } from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { useFraudSimulation } from '../../hooks/useFraudSimulation';
import { STAGE_LABELS } from '../../hooks/useFraudSimulation';
import { SCENARIO_DEFINITIONS } from '../../services/fraudScenarioGenerator';
import type { SimStage } from '../../store/useSimulationStore';

const STAGE_COLORS: Record<SimStage, string> = {
  IDLE:                  'text-slate-500',
  INGESTION:             'text-blue-400',
  PII_MASKING:           'text-cyan-400',
  STATISTICAL_ANALYSIS:  'text-teal-400',
  NETWORK_CORRELATION:   'text-indigo-400',
  RISK_SCORING:          'text-yellow-400',
  INTERCEPTION:          'text-red-400',
  CASE_GENERATION:       'text-orange-400',
  AUDIT_LEDGER:          'text-slate-300',
  COMPLETE:              'text-emerald-400',
};

const SEVERITY_TAG: Record<string, string> = {
  MEDIUM:   'text-yellow-400 bg-yellow-900/30 border-yellow-700/50',
  HIGH:     'text-orange-400 bg-orange-900/30 border-orange-700/50',
  CRITICAL: 'text-red-400 bg-red-900/30 border-red-700/50',
};

export const SimulationStatusPanel = () => {
  const navigate = useNavigate();
  const { cancelSimulation } = useFraudSimulation();
  const {
    isRunning,
    config,
    progress,
    currentStage,
    interceptedCount,
    suspiciousAccountCount,
    graphLinkCount,
    generatedCaseId,
  } = useSimulationStore();

  if (!isRunning && currentStage !== 'COMPLETE') return null;

  const isComplete = currentStage === 'COMPLETE';
  const scenarioMeta = SCENARIO_DEFINITIONS.find(s => s.id === config.scenario);
  const pct = config.transactionCount > 0
    ? Math.min((progress / config.transactionCount) * 100, 100)
    : 0;

  return (
    <div
      className="fixed bottom-6 right-6 z-40 w-72 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden"
      role="status"
      aria-live="polite"
      aria-label="Simulation status"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/80 border-b border-slate-700">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
          <span className="text-[10px] font-bold tracking-widest uppercase text-slate-300">
            {isComplete ? 'Simulation Complete' : 'Simulation Active'}
          </span>
        </div>
        {isRunning && (
          <button
            onClick={cancelSimulation}
            className="p-0.5 text-slate-500 hover:text-red-400 transition-colors"
            aria-label="Cancel simulation"
            title="Cancel Simulation"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-3 text-xs">
        {/* Scenario */}
        <div className="flex items-center justify-between">
          <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">Scenario</span>
          <span className="text-slate-200 font-medium">{scenarioMeta?.label ?? config.scenario}</span>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">Progress</span>
            <span className="text-slate-300 font-mono">
              {progress} / {config.transactionCount}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isComplete ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Current Stage */}
        <div className="flex items-center justify-between">
          <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">Stage</span>
          <span className={`font-semibold flex items-center gap-1 ${STAGE_COLORS[currentStage]}`}>
            {!isComplete && <Activity className="w-3 h-3 animate-pulse" />}
            {STAGE_LABELS[currentStage]}
          </span>
        </div>

        {/* Severity */}
        <div className="flex items-center justify-between">
          <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">Risk</span>
          <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold tracking-wider uppercase ${SEVERITY_TAG[config.severity]}`}>
            {config.severity}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700/60" />

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Intercepted</div>
            <div className="text-base font-bold font-mono text-red-400">{interceptedCount}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Accounts</div>
            <div className="text-base font-bold font-mono text-slate-200">{suspiciousAccountCount}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Graph Links</div>
            <div className="text-base font-bold font-mono text-slate-200">{graphLinkCount}</div>
          </div>
        </div>

        {/* Case link when complete */}
        {isComplete && generatedCaseId && (
          <>
            <div className="border-t border-slate-700/60" />
            <div className="space-y-1.5">
              <div className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                Case Generated
              </div>
              <div className="font-mono text-[11px] text-slate-300 bg-slate-800 border border-slate-700 rounded px-2 py-1">
                {generatedCaseId}
              </div>
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  onClick={() => navigate('/intelligence')}
                  className="flex items-center justify-center gap-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-[10px] font-semibold transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Network Graph
                </button>
                <button
                  onClick={() => navigate(`/cases/${generatedCaseId}`)}
                  className="flex items-center justify-center gap-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-[10px] font-semibold transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  View Case
                </button>
              </div>
            </div>
          </>
        )}

        {/* Cancel button while running */}
        {isRunning && (
          <>
            <div className="border-t border-slate-700/60" />
            <button
              onClick={cancelSimulation}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-800 hover:bg-red-900/30 hover:border-red-700/50 text-slate-400 hover:text-red-400 border border-slate-700 rounded text-[10px] font-semibold transition-colors"
            >
              <StopCircle className="w-3 h-3" />
              Cancel Simulation
            </button>
          </>
        )}
      </div>
    </div>
  );
};

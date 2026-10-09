import { useState, useEffect, useRef, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Network, ZoomIn, ZoomOut, Maximize, X, ExternalLink, GitFork, Server, Smartphone, User, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateMockNetwork } from '../data/networkMock';
import { detectCircularFunding, calculateCentrality, findMuleClusters } from '../utils/graphAnalysis';
import type { GraphNode, GraphEdge } from '../utils/graphAnalysis';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { useThemeStore } from '../store/useThemeStore';

export const Intelligence = () => {
  const navigate = useNavigate();
  const graphRef = useRef<any>(null);
  const theme = useThemeStore(s => s.theme);
  const isLight = theme === 'light';
  
  const [graphData] = useState<{ nodes: GraphNode[], edges: GraphEdge[] }>(() => {
    const data = generateMockNetwork();
    const centrality = calculateCentrality(data.nodes, data.edges);
    data.nodes.forEach(n => {
      n.centrality = centrality[n.id] || 0;
    });
    return data;
  });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Filters
  const [filterType, setFilterType] = useState<string>('ALL');
  const [highRiskOnly, setHighRiskOnly] = useState(false);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const visibleData = useMemo(() => {
    let nodes = graphData.nodes;
    let edges = graphData.edges;

    if (filterType !== 'ALL') {
      nodes = nodes.filter(n => n.type === filterType);
    }
    if (highRiskOnly) {
      nodes = nodes.filter(n => n.riskScore >= 65);
    }

    const nodeIds = new Set(nodes.map(n => n.id));
    edges = edges.filter(e => {
      const src = typeof e.source === 'object' ? e.source.id : e.source;
      const tgt = typeof e.target === 'object' ? e.target.id : e.target;
      return nodeIds.has(src) && nodeIds.has(tgt);
    });

    return { nodes, edges };
  }, [graphData, filterType, highRiskOnly]);

  const analysis = useMemo(() => {
    const cycles = detectCircularFunding(visibleData.edges);
    const mules = findMuleClusters(visibleData.nodes);
    return { cycles: cycles.length, mules: mules.length };
  }, [visibleData]);

  const getNodeColor = (node: GraphNode) => {
    if (node.riskScore >= 85) return '#EF4444'; // Red
    if (node.riskScore >= 65) return '#F59E0B'; // Amber
    return '#3B82F6'; // Blue
  };

  const handleNodeClick = (node: any) => {
    setSelectedNode(node as GraphNode);
    // Center node
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 1000);
      graphRef.current.zoom(2.5, 1000);
    }
  };

  const zoomIn = () => graphRef.current?.zoom(graphRef.current.zoom() * 1.5, 400);
  const zoomOut = () => graphRef.current?.zoom(graphRef.current.zoom() / 1.5, 400);
  const zoomFit = () => graphRef.current?.zoomToFit(400);

  return (
    <div className="flex h-full gap-4 relative text-slate-200">
      <div className={`flex-1 flex flex-col gap-4 transition-all duration-300 ${selectedNode ? 'w-2/3 pr-[350px]' : 'w-full'}`}>
        <header className="mb-2">
          <h1 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <GitFork className="w-5 h-5 text-accent-neutral" /> Live Intelligence Network
          </h1>
          <p className="text-sm text-slate-400">Visualize relationships between accounts, IP addresses, devices and transactions.</p>
        </header>

        {/* Analysis Bar */}
        <div className="bg-panel border border-panel-border rounded p-3 flex flex-wrap items-center gap-6 text-xs font-medium">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Active Entities:</span>
            <span className="text-slate-200 font-bold">{visibleData.nodes.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Network Edges:</span>
            <span className="text-slate-200 font-bold">{visibleData.edges.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Detected Cycles:</span>
            <span className={`font-bold ${analysis.cycles > 0 ? 'text-accent-danger' : 'text-accent-safe'}`}>{analysis.cycles}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Mule Clusters:</span>
            <span className={`font-bold ${analysis.mules > 0 ? 'text-orange-500' : 'text-accent-safe'}`}>{analysis.mules}</span>
          </div>
          
          <div className="flex-1"></div>
          
          <div className="flex items-center gap-3 border-l border-panel-border pl-4">
            <select className="bg-slate-800 border border-panel-border rounded px-2 py-1 outline-none" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="ALL">All Types</option>
              <option value="ACCOUNT">Accounts</option>
              <option value="IP">IP Addresses</option>
              <option value="DEVICE">Devices</option>
              <option value="MERCHANT">Merchants</option>
            </select>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={highRiskOnly} onChange={e => setHighRiskOnly(e.target.checked)} className="accent-accent-danger" />
              High Risk Only
            </label>
          </div>
        </div>

        {/* Graph Container */}
        <div className="bg-panel border border-panel-border rounded flex-1 relative overflow-hidden" ref={containerRef}>
          {/* Controls */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            <button onClick={zoomIn} className="p-2 bg-slate-900 border border-panel-border rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"><ZoomIn className="w-4 h-4" /></button>
            <button onClick={zoomOut} className="p-2 bg-slate-900 border border-panel-border rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"><ZoomOut className="w-4 h-4" /></button>
            <button onClick={zoomFit} className="p-2 bg-slate-900 border border-panel-border rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"><Maximize className="w-4 h-4" /></button>
          </div>
          
          {/* Legend */}
          <div className="absolute bottom-4 left-4 z-10 bg-slate-900/80 backdrop-blur border border-panel-border rounded p-3 text-[10px] uppercase font-bold tracking-wider space-y-2">
             <div className="text-slate-500 mb-1">Risk Level</div>
             <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#3B82F6]"></div> Normal</div>
             <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#F59E0B]"></div> Suspicious</div>
             <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#EF4444]"></div> Critical / Fraud</div>
          </div>

          <ErrorBoundary fallback={<div className="flex-1 flex items-center justify-center text-slate-500 bg-background">Graph failed to render due to invalid topology data.</div>}>
            <ForceGraph2D
              ref={graphRef}
              width={dimensions.width}
              height={dimensions.height}
              graphData={{ nodes: visibleData.nodes, links: visibleData.edges }}
              nodeLabel="label"
              nodeColor={getNodeColor}
              nodeRelSize={6}
              linkColor={() => (isLight ? '#CBD5E1' : '#334155')}
              linkWidth={1.5}
              onNodeClick={handleNodeClick}
              backgroundColor={isLight ? '#F8FAFC' : '#0F172A'}
            />
          </ErrorBoundary>
        </div>
      </div>

      {/* Inspector Panel */}
      {selectedNode && (
        <div className="absolute right-0 top-0 bottom-0 w-full md:w-[350px] bg-panel border-l border-panel-border shadow-lg flex flex-col z-20">
          <div className="flex items-center justify-between p-4 border-b border-panel-border bg-slate-900/50">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Network className="w-4 h-4 text-slate-400" /> Network Inspector
            </h3>
            <button 
              onClick={() => setSelectedNode(null)} 
              className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-neutral"
              aria-label="Close inspector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            <div>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded border bg-slate-800 text-slate-300 border-slate-700">
                  {selectedNode.type === 'ACCOUNT' && <User className="w-3 h-3"/>}
                  {selectedNode.type === 'IP' && <Server className="w-3 h-3"/>}
                  {selectedNode.type === 'DEVICE' && <Smartphone className="w-3 h-3"/>}
                  {selectedNode.type === 'MERCHANT' && <Store className="w-3 h-3"/>}
                  {selectedNode.type}
                </div>
              </div>
              <div className="font-mono text-xs text-slate-300 bg-slate-900 p-2 border border-panel-border rounded mb-4 break-all">
                {selectedNode.id}
              </div>
              
              <div className="text-xl font-bold tracking-tight text-slate-100 mb-4">{selectedNode.label}</div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 p-3 rounded border border-panel-border">
                  <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-semibold">Risk Score</div>
                  <div className={`text-lg font-bold font-mono tracking-tight ${selectedNode.riskScore >= 85 ? 'text-accent-danger' : selectedNode.riskScore >= 65 ? 'text-orange-500' : 'text-slate-100'}`}>
                    {selectedNode.riskScore} <span className="text-xs text-slate-500 font-sans">/ 100</span>
                  </div>
                </div>
                <div className="bg-slate-900 p-3 rounded border border-panel-border">
                  <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-semibold">Mule Score</div>
                  <div className={`text-lg font-bold font-mono tracking-tight ${selectedNode.muleScore >= 70 ? 'text-accent-danger' : 'text-slate-100'}`}>
                    {selectedNode.muleScore} <span className="text-xs text-slate-500 font-sans">/ 100</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-300 uppercase tracking-wider mb-2 border-b border-panel-border pb-1">Topology Metrics</h4>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Network Centrality (Degree)</span>
                <span className="font-mono">{selectedNode.centrality}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Connected Entities</span>
                <span className="font-mono">{selectedNode.centrality} nodes</span>
              </div>
            </div>

            {selectedNode.type === 'ACCOUNT' && (
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-slate-300 uppercase tracking-wider mb-2 border-b border-panel-border pb-1">Account History</h4>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Account Age</span>
                  <span className="font-mono text-slate-300">14 Days</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Transaction Volume</span>
                  <span className="font-mono text-slate-300">24 TXs</span>
                </div>
              </div>
            )}
            
            {selectedNode.riskScore >= 65 && (
              <div className="p-3 bg-accent-danger/10 border border-accent-danger/20 rounded">
                <div className="text-xs font-bold text-accent-danger mb-1 flex items-center gap-1.5"><GitFork className="w-3.5 h-3.5"/> High Risk Topology</div>
                <p className="text-[11px] text-slate-300">
                  This entity is heavily centralized or participates in a known structural anomaly (e.g., circular funding or shared compromised device).
                </p>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-panel-border bg-slate-900/80">
            <button 
              onClick={() => navigate(`/interceptions?q=${selectedNode.id}`)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-semibold rounded transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> View Related Transactions
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export interface GraphNode {
  id: string;
  type: 'ACCOUNT' | 'IP' | 'DEVICE' | 'MERCHANT';
  label: string;
  riskScore: number;
  muleScore: number;
  centrality?: number;
  metadata?: any;
}

export interface GraphEdge {
  id: string;
  source: string | any; 
  target: string | any;
  type: 'TRANSFER' | 'SHARED_IP' | 'SHARED_DEVICE' | 'SHARED_MERCHANT';
  weight: number;
}

export const detectCircularFunding = (edges: GraphEdge[]): string[][] => {
  const graph: Record<string, string[]> = {};
  edges.filter(e => e.type === 'TRANSFER').forEach(e => {
    const src = typeof e.source === 'object' ? e.source.id : e.source;
    const tgt = typeof e.target === 'object' ? e.target.id : e.target;
    if (!graph[src]) graph[src] = [];
    graph[src].push(tgt);
  });

  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recStack = new Set<string>();
  const path: string[] = [];

  const dfs = (node: string) => {
    visited.add(node);
    recStack.add(node);
    path.push(node);

    if (graph[node]) {
      for (const neighbor of graph[node]) {
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        } else if (recStack.has(neighbor)) {
          const cycleStartIdx = path.indexOf(neighbor);
          if (cycleStartIdx !== -1 && path.length - cycleStartIdx > 2) {
            cycles.push([...path.slice(cycleStartIdx)]);
          }
        }
      }
    }
    
    recStack.delete(node);
    path.pop();
  };

  Object.keys(graph).forEach(node => {
    if (!visited.has(node)) dfs(node);
  });

  // Deduplicate simple cycles
  return Array.from(new Set(cycles.map(c => c.sort().join(',')))).map(c => c.split(','));
};

export const calculateCentrality = (nodes: GraphNode[], edges: GraphEdge[]): Record<string, number> => {
  const degree: Record<string, number> = {};
  nodes.forEach(n => degree[n.id] = 0);
  edges.forEach(e => {
    const src = typeof e.source === 'object' ? e.source.id : e.source;
    const tgt = typeof e.target === 'object' ? e.target.id : e.target;
    if(degree[src] !== undefined) degree[src]++;
    if(degree[tgt] !== undefined) degree[tgt]++;
  });
  return degree;
};

export const findMuleClusters = (nodes: GraphNode[]): string[][] => {
  // A mock implementation that returns groups of connected accounts with risk > 70
  const highRiskAccounts = nodes.filter(n => n.type === 'ACCOUNT' && n.riskScore > 70).map(n => n.id);
  const clusters: string[][] = [];
  // For demo, just group them arbitrarily into sets of 3 if they exist
  let currentCluster: string[] = [];
  highRiskAccounts.forEach(id => {
    currentCluster.push(id);
    if(currentCluster.length === 3) {
      clusters.push([...currentCluster]);
      currentCluster = [];
    }
  });
  return clusters;
};

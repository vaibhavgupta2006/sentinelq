import type { GraphNode, GraphEdge } from '../utils/graphAnalysis';

export const generateMockNetwork = () => {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Generate 50 normal accounts
  for (let i = 0; i < 50; i++) {
    nodes.push({
      id: `acc_norm_${i}`,
      type: 'ACCOUNT',
      label: `usr_${Math.random().toString(36).substring(2,6)}`,
      riskScore: Math.floor(Math.random() * 30),
      muleScore: Math.floor(Math.random() * 20),
    });
  }

  // 1. Known Circular Fraud Pattern (A -> B -> C -> D -> A)
  const circularNodes = ['acc_circ_A', 'acc_circ_B', 'acc_circ_C', 'acc_circ_D'];
  circularNodes.forEach(id => {
    nodes.push({ id, type: 'ACCOUNT', label: id.replace('acc_', ''), riskScore: 92, muleScore: 85 });
  });
  edges.push({ id: 'e_c1', source: 'acc_circ_A', target: 'acc_circ_B', type: 'TRANSFER', weight: 1 });
  edges.push({ id: 'e_c2', source: 'acc_circ_B', target: 'acc_circ_C', type: 'TRANSFER', weight: 1 });
  edges.push({ id: 'e_c3', source: 'acc_circ_C', target: 'acc_circ_D', type: 'TRANSFER', weight: 1 });
  edges.push({ id: 'e_c4', source: 'acc_circ_D', target: 'acc_circ_A', type: 'TRANSFER', weight: 1 });

  // 2. Shared Device Cluster (Multiple accounts logging in from same device)
  nodes.push({ id: 'dev_shared_1', type: 'DEVICE', label: 'iPhone 14 (fp_xyz)', riskScore: 88, muleScore: 0 });
  for (let i = 0; i < 5; i++) {
    const accId = `acc_devmule_${i}`;
    nodes.push({ id: accId, type: 'ACCOUNT', label: `usr_devm_${i}`, riskScore: 75, muleScore: 60 });
    edges.push({ id: `e_dev_${i}`, source: accId, target: 'dev_shared_1', type: 'SHARED_DEVICE', weight: 1 });
  }

  // 3. Shared IP Cluster
  nodes.push({ id: 'ip_shared_1', type: 'IP', label: '198.51.100.4 (VPN)', riskScore: 95, muleScore: 0 });
  for (let i = 0; i < 4; i++) {
    const accId = `acc_ipmule_${i}`;
    nodes.push({ id: accId, type: 'ACCOUNT', label: `usr_ipm_${i}`, riskScore: 82, muleScore: 70 });
    edges.push({ id: `e_ip_${i}`, source: accId, target: 'ip_shared_1', type: 'SHARED_IP', weight: 1 });
  }
  
  // 4. Merchants
  nodes.push({ id: 'merch_1', type: 'MERCHANT', label: 'Crypto_Exchange_A', riskScore: 65, muleScore: 10 });
  nodes.push({ id: 'merch_2', type: 'MERCHANT', label: 'Gaming_Site_B', riskScore: 40, muleScore: 5 });

  // Connect normal accounts loosely
  for (let i = 0; i < 30; i++) {
    const src = `acc_norm_${Math.floor(Math.random() * 50)}`;
    const tgt = Math.random() > 0.5 ? `acc_norm_${Math.floor(Math.random() * 50)}` : (Math.random() > 0.5 ? 'merch_1' : 'merch_2');
    if (src !== tgt) {
      edges.push({ id: `e_norm_${i}`, source: src, target: tgt, type: 'TRANSFER', weight: 1 });
    }
  }

  return { nodes, edges };
};

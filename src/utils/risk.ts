import type { RiskLevel } from '../types';

export const calculateStatisticalRisk = (amount: number, isNewAccount: boolean): number => {
  let risk = amount > 500000 ? 50 : amount > 50000 ? 25 : 5;
  if (isNewAccount) risk += 30;
  return Math.min(risk, 100);
};

export const calculateNetworkRisk = (hasSharedDevice: boolean, hasSharedIP: boolean, isCircular: boolean): number => {
  let risk = 0;
  if (hasSharedDevice) risk += 40;
  if (hasSharedIP) risk += 20;
  if (isCircular) risk += 80;
  return Math.min(risk, 100);
};

export const calculateVelocityRisk = (isRapidChain: boolean): number => {
  return isRapidChain ? 85 : 10;
};

export const calculateCompositeRisk = (statRisk: number, netRisk: number, velRisk: number, geoAnomaly: boolean): number => {
  let base = (statRisk * 0.3) + (netRisk * 0.4) + (velRisk * 0.3);
  if (geoAnomaly) base += 30;
  return Math.min(Math.round(base), 100);
};

export const calculateRiskScore = (baseParams: { amount: number; isVpn: boolean; distanceVelocity: number; knownBadIP: boolean }): number => {
  let score = 10;
  if (baseParams.amount > 10000) score += 20;
  if (baseParams.isVpn) score += 15;
  if (baseParams.distanceVelocity > 500) score += 25; 
  if (baseParams.knownBadIP) score += 40;
  return Math.min(Math.max(score, 0), 100);
};

export const determineRiskLevel = (score: number): RiskLevel => {
  if (score >= 85) return 'CRITICAL';
  if (score >= 65) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
};

export const generateRiskSignals = (score: number, amount: number, ipAddress: string): string[] => {
  const signals: string[] = [];
  if (amount > 50000) signals.push('HIGH_VALUE_TRANSFER');
  if (score > 70 && amount > 10000) signals.push('UNUSUAL_VELOCITY');
  if (ipAddress.startsWith('192.168.')) signals.push('INTERNAL_IP_ANOMALY'); 
  if (score >= 85) signals.push('KNOWN_FRAUD_RING_SIGNATURE');
  if (signals.length === 0) signals.push('NOMINAL_BEHAVIOR');
  return signals;
};

export const generateHash = (input: string): string => {
  // A mock abstraction to generate consistent hashes. 
  // Can be replaced with actual crypto.subtle.digest('SHA-256', ...) later.
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(12, '0');
};

export const maskPII = (identifier: string): string => {
  if (!identifier) return '***';
  if (identifier.length <= 4) return '***';
  return `${identifier.substring(0, 2)}****${identifier.substring(identifier.length - 2)}`;
};

export const generateTransactionId = (prefix: string = 'tx_'): string => {
  return `${prefix}${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
};

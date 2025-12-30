import { Credential } from '../types';

export interface DuplicatePasswordInfo {
  isDuplicate: boolean;
  count: number;
  services: string[];
}

/**
 * Check if a password is used in multiple credentials
 */
export const checkDuplicatePassword = (
  password: string,
  credentials: Credential[],
  excludeId?: string // Exclude current credential when editing
): DuplicatePasswordInfo => {
  if (!password) {
    return { isDuplicate: false, count: 0, services: [] };
  }

  const matches = credentials.filter((cred) => {
    // Skip the current credential if editing
    if (excludeId && cred.id === excludeId) {
      return false;
    }
    return cred.password === password;
  });

  return {
    isDuplicate: matches.length > 0,
    count: matches.length,
    services: matches.map((cred) => cred.serviceName),
  };
};

/**
 * Count how many times a password is used across all credentials
 */
export const countPasswordUsage = (
  password: string,
  credentials: Credential[]
): number => {
  if (!password) return 0;
  return credentials.filter((cred) => cred.password === password).length;
};

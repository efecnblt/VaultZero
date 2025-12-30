export type PasswordStrength = 'weak' | 'medium' | 'strong' | 'very-strong';

export interface PasswordStrengthResult {
  strength: PasswordStrength;
  score: number; // 0-100
  feedback: string[];
  color: string;
}

/**
 * Calculate password strength based on various criteria
 */
export const calculatePasswordStrength = (password: string): PasswordStrengthResult => {
  if (!password) {
    return {
      strength: 'weak',
      score: 0,
      feedback: ['Password is required'],
      color: '#ef4444', // red
    };
  }

  let score = 0;
  const feedback: string[] = [];

  // Length scoring
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 15;
  if (password.length >= 16) score += 15;
  if (password.length < 8) {
    feedback.push('Use at least 8 characters');
  }

  // Character variety
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSymbols = /[^a-zA-Z0-9]/.test(password);

  if (hasLowercase) score += 10;
  if (hasUppercase) score += 10;
  if (hasNumbers) score += 10;
  if (hasSymbols) score += 15;

  if (!hasLowercase) feedback.push('Add lowercase letters');
  if (!hasUppercase) feedback.push('Add uppercase letters');
  if (!hasNumbers) feedback.push('Add numbers');
  if (!hasSymbols) feedback.push('Add symbols (!@#$%^&*)');

  // Bonus for variety
  const varietyCount = [hasLowercase, hasUppercase, hasNumbers, hasSymbols].filter(Boolean).length;
  if (varietyCount === 4) score += 10;

  // Penalty for common patterns
  const commonPatterns = [
    /^123/,
    /password/i,
    /qwerty/i,
    /abc/i,
    /(.)\1{2,}/, // Repeating characters
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      score -= 15;
      feedback.push('Avoid common patterns');
      break;
    }
  }

  // Ensure score is between 0-100
  score = Math.max(0, Math.min(100, score));

  // Determine strength level
  let strength: PasswordStrength;
  let color: string;

  if (score < 40) {
    strength = 'weak';
    color = '#ef4444'; // red
    if (feedback.length === 0) feedback.push('Weak password');
  } else if (score < 60) {
    strength = 'medium';
    color = '#f59e0b'; // orange
    if (feedback.length === 0) feedback.push('Fair password');
  } else if (score < 80) {
    strength = 'strong';
    color = '#10b981'; // green
    if (feedback.length === 0) feedback.push('Strong password');
  } else {
    strength = 'very-strong';
    color = '#059669'; // dark green
    if (feedback.length === 0) feedback.push('Very strong password!');
  }

  return { strength, score, feedback, color };
};

/**
 * Get a short label for the strength
 */
export const getStrengthLabel = (strength: PasswordStrength): string => {
  const labels = {
    'weak': 'Weak',
    'medium': 'Medium',
    'strong': 'Strong',
    'very-strong': 'Very Strong',
  };
  return labels[strength];
};

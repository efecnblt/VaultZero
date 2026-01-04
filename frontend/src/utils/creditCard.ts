import { CardType } from '../types';

/**
 * Detect card type from card number
 */
export const detectCardType = (cardNumber: string): CardType => {
  const cleaned = cardNumber.replace(/\s/g, '');

  // Visa: starts with 4
  if (/^4/.test(cleaned)) {
    return 'visa';
  }

  // Mastercard: starts with 51-55 or 2221-2720
  if (/^5[1-5]/.test(cleaned) || /^2(22[1-9]|2[3-9]|[3-6]|7[0-1]|720)/.test(cleaned)) {
    return 'mastercard';
  }

  // American Express: starts with 34 or 37
  if (/^3[47]/.test(cleaned)) {
    return 'amex';
  }

  // Discover: starts with 6011, 622126-622925, 644-649, or 65
  if (/^(6011|65|64[4-9]|622)/.test(cleaned)) {
    return 'discover';
  }

  return 'other';
};

/**
 * Format card number with spaces (4 digits per group)
 * Exception: Amex uses 4-6-5 format
 */
export const formatCardNumber = (cardNumber: string, cardType?: CardType): string => {
  const cleaned = cardNumber.replace(/\s/g, '');
  const type = cardType || detectCardType(cleaned);

  if (type === 'amex') {
    // Amex: 4-6-5 format
    return cleaned.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3');
  }

  // All others: 4-4-4-4 format
  return cleaned.replace(/(\d{4})/g, '$1 ').trim();
};

/**
 * Mask card number showing only last 4 digits
 */
export const maskCardNumber = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\s/g, '');
  const last4 = cleaned.slice(-4);
  const type = detectCardType(cleaned);

  if (type === 'amex') {
    return `•••• •••••• •${last4.slice(0, 1)}${last4.slice(1)}`;
  }

  return `•••• •••• •••• ${last4}`;
};

/**
 * Validate card number using Luhn algorithm
 */
export const validateCardNumber = (cardNumber: string): boolean => {
  const cleaned = cardNumber.replace(/\s/g, '');

  if (!/^\d+$/.test(cleaned)) {
    return false;
  }

  // Luhn algorithm
  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

/**
 * Validate expiry date
 */
export const validateExpiry = (month: string, year: string): boolean => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);

  if (monthNum < 1 || monthNum > 12) {
    return false;
  }

  if (yearNum < currentYear) {
    return false;
  }

  if (yearNum === currentYear && monthNum < currentMonth) {
    return false;
  }

  return true;
};

/**
 * Get card brand color
 */
export const getCardColor = (cardType: CardType): string => {
  switch (cardType) {
    case 'visa':
      return 'from-blue-500 to-blue-700';
    case 'mastercard':
      return 'from-red-500 to-orange-600';
    case 'amex':
      return 'from-cyan-500 to-blue-600';
    case 'discover':
      return 'from-orange-500 to-orange-700';
    default:
      return 'from-slate-600 to-slate-800';
  }
};

/**
 * Get card brand display name
 */
export const getCardBrandName = (cardType: CardType): string => {
  switch (cardType) {
    case 'visa':
      return 'Visa';
    case 'mastercard':
      return 'Mastercard';
    case 'amex':
      return 'American Express';
    case 'discover':
      return 'Discover';
    default:
      return 'Unknown';
  }
};

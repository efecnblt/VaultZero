export interface Credential {
  id: string;
  serviceName: string;
  url: string;
  username: string;
  password: string;
  category: string;
  iconURL: string;
  isFavorite: boolean;
  createdAt: string;
}

export interface CreditCard {
  id: string;
  cardName: string;
  cardholderName: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardType: string;
  billingZip: string;
  isFavorite: boolean;
  createdAt: string;
}

export type Category = 'All' | 'Social' | 'Work' | 'Finance' | 'Other';

export type CardType = 'visa' | 'mastercard' | 'amex' | 'discover' | 'other';

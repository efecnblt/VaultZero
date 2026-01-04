import { useState, useEffect } from 'react';
import { X, Save, CreditCard as CreditCardIcon } from 'lucide-react';
import { CreditCard } from '../types';
import * as App from '../wailsjs/go/main/App';
import {
  detectCardType,
  formatCardNumber,
  validateCardNumber,
  validateExpiry,
  getCardColor,
  getCardBrandName,
} from '../utils/creditCard';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editCard?: CreditCard | null;
}

const AddCardModal: React.FC<AddCardModalProps> = ({ isOpen, onClose, onSuccess, editCard }) => {
  const [cardName, setCardName] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [billingZip, setBillingZip] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cardType = detectCardType(cardNumber);
  const cardColor = getCardColor(cardType);

  useEffect(() => {
    if (editCard) {
      setCardName(editCard.cardName);
      setCardholderName(editCard.cardholderName);
      setCardNumber(editCard.cardNumber);
      setExpiryMonth(editCard.expiryMonth);
      setExpiryYear(editCard.expiryYear);
      setCvv(editCard.cvv);
      setBillingZip(editCard.billingZip || '');
    } else {
      resetForm();
    }
  }, [editCard, isOpen]);

  const resetForm = () => {
    setCardName('');
    setCardholderName('');
    setCardNumber('');
    setExpiryMonth('');
    setExpiryYear('');
    setCvv('');
    setBillingZip('');
    setError('');
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, '');
    if (/^\d*$/.test(value) && value.length <= 16) {
      setCardNumber(value);
    }
  };

  const handleExpiryMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 2) {
      const num = parseInt(value);
      if (value === '' || (num >= 1 && num <= 12)) {
        setExpiryMonth(value);
      }
    }
  };

  const handleExpiryYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 4) {
      setExpiryYear(value);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const maxLength = cardType === 'amex' ? 4 : 3;
    if (/^\d*$/.test(value) && value.length <= maxLength) {
      setCvv(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!cardName.trim()) {
        throw new Error('Card name is required');
      }
      if (!cardholderName.trim()) {
        throw new Error('Cardholder name is required');
      }
      if (!validateCardNumber(cardNumber)) {
        throw new Error('Invalid card number');
      }
      if (!expiryMonth || !expiryYear) {
        throw new Error('Expiry date is required');
      }
      if (!validateExpiry(expiryMonth, expiryYear)) {
        throw new Error('Invalid or expired card');
      }
      const cvvLength = cardType === 'amex' ? 4 : 3;
      if (cvv.length !== cvvLength) {
        throw new Error(`CVV must be ${cvvLength} digits`);
      }

      if (editCard) {
        await App.UpdateCreditCard(
          editCard.id,
          cardName,
          cardholderName,
          cardNumber,
          expiryMonth.padStart(2, '0'),
          expiryYear,
          cvv,
          cardType,
          billingZip
        );
      } else {
        await App.AddCreditCard(
          cardName,
          cardholderName,
          cardNumber,
          expiryMonth.padStart(2, '0'),
          expiryYear,
          cvv,
          cardType,
          billingZip
        );
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center">
              <CreditCardIcon className="w-6 h-6 text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-100">
              {editCard ? 'Edit Credit Card' : 'Add Credit Card'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Card Preview */}
          <div className={`relative w-full h-48 rounded-xl bg-gradient-to-br ${cardColor} p-6 text-white shadow-xl`}>
            <div className="absolute top-6 right-6 text-2xl font-bold opacity-80">
              {getCardBrandName(cardType)}
            </div>
            <div className="absolute bottom-16 left-6 font-mono text-xl tracking-wider">
              {formatCardNumber(cardNumber || '•••• •••• •••• ••••')}
            </div>
            <div className="absolute bottom-6 left-6 space-y-1">
              <div className="text-xs opacity-70">CARDHOLDER</div>
              <div className="font-medium">{cardholderName || 'YOUR NAME'}</div>
            </div>
            <div className="absolute bottom-6 right-6 space-y-1">
              <div className="text-xs opacity-70">EXPIRES</div>
              <div className="font-medium">
                {expiryMonth && expiryYear
                  ? `${expiryMonth.padStart(2, '0')}/${expiryYear.slice(-2)}`
                  : 'MM/YY'}
              </div>
            </div>
          </div>

          {/* Card Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Card Nickname <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="e.g., Personal Visa, Work Mastercard"
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Cardholder Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Cardholder Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
              placeholder="JOHN DOE"
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all uppercase"
              required
            />
          </div>

          {/* Card Number */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Card Number <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formatCardNumber(cardNumber)}
              onChange={handleCardNumberChange}
              placeholder="1234 5678 9012 3456"
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-mono text-lg"
              required
            />
            <div className="mt-1 text-xs text-slate-500">
              Detected: {getCardBrandName(cardType)}
            </div>
          </div>

          {/* Expiry and CVV */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Month <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={expiryMonth}
                onChange={handleExpiryMonthChange}
                placeholder="MM"
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Year <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={expiryYear}
                onChange={handleExpiryYearChange}
                placeholder="YYYY"
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                CVV <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={cvv}
                onChange={handleCvvChange}
                placeholder={cardType === 'amex' ? '1234' : '123'}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          {/* Billing Zip (Optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Billing ZIP Code <span className="text-slate-500">(Optional)</span>
            </label>
            <input
              type="text"
              value={billingZip}
              onChange={(e) => setBillingZip(e.target.value)}
              placeholder="12345"
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : editCard ? 'Update Card' : 'Add Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCardModal;

import { useState } from 'react';
import { Copy, Trash2, Edit, Check, Star, Eye, EyeOff } from 'lucide-react';
import { CreditCard } from '../types';
import * as App from '../wailsjs/go/main/App';
import { maskCardNumber, getCardColor, getCardBrandName } from '../utils/creditCard';

interface CreditCardCardProps {
  card: CreditCard;
  onDelete: (id: string) => void;
  onEdit: (card: CreditCard) => void;
}

const CreditCardCard: React.FC<CreditCardCardProps> = ({ card, onDelete, onEdit }) => {
  const [copiedCard, setCopiedCard] = useState(false);
  const [copiedCVV, setCopiedCVV] = useState(false);
  const [showCardNumber, setShowCardNumber] = useState(false);
  const [showCVV, setShowCVV] = useState(false);

  const cardColor = getCardColor(card.cardType as any);

  const handleCopyCardNumber = async () => {
    try {
      await App.CopyCardNumber(card.id);
      setCopiedCard(true);
      setTimeout(() => setCopiedCard(false), 2000);
    } catch (error) {
      console.error('Failed to copy card number:', error);
    }
  };

  const handleCopyCVV = async () => {
    try {
      await App.CopyCVV(card.id);
      setCopiedCVV(true);
      setTimeout(() => setCopiedCVV(false), 2000);
    } catch (error) {
      console.error('Failed to copy CVV:', error);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await App.ToggleCreditCardFavorite(card.id);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden hover:border-primary-500/50 transition-all group">
      {/* Card Preview */}
      <div className={`relative h-40 bg-gradient-to-br ${cardColor} p-4 text-white`}>
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleToggleFavorite}
            className={`p-2 rounded-lg transition-colors ${
              card.isFavorite
                ? 'bg-amber-500/20 hover:bg-amber-500/30'
                : 'bg-black/20 hover:bg-black/30'
            }`}
            title={card.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star
              className={`w-4 h-4 ${
                card.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-white'
              }`}
            />
          </button>
          <button
            onClick={() => onEdit(card)}
            className="p-2 rounded-lg bg-black/20 hover:bg-black/30 transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => onDelete(card.id)}
            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="h-full flex flex-col justify-between">
          <div className="text-sm font-bold opacity-80">{getCardBrandName(card.cardType as any)}</div>
          <div>
            <div className="font-mono text-lg tracking-wider mb-2">
              {showCardNumber ? card.cardNumber : maskCardNumber(card.cardNumber)}
            </div>
            <div className="flex justify-between items-end text-xs">
              <div>
                <div className="opacity-70 text-[10px]">CARDHOLDER</div>
                <div className="font-medium truncate max-w-[180px]">{card.cardholderName}</div>
              </div>
              <div>
                <div className="opacity-70 text-[10px]">EXPIRES</div>
                <div className="font-medium">
                  {card.expiryMonth}/{card.expiryYear.slice(-2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Details */}
      <div className="p-4 space-y-3">
        {/* Card Name */}
        <div>
          <div className="text-lg font-semibold text-slate-200 mb-1">{card.cardName}</div>
        </div>

        {/* Card Number */}
        <div className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3">
          <div className="flex-1">
            <div className="text-xs text-slate-500 mb-1">Card Number</div>
            <div className="text-sm text-slate-300 font-mono">
              {showCardNumber ? card.cardNumber : maskCardNumber(card.cardNumber)}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCardNumber(!showCardNumber)}
              className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
              title={showCardNumber ? 'Hide number' : 'Show number'}
            >
              {showCardNumber ? (
                <EyeOff className="w-4 h-4 text-slate-400" />
              ) : (
                <Eye className="w-4 h-4 text-slate-400" />
              )}
            </button>
            <button
              onClick={handleCopyCardNumber}
              className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
              title="Copy card number"
            >
              {copiedCard ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {/* CVV */}
        <div className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3">
          <div className="flex-1">
            <div className="text-xs text-slate-500 mb-1">CVV</div>
            <div className="text-sm text-slate-300 font-mono">
              {showCVV ? card.cvv : '•••'}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCVV(!showCVV)}
              className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
              title={showCVV ? 'Hide CVV' : 'Show CVV'}
            >
              {showCVV ? (
                <EyeOff className="w-4 h-4 text-slate-400" />
              ) : (
                <Eye className="w-4 h-4 text-slate-400" />
              )}
            </button>
            <button
              onClick={handleCopyCVV}
              className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
              title="Copy CVV"
            >
              {copiedCVV ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {/* Billing Zip (if present) */}
        {card.billingZip && (
          <div className="text-xs text-slate-500">
            Billing ZIP: <span className="text-slate-400">{card.billingZip}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditCardCard;

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Zap, Check } from 'lucide-react';
import PricingPlans from './PricingPlans';

interface TokenPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredTokens?: number;
  currentTokens?: number;
  onPurchaseSimulate?: (tokens: number) => void;
}

const TokenPurchaseModal: React.FC<TokenPurchaseModalProps> = ({
  isOpen,
  onClose,
  requiredTokens = 3,
  currentTokens = 0,
  onPurchaseSimulate,
}) => {
  const [selectedTokens, setSelectedTokens] = useState<number | null>(null);
  const [purchaseStep, setPurchaseStep] = useState<'select' | 'review'>('select');

  const handlePlanSelect = (tokens: number) => {
    setSelectedTokens(tokens);
    setPurchaseStep('review');
  };

  const handleSimulatePurchase = () => {
    if (selectedTokens) {
      onPurchaseSimulate?.(selectedTokens);
      setPurchaseStep('select');
      setSelectedTokens(null);
      onClose();
    }
  };

  const handleClose = () => {
    setPurchaseStep('select');
    setSelectedTokens(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Get Tokens
          </DialogTitle>
          <DialogDescription>
            Buy tokens to process large datasets and unlock premium features.
          </DialogDescription>
        </DialogHeader>

        {currentTokens === 0 && (
          <Alert className="mb-4 border-orange-300 bg-orange-50">
            <Zap className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Welcome! 👋</strong> You're starting with <strong>0 tokens</strong>. Purchase tokens below to process your large dataset and unlock advanced features.
            </AlertDescription>
          </Alert>
        )}

        {requiredTokens > currentTokens && requiredTokens > 0 && (
          <Alert className="mb-4 border-red-300 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Insufficient Tokens:</strong> You need <strong>{requiredTokens} tokens</strong> to perform this action.
              You currently have <strong>{currentTokens} tokens</strong>. Select a plan below to get started.
            </AlertDescription>
          </Alert>
        )}

        {purchaseStep === 'select' ? (
          <PricingPlans 
            onSelectPlan={handlePlanSelect} 
            currentTokens={currentTokens}
            requiredTokens={requiredTokens}
          />
        ) : (
          <div className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <Zap className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                You are about to purchase <strong>{selectedTokens} tokens</strong> at ₹
                {selectedTokens === 50
                  ? '499'
                  : selectedTokens === 150
                  ? '1,299'
                  : '3,999'}
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h4 className="font-bold">Order Summary</h4>
              <div className="flex justify-between text-sm">
                <span>Tokens:</span>
                <span className="font-bold">{selectedTokens}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t pt-2">
                <span>Total Price:</span>
                <span>
                  ₹
                  {selectedTokens === 50
                    ? '499'
                    : selectedTokens === 150
                    ? '1,299'
                    : '3,999'}
                </span>
              </div>
            </div>

            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                After purchase, you'll have {currentTokens + (selectedTokens || 0)} total tokens available.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                💡 By clicking "Simulate Purchase", we'll add tokens to your account for demo purposes.
                In a production environment, you would be redirected to a payment gateway (Stripe, PayPal, etc.).
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setPurchaseStep('select');
                  setSelectedTokens(null);
                }}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleSimulatePurchase}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Simulate Purchase
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TokenPurchaseModal;

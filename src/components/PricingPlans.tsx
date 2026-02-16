import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Zap } from 'lucide-react';

interface PricingPlan {
  name: string;
  tokens: number;
  price: string;
  currency: string;
  costPerToken: string;
  highlighted?: boolean;
}

const PricingPlans: React.FC<{
  onSelectPlan?: (tokens: number) => void;
  currentTokens?: number;
}> = ({ onSelectPlan, currentTokens = 0 }) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plans: PricingPlan[] = [
    {
      name: 'Starter',
      tokens: 50,
      price: '499',
      currency: '₹',
      costPerToken: '₹9.98',
    },
    {
      name: 'Research',
      tokens: 150,
      price: '1,299',
      currency: '₹',
      costPerToken: '₹8.66',
      highlighted: true,
    },
    {
      name: 'Institutional',
      tokens: 500,
      price: '3,999',
      currency: '₹',
      costPerToken: '₹7.99',
    },
  ];

  const handleSelectPlan = (plan: PricingPlan) => {
    setSelectedPlan(plan.name);
    onSelectPlan?.(plan.tokens);
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-2">Token Pricing Plans</h3>
        <p className="text-muted-foreground">
          Choose a plan that fits your needs. Tokens are required for processing large datasets and predictions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {plans.map((plan, index) => (
          <Card
            key={index}
            className={`relative transition-all duration-300 hover:shadow-lg cursor-pointer ${
              plan.highlighted
                ? 'border-blue-500 shadow-lg ring-2 ring-blue-500/20'
                : 'border-gray-200'
            } ${selectedPlan === plan.name ? 'ring-2 ring-green-500' : ''}`}
            onClick={() => handleSelectPlan(plan)}
          >
            {plan.highlighted && (
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center py-2 rounded-t-lg">
                <span className="text-xs font-bold uppercase tracking-wider">Most Popular</span>
              </div>
            )}

            <CardHeader className={plan.highlighted ? 'pt-16 pb-4' : ''}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-bold">{plan.name}</h4>
                {selectedPlan === plan.name && (
                  <Check className="w-6 h-6 text-green-500" />
                )}
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.currency}{plan.price}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {plan.costPerToken} per token
                </p>
              </div>
            </CardHeader>

            <CardContent>
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span className="font-bold text-lg">{plan.tokens} Tokens</span>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Large dataset processing (&gt;50 rows)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">HMPI predictions</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Advanced analysis features</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">PDF export & CSV download</span>
                </div>
              </div>

              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectPlan(plan);
                }}
                className={`w-full ${
                  selectedPlan === plan.name
                    ? 'bg-green-600 hover:bg-green-700'
                    : plan.highlighted
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {selectedPlan === plan.name ? 'Selected' : 'Select Plan'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Government/Custom Plan */}
      <Card className="border-2 border-dashed border-gray-400 bg-gray-50/50">
        <CardContent className="pt-6">
          <div className="text-center">
            <h4 className="text-lg font-bold mb-2">Enterprise & Government</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Need custom token packages or volume discounts?
            </p>
            <Button
              variant="outline"
              className="border-gray-400 text-gray-700 hover:bg-gray-100"
            >
              Contact Sales
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Balance Display */}
      {currentTokens > 0 && (
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            <span className="font-bold">Current Balance:</span> {currentTokens} tokens available
          </p>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h5 className="font-bold text-sm text-blue-900 mb-2">How Many Tokens Do I Need?</h5>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• <strong>1 token</strong> = Processing one dataset with &gt;50 rows</li>
          <li>• <strong>3 tokens</strong> = Running one prediction analysis</li>
          <li>• <strong>Free</strong> = Datasets with ≤ 50 rows with full analysis</li>
        </ul>
      </div>
    </div>
  );
};

export default PricingPlans;

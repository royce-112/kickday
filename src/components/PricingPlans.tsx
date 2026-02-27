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
  requiredTokens?: number;
}> = ({ onSelectPlan, currentTokens = 0, requiredTokens = 0 }) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Find the minimum recommended package based on required tokens
  const getRecommendedPlan = (required: number): string | null => {
    if (required <= 0) return null;
    if (required <= 50) return 'Starter';
    if (required <= 150) return 'Research';
    return 'Institutional';
  };

  const recommendedPlan = getRecommendedPlan(requiredTokens);

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
        {plans.map((plan, index) => {
          const isRecommended = recommendedPlan === plan.name && requiredTokens > 0;
          const isHighlighted = isRecommended || plan.highlighted;

          return (
          <Card
            key={index}
            className={`relative transition-all duration-300 hover:shadow-lg cursor-pointer ${
              isHighlighted
                ? 'border-green-500 shadow-lg ring-2 ring-green-500/20'
                : 'border-gray-200'
            } ${selectedPlan === plan.name ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => handleSelectPlan(plan)}
          >
            {isRecommended && (
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-green-500 to-green-600 text-white text-center py-2 rounded-t-lg">
                <span className="text-xs font-bold uppercase tracking-wider">✓ Recommended For Your Dataset</span>
              </div>
            )}
            {!isRecommended && plan.highlighted && (
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center py-2 rounded-t-lg">
                <span className="text-xs font-bold uppercase tracking-wider">Popular Choice</span>
              </div>
            )}

            <CardHeader className={isHighlighted ? 'pt-16 pb-4' : ''}>
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
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : isRecommended
                    ? 'bg-green-600 hover:bg-green-700'
                    : isHighlighted
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {selectedPlan === plan.name ? 'Selected' : isRecommended ? 'Recommended' : 'Select Plan'}
              </Button>

              {isRecommended && (
                <div className="mt-3 p-2 bg-green-50 border border-green-300 rounded text-xs text-green-700">
                  <p className="font-semibold">Perfect for your dataset!</p>
                  <p>Covers {requiredTokens} token{requiredTokens === 1 ? '' : 's'} needed with {plan.tokens - requiredTokens} extra for future uploads.</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
        })}
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
      <div className={`mt-8 p-5 rounded-lg border-2 ${currentTokens > 0 ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400' : 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-300'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-semibold ${currentTokens > 0 ? 'text-green-800' : 'text-orange-700'}`}>
              Your Token Balance
            </p>
            <p className={`text-3xl font-bold mt-2 ${currentTokens > 0 ? 'text-green-700' : 'text-orange-600'}`}>
              {currentTokens} <span className="text-lg">tokens</span>
            </p>
          </div>
          <div className={`text-5xl opacity-20 ${currentTokens > 0 ? 'text-green-500' : 'text-orange-400'}`}>
            ⚡
          </div>
        </div>
        {currentTokens === 0 && (
          <p className="text-xs text-orange-600 mt-3 italic">
            💡 No tokens yet? Get a plan below to process large datasets!
          </p>
        )}
      </div>

      {/* Token Formula & Calculator */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formula Explanation */}
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-6">
            <h5 className="font-bold text-sm text-purple-900 mb-4">🔢 Token Calculation Formula</h5>
            <div className="text-xs text-purple-800 space-y-3 mb-4">
              <div className="bg-white p-3 rounded border border-purple-200">
                <p className="font-mono font-bold">If rows ≤ 50:</p>
                <p className="ml-4">Tokens = <strong>0</strong> (Free)</p>
              </div>
              <div className="bg-white p-3 rounded border border-purple-200">
                <p className="font-mono font-bold">If rows &gt; 50:</p>
                <p className="ml-4">k = ⌈(rows - 50) / 5⌉</p>
                <p className="ml-4">Tokens = ⌈2.5 × k⌉</p>
              </div>
            </div>
            <p className="text-xs text-purple-700 italic">
              This ensures fair pricing based on dataset complexity.
            </p>
          </CardContent>
        </Card>

        {/* Token Examples */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h5 className="font-bold text-sm text-blue-900 mb-4">📊 Token Examples</h5>
            <div className="text-xs text-blue-800 space-y-2">
              <div className="flex justify-between bg-white p-2 rounded border border-blue-200">
                <span>50 rows</span>
                <span className="font-bold text-green-600">0 tokens (Free)</span>
              </div>
              <div className="flex justify-between bg-white p-2 rounded border border-blue-200">
                <span>100 rows</span>
                <span className="font-bold">25 tokens</span>
              </div>
              <div className="flex justify-between bg-white p-2 rounded border border-blue-200">
                <span>200 rows</span>
                <span className="font-bold">75 tokens</span>
              </div>
              <div className="flex justify-between bg-white p-2 rounded border border-blue-200">
                <span>500 rows</span>
                <span className="font-bold">225 tokens</span>
              </div>
              <div className="flex justify-between bg-white p-2 rounded border border-blue-200">
                <span>1000 rows</span>
                <span className="font-bold">475 tokens</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Free Tier Information */}
      <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h5 className="font-bold text-sm text-green-900 mb-3">✨ Free Tier Features (≤50 rows)</h5>
        <ul className="text-xs text-green-800 space-y-1">
          <li>✓ Complete HMPI analysis with all 9 heavy metals</li>
          <li>✓ Interactive map visualization with color-coded markers</li>
          <li>✓ Detailed metal concentration data</li>
          <li>✓ Export to CSV and PDF reports</li>
          <li>✓ Risk assessment and trend analysis</li>
        </ul>
      </div>
    </div>
  );
};

export default PricingPlans;

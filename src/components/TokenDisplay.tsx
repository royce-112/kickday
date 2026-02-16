import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import { useDataset } from '@/context/DataContext';

interface TokenDisplayProps {
  onBuyTokens?: () => void;
  compact?: boolean;
}

const TokenDisplay: React.FC<TokenDisplayProps> = ({ onBuyTokens, compact = false }) => {
  const { tokens } = useDataset();

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-100 to-yellow-50 rounded-lg border border-yellow-300 hover:shadow-md transition-shadow">
        <Zap className="w-4 h-4 text-yellow-600" />
        <span className="text-sm font-bold text-yellow-800">{tokens}</span>
        {onBuyTokens && (
          <Button
            onClick={onBuyTokens}
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs hover:bg-yellow-200"
          >
            +
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-200 rounded-lg">
            <Zap className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-blue-700 font-medium">Available Tokens</p>
            <p className="text-2xl font-bold text-blue-900">{tokens}</p>
          </div>
        </div>
        {onBuyTokens && (
          <Button
            onClick={onBuyTokens}
            className="bg-blue-600 hover:bg-blue-700 gap-1"
            size="sm"
          >
            <Zap className="w-4 h-4" />
            Buy More
          </Button>
        )}
      </div>
    </Card>
  );
};

export default TokenDisplay;

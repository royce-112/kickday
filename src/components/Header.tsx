<<<<<<< HEAD
import { Droplets, Beaker } from 'lucide-react';

const Header = () => {
=======
import { Droplets, Beaker, Zap, RotateCcw } from 'lucide-react';
import { useDataset } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const Header = () => {
  const { tokens, resetTokens } = useDataset();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = () => {
    if (window.confirm('⚠️ Clear all tokens and start fresh? This will create a new session.')) {
      resetTokens();
      setShowResetConfirm(false);
      alert('✅ Tokens reset to 0. You now have a fresh session.');
    }
  };
  
>>>>>>> 4a306af (sirf video ke liye)
  return (
    <header className="relative z-10 flex items-center justify-between p-6">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Droplets className="w-8 h-8 text-water-primary animate-droplet" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-water-secondary rounded-full animate-pulse" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            AquaScan
          </h1>
          <p className="text-sm text-muted-foreground">
            Heavy Metal Pollution Index Assessment
          </p>
        </div>
      </div>
      
<<<<<<< HEAD
      <div className="flex items-center gap-2 px-4 py-2 bg-card/50 backdrop-blur-water rounded-full border border-border/50">
        <Beaker className="w-4 h-4 text-water-secondary" />
        <span className="text-sm font-medium text-foreground">v1.0</span>
=======
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-100 to-yellow-50 rounded-lg border border-yellow-300 shadow-sm group relative">
          <Zap className="w-4 h-4 text-yellow-600" />
          <span className="text-sm font-bold text-yellow-800">{tokens} Tokens</span>
          <button
            onClick={handleReset}
            className="ml-2 p-1 rounded hover:bg-yellow-200 transition-colors"
            title="Reset tokens and start fresh"
          >
            <RotateCcw className="w-3 h-3 text-yellow-600 opacity-60 hover:opacity-100" />
          </button>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-card/50 backdrop-blur-water rounded-full border border-border/50">
          <Beaker className="w-4 h-4 text-water-secondary" />
          <span className="text-sm font-medium text-foreground">v1.0</span>
        </div>
>>>>>>> 4a306af (sirf video ke liye)
      </div>
    </header>
  );
};

export default Header;
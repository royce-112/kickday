import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Zap, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import axios from 'axios';
import { useDataset } from '@/context/DataContext';
import { useToast } from '@/hooks/use-toast';
import TokenPurchaseModal from '@/components/TokenPurchase';

const DatasetUpload = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLargeDataset, setIsLargeDataset] = useState(false);
  const [datasetRowCount, setDatasetRowCount] = useState(0);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const { setData, setFileId, tokens, addTokens, deductTokens, user } = useDataset();
  const navigate = useNavigate();

  const openFileDialog = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const checkFileRowCount = async (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim());
        const rowCount = Math.max(0, lines.length - 1); // -1 for header
        resolve(rowCount);
      };
      reader.readAsText(file);
    });
  };

  const handleFile = async (file: File) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(fileExtension)) {
      toast({ title: "Invalid File Type", description: "Upload CSV or Excel", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File Too Large", description: "Max size 10MB", variant: "destructive" });
      return;
    }

    setUploadedFile(file);
    
    // Check file row count (only for CSV)
    if (file.name.endsWith('.csv')) {
      const rowCount = await checkFileRowCount(file);
      setDatasetRowCount(rowCount);
      
      if (rowCount > 50) {
        setIsLargeDataset(true);
        // Large dataset requires tokens
        if (tokens < 1) {
          // Show clear message about token requirement
          toast({ 
            title: "Tokens Required", 
            description: `This dataset has ${rowCount} rows. Datasets with >50 rows need 1 token to process.`,
            variant: "destructive"
          });
          setIsTokenModalOpen(true);
          return;
        }
      } else {
        // Small dataset - process immediately
        setIsLargeDataset(false);
      }
    }

    await processFile(file);
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Pass user_id to backend
      if (user?.userId) {
        formData.append('user_id', user.userId);
      }

      console.log('Uploading file to backend:', file.name);

      // Use /process endpoint to get file_id
      const response = await axios.post('http://127.0.0.1:5000/process', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('Backend response:', response.data);

      // Handle token deduction from response
      if (response.data.tokens_used > 0) {
        deductTokens(response.data.tokens_used);
        toast({ 
          title: "Tokens Used", 
          description: `${response.data.tokens_used} token(s) deducted. New balance: ${response.data.new_token_balance} tokens` 
        });
      }

      // Store both data and fileId
      setData(response.data.GeoJSON);
      setFileId(response.data.file_id);

      toast({ 
        title: "Upload Successful", 
        description: `${file.name} processed successfully with ${response.data.row_count} rows!` 
      });
      
      // Navigate automatically to analysis
      setTimeout(() => {
        navigate('/analysis/samples');
      }, 1500);
      
    } catch (error: any) {
      console.error('Upload error:', error.response?.data || error.message);
      
      const errorMsg = error.response?.data?.message || error.response?.data?.error || "Failed to upload file";
      
      // Handle insufficient tokens error
      if (error.response?.status === 403) {
        toast({ 
          title: "Insufficient Tokens", 
          description: errorMsg,
          variant: "destructive" 
        });
        setIsTokenModalOpen(true);
      } else {
        toast({ 
          title: "Upload Failed", 
          description: errorMsg, 
          variant: "destructive" 
        });
      }
      
      setUploadedFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Upload Groundwater Dataset</h2>
          <p className="text-muted-foreground">Upload heavy metal data with geo-coordinates for HMPI analysis</p>
        </div>

        {!uploadedFile || isLargeDataset ? (
          <div
            className="relative border-2 border-water-primary bg-water-primary/20 rounded-lg p-8 text-center cursor-pointer"
            onClick={!isLargeDataset || tokens > 0 ? openFileDialog : undefined}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-water-primary/20">
                <Upload className="w-8 h-8 text-water-primary" />
              </div>
              <p className="text-lg font-medium mb-2">Drop your dataset here</p>
              <p className="text-sm text-muted-foreground mb-4">or click to browse files</p>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  openFileDialog();
                }}
                variant="outline"
                className="border-water-primary text-water-primary"
              >
                Select File
              </Button>
              <div className="text-xs text-muted-foreground mt-2">
                Supported: CSV, Excel (.xlsx, .xls) • Max 10MB
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg border">
              <FileSpreadsheet className="w-8 h-8 text-water-primary" />
              <div className="flex-1">
                <p className="font-medium">{uploadedFile.name}</p>
                <p className="text-sm text-muted-foreground">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                {datasetRowCount > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">{datasetRowCount} rows</p>
                )}
              </div>
              {isProcessing ? (
                <div className="text-water-primary animate-spin">Processing...</div>
              ) : (
                <CheckCircle className="w-6 h-6 text-water-primary" />
              )}
            </div>

            {!isProcessing && (
              <div className="text-center mt-4">
                <Button
                  onClick={() => navigate('/analysis/samples')}
                  className="bg-blue-600 text-white hover:bg-blue-700 border-none"
                >
                  Go to Analysis
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Large Dataset Warning - No Tokens */}
        {isLargeDataset && tokens === 0 && (
          <Alert className="mt-6 border-orange-300 bg-orange-50/80">
            <Zap className="h-5 w-5 text-orange-600" />
            <AlertDescription className="text-orange-800 ml-2">
              <strong className="block mb-2">🔒 Tokens Required to Process This Dataset</strong>
              <p className="mb-3">Your dataset contains <strong>{datasetRowCount} rows</strong>. Datasets larger than 50 rows require tokens to process.</p>
              <div className="bg-white/60 p-3 rounded mb-3 text-sm">
                <p className="font-semibold mb-1">Current Status:</p>
                <p>📊 Available Tokens: <strong className="text-red-600">0</strong></p>
                <p>💾 Dataset Size: <strong>{datasetRowCount} rows</strong></p>
                <p>💰 Tokens Needed: <strong>1 token</strong></p>
              </div>
              <Button
                onClick={() => setIsTokenModalOpen(true)}
                className="w-full gap-2 bg-orange-600 hover:bg-orange-700"
              >
                <Zap className="w-4 h-4" />
                Get Tokens Now
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Free Dataset Info */}
        {datasetRowCount > 0 && datasetRowCount <= 50 && (
          <Alert className="mt-6 border-green-300 bg-green-50/80">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 ml-2">
              <strong>Great!</strong> Your dataset with {datasetRowCount} rows qualifies for free processing and analysis.
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-water-secondary flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Dataset Requirements:</p>
              <ul className="space-y-1 text-xs">
                <li>• Heavy metal values (mg/L or μg/L)</li>
                <li>• Geographic coordinates (lat, long)</li>
                <li>• Standard column headers</li>
                <li>• Supported metals: Pb, Cd, As, Hg, Cr, Cu, Zn, Ni</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Token System Info */}
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-bold text-blue-900 mb-3">📋 Token System</h4>
          <div className="space-y-2 text-xs text-blue-800">
            <div className="flex items-center justify-between p-2 bg-white/60 rounded">
              <span>Your Current Balance:</span>
              <span className="font-bold text-lg">{tokens}</span>
            </div>
            <div className="border-t border-blue-200 pt-2 mt-2">
              <p className="font-semibold mb-2">How Tokens Work:</p>
              <ul className="space-y-1 ml-3">
                <li>✓ <strong>Small datasets</strong> (≤50 rows): <span className="text-green-600 font-semibold">Always FREE</span></li>
                <li>🔒 <strong>Large datasets</strong> ({'>'}50 rows): <span className="font-semibold">1 token required</span></li>
                <li>⚡ <strong>Prediction analysis:</strong> <span className="font-semibold">3 tokens required</span></li>
              </ul>
            </div>
            {tokens === 0 && (
              <div className="mt-3 p-2 bg-orange-100 rounded text-orange-800">
                <p className="text-xs">💡 <strong>First time here?</strong> You start with 0 tokens. Purchase tokens only when you need to process large datasets.</p>
              </div>
            )}
          </div>
        </div>

        <TokenPurchaseModal
          isOpen={isTokenModalOpen}
          onClose={() => setIsTokenModalOpen(false)}
          currentTokens={tokens}
          onPurchaseSimulate={(amount) => {
            addTokens(amount);
            setIsTokenModalOpen(false);
          }}
        />
      </CardContent>
    </Card>
  );
};

export default DatasetUpload;
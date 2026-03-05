import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Zap,
  Lock
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import axios from 'axios';
import { useDataset } from '@/context/DataContext';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import TokenPurchaseModal from './TokenPurchase';

const DatasetUpload = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [datasetRowCount, setDatasetRowCount] = useState(0);
  const [tokensRequired, setTokensRequired] = useState(0);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const {
    setData,
    setFileId,
    tokens,
    addTokens,
    deductTokens,
    user: datasetUser
  } = useDataset();

  const { user } = useAuth();
  const navigate = useNavigate();

  // Backend formula mirror
  const calculateTokens = (rows: number): number => {
    if (rows <= 50) return 0;
    const k = Math.ceil((rows - 50) / 5);
    return Math.ceil(2.5 * k);
  };

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
        resolve(Math.max(0, lines.length - 1));
      };
      reader.readAsText(file);
    });
  };

  const handleFile = async (file: File) => {

    // 🔒 Block upload if not logged in
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please sign in first",
        variant: "destructive"
      });
      return;
    }

    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(fileExtension)) {
      toast({
        title: "Invalid File Type",
        description: "Upload CSV or Excel",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Max size 10MB",
        variant: "destructive"
      });
      return;
    }

    setUploadedFile(file);

    // CSV row counting + token preview
    if (file.name.endsWith('.csv')) {
      const rowCount = await checkFileRowCount(file);
      setDatasetRowCount(rowCount);

      const tokensNeeded = calculateTokens(rowCount);
      setTokensRequired(tokensNeeded);

      if (tokensNeeded > 0 && tokens < tokensNeeded) {
        toast({
          title: "Tokens Required",
          description: `Dataset with ${rowCount} rows requires ${tokensNeeded} token(s). You have ${tokens}.`,
          variant: "destructive"
        });
        setIsTokenModalOpen(true);
        return;
      } else if (tokensNeeded > 0) {
        toast({
          title: "Tokens Available",
          description: `This dataset will use ${tokensNeeded} token(s).`
        });
      } else {
        toast({
          title: "Free Tier",
          description: "Dataset ≤ 50 rows processes for free."
        });
      }
    }

    await processFile(file);
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // include dataset user id if exists
      if (datasetUser?.userId) {
        formData.append('user_id', datasetUser.userId);
      }

      const token = localStorage.getItem("token");

      const response = await axios.post(
        'http://127.0.0.1:5000/process',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Deduct tokens from backend response
      if (response.data.tokens_used > 0) {
        deductTokens(response.data.tokens_used);
        toast({
          title: "Tokens Used",
          description: `${response.data.tokens_used} token(s) deducted.`
        });
      }

      const geoData = response.data.GeoJSON;
      const featuresArray = geoData.features ? geoData.features : geoData;

      setData(featuresArray);
      setFileId(response.data.file_id);

      toast({
        title: "Upload Successful",
        description: `${file.name} processed successfully!`
      });

      setTimeout(() => {
        navigate('/analysis/samples');
      }, 800);

    } catch (error: any) {

      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Upload failed";

      if (error.response?.status === 403) {
        setIsTokenModalOpen(true);
      }

      toast({
        title: "Upload Failed",
        description: errorMsg,
        variant: "destructive"
      });

      setUploadedFile(null);

    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-8">

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">
            Upload Groundwater Dataset
          </h2>
          <p className="text-muted-foreground">
            Upload heavy metal data with geo-coordinates for HMPI analysis
          </p>
        </div>

        {!uploadedFile || tokensRequired > tokens ? (
          <div
            className="relative border-2 border-water-primary bg-water-primary/20 rounded-lg p-8 text-center cursor-pointer"
            onClick={tokensRequired <= tokens ? openFileDialog : undefined}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex flex-col items-center gap-4">
              <Upload className="w-8 h-8 text-water-primary" />
              <p className="text-lg font-medium">Drop your dataset here</p>
              <Button variant="outline">
                Select File
              </Button>
              <div className="text-xs text-muted-foreground">
                Supported: CSV, Excel (.xlsx, .xls) 
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg border">
              <FileSpreadsheet className="w-8 h-8 text-water-primary" />
              <div className="flex-1">
                <p className="font-medium">{uploadedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                {datasetRowCount > 0 && (
                  <p className="text-xs">{datasetRowCount} rows</p>
                )}
              </div>
              {isProcessing ? (
                "Processing..."
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

        <TokenPurchaseModal
          isOpen={isTokenModalOpen}
          onClose={() => setIsTokenModalOpen(false)}
          requiredTokens={tokensRequired}
          currentTokens={tokens}
          onPurchaseSimulate={(amount) => {
            addTokens(amount);
            setIsTokenModalOpen(false);
            if (uploadedFile) processFile(uploadedFile);
          }}
        />

      </CardContent>
    </Card>
  );
};

export default DatasetUpload;
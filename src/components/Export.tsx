import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet, MapPinned, CircleCheckBig } from "lucide-react";
import { useDataset } from "@/context/DataContext";

const ExportPage = () => {
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const { fileId, data } = useDataset();
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async (fileType: string) => {
    if (!fileId) {
      setError("No file has been uploaded yet. Please upload a dataset first.");
      return;
    }

    setLoading((prev) => ({ ...prev, [fileType]: true }));
    setError(null);

    try {
      let endpoint = "";
      let downloadName = "";

      switch (fileType) {
        case "pdf_long":
          endpoint = `/download_pdf_long/${fileId}`;
          downloadName = "HMPI_Long_Report.pdf";
          break;
        case "pdf_short":
          endpoint = `/download_pdf_short/${fileId}`;
          downloadName = "HMPI_Short_Report.pdf";
          break;
        case "excel":
          endpoint = `/download_excel/${fileId}`;
          downloadName = "HMPI_Data.xlsx";
          break;
        case "map":
          endpoint = `/download_map_html/${fileId}`;
          downloadName = "HMPI_Interactive_Map.html";
          break;
        default:
          throw new Error("Invalid file type");
      }

      const response = await fetch(
  `http://localhost:5000${endpoint}?t=${Date.now()}`,
  {
    method: "GET",
    cache: "no-store"
  }
);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to download file");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Create a temporary <a> element to trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Error downloading file";
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setLoading((prev) => ({ ...prev, [fileType]: false }));
    }
  };

  return (
    <div className="p-8 space-x-10 space-y-10">
      <h1 className="text-3xl font-bold mb-4">Export Analysis Results</h1>
      <p className="text-muted-foreground mb-8">
        Download your computed HMPI data in various formats for reporting and further analysis
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {!fileId && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
          Please upload a dataset first before exporting results.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* PDF Long Summary */}
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" /> PDF Long Summary
            </CardTitle>
            <CardDescription>Comprehensive analysis report with detailed sections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">~3-5 MB</p>
            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
              <li>Cover page with metadata</li>
              <li>Executive summary with HMPI explanation</li>
              <li>Complete sample summary table</li>
              <li>Global visualizations (charts)</li>
              <li>Per-sample analysis with charts</li>
              <li>Technical details & formula</li>
              <li>Conclusion & recommendations</li>
            </ul>
            <Button
              className="mt-4 w-full"
              onClick={() => handleDownload("pdf_long")}
              disabled={!fileId || loading["pdf_long"]}
            >
              {loading["pdf_long"] ? "Generating..." : "Generate & Download"}
            </Button>
          </CardContent>
        </Card>

        {/* PDF Short Summary */}
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CircleCheckBig className="w-5 h-5" /> PDF Short Summary
            </CardTitle>
            <CardDescription>Quick reference report with key insights</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">~1-2 MB</p>
            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
              <li>Cover page with metadata</li>
              <li>Brief executive summary</li>
              <li>HMPI summary table</li>
              <li>Key visualizations (histogram & trends)</li>
              <li>Global risk distribution chart</li>
              <li>Quick conclusion & recommendations</li>
            </ul>
            <Button
              className="mt-4 w-full"
              onClick={() => handleDownload("pdf_short")}
              disabled={!fileId || loading["pdf_short"]}
            >
              {loading["pdf_short"] ? "Generating..." : "Generate & Download"}
            </Button>
          </CardContent>
        </Card>

        {/* Interactive HTML Map */}
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPinned className="w-5 h-5" /> Interactive HTML Map
            </CardTitle>
            <CardDescription>Self-contained geographic visualization - works offline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">~500 KB</p>
            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
              <li>Interactive map with zoom & pan</li>
              <li>Color-coded risk markers</li>
              <li>Sample details on click</li>
              <li>Auto-fit map bounds</li>
              <li>Works offline - no CDN required</li>
            </ul>
            <Button
              className="mt-4 w-full"
              onClick={() => handleDownload("map")}
              disabled={!fileId || loading["map"]}
            >
              {loading["map"] ? "Generating..." : "Generate & Download"}
            </Button>
          </CardContent>
        </Card>

        {/* Excel */}
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" /> Excel Workbook
            </CardTitle>
            <CardDescription>Raw data with computed indices and statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">~850 KB</p>
            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
              <li>HMPI Raw Data sheet</li>
              <li>Statistical Summary (mean, min, max, std dev)</li>
              <li>Risk Category Distribution</li>
              <li>Metadata & Error Checking</li>
            </ul>
            <Button
              className="mt-4 w-full"
              onClick={() => handleDownload("excel")}
              disabled={!fileId || loading["excel"]}
            >
              {loading["excel"] ? "Generating..." : "Generate & Download"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExportPage;

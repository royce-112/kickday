import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet, MapPinned, CircleCheckBig } from "lucide-react";

const ExportPage = () => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async (fileType) => {
    setLoading(true);
    try {
      // Call your backend endpoint to generate/download the file
      const response = await fetch(`/api/download_${fileType}`, { method: "GET" });

      if (!response.ok) throw new Error("Failed to download file");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Create a temporary <a> element to trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = fileType === "pdf_long" ? "HMPI_Long_Report.pdf" :
                   fileType === "pdf_short" ? "HMPI_Short_Report.pdf" :
                   fileType === "map" ? "HMPI_Map.pdf" :
                   "HMPI_Data.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Error downloading file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-x-10 space-y-10">
      <h1 className="text-3xl font-bold mb-4">Export Analysis Results</h1>
      <p className="text-muted-foreground mb-8">
        Download your computed HMPI data in various formats for reporting and further analysis
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* PDF Long Summary */}
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" /> PDF Long Summary
            </CardTitle>
            <CardDescription>Complete analysis report with charts and maps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">~2.5 MB</p>
            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
              <li>Executive Summary</li>
              <li>Data Tables</li>
              <li>Visualizations</li>
              <li>Intra Sample Analysis</li>
            </ul>
            <Button
              className="mt-4 w-full"
              onClick={() => handleDownload("pdf_long")}
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate & Download"}
            </Button>
          </CardContent>
        </Card>

        {/* PDF Short Summary */}
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CircleCheckBig className="w-5 h-5" /> PDF Short Summary
            </CardTitle>
            <CardDescription>Complete analysis report with charts and maps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">~2.5 MB</p>
            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
              <li>Executive Summary</li>
              <li>Data Tables</li>
              <li>Visualizations</li>
              <li>Inter Sample Analysis</li>
            </ul>
            <Button
              className="mt-4 w-full"
              onClick={() => handleDownload("pdf_short")}
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate & Download"}
            </Button>
          </CardContent>
        </Card>

        {/* Map */}
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPinned className="w-5 h-5" /> Download Your Map
            </CardTitle>
            <CardDescription>Complete analysis report with charts and maps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">~2.5 MB</p>
            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
              <li>Interactive Map</li>
              <li>Categorization</li>
              <li>Visualizations</li>
              <li>Geographic Overview</li>
            </ul>
            <Button
              className="mt-4 w-full"
              onClick={() => handleDownload("map")}
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate & Download"}
            </Button>
          </CardContent>
        </Card>

        {/* Excel */}
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" /> Excel Workbook
            </CardTitle>
            <CardDescription>Raw data with computed indices in spreadsheet format</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">~850 KB</p>
            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
              <li>Raw Data</li>
              <li>Computed Indices</li>
              <li>Summary Statistics</li>
              <li>Metadata</li>
            </ul>
            <Button
              className="mt-4 w-full"
              onClick={() => handleDownload("excel")}
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate & Download"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExportPage;

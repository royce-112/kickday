import React, { useState } from 'react';
import { useDataset } from '@/context/DataContext';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';
// import Visualize from '@/components/Visualize';
import VisualizeAllSamples from '@/components/VisualizeAllSamples';

const Samples = () => {
  const { data, fileId } = useDataset();
  const [expandedRowIndex, setExpandedRowIndex] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!data || data.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-6">
        <p>No dataset samples available. Please upload a file first on the main page.</p>
      </div>
    );
  }

  const metals = Array.from(
    new Set(data.flatMap((row) => Object.keys(row.all_metal_conc || {})))
  );

  const whoLimits: Record<string, number> = {
    Lead: 0.05,
    Cadmium: 0.003,
    Arsenic: 0.01,
    Mercury: 0.006,
    Chromium: 0.05,
    Copper: 2,
    Zinc: 3,
    Nickel: 0.02,
  };

  const handleRowClick = (index: number) => {
    setExpandedRowIndex(expandedRowIndex === index ? null : index);
  };

  const handleDownloadCSV = async () => {
    if (!fileId) {
      alert('No file ID available for download');
      return;
    }
    setIsDownloading(true);
    try {
      const response = await fetch(`http://localhost:5000/download/${fileId}`);
      if (!response.ok) throw new Error('Failed to download file');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `processed_data_${fileId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file');
    } finally {
      setIsDownloading(false);
    }
  };

  const prepareDataForVisualize = (row: any) => {
    const currentLevels = metals.map((metal) => row.all_metal_conc[metal] || 0);
    const limits = metals.map((metal) => whoLimits[metal] || 0);
    return { metals, currentLevels, whoLimits: limits, hmpi: row.HMPI };
  };

  const getLatLng = (geometry: any) => {
    try {
      const geo = typeof geometry === 'string' ? JSON.parse(geometry) : geometry;
      return { lat: geo.coordinates[1], lng: geo.coordinates[0] };
    } catch {
      return { lat: '-', lng: '-' };
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-foreground">Dataset Samples</h2>
        <button
          onClick={handleDownloadCSV}
          disabled={isDownloading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {isDownloading ? 'Downloading...' : 'Download Processed CSV'}
        </button>
      </div>

      <div className="flex-1 border border-border rounded-lg overflow-auto bg-card">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10"
            style={{
              background: 'linear-gradient(90deg, rgba(5,78,107,1) 0%, rgba(32,119,186,1) 51%, rgba(83,157,237,1) 100%)'
            }}>
            <tr className="border-b border-border text-white">
              <th className="w-12 px-2 py-3"></th>
              <th className="px-4 py-3 text-left font-semibold">Sample ID</th>
              <th className="px-4 py-3 text-left font-semibold">Latitude</th>
              <th className="px-4 py-3 text-left font-semibold">Longitude</th>
              <th className="px-4 py-3 text-left font-semibold">HMPI</th>
              {metals.map((m) => (
                <th key={m} className="px-4 py-3 text-left font-semibold">{m} mg/L</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              const { lat, lng } = getLatLng(row.geometry);
              return (
                <React.Fragment key={row.Sample_ID}>
                  <tr onClick={() => handleRowClick(index)}
                      className="cursor-pointer hover:bg-muted/50 border-b border-border">
                    <td className="w-12 px-2 py-3 text-center">
                      {expandedRowIndex === index ? (
                        <ChevronUp className="mx-auto w-4 h-4" />
                      ) : (
                        <ChevronDown className="mx-auto w-4 h-4" />
                      )}
                    </td>
                    <td className="px-4 py-3">{row.Sample_ID}</td>
                    <td className="px-4 py-3">{lat}</td>
                    <td className="px-4 py-3">{lng}</td>
                    <td className="px-4 py-3 font-mono font-semibold">
                      {row.HMPI ? row.HMPI.toFixed(2) : 'N/A'}
                    </td>
                    {metals.map((m) => (
                      <td key={m} className={`px-4 py-3 font-mono ${
                        (row.all_metal_conc[m] || 0) > whoLimits[m]
                          ? 'text-red-500 font-semibold bg-red-500/10'
                          : (row.all_metal_conc[m] || 0) > 0.6 * whoLimits[m]
                          ? 'text-yellow-500 font-semibold bg-yellow-500/10'
                          : 'text-green-500'
                      }`}>
                        {row.all_metal_conc[m] || 0}
                      </td>
                    ))}
                  </tr>

                  {expandedRowIndex === index && (
                    <tr>
                      <td colSpan={5 + metals.length} className="p-0">
                        <div className="p-6 bg-muted/20 border-t border-border">
                          <h4 className="text-lg font-semibold mb-2">Sample {row.Sample_ID} Analysis</h4>
                          <p className="mb-4 text-sm text-muted-foreground">
                            HMPI: <span className="font-semibold">{row.HMPI ? row.HMPI.toFixed(2) : 'N/A'}</span>
                          </p>

                          {/* Local Chart.js */}
                          {/* <Visualize dataset={prepareDataForVisualize(row)} /> */}

                          {/* Backend Charts for this sample only */}
                          <div className="mt-8">
                            <h4 className="text-lg font-semibold mb-2">Automated Charts</h4>
                            <VisualizeAllSamples sampleId={row.Sample_ID} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Samples;
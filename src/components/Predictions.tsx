
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, MapPin, TrendingUp, Activity } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import WaterBackground from "@/components/WaterBackground";
import axios from "axios";
import { Toaster } from "sonner";
import "leaflet/dist/leaflet.css";

// Add Leaflet CSS fix - only inject once
if (typeof document !== "undefined" && !document.getElementById("leaflet-style-fix")) {
  const leafletStyles = `
    .leaflet-control {
      border-radius: 5px !important;
    }
    .leaflet-bar {
      border-radius: 5px !important;
      border: 2px solid rgba(0,0,0,0.2) !important;
    }
    .leaflet-bar a {
      background-color: white;
      color: #333;
    }
    .leaflet-bar a:hover {
      background-color: #f0f0f0;
    }
    .info.legend {
      line-height: 1.6;
    }
  `;
  const styleSheet = document.createElement("style");
  styleSheet.id = "leaflet-style-fix";
  styleSheet.textContent = leafletStyles;
  document.head.appendChild(styleSheet);
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Predictions = () => {
  const [activeTab, setActiveTab] = useState("timeline");
  const [predictions, setPredictions] = useState<any[]>([]);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [spatialData, setSpatialData] = useState<any[]>([]);
  const [clusters, setClusters] = useState<any[]>([]);
  const [sampleTrend, setSampleTrend] = useState<any[]>([]);
  const [selectedSample, setSelectedSample] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);

  const fetchData = async () => {
    try {
      const [dataRes, comparisonRes, spatialRes, clusterRes] = await Promise.all([
        axios.get("http://localhost:5000/predictions/data"),
        axios.get("http://localhost:5000/predictions/comparison"),
        axios.get("http://localhost:5000/predictions/spatial-data"),
        axios.get("http://localhost:5000/predictions/cluster-zones"),
      ]);

      console.log("Spatial Data:", spatialRes.data);
      console.log("Clusters Data:", clusterRes.data);

      setPredictions(dataRes.data.predictions);
      setComparisonData(comparisonRes.data.monthly_data);
      setSpatialData(spatialRes.data.features || []);
      setClusters(clusterRes.data.clusters || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load predictions");
      setLoading(false);
    }
  };

  const fetchSampleTrend = async (sampleId: string) => {
    const res = await axios.get(`http://localhost:5000/predictions/sample-trend/${sampleId}`);
    setSampleTrend(res.data.trend);
  };

  const getColorForHMPI = React.useCallback((hmpi: number) => {
    if (hmpi <= 60) return "#22c55e"; // Green - Safe
    if (hmpi <= 100) return "#eab308"; // Yellow - Moderate
    return "#ef4444"; // Red - High Risk
  }, []);

  const getRiskLevel = React.useCallback((hmpi: number) => {
    if (hmpi <= 60) return "Safe";
    if (hmpi <= 100) return "Moderate";
    return "High Risk";
  }, []);

  const initializeMap = React.useCallback(async () => {
    if (!mapRef.current) {
      console.error("Map ref is not available");
      return;
    }

    if (spatialData.length === 0) {
      console.warn("No spatial data available to display on map");
      return;
    }

    try {
      const L = (await import("leaflet")).default;

      // Remove existing map completely before creating new one
      if (leafletMapRef.current) {
        leafletMapRef.current.off();
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      // Ensure the map container is visible and has dimensions
      mapRef.current.innerHTML = ""; // Clear any existing content
      mapRef.current.style.height = "600px";
      mapRef.current.style.width = "100%";

      // Initialize the map with a default center
      const map = L.map(mapRef.current, {
        preferCanvas: true,
        zoomControl: true,
      }).setView([28.45, 77.03], 10);

      // Add OpenStreetMap tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 3,
        opacity: 0.95,
      }).addTo(map);

      // Add a subtle background layer for better aesthetics
      if (typeof document !== "undefined") {
        const mapElement = map.getContainer();
        if (mapElement) {
          mapElement.style.backgroundColor = "rgba(220, 240, 255, 0.3)";
        }
      }

      // Add circle markers for each sample with HMPI-based coloring
      const markers: any[] = [];
      let validMarkerCount = 0;
      
      for (let i = 0; i < spatialData.length; i++) {
        const f = spatialData[i];
        try {
          if (!f.geometry?.coordinates) continue;

          const [lon, lat] = f.geometry.coordinates;
          if (typeof lat !== "number" || typeof lon !== "number" || isNaN(lat) || isNaN(lon)) continue;

          const hmpi = f.properties?.ensemble_avg || f.properties?.ensemble_mean || f.properties?.ensemble_latest || f.properties?.HMPI || 0;
          const color = f.properties?.color || getColorForHMPI(hmpi);
          const riskLevel = f.properties?.risk_category || getRiskLevel(hmpi);
          const trend = f.properties?.trend || "stable";

          // Create custom marker with trend indicator
          const trendArrow = trend === "increasing" ? "📈" : trend === "decreasing" ? "📉" : "➡️";
          
          const marker = L.circleMarker([lat, lon], {
            radius: 12,
            fillColor: color,
            color: "#ffffff",
            weight: 2.5,
            opacity: 1,
            fillOpacity: 0.9,
          }).addTo(map);

          markers.push(marker);
          validMarkerCount++;

          // Enhanced popup content with trend indicator
          const sampleId = f.properties?.sample_id || "Sample";
          const ensemble = f.properties?.ensemble_latest?.toFixed(2) || hmpi.toFixed(2);
          
          const popupHtml = `<div style="font-size:12px;width:200px;padding:8px;font-family:Arial;">
            <div style="margin-bottom:6px;"><b>${sampleId}</b> <span style="font-size:16px;">${trendArrow}</span></div>
            <div style="margin-bottom:4px;"><b>HMPI:</b> ${ensemble}</div>
            <div style="margin-bottom:4px;"><b>Risk:</b> ${riskLevel}</div>
            <div style="margin-bottom:4px;"><b>Trend:</b> ${trend.charAt(0).toUpperCase() + trend.slice(1)}</div>
            <div style="font-size:11px;color:#666;">Lat: ${lat.toFixed(4)}<br/>Lon: ${lon.toFixed(4)}</div>
          </div>`;
          marker.bindPopup(popupHtml);

          // Throttle hover events
          let isHovering = false;
          marker.on("mouseover", function () {
            if (!isHovering) {
              isHovering = true;
              this.openPopup();
            }
          });
          marker.on("mouseout", function () {
            isHovering = false;
            this.closePopup();
          });
        } catch (err) {
          // Silently skip invalid markers
        }
      }

      console.log(`Added ${validMarkerCount} markers to map`);

      
      // Fit bounds to all markers if available
      if (markers.length > 0) {
        const group = L.featureGroup(markers);
        try {
          map.fitBounds(group.getBounds(), { padding: [50, 50] });
        } catch (err) {
          console.warn("Could not fit bounds:", err);
        }
      }

      // Add optimized legend with enhanced styling
      const legend = L.control({ position: "bottomright" });
      legend.onAdd = function () {
        const div = L.DomUtil.create("div", "info legend");
        div.innerHTML = `
          <div style="background: linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.96) 100%); padding: 16px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; min-width: 200px;">
            <div style="font-weight: 700; margin-bottom: 12px; font-size: 14px; color: #1f2937;">HMPI Risk Levels</div>
            <div style="display: flex; align-items: center; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid rgba(0,0,0,0.1);">
              <span style="width: 14px; height: 14px; background: #22c55e; border-radius: 50%; border: 2.5px solid white; margin-right: 10px; box-shadow: 0 0 4px rgba(34,197,94,0.4);"></span>
              <span style="color: #374151;"><strong>Safe</strong> (≤ 60)</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid rgba(0,0,0,0.1);">
              <span style="width: 14px; height: 14px; background: #eab308; border-radius: 50%; border: 2.5px solid white; margin-right: 10px; box-shadow: 0 0 4px rgba(234,179,8,0.4);"></span>
              <span style="color: #374151;"><strong>Moderate</strong> (61-100)</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="width: 14px; height: 14px; background: #ef4444; border-radius: 50%; border: 2.5px solid white; margin-right: 10px; box-shadow: 0 0 4px rgba(239,68,68,0.4);"></span>
              <span style="color: #374151;"><strong>High Risk</strong> (> 100)</span>
            </div>
            <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid rgba(0,0,0,0.1); font-size: 12px; color: #6b7280;">
              <div style="margin-bottom: 4px;"><strong>Trend Indicators:</strong></div>
              <div>📈 Increasing | 📉 Decreasing | ➡️ Stable</div>
            </div>
          </div>
        `;
        return div;
      };
      legend.addTo(map);

      leafletMapRef.current = map;
      console.log("Map initialized successfully with", spatialData.length, "samples and", clusters.length, "clusters");
    } catch (err) {
      console.error("Error initializing map:", err);
    }
  }, [spatialData, clusters, getColorForHMPI, getRiskLevel]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === "map" && spatialData.length > 0) {
      // Small delay to ensure DOM is ready after tab switch
      const timer = setTimeout(() => {
        initializeMap();
      }, 50);
      return () => clearTimeout(timer);
    } else if (activeTab !== "map" && leafletMapRef.current) {
      // Cleanup map when leaving the map tab
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }
  }, [activeTab, spatialData.length, clusters.length, initializeMap]);

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (error) return <div className="p-10 text-red-500">{error}</div>;

  const dates = [...new Set(comparisonData.map((d) => d.date))].sort();

  const ensembleMeans = dates.map(
    (d) => comparisonData.find((c) => c.date === d)?.ensemble_mean || 0
  );

  const ensembleMax = dates.map((d) => {
    const month = comparisonData.find((c) => c.date === d);
    return month ? month.ensemble_mean + (month.ensemble_std || 0) : 0;
  });

  const rollingAvg = ensembleMeans.map((_, i, arr) =>
    i < 2 ? arr[i] : (arr[i] + arr[i - 1] + arr[i - 2]) / 3
  );

  const percentHighRisk = dates.map((d) => {
    const monthSamples = predictions.filter((p) => p.date === d);
    const high = monthSamples.filter((p) => p.ensemble > 100).length;
    return monthSamples.length > 0 ? (high / monthSamples.length) * 100 : 0;
  });

  const monthChange = ensembleMeans.map((val, i, arr) => {
    if (i === 0) return 0;
    const prev = arr[i - 1];
    return prev === 0 ? 0 : ((val - prev) / prev) * 100;
  });

  const sustainedHighRisk =
    ensembleMeans.filter((v) => v > 100).length >= 2;

  const timelineData = {
    labels: dates,
    datasets: [
      {
        label: "Ensemble Mean",
        data: ensembleMeans,
        borderColor: "#10b981",
        backgroundColor: "rgba(16,185,129,0.15)",
        fill: true,
        tension: 0.4,
        yAxisID: "y",
      },
      {
        label: "Worst Case (Mean + Std)",
        data: ensembleMax,
        borderColor: "#ef4444",
        borderDash: [6, 6],
        tension: 0.4,
        yAxisID: "y",
      },
      {
        label: "3-Month Moving Avg",
        data: rollingAvg,
        borderColor: "#3b82f6",
        borderDash: [4, 4],
        tension: 0.4,
        yAxisID: "y",
      },
      {
        label: "Safe Threshold (60)",
        data: dates.map(() => 60),
        borderColor: "#22c55e",
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 0,
        yAxisID: "y",
      },
      {
        label: "High Risk Threshold (100)",
        data: dates.map(() => 100),
        borderColor: "#ef4444",
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 0,
        yAxisID: "y",
      },
      {
        label: "% Samples >100",
        data: percentHighRisk,
        borderColor: "#f59e0b",
        tension: 0.4,
        yAxisID: "y1",
      },
    ],
  };

  const timelineOptions: any = {
    responsive: true,
    interaction: { mode: "index", intersect: false },
    scales: {
      y: {
        position: "left",
        title: { display: true, text: "HMPI Level" },
      },
      y1: {
        position: "right",
        title: { display: true, text: "% High Risk Samples" },
        grid: { drawOnChartArea: false },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          afterBody: function (context: any) {
            const index = context[0].dataIndex;
            return `MoM Change: ${monthChange[index].toFixed(2)}%`;
          },
        },
      },
    },
  };

  const individualTrendData = {
    labels: sampleTrend.map((d) => d.date),
    datasets: [
      {
        label: "Predicted HMPI",
        data: sampleTrend.map((d) => d.ensemble),
        borderColor: "#10b981",
        backgroundColor: "rgba(16,185,129,0.15)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background relative">
      <WaterBackground />

      <div className="relative z-10 container mx-auto px-6 py-8">
        <h2 className="text-3xl font-bold mb-6">2026 HMPI Predictions</h2>

        <Card className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 flex gap-2">
              <TabsTrigger value="timeline">
                <TrendingUp className="w-4 h-4 mr-1"/>Timeline
              </TabsTrigger>
              <TabsTrigger value="individual">
                <Activity className="w-4 h-4 mr-1"/>Individual
              </TabsTrigger>
              <TabsTrigger value="map">
                <MapPin className="w-4 h-4 mr-1"/>Map
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timeline">
              {sustainedHighRisk && (
                <div className="mb-4 p-3 rounded bg-red-500/20 text-red-400 font-semibold text-sm">
                  ⚠ Sustained High-Risk Period Detected
                </div>
              )}

              <Line data={timelineData} options={timelineOptions} />

              <div className="flex mt-4 h-4 rounded overflow-hidden">
                {ensembleMeans.map((value, index) => (
                  <div
                    key={index}
                    className="flex-1"
                    style={{
                      backgroundColor:
                        value <= 60
                          ? "#22c55e"
                          : value <= 100
                          ? "#eab308"
                          : "#ef4444",
                    }}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="individual">
              <select
                className="mb-4 p-2 border rounded bg-white text-gray-900 font-medium"
                onChange={(e) => {
                  setSelectedSample(e.target.value);
                  fetchSampleTrend(e.target.value);
                }}
              >
                <option>Select Sample</option>
                {[...new Set(predictions.map((p) => p.sample_id))].map((id) => (
                  <option key={id}>{id}</option>
                ))}
              </select>

              {sampleTrend.length > 0 && (
                <Line data={individualTrendData} />
              )}
            </TabsContent>

            <TabsContent value="map">
              <div className="w-full mb-4">
                {spatialData.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No spatial data available. Please ensure prediction data is loaded.</p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-lg overflow-hidden shadow-lg border border-gray-200">
                      <div 
                        ref={mapRef} 
                        className="w-full bg-gradient-to-br from-blue-50 to-cyan-50"
                        style={{
                          height: "650px",
                          minHeight: "650px",
                          position: "relative",
                          zIndex: 1,
                        }}
                      />
                    </div>
                    <div className="mt-4 text-sm text-gray-600 flex justify-between items-center px-2">
                      <p><span className="font-semibold">Total samples:</span> <strong className="text-blue-600">{spatialData.length}</strong> | <span className="font-semibold">Clusters:</span> <strong className="text-purple-600">{clusters.length}</strong></p>
                      <span className="text-xs text-gray-400">Hover over markers for details</span>
                    </div>
                  </>
                )}
              </div>
              
              {/* Map Statistics */}
              {spatialData.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold text-green-700">Safe Zone</div>
                      <span className="text-2xl">✓</span>
                    </div>
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {spatialData.filter((d: any) => {
                        const hmpi = d.properties?.ensemble_avg || d.properties?.ensemble_mean || d.properties?.HMPI || 0;
                        return hmpi <= 60;
                      }).length}
                    </div>
                    <div className="text-xs text-green-600 font-medium">HMPI ≤ 60</div>
                  </Card>
                  
                  <Card className="p-6 bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-300 shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold text-yellow-700">Moderate Zone</div>
                      <span className="text-2xl">⚠</span>
                    </div>
                    <div className="text-3xl font-bold text-yellow-600 mb-2">
                      {spatialData.filter((d: any) => {
                        const hmpi = d.properties?.ensemble_avg || d.properties?.ensemble_mean || d.properties?.HMPI || 0;
                        return hmpi > 60 && hmpi <= 100;
                      }).length}
                    </div>
                    <div className="text-xs text-yellow-600 font-medium">60 &lt; HMPI &le; 100</div>
                  </Card>
                  
                  <Card className="p-6 bg-gradient-to-br from-red-50 to-rose-50 border-red-300 shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold text-red-700">High Risk Zone</div>
                      <span className="text-2xl">⚡</span>
                    </div>
                    <div className="text-3xl font-bold text-red-600 mb-2">
                      {spatialData.filter((d: any) => {
                        const hmpi = d.properties?.ensemble_avg || d.properties?.ensemble_mean || d.properties?.HMPI || 0;
                        return hmpi > 100;
                      }).length}
                    </div>
                    <div className="text-xs text-red-600 font-medium">HMPI &gt; 100</div>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>

        <Card className="p-6 mt-6">
          <Button
            onClick={async () => {
              const res = await axios.get(
                "http://localhost:5000/predictions/csv-download",
                { responseType: "blob" }
              );
              const url = window.URL.createObjectURL(res.data);
              const link = document.createElement("a");
              link.href = url;
              link.download = "future_hmpi_predictions_2026.csv";
              link.click();
            }}
          >
            <Download className="w-4 h-4 mr-2"/>Download CSV
          </Button>
        </Card>
      </div>

      <Toaster />
    </div>
  );
};

export default Predictions;

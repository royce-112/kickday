import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, RotateCcw, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useDataset } from '@/context/DataContext';

interface MetalConcentration {
  Arsenic: number;
  Cadmium: number;
  Chromium: number;
  Copper: number;
  Lead: number;
  Mercury: number;
  Nickel: number;
  Uranium: number;
  Zinc: number;
}

interface SampleData {
  HMPI: number;
  Sample_ID: string;
  all_metal_conc: MetalConcentration;
  geometry: {
    coordinates: [number, number];
    type: 'Point';
  };
  latitudeandlongitudepresent: boolean;
  no_of_metals: number;
}
// HMPI color function
const getColor = (hmpi: number): string => {
  if (hmpi <= 60) return '#22c55e'; // green
  if (hmpi <= 100) return '#eab308'; // yellow
  return '#ef4444'; // red
};

// Convert meters to pixels at current zoom
const metersToPixels = (lat: number, meters: number, zoom: number): number => {
  const earthCircumference = 40075017;
  const latitudeRadians = lat * (Math.PI / 180);
  return (meters / earthCircumference) * 512 * Math.pow(2, zoom) / Math.cos(latitudeRadians);
};

const MapVisualization: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [selectedSample, setSelectedSample] = useState<SampleData | null>(null);
  const [pulseAnimation, setPulseAnimation] = useState<number | null>(null);
  const [mapData, setMapData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get data from context (uploaded by user)
  const { data: contextData, fileId } = useDataset();

  // Convert GeoJSON features to map data format
  const convertContextDataToMapFormat = (features: any[]) => {
    if (!features || features.length === 0) return [];
    
    return features.map((feature: any, index: number) => {
      console.log(`\n=== Processing Feature ${index} ===`);
      console.log('Feature keys:', Object.keys(feature));
      
      // The backend returns metal concentrations in all_metal_conc field
      // This is a custom GeoJSON format, not standard GeoJSON
      const metalConc = feature.all_metal_conc || {};
      
      console.log('all_metal_conc:', metalConc);
      console.log('HMPI:', feature.HMPI);

      // Extract HMPI value
      let hmpiValue = parseFloat(feature.HMPI) || 0;
      
      // If HMPI is 0, calculate from metals
      if (!hmpiValue || hmpiValue === 0) {
        const metalValues = Object.values(metalConc).map(v => parseFloat(v as any) || 0);
        hmpiValue = metalValues.reduce((a, b) => a + b, 0);
      }

      const metalCount = Object.values(metalConc).filter(v => (parseFloat(v as any) || 0) > 0).length;

      console.log(`Extracted - HMPI: ${hmpiValue}, Metal Count: ${metalCount}`);
      console.log('Metal Concentrations:', metalConc);

      return {
        HMPI: hmpiValue,
        Sample_ID: feature.Sample_ID || `Sample_${index + 1}`,
        all_metal_conc: metalConc,
        geometry: feature.geometry || {
          coordinates: [0, 0],
          type: 'Point'
        },
        latitudeandlongitudepresent: feature.latitudeandlongitudepresent || true,
        no_of_metals: metalCount,
        trend: feature.trend || 'stable',
        risk_category:
          feature.risk_category ||
          (hmpiValue <= 60
            ? 'Safe'
            : hmpiValue <= 100
            ? 'Moderate'
            : 'High Risk')
      };
    });
  };

  // Load data from context or API
  const loadMapData = () => {
    try {
      setLoading(true);
      setError(null);

      // Priority 1: Use context data (uploaded by user)
      if (contextData && contextData.length > 0) {
        console.log('=== CONTEXT DATA RECEIVED ===');
        console.log('Total features:', contextData.length);
        console.log('First feature raw:', JSON.stringify(contextData[0], null, 2));
        console.log('First feature properties:', contextData[0].properties || contextData[0]);
        
        const convertedData = convertContextDataToMapFormat(contextData);
        console.log('Converted data sample:', convertedData[0]);
        
        setMapData(convertedData);
        setLoading(false);
        return;
      }

      // Priority 2: Fetch from predictions API if no context data
      axios.get('http://localhost:5000/predictions/spatial-data')
        .then((response) => {
          const features = response.data.features || [];
          console.log('Loading map data from API:', features.length, 'features');
          
          const convertedData = features.map((feature: any) => ({
            HMPI: feature.properties?.ensemble_avg || 0,
            Sample_ID: feature.properties?.sample_id || 'Sample',
            all_metal_conc: {
              Arsenic: 0,
              Cadmium: 0,
              Chromium: 0,
              Copper: 0,
              Lead: 0,
              Mercury: 0,
              Nickel: 0,
              Uranium: 0,
              Zinc: 0
            },
            geometry: {
              coordinates: feature.geometry.coordinates,
              type: 'Point'
            },
            latitudeandlongitudepresent: true,
            no_of_metals: 9,
            trend: feature.properties?.trend || 'stable',
            risk_category: feature.properties?.risk_category || 'Safe'
          }));
          
          setMapData(convertedData);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching map data from API:', err);
          setError('No data available. Please upload a dataset or ensure predictions are loaded.');
          setMapData([]);
          setLoading(false);
        });
    } catch (err) {
      console.error('Error loading map data:', err);
      setError('Failed to load map data');
      setLoading(false);
    }
  };

  // Load data when context changes or component mounts
  useEffect(() => {
    loadMapData();
  }, [contextData]);

  useEffect(() => {
    if (!mapContainer.current || mapData.length === 0) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Initialize map
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [77.21, 28.613],
      attributionControl: false,
      zoom: 13
    });

    mapRef.current = map;

    // Add navigation controls
    map.addControl(new maplibregl.NavigationControl());

    // Cleanup pulse
    const removePulseCircle = () => {
      if (pulseAnimation) {
        cancelAnimationFrame(pulseAnimation);
        setPulseAnimation(null);
      }
      if (map.getLayer('pulse-circle')) map.removeLayer('pulse-circle');
      if (map.getSource('pulse-circle')) map.removeSource('pulse-circle');
    };

    // Close popup
    const closeOpenPopup = () => {
      if (popupRef.current) {
        try {
          popupRef.current.remove();
        } catch {}
        popupRef.current = null;
      }
      setSelectedSample(null);
      removePulseCircle();
    };

    // Add markers from dynamic data
    mapData.forEach((sample, sampleIndex) => {
      // Get all metals in fixed order for consistent display
      const allMetals = [
        'Arsenic', 'Cadmium', 'Chromium', 'Copper', 'Lead', 
        'Mercury', 'Nickel', 'Uranium', 'Zinc'
      ];

      const metals = allMetals
        .map(metal => {
          const concentration = sample.all_metal_conc;
          const value = concentration && concentration[metal] ? parseFloat(concentration[metal]) : 0;
          
          // Log metal values for debugging
          if (sampleIndex < 3) { // Log first 3 samples
            console.log(`${sample.Sample_ID} - ${metal}: ${value}`);
          }
          
          return `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding: 6px 8px; background: rgba(255,255,255,0.08); border-radius: 4px;">
              <span style="font-weight: 500; font-size: 12px;">${metal}:</span>
              <span style="font-weight: 600; font-size: 12px; background: rgba(255,255,255,0.15); padding: 2px 8px; border-radius: 3px;">${value.toFixed(4)}</span>
            </div>
          `;
        })
        .join("");

      const popupHtml = `
        <div style="font-family: 'Segoe UI', sans-serif; font-size: 13px; max-width: 320px; background: ${getColor(sample.HMPI)}; color: white; border-radius: 8px; padding: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.4);">
          <!-- Header with Sample ID -->
          <div style="margin-bottom: 14px; padding-bottom: 12px; border-bottom: 2px solid rgba(255,255,255,0.3);">
            <div style="font-size: 16px; font-weight: 700; text-align: center;">${sample.Sample_ID}</div>
          </div>
          
          <!-- HMPI Value -->
          <div style="margin-bottom: 14px; padding: 12px; background: rgba(255,255,255,0.15); border-radius: 6px; text-align: center;">
            <div style="font-size: 11px; opacity: 0.9; font-weight: 600; margin-bottom: 4px; letter-spacing: 0.5px;">HMPI VALUE</div>
            <div style="font-size: 28px; font-weight: 900; letter-spacing: 1px;">${sample.HMPI.toFixed(2)}</div>
          </div>

          <!-- Metal Concentrations Header -->
          <div style="font-size: 12px; font-weight: 700; margin-bottom: 10px; letter-spacing: 0.5px;">METAL CONCENTRATIONS:</div>

          <!-- Metal List -->
          <div style="max-height: 280px; overflow-y: auto;">
            ${metals}
          </div>

          <!-- Footer Stats -->
          <div style="margin-top: 12px; padding-top: 12px; border-top: 2px solid rgba(255,255,255,0.3); display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div style="text-align: center; padding: 8px; background: rgba(255,255,255,0.08); border-radius: 4px;">
              <div style="font-size: 10px; opacity: 0.85; margin-bottom: 2px;">Metals Found</div>
              <div style="font-size: 14px; font-weight: 700;">${sample.no_of_metals}</div>
            </div>
            <div style="text-align: center; padding: 8px; background: rgba(255,255,255,0.08); border-radius: 4px;">
              <div style="font-size: 10px; opacity: 0.85; margin-bottom: 2px;">Risk Level</div>
              <div style="font-size: 12px; font-weight: 700;">${sample.risk_category || 'N/A'}</div>
            </div>
          </div>
        </div>
      `;

      const popup = new maplibregl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: true,
        className: 'map-popup'
      }).setHTML(popupHtml);

      // Marker element (SVG pin) - uses actual HMPI value for color
      const el = document.createElement('div');
      el.className = 'marker-svg-container cursor-pointer';
      el.style.width = '32px';
      el.style.height = '42px';
      const markerColor = getColor(sample.HMPI);
      el.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 24 24" fill="${markerColor}" stroke="white" stroke-width="1.5" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
          <path d="M12 2C8 2 5 5 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-4-3-7-7-7z"/>
          <circle cx="12" cy="9" r="2.5" fill="white"/>
        </svg>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(sample.geometry.coordinates)
        .addTo(map);

      markersRef.current.push(marker);

      // Marker click to show popup
      marker.getElement().addEventListener('click', (e) => {
        e.stopPropagation();

        // If same popup open, close it
        if (popupRef.current === popup) {
          closeOpenPopup();
          return;
        }

        // Close old popup
        closeOpenPopup();

        // Open new popup
        popup.setLngLat(sample.geometry.coordinates).addTo(map);
        popupRef.current = popup;
        setSelectedSample(sample);

        const shiftedCoordinates: [number, number] = [
        sample.geometry.coordinates[0],             // longitude (x) stays the same
        sample.geometry.coordinates[1] - 0.003       // latitude (y) + 0.01
        ];
        // Fly
        map.flyTo({ center: shiftedCoordinates , zoom: 14.5 });

        // Pulse circle
        map.addSource('pulse-circle', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [{ type: 'Feature', geometry: sample.geometry, properties: {} }]
          }
        });

        map.addLayer({
          id: 'pulse-circle',
          type: 'circle',
          source: 'pulse-circle',
          paint: {
            'circle-radius': metersToPixels(sample.geometry.coordinates[1], 100, map.getZoom()),
            'circle-color': getColor(sample.HMPI),
            'circle-opacity': 0.5
          }
        });

        // Animate pulse
        let start: number | null = null;
        const animatePulse = (timestamp: number) => {
          if (!map || !map.getLayer('pulse-circle')) return;
          if (!start) start = timestamp;
          const progress = (timestamp - start) / 1000;
          const opacity = 0.3 + 0.2 * Math.sin(progress * 2 * Math.PI);
          map.setPaintProperty('pulse-circle', 'circle-opacity', opacity);

          const radius = metersToPixels(sample.geometry.coordinates[1], 100, map.getZoom());
          map.setPaintProperty('pulse-circle', 'circle-radius', radius);

          const id = requestAnimationFrame(animatePulse);
          setPulseAnimation(id);
        };
        animatePulse(0);

        popup.on('close', () => {
          if (popupRef.current === popup) {
            closeOpenPopup();
          }
        });
      });
    });

    // Map click clears popup
    map.on('click', closeOpenPopup);

    // Fit bounds
    map.on('load', () => {
      const bounds = new maplibregl.LngLatBounds();
      mapData.forEach(s => bounds.extend(s.geometry.coordinates));
      map.fitBounds(bounds, { padding: 50 });
    });

    // Cleanup
    return () => {
      if (pulseAnimation) cancelAnimationFrame(pulseAnimation);
      closeOpenPopup();
      markersRef.current.forEach(m => m.remove());
      map.remove();
    };
<<<<<<< HEAD
  }, []);
=======
  }, [mapData]);
>>>>>>> 4a306af (sirf video ke liye)

  const handleRecenter = () => {
    if (!mapRef.current) return;
    const bounds = new maplibregl.LngLatBounds();
<<<<<<< HEAD
    allData.forEach(s => bounds.extend(s.geometry.coordinates));
=======
    mapData.forEach(s => bounds.extend(s.geometry.coordinates));
>>>>>>> 4a306af (sirf video ke liye)
    mapRef.current.fitBounds(bounds, { padding: 50 });
    // Reset everything
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }
    if (pulseAnimation) {
      cancelAnimationFrame(pulseAnimation);
      setPulseAnimation(null);
    }
    setSelectedSample(null);
    if (mapRef.current.getLayer('pulse-circle')) {
      mapRef.current.removeLayer('pulse-circle');
      mapRef.current.removeSource('pulse-circle');
    }
  };

  return (
    <div className="relative w-full h-screen bg-map-background">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="font-medium text-gray-700">Loading map data...</span>
          </div>
        </div>
      )}
      
      {error && !loading && mapData.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-8 max-w-md text-center shadow-lg">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-700 mb-2">No Data Available</h3>
            <p className="text-gray-600 text-sm mb-4">{error}</p>
            <p className="text-xs text-gray-500">Upload a CSV file in the Dataset Upload section to visualize your data on the map.</p>
          </div>
        </div>
      )}

      {mapData.length > 0 && !loading && (
        <div className="absolute top-2 left-2 bg-blue-50 border border-blue-300 rounded px-3 py-2 z-40">
          <p className="text-xs font-medium text-blue-900">
            📊 Displaying {mapData.length} samples {contextData ? '(from uploaded file)' : '(from predictions)'}
          </p>
        </div>
      )}

      <div ref={mapContainer} className="absolute inset-0 rounded-lg shadow-map" />

      {/* Legend */}
      <Card className="absolute top-6 left-6 bg-map-panel/95 backdrop-blur-sm border-border/20 shadow-panel">
        <div className="p-4 space-y-3" style={{ backgroundColor: "hsl(215 25% 27%)", borderRadius: "0.65rem" }}>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-map-panel-foreground" />
            <h3 className="font-semibold text-map-panel-foreground">HMPI Levels</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full" style={{backgroundColor: "#22c55e"}}></div>
              <span className="text-map-panel-foreground">Safe (≤60)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full" style={{backgroundColor: "#eab308"}}></div>
              <span className="text-map-panel-foreground">Moderate (61-100)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full" style={{backgroundColor: "#ef4444"}}></div>
              <span className="text-map-panel-foreground">High (&gt;100)</span>
            </div>
          </div>
          <div className="border-t border-map-panel-foreground/20 pt-3 mt-3">
            <p className="text-xs text-map-panel-foreground font-medium mb-2">📍 Data Source:</p>
            <p className="text-xs text-map-panel-foreground/80">
              {contextData && contextData.length > 0 ? '✓ User Uploaded' : contextData === null ? '⚙ Predictions API' : '○ No Data'}
            </p>
          </div>
        </div>
      </Card>

      {/* Recenter button */}
      <Button
        onClick={handleRecenter}
        className="absolute bottom-6 right-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-panel"
        size="lg"
        disabled={loading}
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Recenter
      </Button>

      {/* Sample Info Panel */}
      {selectedSample && (
        <Card className="absolute top-6 right-6 w-80 bg-map-panel/95 backdrop-blur-sm border-border/20 shadow-panel">
          <div className="p-4" style={{ backgroundColor: "hsl(215 25% 27%)" , borderRadius: "0.65rem" }}>
            <div className="flex items-center gap-2 mb-3">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: getColor(selectedSample.HMPI) }}
              ></div>
              <h3 className="font-semibold text-lg text-map-panel-foreground">
                {selectedSample.Sample_ID}
              </h3>
            </div>
            <div className="space-y-3 text-sm text-map-panel-foreground">
              <div>
                <span className="font-medium">HMPI: </span>
                <span className="font-bold">{selectedSample.HMPI.toFixed(2)}</span>
              </div>
              <div>
                <span className="font-medium">Risk: </span>
                <span>{selectedSample.risk_category || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium">Trend: </span>
                <span>{selectedSample.trend ? selectedSample.trend.charAt(0).toUpperCase() + selectedSample.trend.slice(1) : 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium">Total Metals: </span>
                <span>{selectedSample.no_of_metals}</span>
              </div>
              <div>
                <span className="font-medium">Location: </span>
                <span className="text-xs">
                  {selectedSample.geometry.coordinates[1].toFixed(4)}, {selectedSample.geometry.coordinates[0].toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default MapVisualization;

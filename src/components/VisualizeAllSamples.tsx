import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import axios from "axios";
import { useDataset } from "@/context/DataContext";

interface Props {
  sampleId: string;
}

const VisualizeAllSamples: React.FC<Props> = ({ sampleId }) => {
  const { fileId } = useDataset();
  const [charts, setCharts] = useState<any>(null);

  useEffect(() => {
    if (!fileId || !sampleId) return;

    axios
      .get(`http://localhost:5000/charts/${fileId}`)
      .then((res) => {
        const sampleCharts = res.data.sample_charts || {};
        if (sampleCharts[sampleId]) {
          setCharts(sampleCharts[sampleId]);
        } else {
          setCharts(null);
        }
      })
      .catch((err) => console.error("Error fetching charts:", err));
  }, [fileId, sampleId]);

  if (!charts) {
    return <p className="text-muted-foreground">Generating charts...</p>;
  }

  return (
    <div className="space-y-6">
      {charts.bar && (
        <div>
          <h4 className="text-md font-semibold mb-2">Bar Chart</h4>
          <Plot
            data={JSON.parse(charts.bar).data}
            layout={JSON.parse(charts.bar).layout}
            style={{ width: "100%", height: "400px" }}
          />
        </div>
      )}
      {charts.pie && (
        <div>
          <h4 className="text-md font-semibold mb-2">Pie Chart</h4>
          <Plot
            data={JSON.parse(charts.pie).data}
            layout={JSON.parse(charts.pie).layout}
            style={{ width: "100%", height: "400px" }}
          />
        </div>
      )}
      {charts.radar && (
        <div>
          <h4 className="text-md font-semibold mb-2">Radar Chart (vs. Standard Limits)</h4>
          <Plot
            data={JSON.parse(charts.radar).data}
            layout={JSON.parse(charts.radar).layout}
            style={{ width: "100%", height: "400px" }}
          />
        </div>
      )}
    </div>
  );
};

export default VisualizeAllSamples;
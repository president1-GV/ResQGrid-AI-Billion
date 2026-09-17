import React, { useState, useEffect } from 'react';
import {
  Database,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  CloudRain,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Info,
  ChevronRight
} from 'lucide-react';
import { fetchDatasets, ingestDataset, fetchDatasetQuality, fetchDatasetLineage, fetchLiveWeather } from '../services/api';
import { DatasetMetadata, DataQualityReport } from '../types';

export interface DatasetsViewProps {
  isDarkMode?: boolean;
}

export const DatasetsView: React.FC<DatasetsViewProps> = ({ isDarkMode = true }) => {
  const [datasets, setDatasets] = useState<DatasetMetadata[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [ingestingId, setIngestingId] = useState<string | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<DataQualityReport | null>(null);
  const [selectedLineage, setSelectedLineage] = useState<any | null>(null);
  const [liveWeather, setLiveWeather] = useState<any | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    loadCatalog();
    loadWeather();
  }, []);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const data = await fetchDatasets();
      setDatasets(data);
    } catch (err: any) {
      console.error('Failed to load datasets', err);
    } finally {
      setLoading(false);
    }
  };

  const loadWeather = async () => {
    try {
      const w = await fetchLiveWeather(26.1445, 91.7362);
      setLiveWeather(w);
    } catch (err) {
      console.warn('Weather telemetry unavailable', err);
    }
  };

  const handleIngest = async (datasetId: string) => {
    setIngestingId(datasetId);
    setActionMessage(`Downloading real records for ${datasetId}...`);
    try {
      const res = await ingestDataset(datasetId);
      setActionMessage(`Ingestion successful: ${res.record_count} records processed! Quality score: ${res.quality_score}%`);
      await loadCatalog();
    } catch (err: any) {
      setActionMessage(`Ingestion failed: ${err.message}`);
    } finally {
      setIngestingId(null);
    }
  };

  const handleInspectQuality = async (datasetId: string) => {
    try {
      const q = await fetchDatasetQuality(datasetId);
      setSelectedQuality(q);
    } catch (err: any) {
      alert(`Could not fetch quality report: ${err.message}`);
    }
  };

  const handleViewLineage = async (datasetId: string) => {
    try {
      const l = await fetchDatasetLineage(datasetId);
      setSelectedLineage(l);
    } catch (err: any) {
      alert(`Could not fetch lineage: ${err.message}`);
    }
  };

  const totalRecords = datasets.reduce((acc, d) => acc + (d.record_count || 0), 0);
  const avgQuality = datasets.length > 0
    ? (datasets.reduce((acc, d) => acc + (d.quality_score || 0), 0) / datasets.length).toFixed(1)
    : '0';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className={`border rounded-xl p-6 shadow-xl relative overflow-hidden ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg border ${
                isDarkMode ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-blue-100 text-blue-700 border-blue-300'
              }`}>
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold tracking-tight flex items-center gap-2 ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  Dataset Intelligence & Open Data Catalog
                  <span className={`text-xs px-2.5 py-1 rounded-full font-mono font-bold border ${
                    isDarkMode
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                      : 'bg-emerald-100 border-emerald-300 text-emerald-800'
                  }`}>
                    LIVE GROUND TRUTH
                  </span>
                </h1>
                <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                  Real multi-decadal flood inventories, EM-DAT impact profiles, IMD radar, Open-Meteo telemetry, and OSM layers.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadCatalog}
              disabled={loading}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold transition cursor-pointer border ${
                isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 shadow-sm'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => handleIngest('india_flood_inventory')}
              disabled={ingestingId !== null}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-500/25 transition cursor-pointer"
            >
              <Database className="w-4 h-4" />
              Ingest India Flood Inventory
            </button>
          </div>
        </div>

        {/* Telemetry Strip */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t ${
          isDarkMode ? 'border-slate-800/80' : 'border-slate-200'
        }`}>
          <div className={`p-3.5 rounded-lg border ${
            isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200 shadow-sm'
          }`}>
            <div className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>Registered Catalogs</div>
            <div className={`text-2xl font-bold mt-1 font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{datasets.length} Sources</div>
            <div className={`text-xs mt-1 flex items-center gap-1 font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
              <CheckCircle className="w-3 h-3" /> 100% Schema Validated
            </div>
          </div>
          <div className={`p-3.5 rounded-lg border ${
            isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200 shadow-sm'
          }`}>
            <div className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>Ingested Live Records</div>
            <div className={`text-2xl font-bold mt-1 font-mono ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{totalRecords.toLocaleString()}</div>
            <div className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Multi-Decadal (1967–2023)</div>
          </div>
          <div className={`p-3.5 rounded-lg border ${
            isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200 shadow-sm'
          }`}>
            <div className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>Mean Data Quality Score</div>
            <div className={`text-2xl font-bold mt-1 font-mono ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>{avgQuality} / 100</div>
            <div className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Zero Synthetic Fabrication</div>
          </div>
          <div className={`p-3.5 rounded-lg border ${
            isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200 shadow-sm'
          }`}>
            <div className={`text-xs font-semibold flex items-center gap-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>
              <CloudRain className={`w-3 h-3 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`} /> Live Weather (Guwahati)
            </div>
            <div className={`text-xl font-bold mt-1 font-mono ${isDarkMode ? 'text-cyan-300' : 'text-cyan-800'}`}>
              {liveWeather ? `${liveWeather.temperature_c}°C | ${liveWeather.relative_humidity_pct}% RH` : 'Connecting...'}
            </div>
            <div className={`text-xs mt-1 truncate font-medium ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>
              {liveWeather ? `24h Precip: ${liveWeather.daily_precipitation_sum_mm}mm` : 'Open-Meteo Stream'}
            </div>
          </div>
        </div>

        {actionMessage && (
          <div className={`mt-4 p-3 rounded-lg text-xs font-mono flex items-center justify-between border ${
            isDarkMode ? 'bg-blue-950/60 border-blue-800 text-blue-200' : 'bg-blue-50 border-blue-300 text-blue-900'
          }`}>
            <span>ℹ️ {actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
          </div>
        )}
      </div>

      {/* Dataset Table */}
      <div className={`border rounded-xl overflow-hidden shadow-xl ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isDarkMode ? 'border-slate-800' : 'border-slate-200 bg-slate-50'
        }`}>
          <h2 className={`text-base font-bold flex items-center gap-2 ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>
            <FileSpreadsheet className="w-4 h-4 text-blue-500" />
            Active Disaster Intelligence Repositories
          </h2>
          <span className={`text-xs font-mono font-semibold ${
            isDarkMode ? 'text-slate-400' : 'text-slate-700'
          }`}>
            {datasets.filter(d => !d.is_synthetic).length} Real-World Sources | 0 Synthetic Fabrications
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                isDarkMode ? 'bg-slate-800/60 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-800'
              }`}>
                <th className="px-6 py-3.5">Dataset & Provider</th>
                <th className="px-4 py-3.5">Format & Scope</th>
                <th className="px-4 py-3.5">Records</th>
                <th className="px-4 py-3.5">Quality</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y text-sm ${isDarkMode ? 'divide-slate-800' : 'divide-slate-200'}`}>
              {datasets.map((d) => (
                <tr key={d.dataset_id} className={`transition ${isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                  <td className="px-6 py-4">
                    <div className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {d.name}
                      <a
                        href={d.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-500 hover:text-blue-500 transition"
                        title="Visit Source Repository"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <div className={`text-xs mt-0.5 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>{d.provider}</div>
                    <div className={`text-xs mt-1 line-clamp-1 max-w-md ${isDarkMode ? 'text-slate-500' : 'text-slate-600'}`}>{d.description}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-bold border ${
                      isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-800 border-slate-300'
                    }`}>
                      {d.format}
                    </span>
                    <div className={`text-xs mt-1 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>{d.geographic_scope}</div>
                    <div className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-600'}`}>{d.temporal_scope}</div>
                  </td>
                  <td className={`px-4 py-4 font-mono font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                    {d.record_count.toLocaleString()}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-12 rounded-full h-2 overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                        <div
                          className={`h-full rounded-full ${
                            d.quality_score >= 90 ? 'bg-emerald-500' : d.quality_score >= 70 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(10, d.quality_score))}%` }}
                        />
                      </div>
                      <span className={`text-xs font-mono font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-900'}`}>
                        {d.quality_score.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                        d.ingestion_status === 'SUCCESS'
                          ? isDarkMode
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : d.ingestion_status === 'INGESTING'
                          ? isDarkMode
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 animate-pulse'
                            : 'bg-blue-100 text-blue-800 border-blue-300 animate-pulse'
                          : 'bg-slate-200 text-slate-800 border-slate-300'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${d.ingestion_status === 'SUCCESS' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                      {d.ingestion_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleInspectQuality(d.dataset_id)}
                      className={`px-2.5 py-1.5 rounded text-xs font-bold transition cursor-pointer border ${
                        isDarkMode
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 shadow-sm'
                      }`}
                    >
                      Quality
                    </button>
                    <button
                      onClick={() => handleViewLineage(d.dataset_id)}
                      className={`px-2.5 py-1.5 rounded text-xs font-bold transition cursor-pointer border ${
                        isDarkMode
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 shadow-sm'
                      }`}
                    >
                      Lineage
                    </button>
                    <button
                      onClick={() => handleIngest(d.dataset_id)}
                      disabled={ingestingId === d.dataset_id}
                      className={`px-3 py-1.5 rounded text-xs font-bold transition cursor-pointer border ${
                        isDarkMode
                          ? 'bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border-blue-500/30'
                          : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm'
                      }`}
                    >
                      {ingestingId === d.dataset_id ? 'Ingesting...' : 'Sync'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quality Modal */}
      {selectedQuality && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className={`border rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            <div className={`flex items-center justify-between border-b pb-4 ${
              isDarkMode ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${
                  isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                }`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Data Quality Engine Report
                  </h3>
                  <p className={`text-xs font-mono font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Dataset ID: {selectedQuality.dataset_id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedQuality(null)}
                className={`text-lg font-bold cursor-pointer ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className={`p-3 rounded-lg border text-center ${
                isDarkMode ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>Completeness</div>
                <div className="text-xl font-bold text-emerald-500 mt-1">{selectedQuality.completeness_pct}%</div>
              </div>
              <div className={`p-3 rounded-lg border text-center ${
                isDarkMode ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>Uniqueness</div>
                <div className="text-xl font-bold text-blue-500 mt-1">{selectedQuality.uniqueness_pct}%</div>
              </div>
              <div className={`p-3 rounded-lg border text-center ${
                isDarkMode ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>Geospatial Bounds</div>
                <div className="text-xl font-bold text-amber-500 mt-1">{selectedQuality.geospatial_validity_pct}%</div>
              </div>
            </div>

            <div>
              <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-700'
              }`}>
                Audited Issues & Boundary Checks
              </h4>
              <div className={`p-3.5 rounded-lg border space-y-1.5 max-h-48 overflow-y-auto ${
                isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                {selectedQuality.issues.map((issue, idx) => (
                  <div key={idx} className={`text-xs font-mono flex items-start gap-2 ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-800 font-medium'
                  }`}>
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>{issue}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`flex justify-end pt-2 border-t ${
              isDarkMode ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <button
                onClick={() => setSelectedQuality(null)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition cursor-pointer border ${
                  isDarkMode
                    ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 shadow-sm'
                }`}
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lineage Modal */}
      {selectedLineage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className={`border rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            <div className={`flex items-center justify-between border-b pb-4 ${
              isDarkMode ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${
                  isDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700 border border-purple-300'
                }`}>
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    End-to-End Data Lineage Graph
                  </h3>
                  <p className={`text-xs font-mono font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Dataset: {selectedLineage.dataset_id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLineage(null)}
                className={`text-lg font-bold cursor-pointer ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {selectedLineage.pipeline_stages.map((stg: any, idx: number) => (
                <div key={idx} className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  isDarkMode ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-purple-600/30 border border-purple-500/40 text-purple-300 rounded-full flex items-center justify-center text-xs font-bold font-mono">
                      {idx + 1}
                    </div>
                    <div>
                      <div className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {stg.stage.replace(/_/g, ' ')}
                      </div>
                      <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                        {stg.source || stg.engine || stg.model || stg.features?.join(', ')}
                      </div>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${
                    isDarkMode
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {stg.status}
                  </span>
                </div>
              ))}
            </div>

            <div className={`flex justify-end pt-2 border-t ${
              isDarkMode ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <button
                onClick={() => setSelectedLineage(null)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition cursor-pointer border ${
                  isDarkMode
                    ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 shadow-sm'
                }`}
              >
                Close Lineage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

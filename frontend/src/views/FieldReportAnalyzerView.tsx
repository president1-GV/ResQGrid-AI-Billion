import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  CheckCircle,
  AlertOctagon,
  MapPin,
  Ambulance,
  ShieldCheck,
  Cpu,
  Brain,
  Sliders,
  RotateCcw,
  Check,
  X,
  Edit3
} from 'lucide-react';
import { extractLLMEvent, submitReviewAction, trainDemandModel, fetchPendingReviews } from '../services/api';
import { LLMExtractionOutput, ModelTrainingResponse } from '../types';

export const FieldReportAnalyzerView: React.FC = () => {
  const [reportText, setReportText] = useState<string>(
    'Flash flood in South Slum Cluster! Around 1,200 people trapped on rooftops. 14 elderly residents require urgent medical attention. Road R17 is completely submerged. Urgent need of 4,000 liters of water and 2 ambulances.'
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [extraction, setExtraction] = useState<LLMExtractionOutput | null>(null);
  const [trainingLoading, setTrainingLoading] = useState<boolean>(false);
  const [trainingResult, setTrainingResult] = useState<ModelTrainingResponse | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  const sampleReports = [
    {
      title: 'South Slum Flood & Submerged Bridge',
      text: 'Flash flood in South Slum Cluster! Around 1,200 people trapped on rooftops. 14 elderly residents require urgent medical attention. Road R17 is completely submerged. Urgent need of 4,000 liters of water and 2 ambulances.',
    },
    {
      title: 'Riverbank Colony Road Breach',
      text: 'Riverbank Colony levee breached at 04:00 IST. Water level 2.8m above danger mark. 850 citizens stranded. 5 patients need dialysis transfer. North access road impassable.',
    },
    {
      title: 'Vague Storm Report (Hallucination Test)',
      text: 'Severe rainfall somewhere in the rural sector. Rising water reported, citizens worried. Situation still developing.',
    },
  ];

  const handleExtract = async () => {
    setLoading(true);
    setReviewSuccess(null);
    try {
      const res = await extractLLMEvent(reportText, 'FIELD-DISPATCH-LIVE', 'local');
      setExtraction(res);
    } catch (err: any) {
      alert(`Extraction failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (action: 'APPROVE' | 'REJECT') => {
    if (!extraction) return;
    try {
      await submitReviewAction({
        extraction_id: extraction.extraction_id,
        action,
        rationale: action === 'APPROVE' ? 'Verified by Incident Commander' : 'Rejected due to insufficient ground verification',
        reviewer_role: 'Incident Commander',
      });
      setReviewSuccess(`Report ${extraction.extraction_id} ${action}D successfully.`);
      setExtraction({ ...extraction, review_status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' });
    } catch (err: any) {
      alert(`Review action failed: ${err.message}`);
    }
  };

  const handleTrainModel = async () => {
    setTrainingLoading(true);
    try {
      const res = await trainDemandModel({ dataset_id: 'india_flood_inventory', n_estimators: 80 });
      setTrainingResult(res);
    } catch (err: any) {
      alert(`Training failed: ${err.message}`);
    } finally {
      setTrainingLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                Field Report Analyzer & LLM Studio
                <span className="text-xs px-2.5 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-full font-mono">
                  HALLUCINATION-CONTROLLED
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Translates unstructured disaster dispatches into validated Pydantic events with strict null guards and human review.
              </p>
            </div>
          </div>

          <button
            onClick={handleTrainModel}
            disabled={trainingLoading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-purple-500/25 transition cursor-pointer"
          >
            <Cpu className={`w-4 h-4 ${trainingLoading ? 'animate-spin' : ''}`} />
            {trainingLoading ? 'Training Model...' : 'Retrain Demand ML Model'}
          </button>
        </div>
      </div>

      {/* Main Grid: Input on Left, Output on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Input Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              Unstructured Field Dispatch
            </h2>
            <span className="text-xs text-slate-400">Radio / WhatsApp / SMS Dispatch</span>
          </div>

          {/* Sample Pills */}
          <div className="space-y-1.5">
            <div className="text-xs text-slate-400 font-medium">Quick Evaluator Scenarios:</div>
            <div className="flex flex-wrap gap-2">
              {sampleReports.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setReportText(s.text)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-xs transition cursor-pointer"
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            rows={7}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3.5 text-sm text-slate-200 font-mono focus:outline-none focus:border-purple-500 transition resize-none"
            placeholder="Enter raw field report..."
          />

          <button
            onClick={handleExtract}
            disabled={loading || !reportText.trim()}
            className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-purple-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Extracting Intelligence...' : '⚡ Extract Structured Intelligence'}
          </button>
        </div>

        {/* Right Column: Structured AI Extraction */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Extracted & Validated Intelligence
            </h2>
            {extraction && (
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${
                extraction.confidence >= 0.85 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                Confidence: {(extraction.confidence * 100).toFixed(0)}%
              </span>
            )}
          </div>

          {extraction ? (
            <div className="space-y-4">
              {/* Event & Location Strip */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div className="text-xs text-slate-400">Incident Classification</div>
                  <div className="text-sm font-bold text-white mt-1 capitalize flex items-center gap-2">
                    {extraction.event_type || 'Unknown'}
                    {extraction.severity && (
                      <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded">
                        {extraction.severity}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-400" /> Resolved Location
                  </div>
                  <div className="text-sm font-bold text-white mt-1">
                    {extraction.location.name || <span className="text-slate-500 font-mono">null (Not in source)</span>}
                  </div>
                  {extraction.location.latitude && (
                    <div className="text-xs text-emerald-400 font-mono">
                      {extraction.location.latitude.toFixed(4)}°N, {extraction.location.longitude?.toFixed(4)}°E
                    </div>
                  )}
                </div>
              </div>

              {/* Casualties & Population */}
              <div className="p-3.5 bg-slate-800/50 rounded-lg border border-slate-700/50 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-xs text-slate-400">Affected Citizens</div>
                  <div className="text-lg font-bold text-amber-400 mt-0.5">
                    {extraction.affected_population?.toLocaleString() ?? <span className="text-xs text-slate-500">null</span>}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Medical Priority</div>
                  <div className="text-lg font-bold text-red-400 mt-0.5">
                    {extraction.medical_needs.priority || 'NORMAL'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Road Status</div>
                  <div className="text-lg font-bold text-cyan-400 mt-0.5">
                    {extraction.road_conditions.status || 'OPEN'}
                  </div>
                </div>
              </div>

              {/* Commodities Demanded */}
              <div>
                <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-1.5">
                  Extracted Commodity Requirements
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(extraction.resource_demands).map(([item, val]) => (
                    <div key={item} className="p-2.5 bg-slate-950 rounded border border-slate-800 text-center">
                      <div className="text-xs text-slate-400 capitalize">{item.replace('_', ' ')}</div>
                      <div className="text-sm font-bold text-white mt-1 font-mono">
                        {val !== null && val !== undefined ? val.toLocaleString() : <span className="text-slate-600 text-xs">null</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hallucination Guard Box */}
              {extraction.hallucination_warnings.length > 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs space-y-1">
                  <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <AlertOctagon className="w-4 h-4" /> Hallucination Guard Report:
                  </div>
                  {extraction.hallucination_warnings.map((w, idx) => (
                    <div key={idx} className="text-amber-200/80 pl-5">• {w}</div>
                  ))}
                </div>
              )}

              {/* Human in the Loop Actions */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div className="text-xs text-slate-400 font-mono">
                  Status: <span className="text-white font-bold">{extraction.review_status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReview('REJECT')}
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded text-xs font-semibold transition cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleReview('APPROVE')}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    Approve & Prepare Dispatch
                  </button>
                </div>
              </div>

              {reviewSuccess && (
                <div className="p-2.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded text-xs text-center font-mono">
                  ✓ {reviewSuccess}
                </div>
              )}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 space-y-2 border-2 border-dashed border-slate-800 rounded-lg">
              <FileText className="w-8 h-8 text-slate-600" />
              <div className="text-sm">No report extracted yet</div>
              <div className="text-xs text-slate-600">Enter a report on the left and click Extract</div>
            </div>
          )}
        </div>
      </div>

      {/* Model Training Telemetry Card */}
      {trainingResult && (
        <div className="bg-slate-900 border border-purple-900/50 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-bold text-white">
                Model Registry: {trainingResult.model_name}
              </h3>
              <span className="text-xs px-2.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded font-mono">
                {trainingResult.model_version}
              </span>
            </div>
            <span className="text-xs text-emerald-400 font-mono font-semibold">● DEPLOYED TO SOLVER PIPELINE</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
              <div className="text-xs text-slate-400">R² Validation Score</div>
              <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">{trainingResult.r2_score}</div>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
              <div className="text-xs text-slate-400">Mean Absolute Error (MAE)</div>
              <div className="text-xl font-bold text-blue-400 mt-1 font-mono">{trainingResult.mae}</div>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
              <div className="text-xs text-slate-400">Training Records Used</div>
              <div className="text-xl font-bold text-white mt-1 font-mono">{trainingResult.records_used.toLocaleString()}</div>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
              <div className="text-xs text-slate-400">Train / Test Split</div>
              <div className="text-xl font-bold text-amber-400 mt-1 font-mono">{trainingResult.train_split} / {trainingResult.test_split}</div>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2">Feature Importances</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(trainingResult.feature_importances).map(([feat, imp]) => (
                <div key={feat} className="p-2 bg-slate-950 rounded border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-300">{feat}</span>
                  <span className="font-mono text-purple-400 font-bold">{(imp * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
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
import { extractLLMEvent, submitReviewAction, trainDemandModel, submitFieldReport } from '../services/api';
import { LLMExtractionOutput, ModelTrainingResponse } from '../types';

export interface FieldReportAnalyzerViewProps {
  isDarkMode?: boolean;
  onSubmitReport?: (data: {
    reporter_name: string;
    reporter_role: string;
    location_name: string;
    raw_text: string;
    lat?: number;
    lon?: number;
  }) => Promise<void>;
  onRefreshState?: () => Promise<void>;
}

export const FieldReportAnalyzerView: React.FC<FieldReportAnalyzerViewProps> = ({
  isDarkMode = true,
  onSubmitReport,
  onRefreshState,
}) => {
  const [reportText, setReportText] = useState<string>(
    'Flash flood in South Slum Cluster! Around 1,200 people trapped on rooftops. 14 elderly residents require urgent medical attention. Road R17 is completely submerged. Urgent need of 4,000 liters of water and 2 ambulances.'
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [extraction, setExtraction] = useState<LLMExtractionOutput | null>(null);
  const [trainingLoading, setTrainingLoading] = useState<boolean>(false);
  const [trainingResult, setTrainingResult] = useState<ModelTrainingResponse | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [isSubmittingDispatch, setIsSubmittingDispatch] = useState<boolean>(false);

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
    setIsSubmittingDispatch(true);
    try {
      await submitReviewAction({
        extraction_id: extraction.extraction_id,
        action,
        rationale: action === 'APPROVE' ? 'Verified by Incident Commander' : 'Rejected due to insufficient ground verification',
        reviewer_role: 'Incident Commander',
      });

      if (action === 'APPROVE') {
        const payload = {
          reporter_name: 'Incident Commander',
          reporter_role: 'Operations Chief',
          location_name: extraction.location?.name || 'Field Operational Area',
          raw_text: reportText,
          lat: extraction.location?.latitude ?? undefined,
          lon: extraction.location?.longitude ?? undefined,
        };

        if (onSubmitReport) {
          await onSubmitReport(payload);
        } else {
          await submitFieldReport(payload);
          if (onRefreshState) await onRefreshState();
        }
      } else {
        if (onRefreshState) await onRefreshState();
      }

      setReviewSuccess(
        action === 'APPROVE'
          ? `Report ${extraction.extraction_id} APPROVED and registered in Live Command Dispatches!`
          : `Report ${extraction.extraction_id} REJECTED.`
      );
      setExtraction({ ...extraction, review_status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' });
    } catch (err: any) {
      alert(`Review action failed: ${err.message}`);
    } finally {
      setIsSubmittingDispatch(false);
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
      <div
        className={`border rounded-xl p-6 shadow-xl relative overflow-hidden transition-colors ${
          isDarkMode
            ? 'bg-slate-900 border-slate-800'
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-lg border ${
                isDarkMode
                  ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                  : 'bg-purple-50 text-purple-600 border-purple-200'
              }`}
            >
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h1
                className={`text-2xl font-bold tracking-tight flex items-center gap-2 ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                Field Report Analyzer & NLP Studio
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-mono font-semibold border ${
                    isDarkMode
                      ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                      : 'bg-purple-100 border-purple-200 text-purple-700'
                  }`}
                >
                  HALLUCINATION-CONTROLLED
                </span>
              </h1>
              <p
                className={`text-sm mt-0.5 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Translates unstructured field reports into rule-verified Pydantic events with strict null guards and human review.
              </p>
            </div>
          </div>

          <button
            onClick={handleTrainModel}
            disabled={trainingLoading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-purple-500/25 transition cursor-pointer disabled:opacity-50"
          >
            <Cpu className={`w-4 h-4 ${trainingLoading ? 'animate-spin' : ''}`} />
            {trainingLoading ? 'Training Model...' : 'Retrain Demand ML Model'}
          </button>
        </div>
      </div>

      {/* Main Grid: Input on Left, Output on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Input Form */}
        <div
          className={`border rounded-xl p-6 shadow-xl space-y-4 transition-colors ${
            isDarkMode
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-slate-200 text-slate-800 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <h2
              className={`text-base font-semibold flex items-center gap-2 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4 text-purple-500" />
              Unstructured Field Dispatch
            </h2>
            <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Radio / WhatsApp / SMS Dispatch
            </span>
          </div>

          {/* Sample Pills */}
          <div className="space-y-1.5">
            <div
              className={`text-xs font-medium ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Quick Evaluator Scenarios:
            </div>
            <div className="flex flex-wrap gap-2">
              {sampleReports.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setReportText(s.text)}
                  className={`px-2.5 py-1 rounded text-xs transition cursor-pointer border ${
                    isDarkMode
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
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
            className={`w-full rounded-lg p-3.5 text-sm font-mono focus:outline-none focus:border-purple-500 transition resize-none border ${
              isDarkMode
                ? 'bg-slate-950 border-slate-800 text-slate-200'
                : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
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
        <div
          className={`border rounded-xl p-6 shadow-xl space-y-4 transition-colors ${
            isDarkMode
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-slate-200 text-slate-800 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <h2
              className={`text-base font-semibold flex items-center gap-2 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Extracted & Validated Intelligence
            </h2>
            {extraction && (
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${
                  extraction.confidence >= 0.85
                    ? isDarkMode
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                    : isDarkMode
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-amber-100 text-amber-700 border border-amber-300'
                }`}
              >
                Confidence: {(extraction.confidence * 100).toFixed(0)}%
              </span>
            )}
          </div>

          {extraction ? (
            <div className="space-y-4">
              {/* Event & Location Strip */}
              <div className="grid grid-cols-2 gap-3">
                <div
                  className={`p-3 rounded-lg border ${
                    isDarkMode
                      ? 'bg-slate-800/50 border-slate-700/50'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Incident Classification
                  </div>
                  <div
                    className={`text-sm font-bold mt-1 capitalize flex items-center gap-2 ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {extraction.event_type || 'Unknown'}
                    {extraction.severity && (
                      <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded font-semibold">
                        {extraction.severity}
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className={`p-3 rounded-lg border ${
                    isDarkMode
                      ? 'bg-slate-800/50 border-slate-700/50'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className={`text-xs flex items-center gap-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    <MapPin className="w-3 h-3 text-emerald-500" /> Resolved Location
                  </div>
                  <div
                    className={`text-sm font-bold mt-1 ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {extraction.location?.name || <span className="text-slate-500 font-mono">null (Not in source)</span>}
                  </div>
                  {extraction.location?.latitude && (
                    <div className="text-xs text-emerald-500 font-mono font-semibold">
                      {extraction.location.latitude.toFixed(4)}°N, {extraction.location.longitude?.toFixed(4)}°E
                    </div>
                  )}
                </div>
              </div>

              {/* Casualties & Population */}
              <div
                className={`p-3.5 rounded-lg border grid grid-cols-3 gap-2 text-center ${
                  isDarkMode
                    ? 'bg-slate-800/50 border-slate-700/50'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Affected Citizens
                  </div>
                  <div className="text-lg font-bold text-amber-500 mt-0.5">
                    {extraction.affected_population?.toLocaleString() ?? <span className="text-xs text-slate-400">null</span>}
                  </div>
                </div>
                <div>
                  <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Medical Priority
                  </div>
                  <div className="text-lg font-bold text-red-500 mt-0.5">
                    {extraction.medical_needs?.priority || 'NORMAL'}
                  </div>
                </div>
                <div>
                  <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Road Status
                  </div>
                  <div className="text-lg font-bold text-sky-500 mt-0.5">
                    {extraction.road_conditions?.status || 'OPEN'}
                  </div>
                </div>
              </div>

              {/* Commodities Demanded */}
              <div>
                <div
                  className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Extracted Commodity Requirements
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(extraction.resource_demands || {}).map(([item, val]) => (
                    <div
                      key={item}
                      className={`p-2.5 rounded border text-center ${
                        isDarkMode
                          ? 'bg-slate-950 border-slate-800'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className={`text-xs capitalize ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {item.replace('_', ' ')}
                      </div>
                      <div
                        className={`text-sm font-bold mt-1 font-mono ${
                          isDarkMode ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {val !== null && val !== undefined ? val.toLocaleString() : <span className="text-slate-400 text-xs">null</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hallucination Guard Box */}
              {(extraction.hallucination_warnings || []).length > 0 && (
                <div
                  className={`p-3 border rounded-lg text-xs space-y-1 ${
                    isDarkMode
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-amber-50 border-amber-200'
                  }`}
                >
                  <div
                    className={`font-semibold flex items-center gap-1.5 ${
                      isDarkMode ? 'text-amber-300' : 'text-amber-800'
                    }`}
                  >
                    <AlertOctagon className="w-4 h-4 text-amber-500" /> Hallucination Guard Report:
                  </div>
                  {(extraction.hallucination_warnings || []).map((w, idx) => (
                    <div
                      key={idx}
                      className={`pl-5 ${isDarkMode ? 'text-amber-200/90' : 'text-amber-900'}`}
                    >
                      • {w}
                    </div>
                  ))}
                </div>
              )}

              {/* Human in the Loop Actions */}
              <div
                className={`pt-3 border-t flex items-center justify-between ${
                  isDarkMode ? 'border-slate-800' : 'border-slate-200'
                }`}
              >
                <div
                  className={`text-xs font-mono ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Status:{' '}
                  <span
                    className={`font-bold ${
                      extraction.review_status === 'APPROVED'
                        ? 'text-emerald-500'
                        : extraction.review_status === 'REJECTED'
                        ? 'text-red-500'
                        : isDarkMode
                        ? 'text-white'
                        : 'text-slate-900'
                    }`}
                  >
                    {extraction.review_status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReview('REJECT')}
                    disabled={isSubmittingDispatch}
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/30 rounded text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleReview('APPROVE')}
                    disabled={isSubmittingDispatch}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSubmittingDispatch ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      'Approve & Prepare Dispatch'
                    )}
                  </button>
                </div>
              </div>

              {reviewSuccess && (
                <div
                  className={`p-2.5 border rounded text-xs text-center font-mono ${
                    isDarkMode
                      ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  }`}
                >
                  ✓ {reviewSuccess}
                </div>
              )}
            </div>
          ) : (
            <div
              className={`h-64 flex flex-col items-center justify-center space-y-2 border-2 border-dashed rounded-lg ${
                isDarkMode
                  ? 'border-slate-800 text-slate-500'
                  : 'border-slate-300 text-slate-400'
              }`}
            >
              <FileText className="w-8 h-8" />
              <div className="text-sm font-medium">No report extracted yet</div>
              <div className="text-xs">Enter a report on the left and click Extract</div>
            </div>
          )}
        </div>
      </div>

      {/* Model Training Telemetry Card */}
      {trainingResult && (
        <div
          className={`border rounded-xl p-6 shadow-xl space-y-4 transition-colors ${
            isDarkMode
              ? 'bg-slate-900 border-purple-900/50'
              : 'bg-white border-purple-200 text-slate-800 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-5 h-5 text-purple-500" />
              <h3
                className={`text-base font-bold ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                Model Registry: {trainingResult.model_name}
              </h3>
              <span
                className={`text-xs px-2.5 py-0.5 rounded font-mono font-semibold border ${
                  isDarkMode
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    : 'bg-purple-100 text-purple-700 border-purple-200'
                }`}
              >
                {trainingResult.model_version}
              </span>
            </div>
            <span className="text-xs text-emerald-500 font-mono font-semibold">
              ● DEPLOYED TO SOLVER PIPELINE
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
              className={`p-3 rounded-lg border text-center ${
                isDarkMode
                  ? 'bg-slate-950 border-slate-800'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                R² Validation Score
              </div>
              <div className="text-xl font-bold text-emerald-500 mt-1 font-mono">
                {trainingResult.r2_score}
              </div>
            </div>
            <div
              className={`p-3 rounded-lg border text-center ${
                isDarkMode
                  ? 'bg-slate-950 border-slate-800'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Mean Absolute Error (MAE)
              </div>
              <div className="text-xl font-bold text-sky-500 mt-1 font-mono">
                {trainingResult.mae}
              </div>
            </div>
            <div
              className={`p-3 rounded-lg border text-center ${
                isDarkMode
                  ? 'bg-slate-950 border-slate-800'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Training Records Used
              </div>
              <div
                className={`text-xl font-bold mt-1 font-mono ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                {trainingResult.records_used.toLocaleString()}
              </div>
            </div>
            <div
              className={`p-3 rounded-lg border text-center ${
                isDarkMode
                  ? 'bg-slate-950 border-slate-800'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Train / Test Split
              </div>
              <div className="text-xl font-bold text-amber-500 mt-1 font-mono">
                {trainingResult.train_split} / {trainingResult.test_split}
              </div>
            </div>
          </div>

          <div>
            <div
              className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Feature Importances
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(trainingResult.feature_importances).map(([feat, imp]) => (
                <div
                  key={feat}
                  className={`p-2 rounded border flex items-center justify-between text-xs ${
                    isDarkMode
                      ? 'bg-slate-950 border-slate-800'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>
                    {feat}
                  </span>
                  <span className="font-mono text-purple-500 font-bold">
                    {(imp * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

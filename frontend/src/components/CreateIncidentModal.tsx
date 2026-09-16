import React, { useState } from 'react';
import {
  X,
  Zap,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Activity,
  ArrowRight,
  TrendingUp,
  Truck,
  Users,
  Check,
  RotateCcw
} from 'lucide-react';
import { IncidentCreateRequest, IncidentPipelineResult } from '../types';
import { createIncidentAndRun, actOnAllocation } from '../services/api';

interface CreateIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isDarkMode: boolean;
}

export const CreateIncidentModal: React.FC<CreateIncidentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isDarkMode
}) => {
  const [formData, setFormData] = useState<IncidentCreateRequest>({
    disaster_type: 'Flood',
    location: 'North Embankment Ward 9',
    affected_population: 14500,
    casualties: 4,
    missing_people: 12,
    injured_people: 68,
    infrastructure_damage: 'Severe',
    medical_needs: 180,
    water_needs: 12000,
    food_needs: 4500,
    shelter_needs: 600,
    urgency: 'Critical',
    raw_text: 'Embankment overflowed at 03:00. Primary transit bridge impassable. Drinking water pipeline fractured. Local PHC flooded, 68 patients require trauma stabilization and IV rehydration. 14,500 residents cut off.',
    source: 'District Disaster Management Radio'
  });

  const [isRunning, setIsRunning] = useState(false);
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [result, setResult] = useState<IncidentPipelineResult | null>(null);
  const [actionDone, setActionDone] = useState<string | null>(null);

  if (!isOpen) return null;

  const pipelineStages = [
    'Data Ingestion & Format Validation',
    'AI Multi-Modal Entity Extraction',
    'Multi-Source Verification Engine',
    'Canonical Schema & Geolocation',
    'Disaster Impact Assessment',
    'Demand Forecasting (Sphere Standards)',
    'Explainable Urgency Priority Scoring',
    'Google OR-Tools MIP Constraint Optimization',
    'Generating Explainable Recommendation & Dispatches'
  ];

  const presets = [
    {
      name: 'Monsoon Embankment Breach',
      data: {
        disaster_type: 'Flood',
        location: 'Riverfront Sluice Ward 11',
        affected_population: 18500,
        casualties: 6,
        missing_people: 15,
        injured_people: 95,
        infrastructure_damage: 'Critical',
        medical_needs: 250,
        water_needs: 22000,
        food_needs: 8000,
        shelter_needs: 1200,
        urgency: 'Critical',
        raw_text: 'Sluice gate 4 gave way under pressure. Water surging through eastern agricultural belt into Ward 11. Over 18,500 people submerged. Clean water completely cut off.',
        source: 'Emergency Dispatch Radio #CH-04'
      }
    },
    {
      name: '6.8M Urban Earthquake',
      data: {
        disaster_type: 'Earthquake',
        location: 'Downtown Commercial Sector',
        affected_population: 26000,
        casualties: 42,
        missing_people: 85,
        injured_people: 310,
        infrastructure_damage: 'Critical',
        medical_needs: 500,
        water_needs: 15000,
        food_needs: 6000,
        shelter_needs: 2500,
        urgency: 'Critical',
        raw_text: 'Shallow 6.8 magnitude tremor caused collapse of two 5-story residential complexes. Major gas main fires. Massive trauma injuries reported.',
        source: 'Central Police Command Field Report'
      }
    },
    {
      name: 'Coastal Super Cyclone',
      data: {
        disaster_type: 'Cyclone',
        location: 'Estuary Fishing Settlement',
        affected_population: 32000,
        casualties: 8,
        missing_people: 22,
        injured_people: 140,
        infrastructure_damage: 'Severe',
        medical_needs: 220,
        water_needs: 28000,
        food_needs: 14000,
        shelter_needs: 4000,
        urgency: 'High',
        raw_text: '145 km/h winds ripped away zinc roofing across 80% of dwellings. Sea water surge contaminated sweetwater ponds. Immediate tarpaulins and dry food required.',
        source: 'Coast Guard Radar Station'
      }
    }
  ];

  const handleRunPipeline = async () => {
    setIsRunning(true);
    setResult(null);
    setActionDone(null);

    // Simulate stepping through stages for interactive operational visualization
    for (let i = 0; i < pipelineStages.length; i++) {
      setCurrentStage(i);
      await new Promise((r) => setTimeout(r, 160));
    }

    try {
      const res = await createIncidentAndRun(formData);
      setResult(res);
      onSuccess();
    } catch (err: any) {
      alert(`Error running pipeline: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleApproveAll = async () => {
    if (!result) return;
    for (const alloc of result.recommended_allocations) {
      await actOnAllocation(alloc.id, 'APPROVE', 'Chief Dispatcher', 'Approved via Incident Creation Pipeline');
    }
    setActionDone('All recommended dispatches approved & placed in operational dispatch queue!');
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div
        className={`w-full max-w-4xl rounded-2xl shadow-2xl border transition-all my-8 ${
          isDarkMode
            ? 'bg-slate-900 border-slate-700 text-slate-100'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`p-6 border-b flex items-center justify-between ${
            isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/50 flex items-center justify-center text-sky-400 font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold">CREATE INCIDENT &rarr; RUN RESQGRID</h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 font-bold">
                  AUTONOMOUS PIPELINE
                </span>
              </div>
              <p className="text-xs opacity-75">
                Ingest disaster signals, verify data consistency, evaluate impact, forecast demands, and compute optimal allocations.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800/40 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {!result && (
            <>
              {/* Presets Row */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider opacity-75">
                  Quick Tactical Scenarios
                </label>
                <div className="flex flex-wrap gap-2">
                  {presets.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, ...p.data })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                        isDarkMode
                          ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200'
                          : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Disaster Classification</label>
                  <select
                    value={formData.disaster_type}
                    onChange={(e) => setFormData({ ...formData, disaster_type: e.target.value })}
                    className={`w-full p-2.5 rounded-lg text-xs border ${
                      isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <option value="Flood">Flood (Flash / Riverine)</option>
                    <option value="Earthquake">Earthquake (Structural Damage)</option>
                    <option value="Cyclone">Cyclone (Storm Surge & Wind)</option>
                    <option value="Landslide">Landslide (Route Blockage)</option>
                    <option value="Industrial">Industrial Hazmat / Chemical</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Location / Municipal Sector</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className={`w-full p-2.5 rounded-lg text-xs border ${
                      isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Affected Population</label>
                  <input
                    type="number"
                    value={formData.affected_population}
                    onChange={(e) =>
                      setFormData({ ...formData, affected_population: parseInt(e.target.value) || 0 })
                    }
                    className={`w-full p-2.5 rounded-lg text-xs border ${
                      isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Casualties (Deceased)</label>
                  <input
                    type="number"
                    value={formData.casualties}
                    onChange={(e) => setFormData({ ...formData, casualties: parseInt(e.target.value) || 0 })}
                    className={`w-full p-2.5 rounded-lg text-xs border ${
                      isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Missing Persons</label>
                  <input
                    type="number"
                    value={formData.missing_people}
                    onChange={(e) =>
                      setFormData({ ...formData, missing_people: parseInt(e.target.value) || 0 })
                    }
                    className={`w-full p-2.5 rounded-lg text-xs border ${
                      isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Injured / Acute Patients</label>
                  <input
                    type="number"
                    value={formData.injured_people}
                    onChange={(e) =>
                      setFormData({ ...formData, injured_people: parseInt(e.target.value) || 0 })
                    }
                    className={`w-full p-2.5 rounded-lg text-xs border ${
                      isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
              </div>

              {/* Raw Dispatch Text */}
              <div className="space-y-1">
                <label className="text-xs font-medium">
                  Semi-Structured Field Note / Radio Transcript / Ingestion Feed
                </label>
                <textarea
                  rows={3}
                  value={formData.raw_text}
                  onChange={(e) => setFormData({ ...formData, raw_text: e.target.value })}
                  className={`w-full p-3 rounded-lg text-xs border font-mono ${
                    isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              {/* Progress Runner */}
              {isRunning && (
                <div
                  className={`p-4 rounded-xl border space-y-3 ${
                    isDarkMode ? 'bg-slate-950 border-sky-500/30' : 'bg-sky-50 border-sky-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-sky-400 uppercase tracking-wider flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                      <span>Stage {currentStage + 1} of {pipelineStages.length}:</span>
                    </span>
                    <span className="font-mono text-sky-400">
                      {pipelineStages[currentStage]}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-sky-400 h-1.5 transition-all duration-200"
                      style={{ width: `${((currentStage + 1) / pipelineStages.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Results Screen */}
          {result && (
            <div className="space-y-6">
              <div
                className={`p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-slate-950 via-sky-950/40 to-slate-950 border-sky-500/40'
                    : 'bg-gradient-to-r from-sky-50 to-blue-50 border-sky-300'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-400">
                      {result.incident_number}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        result.verification.status === 'VERIFIED'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {result.verification.status} ({Math.round(result.verification.confidence * 100)}% CONFIDENCE)
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                      PRIORITY {result.priority_score} / 100
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mt-1">
                    {result.location} &mdash; {result.disaster_type} Incident
                  </h3>
                  <p className="text-xs opacity-75">
                    Impact Level: <strong>{result.impact.impact_level}</strong> (Score: {result.impact.impact_score}/100) &bull; Affected: <strong>{result.affected_population.toLocaleString()}</strong> citizens.
                  </p>
                </div>

                <div className="shrink-0 flex items-center space-x-2">
                  <button
                    onClick={handleApproveAll}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20 transition cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve All ({result.recommended_allocations.length})</span>
                  </button>
                </div>
              </div>

              {actionDone && (
                <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{actionDone}</span>
                </div>
              )}

              {/* Explainable Recommendation Breakdown */}
              <div
                className={`p-5 rounded-xl border space-y-3 ${
                  isDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center space-x-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
                  <Activity className="w-4 h-4" />
                  <span>Explainable Recommendation & Mathematical Rationale</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/80 space-y-1">
                    <span className="font-semibold text-sky-400">WHY THIS RESOURCE?</span>
                    <p className="opacity-90">{result.recommendation_explanation.why_resource}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/80 space-y-1">
                    <span className="font-semibold text-sky-400">WHY THIS LOCATION?</span>
                    <p className="opacity-90">{result.recommendation_explanation.why_location}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/80 space-y-1">
                    <span className="font-semibold text-sky-400">WHY THIS QUANTITY?</span>
                    <p className="opacity-90">{result.recommendation_explanation.why_quantity}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/80 space-y-1">
                    <span className="font-semibold text-sky-400">WHY THIS TEAM?</span>
                    <p className="opacity-90">{result.recommendation_explanation.why_team}</p>
                  </div>
                </div>

                {/* Justification Reasons */}
                <div className="pt-2 border-t border-slate-800/60 space-y-1">
                  <span className="text-[11px] font-mono uppercase opacity-75">Priority Justification Factors:</span>
                  <ul className="list-disc list-inside text-xs opacity-90 space-y-0.5">
                    {result.priority_reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Allocations & Dispatches List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="uppercase tracking-wider">
                    Recommended Allocations & Transit Schedules ({result.recommended_allocations.length})
                  </span>
                  <span className="font-mono opacity-75">OR-Tools Hard-Constraint Satisfied</span>
                </div>

                <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 overflow-hidden">
                  {result.recommended_allocations.map((alloc) => (
                    <div
                      key={alloc.id}
                      className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                        isDarkMode ? 'bg-slate-900/80' : 'bg-white'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sky-400 font-bold">{alloc.id}</span>
                          <span className="font-semibold">
                            {alloc.quantity.toLocaleString()} {alloc.resource_type.replace('_', ' ')}
                          </span>
                          <span className="opacity-50">&rarr;</span>
                          <span>{alloc.destination_zone_name}</span>
                        </div>
                        <div className="text-[11px] opacity-75 flex items-center space-x-3">
                          <span>Depot: {alloc.source_warehouse_name}</span>
                          <span>&bull;</span>
                          <span>Vehicle: {alloc.vehicle_type}</span>
                          <span>&bull;</span>
                          <span>ETA: {alloc.estimated_time_min} min ({alloc.distance_km} km)</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="px-2.5 py-1 rounded bg-sky-500/20 text-sky-400 font-mono text-[10px] font-bold">
                          STATUS: {alloc.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className={`p-4 border-t flex items-center justify-between ${
            isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium hover:bg-slate-800/20 transition cursor-pointer"
          >
            {result ? 'Close Dialog' : 'Cancel'}
          </button>

          {!result ? (
            <button
              onClick={handleRunPipeline}
              disabled={isRunning}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-lg shadow-sky-500/20 transition cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>{isRunning ? 'RUNNING RESQGRID...' : 'RUN RESQGRID'}</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setResult(null);
                setCurrentStage(0);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-medium transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Enter Another Incident</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

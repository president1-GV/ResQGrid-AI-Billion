import React, { useState } from 'react';
import { FileText, Send, CheckCircle2, AlertTriangle, UserCheck, ShieldCheck, Sparkles } from 'lucide-react';
import { FieldReport } from '../types';

interface FieldReportsViewProps {
  reports: FieldReport[];
  onSubmitReport: (data: {
    reporter_name: string;
    reporter_role: string;
    location_name: string;
    raw_text: string;
  }) => Promise<void>;
  isDarkMode?: boolean;
}

export const FieldReportsView: React.FC<FieldReportsViewProps> = ({ reports, onSubmitReport, isDarkMode = true }) => {
  const [name, setName] = useState('Captain R. Barua');
  const [role, setRole] = useState('NDRF Field Commander');
  const [location, setLocation] = useState('Riverbank Colony');
  const [text, setText] = useState(
    'Embankment breach widened by 15 meters. Approximately 250 stranded villagers gathered at high school rooftop. Local clinic completely inundated. Urgent need for 800 liters drinking water, 40 medical kits, and 2 evacuation boats or ambulances.'
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setSubmitting(true);
    try {
      await onSubmitReport({
        reporter_name: name,
        reporter_role: role,
        location_name: location,
        raw_text: text,
      });
      setText('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div>
          <div className="flex items-center space-x-2">
            <span className={`text-xs font-mono font-bold uppercase ${isDarkMode ? 'text-cyan-400' : 'text-cyan-800'}`}>
              Unstructured Telemetry Ingestion
            </span>
            <span className={`text-xs px-2.5 py-0.5 rounded font-bold border ${
              isDarkMode
                ? 'bg-cyan-950 border-cyan-500/40 text-cyan-300'
                : 'bg-cyan-100 border-cyan-300 text-cyan-900'
            }`}>
              NLP ENTITY & DEMAND SIGNAL PIPELINE
            </span>
          </div>
          <h1 className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Responder Field Reports & NLP Extraction
          </h1>
          <p className={`text-xs max-w-2xl mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
            Converts free-text field dispatches, radio transcripts, and crowdsourced emergency notes into structured numerical demand constraints with transparent confidence tiers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Submission Form */}
        <div className={`p-5 rounded-xl border space-y-4 shadow-sm ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className={`flex items-center space-x-2 border-b pb-3 ${
            isDarkMode ? 'text-white border-slate-800' : 'text-slate-900 border-slate-200'
          }`}>
            <Sparkles className="w-4 h-4 text-sky-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Submit Tactical Field Report</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className={`block mb-1 font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-800'}`}>
                Reporter Name & Call-sign:
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full rounded-lg p-2 border focus:outline-none focus:border-sky-500 transition ${
                  isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-sm'
                }`}
                required
              />
            </div>

            <div>
              <label className={`block mb-1 font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-800'}`}>
                Responder Agency / Role:
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={`w-full rounded-lg p-2 border focus:outline-none focus:border-sky-500 transition ${
                  isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-sm'
                }`}
                required
              />
            </div>

            <div>
              <label className={`block mb-1 font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-800'}`}>
                Target Sector / Location:
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={`w-full rounded-lg p-2 border focus:outline-none focus:border-sky-500 transition ${
                  isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-sm'
                }`}
                required
              />
            </div>

            <div>
              <label className={`block mb-1 font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-800'}`}>
                Raw Dispatch Text (NLP Parser will extract figures):
              </label>
              <textarea
                rows={5}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Describe stranded population, casualties, medical or food requirements..."
                className={`w-full rounded-lg p-2.5 text-xs border focus:outline-none focus:border-sky-500 transition ${
                  isDarkMode ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-900 shadow-sm'
                }`}
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-lg shadow-sky-500/20 transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'EXTRACTING SIGNALS...' : 'SUBMIT & EXTRACT DEMAND'}</span>
            </button>
          </form>
        </div>

        {/* Right 2 Cols: Extracted Reports Stream */}
        <div className="lg:col-span-2 space-y-4">
          <div className={`p-5 rounded-xl border space-y-4 shadow-sm ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h3 className={`text-sm font-bold uppercase tracking-wider border-b pb-3 ${
              isDarkMode ? 'text-white border-slate-800' : 'text-slate-900 border-slate-200'
            }`}>
              Verified Ingested Field Intelligence ({reports.length})
            </h3>

            <div className="space-y-4">
              {reports.map((rep) => (
                <div key={rep.id} className={`p-4 rounded-xl border space-y-3 ${
                  isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'
                }`}>
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2 ${
                    isDarkMode ? 'border-slate-800/80' : 'border-slate-200'
                  }`}>
                    <div>
                      <span className={`font-bold text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{rep.location_name}</span>
                      <span className={`text-xs ml-2 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>by {rep.reporter_name} ({rep.reporter_role})</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          rep.urgency === 'Critical'
                            ? isDarkMode
                              ? 'bg-red-950 text-red-400 border-red-500/40'
                              : 'bg-red-100 text-red-800 border-red-300'
                            : isDarkMode
                              ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}
                      >
                        {rep.urgency} Urgency
                      </span>
                      <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                        isDarkMode
                          ? 'bg-sky-950 text-sky-300 border-sky-500/30'
                          : 'bg-sky-100 text-sky-800 border-sky-300'
                      }`}>
                        {rep.data_confidence_tier}
                      </span>
                    </div>
                  </div>

                  <p className={`text-xs italic p-2.5 rounded border ${
                    isDarkMode ? 'bg-slate-900/60 border-slate-800/60 text-slate-300' : 'bg-white border-slate-200 text-slate-800 font-medium'
                  }`}>
                    "{rep.raw_text}"
                  </p>

                  {/* NLP Extracted Entities */}
                  <div className="pt-1">
                    <span className={`text-[10px] font-mono uppercase font-bold block mb-1.5 ${
                      isDarkMode ? 'text-sky-400' : 'text-sky-800'
                    }`}>
                      NLP Automated Entity Extraction & Demand Signals:
                    </span>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {rep.extracted_population && (
                        <span className={`px-2.5 py-1 rounded border font-semibold ${
                          isDarkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-800 border-slate-300'
                        }`}>
                          Population: <strong className={isDarkMode ? 'text-white' : 'text-slate-950 font-bold'}>{rep.extracted_population} persons</strong>
                        </span>
                      )}
                      {Object.entries(rep.extracted_needs).map(([k, v]) => (
                        <span key={k} className={`px-2.5 py-1 rounded border font-semibold ${
                          isDarkMode ? 'bg-sky-950/60 text-sky-200 border-sky-500/30' : 'bg-sky-100 text-sky-900 border-sky-300'
                        }`}>
                          {k.replace('_', ' ')}: <strong className={isDarkMode ? 'text-white' : 'text-sky-950 font-bold'}>{v.toLocaleString()}</strong>
                        </span>
                      ))}
                      <span className={`px-2.5 py-1 rounded border font-semibold ${
                        isDarkMode ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        Confidence: {Math.round(rep.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

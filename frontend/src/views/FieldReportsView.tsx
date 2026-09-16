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
}

export const FieldReportsView: React.FC<FieldReportsViewProps> = ({ reports, onSubmitReport }) => {
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
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-cyan-400 font-bold uppercase">Unstructured Telemetry Ingestion</span>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-semibold">
              NLP ENTITY & DEMAND SIGNAL PIPELINE
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">
            Responder Field Reports & NLP Extraction
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
            Converts free-text field dispatches, radio transcripts, and crowdsourced emergency notes into structured numerical demand constraints with transparent confidence tiers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Submission Form */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 text-white border-b border-slate-800 pb-3">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Submit Tactical Field Report</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Reporter Name & Call-sign:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-sky-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Responder Agency / Role:</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-sky-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Target Sector / Location:</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-sky-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Raw Dispatch Text (NLP Parser will extract figures):
              </label>
              <textarea
                rows={5}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Describe stranded population, casualties, medical or food requirements..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-lg shadow-sky-500/20 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'EXTRACTING SIGNALS...' : 'SUBMIT & EXTRACT DEMAND'}</span>
            </button>
          </form>
        </div>

        {/* Right 2 Cols: Extracted Reports Stream */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
              Verified Ingested Field Intelligence ({reports.length})
            </h3>

            <div className="space-y-4">
              {reports.map((rep) => (
                <div key={rep.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                    <div>
                      <span className="font-bold text-sm text-slate-200">{rep.location_name}</span>
                      <span className="text-xs text-slate-400 ml-2">by {rep.reporter_name} ({rep.reporter_role})</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          rep.urgency === 'Critical'
                            ? 'bg-red-950 text-red-400 border border-red-500/40'
                            : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {rep.urgency} Urgency
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-500/30">
                        {rep.data_confidence_tier}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 italic bg-slate-900/60 p-2.5 rounded border border-slate-800/60">
                    "{rep.raw_text}"
                  </p>

                  {/* NLP Extracted Entities */}
                  <div className="pt-1">
                    <span className="text-[10px] font-mono uppercase text-sky-400 block mb-1.5">
                      NLP Automated Entity Extraction & Demand Signals:
                    </span>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {rep.extracted_population && (
                        <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 border border-slate-700">
                          Population: <strong className="text-white">{rep.extracted_population} persons</strong>
                        </span>
                      )}
                      {Object.entries(rep.extracted_needs).map(([k, v]) => (
                        <span key={k} className="px-2.5 py-1 rounded bg-sky-950/60 text-sky-200 border border-sky-500/30">
                          {k.replace('_', ' ')}: <strong className="text-white">{v.toLocaleString()}</strong>
                        </span>
                      ))}
                      <span className="px-2.5 py-1 rounded bg-slate-900 text-slate-400 border border-slate-800">
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

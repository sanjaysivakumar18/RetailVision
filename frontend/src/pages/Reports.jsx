import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  History, 
  GitCompare, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Film, 
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';

export default function Reports({ session, sessions, shelves, customers, events, onSelectSession }) {
  const [compareSession1, setCompareSession1] = useState(session?.id || (sessions[0]?.id || ''));
  const [compareSession2, setCompareSession2] = useState(sessions[1]?.id || (sessions[0]?.id || ''));
  const [comparisonResult, setComparisonResult] = useState(null);
  const [isComparing, setIsComparing] = useState(false);

  const handleRunComparison = async () => {
    if (!compareSession1 || !compareSession2) return;
    setIsComparing(true);
    try {
      const data = await api.compareSessions(compareSession1, compareSession2);
      setComparisonResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsComparing(false);
    }
  };

  const summary = session?.summary || {};

  return (
    <div className="space-y-7">
      {/* Export Action Card */}
      <div className="bg-[#0D1527]/85 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-7 shadow-card-glow text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2.5 tracking-tight">
              <FileText className="w-5 h-5 text-blue-400" />
              <span>Session Intelligence Exports</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Generate executive PDF summaries and quantitative CSV telemetry logs for Session {session?.id || 'N/A'}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {session && (
              <>
                <a
                  href={api.getPdfReportUrl(session.id)}
                  download={`RetailVision_Report_${session.id}.pdf`}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-neon-blue transition-all hover:scale-[1.02]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Executive PDF Report</span>
                </a>
                <a
                  href={api.getCsvReportUrl(session.id)}
                  download={`RetailVision_Events_${session.id}.csv`}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#070C18] hover:bg-blue-600/20 text-slate-200 border border-blue-500/30 transition-all hover:scale-[1.02]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV Analytics</span>
                </a>
              </>
            )}
          </div>
        </div>

        {/* Executive Summary Metrics Card */}
        {session && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-[#070C18]/80 border border-blue-500/20">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Source Video</span>
              <p className="text-xs font-extrabold text-white mt-1 truncate">{session.filename}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Shoppers</span>
              <p className="text-base font-black text-cyan-400 mt-0.5">{summary.total_customers ?? customers.length}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Shelf Interactions</span>
              <p className="text-base font-black text-emerald-400 mt-0.5">{summary.total_interactions ?? 0}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Completed At</span>
              <p className="text-xs font-mono font-bold text-slate-300 mt-1">{session.completed_at || 'In progress'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Session Comparison Tool */}
      <div className="bg-[#0D1527]/85 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-7 shadow-card-glow text-white">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-neon-blue">
            <GitCompare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white tracking-tight">Session Side-by-Side Comparison</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Benchmark customer traffic, dwell patterns, and interaction volume between two footage captures.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <select
            value={compareSession1}
            onChange={(e) => setCompareSession1(e.target.value)}
            className="bg-[#070C18] border border-blue-500/30 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {sessions.map(s => (
              <option key={s.id} value={s.id} className="bg-[#0D1527] text-white">
                Session 1: {s.filename} ({s.id.slice(-6)})
              </option>
            ))}
          </select>

          <span className="text-xs text-slate-400 font-extrabold">vs</span>

          <select
            value={compareSession2}
            onChange={(e) => setCompareSession2(e.target.value)}
            className="bg-[#070C18] border border-blue-500/30 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {sessions.map(s => (
              <option key={s.id} value={s.id} className="bg-[#0D1527] text-white">
                Session 2: {s.filename} ({s.id.slice(-6)})
              </option>
            ))}
          </select>

          <button
            onClick={handleRunComparison}
            disabled={isComparing || !compareSession1 || !compareSession2}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-neon-blue transition-all cursor-pointer hover:scale-[1.02] disabled:opacity-50"
          >
            {isComparing ? 'Comparing...' : 'Run Comparative Analysis'}
          </button>
        </div>

        {/* Comparison Result Table */}
        {comparisonResult && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
            {/* Session 1 Column */}
            <div className="p-5 rounded-2xl bg-[#070C18]/80 border border-blue-500/20">
              <h4 className="text-sm font-extrabold text-blue-400 mb-3 truncate">
                {comparisonResult.session1.filename} ({comparisonResult.session1.id.slice(-6)})
              </h4>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-blue-900/30">
                  <span className="text-slate-400 font-medium">Total Shoppers</span>
                  <span className="font-extrabold text-white">{comparisonResult.session1.summary.total_customers ?? 0}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-blue-900/30">
                  <span className="text-slate-400 font-medium">Shelf Interactions</span>
                  <span className="font-extrabold text-white">{comparisonResult.session1.summary.total_interactions ?? 0}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-blue-900/30">
                  <span className="text-slate-400 font-medium">Avg Shelf Dwell</span>
                  <span className="font-extrabold text-cyan-400">{comparisonResult.session1.summary.avg_shelf_dwell_time ?? 0}s</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-blue-900/30">
                  <span className="text-slate-400 font-medium">Top Visited Shelf</span>
                  <span className="font-extrabold text-emerald-400">{comparisonResult.session1.summary.most_visited_shelf || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Session 2 Column */}
            <div className="p-5 rounded-2xl bg-[#070C18]/80 border border-blue-500/20">
              <h4 className="text-sm font-extrabold text-cyan-400 mb-3 truncate">
                {comparisonResult.session2.filename} ({comparisonResult.session2.id.slice(-6)})
              </h4>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-blue-900/30">
                  <span className="text-slate-400 font-medium">Total Shoppers</span>
                  <span className="font-extrabold text-white">{comparisonResult.session2.summary.total_customers ?? 0}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-blue-900/30">
                  <span className="text-slate-400 font-medium">Shelf Interactions</span>
                  <span className="font-extrabold text-white">{comparisonResult.session2.summary.total_interactions ?? 0}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-blue-900/30">
                  <span className="text-slate-400 font-medium">Avg Shelf Dwell</span>
                  <span className="font-extrabold text-cyan-400">{comparisonResult.session2.summary.avg_shelf_dwell_time ?? 0}s</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-blue-900/30">
                  <span className="text-slate-400 font-medium">Top Visited Shelf</span>
                  <span className="font-extrabold text-emerald-400">{comparisonResult.session2.summary.most_visited_shelf || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Historical Sessions Registry */}
      <div className="bg-[#0D1527]/85 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-7 shadow-card-glow text-white">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-blue-400" />
          <h3 className="text-base font-extrabold text-white tracking-tight">Historical Video Analysis Sessions</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070C18]/80 text-slate-400 uppercase tracking-wider border-b border-blue-500/20">
              <tr>
                <th className="py-3.5 px-4 font-bold">Session ID</th>
                <th className="py-3.5 px-4 font-bold">Video Filename</th>
                <th className="py-3.5 px-4 font-bold">Created Timestamp</th>
                <th className="py-3.5 px-4 text-center font-bold">Duration</th>
                <th className="py-3.5 px-4 text-center font-bold">Status</th>
                <th className="py-3.5 px-4 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-900/30 text-slate-300">
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-blue-600/10 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-400">
                    {s.id}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-white">
                    {s.filename}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-medium">
                    {s.created_at}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-cyan-300">
                    {s.duration_seconds?.toFixed(1) || '—'}s
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold font-mono ${
                      s.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : s.status === 'processing'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onSelectSession(s.id)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 transition-colors cursor-pointer"
                    >
                      Load Session
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

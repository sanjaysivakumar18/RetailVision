import React from 'react';
import { Upload, RefreshCw, Film, ChevronDown } from 'lucide-react';

export default function Header({ 
  activeSection, 
  sessions, 
  currentSessionId, 
  onSelectSession, 
  onNewUpload,
  isRefreshing,
  onRefresh
}) {
  const titles = {
    'overview': 'Executive Overview',
    'video-analysis': 'CCTV Video Analysis & Playback',
    'traffic-shelves': 'Traffic Density & Shelf Analytics',
    'customer-intelligence': 'Customer Intelligence & Evidence',
    'recommendations': 'AI Merchandising & Store Recommendations',
    'reports': 'Intelligence Reports & Session History'
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);

  return (
    <header className="h-20 bg-[#070C18]/85 backdrop-blur-xl border-b border-blue-900/20 px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
      <div>
        <h1 className="text-xl font-extrabold text-white tracking-tight">
          {titles[activeSection] || 'Executive Overview'}
        </h1>
        <p className="text-xs text-slate-400 font-medium">
          Real-time AI insights for smarter retail decisions
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Session Selector Pill (Direct match to reference image) */}
        {sessions.length > 0 && (
          <div className="flex items-center gap-2 bg-[#0D1527] px-3.5 py-2 rounded-2xl border border-blue-500/20 text-xs shadow-card-glow text-slate-300">
            <Film className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">SESSION:</span>
            <select
              value={currentSessionId || ''}
              onChange={(e) => onSelectSession(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer max-w-[210px] truncate"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#0B1120] text-white">
                  {s.filename} ({s.id.slice(-6)})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>
        )}

        {/* Refresh Status Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh Telemetry"
          className="p-2.5 rounded-2xl bg-[#0D1527] text-slate-400 hover:text-white border border-blue-500/20 hover:border-blue-500/40 transition-all cursor-pointer shadow-card-glow"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
        </button>

        {/* Upload CCTV Video Button (Vibrant Electric Blue Pill from Reference) */}
        <button
          onClick={onNewUpload}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-neon-blue transition-all hover:scale-[1.02] cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>Upload CCTV Video</span>
        </button>
      </div>
    </header>
  );
}

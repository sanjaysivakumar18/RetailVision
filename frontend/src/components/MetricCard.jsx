import React from 'react';

export default function MetricCard({ title, value, subtitle, icon: Icon, color = 'blue', trend = null }) {
  const colorMap = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  };

  return (
    <div className="bg-[#0D1527]/85 backdrop-blur-xl border border-blue-500/20 hover:border-blue-500/40 rounded-2xl p-5 shadow-card-glow hover:shadow-neon-blue transition-all duration-300 flex flex-col justify-between group">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{title}</span>
        {trend ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shadow-sm">
            ▲ {trend}
          </span>
        ) : Icon && (
          <div className={`p-2 rounded-xl border ${colorMap[color] || colorMap.blue} transition-transform duration-300 group-hover:scale-110`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-black text-white tracking-tight">{value ?? '—'}</span>
      </div>

      {subtitle && (
        <p className="mt-1.5 text-xs text-slate-400 font-medium flex items-center gap-1">
          {subtitle}
        </p>
      )}
    </div>
  );
}

import React from 'react';
import { 
  Eye, 
  Video, 
  Grid3X3, 
  Users, 
  FileText, 
  Layers, 
  ChevronRight,
  Camera,
  Zap,
  LayoutGrid,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ activeSection, onSelectSection, currentSession }) {
  const totalShoppers = currentSession?.summary?.total_customers || 0;
  const totalInteractions = currentSession?.summary?.total_interactions || 0;
  const totalShelves = currentSession?.summary?.total_shelves || 0;

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid, badge: null },
    { id: 'video-analysis', label: 'Video Analysis', icon: Video, badge: currentSession?.status === 'processing' ? 'Active' : null },
    { id: 'traffic-shelves', label: 'Traffic & Shelves', icon: Grid3X3, badge: totalShelves > 0 ? `${totalShelves} Shelves` : null },
    { id: 'customer-intelligence', label: 'Customer Intelligence', icon: Users, badge: totalShoppers > 0 ? `${totalShoppers} Cust` : null },
    { id: 'recommendations', label: 'AI Recommendations', icon: Sparkles, badge: 'AI Action' },
    { id: 'reports', label: 'Reports & History', icon: FileText, badge: null },
  ];

  return (
    <aside className="w-72 bg-[#080E1D] border-r border-blue-900/30 text-slate-100 flex flex-col shrink-0 h-screen select-none relative overflow-hidden z-30">
      {/* Background Ambient Glow & Wave Graphic */}
      <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <svg className="absolute bottom-12 left-0 w-full opacity-20 pointer-events-none" viewBox="0 0 288 120" fill="none">
        <path d="M0 60C50 20 100 90 150 40C200 -10 250 80 288 50V120H0V60Z" fill="url(#wave-grad)" />
        <defs>
          <linearGradient id="wave-grad" x1="0" y1="0" x2="288" y2="120" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2563EB" />
            <stop offset="1" stopColor="#06B6D4" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 gap-3.5 border-b border-blue-950/60">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600/30 to-cyan-500/20 border border-blue-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.35)]">
          <Eye className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <span className="font-extrabold text-lg text-white tracking-tight flex items-center gap-1.5">
            RetailVision <span className="text-xs px-1.5 py-0.5 rounded-md bg-blue-600/30 text-blue-400 font-black border border-blue-500/40">AI</span>
          </span>
          <p className="text-[11px] text-slate-400 font-medium">Store Intelligence Platform</p>
        </div>
      </div>

      {/* Store View Status Widget (Top of Sidebar) */}
      <div className="p-5 pb-2">
        <div className="bg-[#101B33]/90 border border-blue-500/20 rounded-2xl p-4 shadow-card-glow backdrop-blur-md">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Retail Store View</p>
                <h4 className="text-xs font-bold text-white">Main Floor CCTV</h4>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-[#0A1224] border border-blue-900/30 rounded-xl py-2 px-1">
              <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Shoppers</span>
              <span className="text-sm font-black text-white">{totalShoppers}</span>
            </div>
            <div className="bg-[#0A1224] border border-blue-900/30 rounded-xl py-2 px-1">
              <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Interactions</span>
              <span className="text-sm font-black text-cyan-400">{totalInteractions}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Section */}
      <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-neon-blue font-extrabold scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-[#101B33]/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-[#0D172E] text-slate-400 border border-blue-900/40'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Active Capture Card (Bottom of Sidebar) */}
      <div className="p-4 m-4 rounded-2xl bg-[#0D172E]/90 border border-blue-500/30 backdrop-blur-md shadow-card-glow relative z-10">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
            <Camera className="w-3.5 h-3.5" />
            <span>Active Capture</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" />
        </div>
        <p className="text-xs font-bold text-white truncate" title={currentSession?.filename || 'No video loaded'}>
          {currentSession?.filename || 'No video active'}
        </p>
        <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
          {currentSession?.id || 'Ready for upload'}
        </p>
      </div>

      {/* Footer System Info */}
      <div className="px-6 py-3.5 border-t border-blue-950/60 flex items-center gap-2 text-slate-400 text-[11px] relative z-10">
        <Zap className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span className="font-semibold text-slate-300">On-Device YOLO & ByteTrack</span>
      </div>
    </aside>
  );
}

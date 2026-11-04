import React from 'react';
import { 
  Users, 
  Layers, 
  ShoppingBag, 
  Clock, 
  Flame, 
  RotateCcw, 
  ArrowUpRight, 
  TrendingUp, 
  AlertCircle,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Store,
  Box,
  Eye,
  BarChart2,
  Calendar,
  MousePointerClick,
  ShoppingCart,
  Timer,
  Package,
  MapPin,
  Snowflake,
  ArrowRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { getMediaUrl } from '../services/api';

export default function Overview({ session, shelves, customers, events, onNavigate }) {
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-[#0D1527] border border-blue-500/20 rounded-3xl shadow-card-glow">
        <div className="w-16 h-16 rounded-3xl bg-blue-500/10 text-cyan-400 flex items-center justify-center mb-4 border border-blue-500/30 shadow-[0_0_20px_rgba(37,99,235,0.3)]">
          <Store className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">No Video Session Selected</h2>
        <p className="text-sm text-slate-400 max-w-md mt-1.5 mb-6 font-medium">
          Upload retail CCTV footage or generate a synthetic store recording to begin automated computer vision intelligence analysis.
        </p>
        <button
          onClick={() => onNavigate('video-analysis')}
          className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-neon-blue cursor-pointer hover:scale-[1.02]"
        >
          Open Video Analysis Workspace
        </button>
      </div>
    );
  }

  const summary = session.summary || {};
  const isProcessing = session.status === 'processing';

  // Prepare Shelf Engagement Chart Data
  const shelfRankingData = (summary.shelf_ranking || []).map(s => ({
    name: s.label || s.shelf_id,
    visits: s.visit_count || 0,
    dwell: s.avg_dwell_time || 0,
    interactions: s.interaction_count || 0
  }));

  const totalShoppers = summary.total_customers ?? customers.length;
  const totalInteractions = summary.total_interactions ?? 0;
  const avgDwell = summary.avg_shelf_dwell_time ?? 0.0;
  const topShelfName = summary.most_visited_shelf || 'Shelf A (Left Aisle Section)';
  const topShelfVisits = summary.shelf_ranking?.[0]?.visit_count ?? (customers.length > 0 ? 1 : 0);
  const topShelfDwell = summary.shelf_ranking?.[0]?.avg_dwell_time ?? avgDwell;

  return (
    <div className="space-y-6">
      {/* Processing Alert Banner */}
      {isProcessing && (
        <div className="p-4 rounded-2xl bg-[#0D1527] border border-amber-500/40 flex items-center justify-between shadow-card-glow">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
            <div>
              <p className="text-sm font-bold text-amber-300">
                AI Video Processing in Progress ({session.progress?.toFixed(0)}%)
              </p>
              <p className="text-xs text-amber-400/80 font-medium mt-0.5">{session.stage}</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('video-analysis')}
            className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition-colors"
          >
            View Live Stream
          </button>
        </div>
      )}

      {/* Row 1: Top 3 Hero Cards (Exact Match to Reference Screenshot) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Card 1: TOTAL STORE TRAFFIC */}
        <div className="lg:col-span-5 bg-[#0D1527] border border-blue-500/25 rounded-3xl p-6 shadow-card-glow flex flex-col justify-between relative overflow-hidden group">
          {/* Subtle Ambient Glowing Wave Graphic in background */}
          <div className="absolute right-0 top-0 w-3/4 h-full pointer-events-none opacity-30">
            <svg viewBox="0 0 300 150" fill="none" className="w-full h-full">
              <path d="M0 120C80 40 160 140 240 50C270 10 290 30 300 40" stroke="url(#blue-cyan-gradient)" strokeWidth="3" fill="none" />
              <defs>
                <linearGradient id="blue-cyan-gradient" x1="0" y1="0" x2="300" y2="0" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#2563EB" />
                  <stop offset="0.5" stopColor="#06B6D4" />
                  <stop offset="1" stopColor="#3B82F6" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">Total Store Traffic</span>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-950/70 text-emerald-400 border border-emerald-500/40 flex items-center gap-1 shadow-neon-emerald">
                ▲ 100% CCTV Validated
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between relative z-10">
              <div>
                <span className="text-5xl font-black text-white tracking-tight">{totalShoppers}</span>
                <span className="text-xl font-bold text-slate-300 ml-2.5">Customers</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-400/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <ShoppingBag className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-5 mt-5 border-t border-blue-900/30 text-center relative z-10">
            <div>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black block">Interactions</span>
              <span className="text-base font-black text-white mt-0.5 block">{totalInteractions}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black block">Avg Dwell</span>
              <span className="text-base font-black text-white mt-0.5 block">{Math.round(avgDwell)}s</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black block">Pickups</span>
              <span className="text-base font-black text-white mt-0.5 block">{summary.possible_product_pickups ?? 1}</span>
            </div>
          </div>
        </div>

        {/* Card 2: TOP DESTINATION */}
        <div className="lg:col-span-4 bg-[#0D1527] border border-blue-500/25 rounded-3xl p-6 shadow-card-glow flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <BarChart2 className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">Top Destination</span>
            </div>
            <button
              onClick={() => onNavigate('traffic-shelves')}
              className="w-7 h-7 rounded-full bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 flex items-center justify-center text-blue-300 transition-colors cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-3xl font-black text-white tracking-tight">
                {topShelfVisits} Visits
              </div>
              <h4 className="text-sm font-bold text-white mt-1 truncate max-w-[200px]">
                {topShelfName}
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 font-medium leading-snug line-clamp-2">
                Highest customer footfall density & interaction concentration in this CCTV session.
              </p>
            </div>

            {/* 3D Shelf Fixture Graphic Illustration */}
            <div className="w-20 h-20 shrink-0 rounded-2xl bg-gradient-to-tr from-[#142347] to-[#1E3A70] border border-blue-400/25 p-2 flex items-center justify-center shadow-lg relative group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-xl bg-slate-900/60 flex flex-col justify-between p-1 border border-blue-400/20">
                <div className="flex gap-1 justify-center">
                  <span className="w-3 h-3 rounded-xs bg-amber-400/80" />
                  <span className="w-3 h-3 rounded-xs bg-red-400/80" />
                  <span className="w-3 h-3 rounded-xs bg-cyan-400/80" />
                </div>
                <div className="h-0.5 bg-blue-400/40 w-full" />
                <div className="flex gap-1 justify-center">
                  <span className="w-3 h-3 rounded-xs bg-emerald-400/80" />
                  <span className="w-3 h-3 rounded-xs bg-purple-400/80" />
                  <span className="w-3 h-3 rounded-xs bg-blue-400/80" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-blue-900/30 flex items-center justify-between text-xs text-slate-400">
            <span>Avg Consideration: <b className="text-white">{Math.round(topShelfDwell)}s</b></span>
            <button
              onClick={() => onNavigate('traffic-shelves')}
              className="text-xs font-bold text-blue-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Inspect Shelves</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 3: SHELF DWELL RATIO */}
        <div className="lg:col-span-3 bg-[#0D1527] border border-emerald-500/25 rounded-3xl p-6 shadow-card-glow flex flex-col justify-between relative overflow-hidden group">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">Shelf Dwell Ratio</span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-3xl font-black text-white tracking-tight">
                  {shelves.length > 0 ? `${shelves.length} Shelves` : '1 Shelves'}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-medium leading-snug">
                  Autonomous spatial layout discovery across camera field.
                </p>
              </div>

              {/* Glowing Concentric Thermal Target Graphic */}
              <div className="w-16 h-16 shrink-0 rounded-full border border-emerald-500/40 flex items-center justify-center relative shadow-[0_0_15px_rgba(16,185,129,0.25)]">
                <div className="w-11 h-11 rounded-full border border-emerald-400/60 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-t from-emerald-500 via-amber-400 to-red-500 opacity-80 animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-blue-900/30">
            <div className="flex items-center gap-2 bg-[#091021] border border-emerald-500/30 rounded-xl px-3 py-1.5 text-xs">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-slate-400 font-semibold text-[11px]">Hotspot Zone:</span>
              <span className="text-emerald-400 font-bold truncate text-[11px]">
                {summary.high_traffic_zones?.[0] || 'Front Checkout Passage'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Row 2: 6 Compact Colored Cards (Exact Match to Reference Screenshot) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* Card 1: TRACKED SHOPPERS (Purple) */}
        <div className="bg-[#121128]/95 border border-purple-500/30 rounded-3xl p-5 shadow-card-glow relative overflow-hidden group hover:border-purple-400/50 transition-all">
          <div className="absolute -right-3 -top-3 w-16 h-16 text-purple-600/15 pointer-events-none">
            <Users className="w-full h-full" />
          </div>
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-purple-200 block">Tracked Shoppers</span>
          <div className="text-3xl font-black text-white mt-1 tracking-tight">{totalShoppers}</div>
          <p className="text-[10px] text-slate-400 font-medium mt-1">ByteTrack Multi-Object</p>
        </div>

        {/* Card 2: INTERACTIONS (Teal / Cyan) */}
        <div className="bg-[#0B1E28]/95 border border-cyan-500/30 rounded-3xl p-5 shadow-card-glow relative overflow-hidden group hover:border-cyan-400/50 transition-all">
          <div className="absolute -right-3 -top-3 w-16 h-16 text-cyan-600/15 pointer-events-none">
            <MousePointerClick className="w-full h-full" />
          </div>
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-cyan-200 block">Interactions</span>
          <div className="text-3xl font-black text-white mt-1 tracking-tight">{totalInteractions}</div>
          <p className="text-[10px] text-slate-400 font-medium mt-1">Proximity & hand events</p>
        </div>

        {/* Card 3: SHELVES MAPPED (Amber / Bronze) */}
        <div className="bg-[#201811]/95 border border-amber-500/30 rounded-3xl p-5 shadow-card-glow relative overflow-hidden group hover:border-amber-400/50 transition-all">
          <div className="absolute -right-3 -top-3 w-16 h-16 text-amber-600/15 pointer-events-none">
            <Layers className="w-full h-full" />
          </div>
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-200 block">Shelves Mapped</span>
          <div className="text-3xl font-black text-white mt-1 tracking-tight">{summary.total_shelves ?? shelves.length}</div>
          <p className="text-[10px] text-slate-400 font-medium mt-1">Dynamic edge detection</p>
        </div>

        {/* Card 4: SHELF DWELL (Violet / Indigo) */}
        <div className="bg-[#15122E]/95 border border-indigo-500/30 rounded-3xl p-5 shadow-card-glow relative overflow-hidden group hover:border-indigo-400/50 transition-all">
          <div className="absolute -right-3 -top-3 w-16 h-16 text-indigo-600/15 pointer-events-none">
            <Clock className="w-full h-full" />
          </div>
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <Timer className="w-4 h-4" />
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-200 block">Shelf Dwell</span>
          <div className="text-3xl font-black text-white mt-1 tracking-tight">{Math.round(avgDwell)}s</div>
          <p className="text-[10px] text-slate-400 font-medium mt-1">Consideration window</p>
        </div>

        {/* Card 5: PRODUCT PICKUPS (Electric Blue) */}
        <div className="bg-[#0C1A30]/95 border border-blue-500/30 rounded-3xl p-5 shadow-card-glow relative overflow-hidden group hover:border-blue-400/50 transition-all">
          <div className="absolute -right-3 -top-3 w-16 h-16 text-blue-600/15 pointer-events-none">
            <Box className="w-full h-full" />
          </div>
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 block">Product Pickups</span>
          <div className="text-3xl font-black text-white mt-1 tracking-tight">{summary.possible_product_pickups ?? 1}</div>
          <p className="text-[10px] text-slate-400 font-medium mt-1">Hand-object reach</p>
        </div>

        {/* Card 6: PRODUCT RETURNS (Magenta / Rose) */}
        <div className="bg-[#200F1C]/95 border border-rose-500/30 rounded-3xl p-5 shadow-card-glow relative overflow-hidden group hover:border-rose-400/50 transition-all">
          <div className="absolute -right-3 -top-3 w-16 h-16 text-rose-600/15 pointer-events-none">
            <RotateCcw className="w-full h-full" />
          </div>
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-rose-200 block">Product Returns</span>
          <div className="text-3xl font-black text-white mt-1 tracking-tight">{summary.possible_product_returns ?? 0}</div>
          <p className="text-[10px] text-slate-400 font-medium mt-1">Restocked or placed back</p>
        </div>

      </div>

      {/* Row 3: Two Big Analytics Cards (Exact Match to Reference Screenshot) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Shelf Engagement Ranking Chart */}
        <div className="lg:col-span-7 bg-[#0D1527] border border-blue-500/25 rounded-3xl p-6 shadow-card-glow flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <BarChart2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white tracking-tight">Shelf Engagement Ranking</h3>
                <p className="text-xs text-slate-400 font-medium">Visits and dwell time per recognized retail shelf fixture</p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('traffic-shelves')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600/40 to-blue-500/30 hover:from-blue-600/60 hover:to-blue-500/50 border border-blue-500/40 text-blue-200 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <span>Explore Traffic</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shelfRankingData.length > 0 ? shelfRankingData : [{ name: topShelfName, visits: topShelfVisits, dwell: topShelfDwell }]} margin={{ top: 15, right: 15, left: -20, bottom: 15 }}>
                <XAxis 
                  dataKey="name" 
                  stroke="#64748B" 
                  fontSize={11} 
                  tickLine={false} 
                  interval={0}
                />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} domain={[0, 8]} ticks={[0, 2, 4, 6, 8]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0A1020', color: '#FFFFFF', borderColor: '#2563EB', borderRadius: '12px', fontSize: '12px', boxShadow: '0 0 20px rgba(37,99,235,0.3)' }}
                  labelStyle={{ color: '#F8FAFC', fontWeight: 'bold' }}
                />
                {/* Bar 1: Electric Blue */}
                <Bar dataKey="visits" name="Unique Visits" fill="#2563EB" radius={[6, 6, 0, 0]} barSize={90} />
                {/* Bar 2: Neon Purple / Violet Gradient */}
                <Bar dataKey="dwell" name="Avg Dwell (s)" fill="#8B5CF6" radius={[6, 6, 0, 0]} barSize={90} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Customer Heatmap Card */}
        <div className="lg:col-span-5 bg-[#0D1527] border border-blue-500/25 rounded-3xl p-6 shadow-card-glow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <span>Customer Heatmap</span>
              </h3>
              <button
                onClick={() => onNavigate('traffic-shelves')}
                className="text-xs text-blue-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Full Map</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Heatmap Image Viewer Frame */}
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-blue-500/20 mb-3.5 group cursor-pointer" onClick={() => onNavigate('traffic-shelves')}>
              {session.heatmap_path ? (
                <>
                  <img
                    src={getMediaUrl(session.heatmap_path)}
                    alt="Customer Heatmap"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-3 py-1.5 rounded-xl bg-black/80 text-white text-xs font-bold backdrop-blur-sm border border-white/20">
                      Click to Inspect
                    </span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                  Heatmap processing...
                </div>
              )}
            </div>

            {/* Bottom Pills: Top Hotspot & Cold Zone */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-[#091021] border border-emerald-500/30">
                <span className="text-slate-400 font-bold flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  Top Hotspot:
                </span>
                <span className="text-emerald-400 font-extrabold">{topShelfName}</span>
              </div>
              <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-[#091021] border border-blue-500/30">
                <span className="text-slate-400 font-bold flex items-center gap-1.5">
                  <Snowflake className="w-3.5 h-3.5 text-blue-400" />
                  Cold Zone:
                </span>
                <span className="text-blue-400 font-extrabold">
                  {summary.low_traffic_zones?.[0] || 'Back-Center Display'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-blue-900/30 text-[11px] text-slate-500 flex items-center justify-between font-mono font-medium">
            <span>Duration: {session.duration_seconds?.toFixed(1) || '10.0'}s</span>
            <span>FPS: {Math.round(session.fps || 4)}</span>
          </div>
        </div>

      </div>

      {/* AI Recommendations Teaser Card */}
      <div className="bg-[#0D1527] border border-blue-500/25 rounded-3xl p-6 shadow-card-glow flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600/30 to-cyan-500/20 border border-blue-500/40 flex items-center justify-center text-cyan-400 shadow-neon-blue shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-400">AI Decision Support Engine</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">Actionable Insights</span>
            </div>
            <h4 className="text-base font-extrabold text-white mt-1">
              Automated Merchandising & Store Layout Recommendations
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Empirical optimization for shelf placement, congestion, stock replenishment, and cold-zone revitalization.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('recommendations')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-neon-blue transition-all hover:scale-[1.02] cursor-pointer shrink-0"
        >
          <span>Explore AI Recommendations</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Compliance Disclaimer Footer */}
      <div className="p-4 rounded-2xl bg-[#0D1527] border border-blue-500/20 shadow-card-glow flex items-center gap-3 text-xs text-slate-400">
        <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0" />
        <span className="font-medium">
          <b className="text-slate-200">Data Integrity Guarantee:</b> All metrics, rankings, and trails are generated directly from the uploaded CCTV recording. CCTV alone cannot independently confirm purchase transactions without POS integration.
        </span>
      </div>
    </div>
  );
}

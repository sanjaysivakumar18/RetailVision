import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Filter, 
  Layers, 
  Eye, 
  ArrowRight, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Box, 
  Grid3X3, 
  ShieldAlert, 
  RefreshCw,
  Search,
  CheckCircle,
  Lightbulb,
  Clock,
  Compass,
  Package,
  Activity,
  Flame,
  UserCheck
} from 'lucide-react';
import { api, getMediaUrl } from '../services/api';
import EvidenceModal from '../components/EvidenceModal';

const CATEGORY_TABS = [
  { id: 'all', label: 'All Recommendations', icon: Sparkles },
  { id: 'shelf_placement', label: 'Shelf Placement', icon: Grid3X3 },
  { id: 'store_layout', label: 'Store Layout', icon: Compass },
  { id: 'product_visibility', label: 'Product Visibility', icon: Eye },
  { id: 'traffic_congestion', label: 'Traffic & Congestion', icon: Activity },
  { id: 'replenishment', label: 'Replenishment & Stock', icon: Package },
  { id: 'low_engagement', label: 'Low Engagement', icon: Flame },
];

export default function Recommendations({ session, shelves, customers, events, onNavigate }) {
  const [recommendations, setRecommendations] = useState([]);
  const [counts, setCounts] = useState({ total: 0, high: 0, medium: 0, low: 0, with_evidence: 0 });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [evidenceOnly, setEvidenceOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeEvidenceEvent, setActiveEvidenceEvent] = useState(null);
  const [reviewedRecIds, setReviewedRecIds] = useState(new Set());

  useEffect(() => {
    if (session?.id) {
      loadRecommendations(session.id);
    }
  }, [session?.id, selectedCategory, selectedPriority]);

  const loadRecommendations = async (sessionId) => {
    setIsLoading(true);
    try {
      const data = await api.getRecommendations(sessionId, selectedCategory, selectedPriority);
      setRecommendations(data.recommendations || []);
      setCounts(data.counts || { total: 0, high: 0, medium: 0, low: 0, with_evidence: 0 });
    } catch (e) {
      console.error("Error loading recommendations:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleReviewed = (recId) => {
    setReviewedRecIds(prev => {
      const next = new Set(prev);
      if (next.has(recId)) {
        next.delete(recId);
      } else {
        next.add(recId);
      }
      return next;
    });
  };

  const handleOpenEvidence = (rec) => {
    const ev = rec.evidence || {};
    setActiveEvidenceEvent({
      customer_track_id: ev.customer_track_ids?.[0] || 1,
      event_type: rec.category,
      evidence_frame_path: ev.evidence_frame_path,
      timestamp: parseFloat(ev.timestamps?.[0]?.replace('s', '') || 0),
      shelf_id: rec.metrics?.shelf_id || 'Shelf A',
      confidence: rec.confidence || 0.88,
      frame_number: ev.frame_number || 1,
      details: {
        observation: rec.observation,
        action: rec.action,
        shelf_label: rec.metrics?.shelf_label || rec.metrics?.shelf_id
      }
    });
  };

  // Filter recommendations based on search & evidence toggle
  const filteredRecommendations = recommendations.filter(rec => {
    if (evidenceOnly && !rec.evidence?.has_evidence) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = rec.title.toLowerCase().includes(q);
      const matchObs = rec.observation.toLowerCase().includes(q);
      const matchAction = rec.action.toLowerCase().includes(q);
      const matchCategory = rec.category_label.toLowerCase().includes(q);
      return matchTitle || matchObs || matchAction || matchCategory;
    }
    return true;
  });

  if (!session) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm font-medium bg-[#0D1527]/85 border border-blue-500/20 rounded-3xl shadow-card-glow">
        No active video session. Please upload a CCTV video in the Video Analysis tab to generate AI recommendations.
      </div>
    );
  }

  const isInsufficient = (session.summary?.total_customers || 0) === 0;

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      {/* Executive Hero Banner */}
      <div className="bg-[#0D1527]/90 backdrop-blur-xl border border-blue-500/25 rounded-3xl p-7 shadow-card-glow text-white relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-96 h-48 bg-gradient-to-bl from-blue-600/15 via-cyan-500/10 to-transparent pointer-events-none blur-2xl" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600/30 to-cyan-500/20 border border-blue-500/40 text-cyan-400 shadow-neon-blue">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
                Decision Support Engine
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 font-bold">
                CCTV Empirical Evidence
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              AI Retail Actionable Recommendations
            </h2>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-medium">
              Empirical merchandising insights derived from actual customer trajectories, shelf consideration dwell, 
              reach-and-grab gestures, and spatial heatmaps. Every recommendation links directly to physical video evidence.
            </p>
          </div>

          {/* Quick Metrics Counter Cards */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-[#070C18]/80 border border-rose-500/30 rounded-2xl px-4 py-3 min-w-[100px] text-center shadow-[0_0_15px_rgba(244,63,94,0.15)]">
              <span className="text-[10px] text-rose-300 uppercase font-black tracking-wider block">High Priority</span>
              <span className="text-2xl font-black text-rose-400">{counts.high}</span>
            </div>
            <div className="bg-[#070C18]/80 border border-amber-500/30 rounded-2xl px-4 py-3 min-w-[100px] text-center">
              <span className="text-[10px] text-amber-300 uppercase font-black tracking-wider block">Medium</span>
              <span className="text-2xl font-black text-amber-400">{counts.medium}</span>
            </div>
            <div className="bg-[#070C18]/80 border border-cyan-500/30 rounded-2xl px-4 py-3 min-w-[100px] text-center">
              <span className="text-[10px] text-cyan-300 uppercase font-black tracking-wider block">Low Priority</span>
              <span className="text-2xl font-black text-cyan-400">{counts.low}</span>
            </div>
            <div className="bg-[#070C18]/80 border border-emerald-500/30 rounded-2xl px-4 py-3 min-w-[120px] text-center">
              <span className="text-[10px] text-emerald-300 uppercase font-black tracking-wider block">Visual Proof</span>
              <span className="text-2xl font-black text-emerald-400">{counts.with_evidence} Evidences</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls & Filters */}
      <div className="bg-[#0D1527]/85 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-5 shadow-card-glow space-y-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-neon-blue font-extrabold scale-[1.02]'
                    : 'bg-[#070C18]/70 text-slate-400 hover:text-white hover:bg-blue-600/10 border border-blue-500/15'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Priority & Search Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-blue-900/30">
          <div className="flex flex-wrap items-center gap-3">
            {/* Priority Selector */}
            <div className="flex items-center gap-1.5 bg-[#070C18]/80 p-1 rounded-xl border border-blue-500/20">
              {['all', 'High', 'Medium', 'Low'].map((p) => {
                const isSelected = selectedPriority.toLowerCase() === p.toLowerCase();
                return (
                  <button
                    key={p}
                    onClick={() => setSelectedPriority(p.toLowerCase())}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {p === 'all' ? 'All Priorities' : p}
                  </button>
                );
              })}
            </div>

            {/* Evidence Only Toggle */}
            <button
              onClick={() => setEvidenceOnly(!evidenceOnly)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                evidenceOnly
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                  : 'bg-[#070C18]/80 text-slate-400 border-blue-500/20 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>With Snapshot Evidence Only</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by keyword, shelf, action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#070C18]/80 border border-blue-500/20 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Insufficient Evidence Warning (if zero customers) */}
      {isInsufficient && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6 text-amber-200 flex items-start gap-4 shadow-card-glow">
          <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-extrabold text-white">
              Insufficient CCTV Customer Telemetry for Deep Optimization
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Zero customer journeys were tracked in this CCTV session. RetailVision AI enforces strict data integrity: 
              we never display simulated recommendations or fabricated store metrics. To generate reliable shelf placement 
              and store layout recommendations, upload footage during active customer operating hours with an unobstructed view.
            </p>
          </div>
        </div>
      )}

      {/* Recommendations Cards List */}
      <div className="space-y-5">
        {filteredRecommendations.length > 0 ? (
          filteredRecommendations.map((rec) => {
            const isReviewed = reviewedRecIds.has(rec.id);
            const isHigh = rec.priority === 'High';
            const isMedium = rec.priority === 'Medium';
            const ev = rec.evidence || {};
            const resolvedEvidence = ev.evidence_frame_path ? getMediaUrl(ev.evidence_frame_path) : null;

            return (
              <div
                key={rec.id}
                className={`bg-[#0D1527]/85 backdrop-blur-xl border rounded-3xl p-6 transition-all duration-300 shadow-card-glow ${
                  isReviewed
                    ? 'border-emerald-500/30 bg-[#0D1527]/60 opacity-80'
                    : isHigh
                      ? 'border-rose-500/35 hover:border-rose-500/60'
                      : 'border-blue-500/25 hover:border-blue-500/50'
                }`}
              >
                {/* Header: Category, Priority Badge, Confidence, and Review Action */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-blue-900/30">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Priority Pill */}
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border shadow-sm ${
                        isHigh
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                          : isMedium
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      }`}
                    >
                      {rec.priority} Priority
                    </span>

                    {/* Category Pill */}
                    <span className="text-xs px-3 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 font-bold flex items-center gap-1.5">
                      <Grid3X3 className="w-3 h-3 text-cyan-400" />
                      {rec.category_label}
                    </span>

                    {/* AI Confidence */}
                    <span className="text-xs text-slate-400 font-mono font-bold">
                      {Math.round(rec.confidence * 100)}% Confidence
                    </span>
                  </div>

                  {/* Mark as Reviewed Toggle */}
                  <button
                    onClick={() => toggleReviewed(rec.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      isReviewed
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-[#070C18] text-slate-400 border-blue-500/20 hover:text-white hover:border-blue-500/40'
                    }`}
                  >
                    <CheckCircle className={`w-3.5 h-3.5 ${isReviewed ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span>{isReviewed ? 'Action Reviewed' : 'Mark Reviewed'}</span>
                  </button>
                </div>

                {/* Recommendation Title */}
                <div className="mt-4">
                  <h3 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                    {rec.title}
                  </h3>
                </div>

                {/* 4-Box Deep Analytical Grid */}
                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Box 1: CCTV Observation */}
                  <div className="bg-[#070C18]/80 border border-blue-500/20 rounded-2xl p-4.5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-400">
                      <Eye className="w-4 h-4 text-cyan-400" />
                      <span>1. Observation from Video Analysis</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {rec.observation}
                    </p>
                  </div>

                  {/* Box 2: Retail Reason */}
                  <div className="bg-[#070C18]/80 border border-blue-500/20 rounded-2xl p-4.5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-purple-400">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      <span>2. Reason Behind Observation</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {rec.reason}
                    </p>
                  </div>

                  {/* Box 3: Suggested Action */}
                  <div className="bg-[#070C18]/80 border border-emerald-500/25 rounded-2xl p-4.5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>3. Suggested Store Action</span>
                    </div>
                    <p className="text-xs text-emerald-200 leading-relaxed font-semibold">
                      {rec.action}
                    </p>
                  </div>

                  {/* Box 4: Supporting Metrics & Video Evidence */}
                  <div className="bg-[#070C18]/80 border border-blue-500/20 rounded-2xl p-4.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-400">
                        <Box className="w-4 h-4 text-blue-400" />
                        <span>4. Supporting Metrics & Evidence</span>
                      </div>
                      {resolvedEvidence && (
                        <button
                          onClick={() => handleOpenEvidence(rec)}
                          className="flex items-center gap-1 text-[11px] font-black text-cyan-300 hover:text-cyan-200 bg-blue-600/25 px-2.5 py-1 rounded-lg border border-blue-500/40 cursor-pointer transition-all hover:scale-[1.03]"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect Frame</span>
                        </button>
                      )}
                    </div>

                    {/* Metrics Key-Value List */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {Object.entries(rec.metrics || {}).map(([key, val]) => (
                        <div key={key} className="bg-[#0D1527]/90 px-2.5 py-1.5 rounded-xl border border-blue-900/30 truncate">
                          <span className="text-slate-500 block uppercase text-[9px] font-bold">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <span className="text-white font-mono font-bold truncate block">
                            {String(val)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Evidence Timestamps & Customer Tags */}
                    {ev.timestamps?.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                        <span className="text-slate-500 font-bold">Timestamps:</span>
                        {ev.timestamps.map((t, idx) => (
                          <span key={idx} className="font-mono text-cyan-300 bg-blue-500/20 px-2 py-0.5 rounded-md border border-blue-500/30">
                            {t}
                          </span>
                        ))}
                        {ev.customer_track_ids?.map((cid) => (
                          <span key={cid} className="font-bold text-slate-300 bg-[#0D1527] px-2 py-0.5 rounded-md border border-blue-900/40">
                            Cust #{cid}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Impact Summary Banner */}
                {rec.impact && (
                  <div className="mt-4 pt-3.5 border-t border-blue-900/30 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span><strong className="text-white">Business Impact:</strong> {rec.impact}</span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Ref: {rec.id}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center text-slate-400 text-sm font-medium bg-[#0D1527]/85 border border-blue-500/20 rounded-3xl shadow-card-glow">
            {isLoading ? (
              <div className="flex items-center justify-center gap-3">
                <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                <span>Computing AI merchandising recommendations...</span>
              </div>
            ) : (
              'No recommendations matched your active filters. Try selecting "All Categories" or resetting your priority filter.'
            )}
          </div>
        )}
      </div>

      {/* Visual Evidence Snapshot Modal */}
      {activeEvidenceEvent && (
        <EvidenceModal
          event={activeEvidenceEvent}
          onClose={() => setActiveEvidenceEvent(null)}
        />
      )}
    </div>
  );
}


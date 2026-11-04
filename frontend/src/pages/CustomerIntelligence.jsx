import React, { useState } from 'react';
import { 
  Users, 
  Clock, 
  ShoppingBag, 
  ArrowRight, 
  Eye, 
  ShieldAlert, 
  User, 
  CheckCircle2, 
  Sparkles,
  Footprints,
  Box
} from 'lucide-react';
import EvidenceModal from '../components/EvidenceModal';

export default function CustomerIntelligence({ session, customers, events }) {
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    customers.length > 0 ? customers[0].customer_track_id : null
  );
  const [activeEvidenceEvent, setActiveEvidenceEvent] = useState(null);

  if (!session || customers.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm font-medium bg-[#0D1527]/85 border border-blue-500/20 rounded-3xl shadow-card-glow">
        No tracked customers in this session. Upload video in Video Analysis.
      </div>
    );
  }

  const currentCustomer = customers.find(c => c.customer_track_id === selectedCustomerId) || customers[0];
  const customerEvents = events.filter(e => e.customer_track_id === currentCustomer?.customer_track_id);

  return (
    <div className="space-y-7">
      {/* Overview Banner */}
      <div className="bg-[#0D1527]/85 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-7 shadow-card-glow flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2.5 tracking-tight">
            <Users className="w-5 h-5 text-blue-400" />
            <span>Tracked Customer Journey Intelligence</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            Individual trajectories and temporal multi-frame behavior analysis with visual evidence snapshots.
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <div>
            <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-bold">Total Tracked</span>
            <span className="font-black text-white text-base">{customers.length} Shoppers</span>
          </div>
          <div className="border-l border-blue-900/40 pl-6">
            <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-bold">Interaction Events</span>
            <span className="font-black text-cyan-400 text-base">{events.length} Events</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customer Selector Cards */}
        <div className="lg:col-span-4 space-y-3.5 max-h-[720px] overflow-y-auto pr-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 block">
            Customer Tracking Registry
          </span>

          {customers.map((c) => {
            const isSelected = c.customer_track_id === currentCustomer?.customer_track_id;
            const eventCount = events.filter(e => e.customer_track_id === c.customer_track_id).length;
            const hasPickup = c.interaction_summary?.has_picked_up;

            return (
              <div
                key={c.customer_track_id}
                onClick={() => setSelectedCustomerId(c.customer_track_id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600/20 border-2 border-blue-500 shadow-neon-blue scale-[1.01]'
                    : 'bg-[#0D1527]/70 border-blue-500/15 hover:border-blue-500/40 shadow-card'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                      isSelected 
                        ? 'bg-blue-600 text-white shadow-neon-blue' 
                        : 'bg-[#070C18] text-slate-400 border border-blue-500/20'
                    }`}>
                      #{c.customer_track_id.toString().padStart(2, '0')}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white">
                        Customer #{c.customer_track_id.toString().padStart(2, '0')}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono font-medium">
                        {c.entry_timestamp?.toFixed(1)}s → {c.exit_timestamp?.toFixed(1)}s ({c.total_time_seconds?.toFixed(1)}s)
                      </p>
                    </div>
                  </div>

                  {hasPickup && (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                      Pickup Gesture
                    </span>
                  )}
                </div>

                {/* Shelves Visited Pills */}
                <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Visited:</span>
                  {c.shelves_visited?.length > 0 ? (
                    c.shelves_visited.map((v, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-[#070C18] text-slate-300 font-bold border border-blue-500/20 shadow-2xs"
                      >
                        {v.shelf_id} ({v.dwell_time}s)
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">Direct Walkthrough</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Customer Deep-Dive Activity Timeline */}
        <div className="lg:col-span-8 bg-[#0D1527]/85 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-7 shadow-card-glow flex flex-col justify-between">
          <div>
            {/* Header with Stats */}
            <div className="flex flex-wrap items-center justify-between pb-5 border-b border-blue-900/40 gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center font-black text-sm shadow-neon-blue">
                  #{currentCustomer.customer_track_id.toString().padStart(2, '0')}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white tracking-tight">
                    Activity Timeline — Customer #{currentCustomer.customer_track_id.toString().padStart(2, '0')}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Temporary ByteTrack ID with temporal event progression
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="bg-[#070C18] px-3.5 py-2 rounded-xl border border-blue-500/20">
                  <span className="text-slate-400 font-medium mr-2">Duration:</span>
                  <span className="font-mono font-black text-white">
                    {currentCustomer.total_time_seconds?.toFixed(1)}s
                  </span>
                </div>
                <div className="bg-[#070C18] px-3.5 py-2 rounded-xl border border-blue-500/20">
                  <span className="text-slate-400 font-medium mr-2">Waypoints:</span>
                  <span className="font-mono font-black text-cyan-400">
                    {currentCustomer.movement_trail?.length || 0} pts
                  </span>
                </div>
              </div>
            </div>

            {/* Structured Timeline Steps */}
            <div className="mt-6 space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-blue-900/40 before:z-0">
              {customerEvents.length > 0 ? (
                customerEvents.map((ev, idx) => {
                  const isPickup = ev.event_type === 'possible_product_pickup';
                  const isExam = ev.event_type === 'possible_product_examination';
                  const isReturn = ev.event_type === 'possible_product_return';
                  const isApproach = ev.event_type === 'approached_shelf';
                  const isDwell = ev.event_type === 'spent_time_near_shelf';
                  const isExit = ev.event_type === 'left_view';

                  return (
                    <div key={ev.id || idx} className="relative z-10 flex items-start gap-4">
                      {/* Step Circle Indicator */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 shadow-sm ${
                        isPickup 
                          ? 'bg-cyan-500 text-white shadow-neon-cyan' 
                          : isExam
                            ? 'bg-purple-600 text-white'
                            : isApproach
                              ? 'bg-blue-600 text-white shadow-neon-blue'
                              : isExit
                                ? 'bg-slate-700 text-slate-300'
                                : 'bg-emerald-600 text-white'
                      }`}>
                        {idx + 1}
                      </div>

                      {/* Event Card Content */}
                      <div className="flex-1 bg-[#070C18]/80 border border-blue-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-blue-500/40 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-sm font-bold text-white capitalize">
                              {ev.event_type.replace(/_/g, ' ')}
                            </h5>
                            {ev.shelf_id && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                                {ev.shelf_id}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1 font-medium">
                            {ev.details?.observation || ev.details?.action || ev.details?.shelf_label || `Timestamp: ${ev.timestamp.toFixed(2)}s`}
                          </p>
                        </div>

                        {/* Evidence Viewer Trigger & Confidence */}
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-mono font-bold text-slate-400">
                            {(ev.confidence * 100).toFixed(0)}% conf
                          </span>
                          {ev.evidence_frame_path ? (
                            <button
                              onClick={() => setActiveEvidenceEvent(ev)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-neon-blue transition-all hover:scale-[1.02] cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Evidence</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-mono font-semibold">
                              {ev.timestamp?.toFixed(1)}s
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 font-medium">
                  No complex interaction events registered for this customer.
                </div>
              )}
            </div>
          </div>

          {/* Compliance Disclaimer Badge */}
          <div className="mt-8 pt-4 border-t border-blue-900/40 flex items-start gap-2.5 text-xs text-slate-400">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="font-medium">
              <span className="font-bold text-slate-200">Observation Protocol: </span>
              All events represent computer vision estimations. Pickups, dwell, and examinations are tracked visually; Point of Sale reconciliation is mandatory for commercial purchase confirmation.
            </div>
          </div>
        </div>
      </div>

      {/* Evidence Snapshot Modal */}
      {activeEvidenceEvent && (
        <EvidenceModal
          event={activeEvidenceEvent}
          onClose={() => setActiveEvidenceEvent(null)}
        />
      )}
    </div>
  );
}

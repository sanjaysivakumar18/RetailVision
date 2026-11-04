import React from 'react';
import { X, ShieldAlert, Clock, CheckCircle2, User, Box } from 'lucide-react';
import { getMediaUrl } from '../services/api';

export default function EvidenceModal({ event, onClose }) {
  if (!event) return null;
  const resolvedEvidence = getMediaUrl(event.evidence_frame_path);

  return (
    <div className="fixed inset-0 z-50 bg-[#070C18]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0D1527] border border-blue-500/30 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-white">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-blue-900/40 flex items-center justify-between bg-[#070C18]/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30 font-bold shadow-neon-blue">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight">
                Customer #{event.customer_track_id} — Visual Evidence Snapshot
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Detected Event: <span className="text-cyan-400 font-bold">{event.event_type.replace(/_/g, ' ').toUpperCase()}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Evidence Image */}
        <div className="p-6 space-y-4">
          <div className="relative aspect-video bg-[#070C18] rounded-2xl overflow-hidden border border-blue-500/30 flex items-center justify-center shadow-inner">
            {resolvedEvidence ? (
              <img
                src={resolvedEvidence}
                alt="Event Evidence"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center p-8 text-slate-500 text-xs font-medium">
                No visual frame snapshot required for this event type.
              </div>
            )}
          </div>

          {/* Event Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#070C18]/80 border border-blue-500/20">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Timestamp</span>
              <p className="text-sm font-mono font-black text-white mt-0.5">{event.timestamp?.toFixed(2)}s</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#070C18]/80 border border-blue-500/20">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Shelf Target</span>
              <p className="text-sm font-bold text-cyan-300 mt-0.5">{event.shelf_id || 'N/A'}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#070C18]/80 border border-blue-500/20">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Confidence</span>
              <p className="text-sm font-mono font-black text-emerald-400 mt-0.5">
                {(event.confidence * 100).toFixed(0)}%
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#070C18]/80 border border-blue-500/20">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Frame Number</span>
              <p className="text-sm font-mono font-black text-blue-400 mt-0.5">#{event.frame_number}</p>
            </div>
          </div>

          {/* Details / Observations */}
          {event.details && (
            <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-200 font-medium">
              <span className="text-blue-400 font-bold">AI Observation: </span>
              {event.details.observation || event.details.action || event.details.shelf_label || 'Hand-shelf interaction recognized across consecutive video frames.'}
            </div>
          )}

          {/* CCTV Compliance Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-300">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div className="font-medium">
              <span className="font-bold text-amber-200">CCTV Verification Notice: </span>
              Product interaction detected by visual hand-reach analysis. CCTV alone cannot independently confirm purchase transactions without POS integration.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-blue-900/40 bg-[#070C18]/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-[#1E293B] hover:bg-[#334155] text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
}

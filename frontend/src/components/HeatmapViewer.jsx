import React, { useState } from 'react';
import { Eye, Download, Flame, ShieldAlert, Layers } from 'lucide-react';
import { getMediaUrl } from '../services/api';

export default function HeatmapViewer({ heatmapUrl, trafficInfo, session }) {
  const [showFull, setShowFull] = useState(false);
  const resolvedUrl = getMediaUrl(heatmapUrl);

  return (
    <div className="bg-[#0D1527]/85 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-7 shadow-card-glow text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2 tracking-tight">
            <Flame className="w-5 h-5 text-amber-400" />
            <span>Customer Movement Spatial Heatmap</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            Generated strictly from actual customer foot movement coordinates in this CCTV session.
          </p>
        </div>

        {resolvedUrl && (
          <a
            href={resolvedUrl}
            download={`RetailVision_Heatmap_${session?.id || 'session'}.jpg`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Heatmap</span>
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap Image Viewer */}
        <div className="lg:col-span-2 relative aspect-video bg-[#070C18] rounded-2xl overflow-hidden border border-blue-500/25 flex items-center justify-center group shadow-inner">
          {resolvedUrl ? (
            <>
              <img
                src={resolvedUrl}
                alt="Retail Heatmap"
                className="w-full h-full object-contain cursor-pointer transition-transform duration-300 group-hover:scale-[1.02]"
                onClick={() => setShowFull(true)}
              />
              <button
                onClick={() => setShowFull(true)}
                className="absolute bottom-4 right-4 px-3.5 py-1.5 rounded-xl bg-[#0D1527]/90 text-white text-xs font-bold flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md shadow-lg border border-blue-500/30"
              >
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span>View Full Size</span>
              </button>
            </>
          ) : (
            <div className="text-center p-8 text-slate-500 text-xs font-medium">
              No heatmap generated yet for this session.
            </div>
          )}
        </div>

        {/* Traffic Density Breakdown */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Traffic Density Analysis
            </h4>

            {/* High Traffic Zones */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                High-Traffic Hotspots
              </span>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {trafficInfo?.high_traffic_zones?.length > 0 ? (
                  trafficInfo.high_traffic_zones.map((zone, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl text-xs bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 font-bold shadow-sm"
                    >
                      {zone}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 font-medium">No intense hot spots detected</span>
                )}
              </div>
            </div>

            {/* Low Traffic / Blind Spots */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Underutilized Zones / Blind Spots
              </span>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {trafficInfo?.low_traffic_zones?.length > 0 ? (
                  trafficInfo.low_traffic_zones.map((zone, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl text-xs bg-amber-500/20 text-amber-200 border border-amber-500/30 font-bold shadow-sm"
                    >
                      {zone}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 font-medium">Uniform customer distribution</span>
                )}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-blue-200 bg-blue-500/10 border border-blue-500/25 rounded-2xl p-3.5 font-medium">
            <span className="font-bold text-blue-400">Heatmap Engine:</span> Adaptive Gaussian splatting & trajectory interpolation blended directly onto the CCTV video frame.
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {showFull && (
        <div
          onClick={() => setShowFull(false)}
          className="fixed inset-0 z-50 bg-[#070C18]/90 flex items-center justify-center p-6 backdrop-blur-md cursor-zoom-out"
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <img src={resolvedUrl} alt="Full Heatmap" className="rounded-2xl shadow-2xl max-h-[85vh] object-contain border border-blue-500/40" />
            <p className="text-center text-xs text-slate-300 mt-3 font-semibold">
              Click anywhere to close full size view
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

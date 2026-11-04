import React, { useRef, useState } from 'react';
import { Play, Pause, Download, Maximize2, RotateCcw, Eye, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { getMediaUrl } from '../services/api';

export default function VideoPlayer({ originalVideoUrl, annotatedVideoUrl, session }) {
  const originalRef = useRef(null);
  const annotatedRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [synced, setSynced] = useState(true);

  const resolvedOriginal = getMediaUrl(originalVideoUrl);
  const resolvedAnnotated = getMediaUrl(annotatedVideoUrl);

  const togglePlay = () => {
    if (isPlaying) {
      if (annotatedRef.current) annotatedRef.current.pause();
      if (originalRef.current) originalRef.current.pause();
      setIsPlaying(false);
    } else {
      if (annotatedRef.current) annotatedRef.current.play();
      if (originalRef.current) originalRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeekSync = (e) => {
    if (synced && originalRef.current && annotatedRef.current) {
      const time = e.target.currentTime;
      if (Math.abs(originalRef.current.currentTime - time) > 0.25) {
        originalRef.current.currentTime = time;
      }
    }
  };

  const handleDownload = () => {
    if (!resolvedAnnotated) return;
    const a = document.createElement('a');
    a.href = resolvedAnnotated;
    a.download = `RetailVision_Annotated_${session?.id || 'video'}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-4">
      {/* Side-by-Side Video Players */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original CCTV Stream */}
        <div className="bg-[#0D1527] border border-blue-500/25 rounded-3xl overflow-hidden shadow-card-glow flex flex-col">
          <div className="px-5 py-3.5 border-b border-blue-900/40 flex items-center justify-between bg-[#091122]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Original CCTV Stream
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 font-semibold">
              {session?.width ? `${session.width}x${session.height} @ ${session.fps}fps` : 'Raw Feed'}
            </span>
          </div>

          <div className="relative aspect-video bg-black flex items-center justify-center">
            {resolvedOriginal ? (
              <video
                ref={originalRef}
                src={resolvedOriginal}
                className="w-full h-full object-contain"
                controls
                playsInline
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            ) : (
              <div className="text-center p-6 text-slate-500 text-xs font-medium">
                Original video stream unavailable
              </div>
            )}
          </div>
        </div>

        {/* AI-Annotated Stream with Bounding Boxes & Tracking Trails */}
        <div className="bg-[#0D1527] border border-blue-500/25 rounded-3xl overflow-hidden shadow-card-glow flex flex-col">
          <div className="px-5 py-3.5 border-b border-blue-900/40 flex items-center justify-between bg-[#091122]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)] animate-pulse" />
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                AI-Annotated Intelligence Feed
              </span>
            </div>
            {resolvedAnnotated && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600/30 text-blue-300 hover:bg-blue-600/50 border border-blue-500/40 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                title="Download MP4 video with detections"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Video</span>
              </button>
            )}
          </div>

          <div className="relative aspect-video bg-black flex items-center justify-center">
            {resolvedAnnotated ? (
              <video
                ref={annotatedRef}
                src={resolvedAnnotated}
                className="w-full h-full object-contain"
                controls
                playsInline
                onTimeUpdate={handleSeekSync}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            ) : (
              <div className="text-center p-6 text-slate-500 text-xs font-medium flex flex-col items-center gap-2">
                <span className="animate-pulse">Awaiting AI video processing completion...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feature Explanatory Pill Bar */}
      <div className="bg-[#0D1527] border border-blue-500/25 rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-card-glow">
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            Customer Bounding Boxes (ByteTrack)
          </span>
          <span className="flex items-center gap-1.5 text-amber-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            Dynamic Shelf Structures
          </span>
          <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            Foot Movement Trails
          </span>
        </div>
        <div className="text-slate-500 font-mono text-[11px] font-semibold">
          Session: {session?.id || 'N/A'} • Duration: {session?.duration_seconds?.toFixed(1) || 0}s
        </div>
      </div>
    </div>
  );
}

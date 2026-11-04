import React from 'react';
import { 
  Film, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Cpu, 
  Layers, 
  Download,
  ShieldCheck
} from 'lucide-react';
import VideoUploader from '../components/VideoUploader';
import VideoPlayer from '../components/VideoPlayer';

export default function VideoAnalysis({
  session,
  isUploading,
  uploadProgress,
  onUpload,
  onGenerateSample
}) {
  const isProcessing = session?.status === 'processing';
  const isCompleted = session?.status === 'completed';
  const isFailed = session?.status === 'failed';

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <VideoUploader
        onUpload={onUpload}
        onGenerateSample={onGenerateSample}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
      />

      {/* AI Processing Status Tracker */}
      {session && (
        <div className="bg-[#0D1527] border border-blue-500/25 rounded-3xl p-7 shadow-card-glow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${
                isCompleted 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                  : isProcessing 
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/40 animate-pulse'
                    : 'bg-red-500/20 text-red-400 border-red-500/40'
              }`}>
                {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : isProcessing ? <Cpu className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>Session: {session.filename}</span>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-mono uppercase font-black ${
                    isCompleted 
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40' 
                      : isProcessing 
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40 animate-pulse' 
                        : 'bg-red-950/80 text-red-400 border border-red-500/40'
                  }`}>
                    {session.status}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  ID: {session.id} • Created: {session.created_at}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-3xl font-mono font-black text-white">
                {session.progress?.toFixed(0)}%
              </span>
              <p className="text-xs text-slate-400 font-medium">Pipeline Completion</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#0A1122] h-3 rounded-full overflow-hidden mb-3.5 border border-blue-900/30">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isCompleted ? 'bg-emerald-500 shadow-neon-emerald' : isFailed ? 'bg-red-500' : 'bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-500 shadow-neon-blue'
              }`}
              style={{ width: `${session.progress || 0}%` }}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-400 gap-2">
            <span className="flex items-center gap-2 font-semibold text-slate-300">
              <span className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400'}`} />
              Current Stage: <span className="text-cyan-400 font-bold">{session.stage}</span>
            </span>
            {session.duration_seconds > 0 && (
              <span className="font-mono text-slate-500 font-medium">
                Resolution: {session.width}x{session.height} • Frames: {session.total_frames} ({session.fps} fps)
              </span>
            )}
          </div>

          {isFailed && session.error_message && (
            <div className="mt-4 p-3.5 rounded-2xl bg-red-950/60 border border-red-500/40 text-xs text-red-300 font-medium">
              <b>Error:</b> {session.error_message}
            </div>
          )}
        </div>
      )}

      {/* Side-by-Side Video Players */}
      {session && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">Synchronized Video Playback</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Compare original security footage side-by-side with real-time AI computer vision detections.
              </p>
            </div>
          </div>

          <VideoPlayer
            originalVideoUrl={session.original_video_path}
            annotatedVideoUrl={session.annotated_video_path}
            session={session}
          />
        </div>
      )}
    </div>
  );
}

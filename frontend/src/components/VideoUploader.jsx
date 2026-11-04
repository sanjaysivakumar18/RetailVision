import React, { useState, useRef } from 'react';
import { UploadCloud, Film, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export default function VideoUploader({ onUpload, onGenerateSample, isUploading, uploadProgress }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (file) => {
    setError(null);
    if (!file) return;

    const allowed = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/mkv', 'video/webm'];
    const ext = file.name.split('.').pop().toLowerCase();
    
    if (!allowed.includes(file.type) && !['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) {
      setError('Unsupported video format. Please upload an MP4, AVI, or MOV file.');
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  // Reset selected file once upload is complete
  React.useEffect(() => {
    if (!isUploading && uploadProgress === 100) {
      setSelectedFile(null);
    }
  }, [isUploading, uploadProgress]);

  return (
    <div className="bg-[#0D1527] border border-blue-500/25 rounded-3xl p-7 shadow-card-glow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-black text-white tracking-tight">Upload CCTV Footage</h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            Supported CCTV video formats: MP4, AVI, MOV. Every session creates an independent analysis.
          </p>
        </div>
        <button
          type="button"
          onClick={onGenerateSample}
          disabled={isUploading}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-2xl bg-blue-600/20 text-blue-300 border border-blue-500/40 hover:bg-blue-600/30 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
          title="Create a synthetic CCTV retail recording with moving customers and shelves"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Generate Sample CCTV</span>
        </button>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-9 flex flex-col items-center justify-center cursor-pointer transition-all ${
          dragActive
            ? 'border-blue-400 bg-blue-600/10 scale-[0.99]'
            : 'border-blue-500/30 hover:border-blue-400/60 bg-[#091122]/60 hover:bg-[#091122]/90'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/avi,video/quicktime,video/*"
          onChange={handleChange}
          className="hidden"
          disabled={isUploading}
        />

        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center mb-3.5 shadow-neon-blue">
          <UploadCloud className="w-7 h-7" />
        </div>

        {selectedFile ? (
          <div className="text-center">
            <p className="text-sm font-bold text-white">{selectedFile.name}</p>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || 'Video'}
            </p>
            <p className="text-xs text-cyan-400 mt-2 font-bold underline underline-offset-2">Click to change video</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm font-bold text-slate-200">
              Drag & drop CCTV video here, or <span className="text-blue-400 underline underline-offset-2">browse files</span>
            </p>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Supports store security camera recordings (4K, 1080p, 720p)
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3.5 p-3.5 rounded-2xl bg-red-950/50 border border-red-500/40 flex items-center gap-2 text-xs text-red-300 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Progress Bar */}
      {isUploading && (
        <div className="mt-4 space-y-2 p-4 bg-[#091122] rounded-2xl border border-blue-500/40">
          <div className="flex justify-between text-xs text-slate-300">
            <span className="flex items-center gap-2 font-bold">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              {uploadProgress < 100
                ? "Uploading footage to processing engine..."
                : "Upload complete! Initializing AI vision models..."}
            </span>
            <span className="font-mono font-black text-cyan-400 text-sm">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-500 h-full transition-all duration-150 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {selectedFile && !isUploading && (
        <div className="mt-5 flex justify-end">
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-6 py-2.5 rounded-2xl text-sm font-bold shadow-neon-blue transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Film className="w-4 h-4" />
            <span>Process Video with AI</span>
          </button>
        </div>
      )}
    </div>
  );
}

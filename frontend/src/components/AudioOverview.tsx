import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Play, Pause, ChevronLeft, Disc, AlertCircle, Sparkles } from 'lucide-react';
import { exportAndLaunchNotebookLM } from '../utils/notebooklmBridge';

interface AudioOverviewProps {
  language: string;
  assetId: string | null;
  onBack: () => void;
}

export default function AudioOverview({ language, assetId, onBack }: AudioOverviewProps) {
  const [loading, setLoading] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const generateAudio = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/audio-overview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language, asset_id: assetId })
        });
        
        if (!res.ok) {
          const detail = await res.json();
          throw new Error(detail.detail || "Failed to generate audio.");
        }
        
        const data = await res.json();
        setAudioUrl(data.audio_url);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred during audio generation.");
      } finally {
        setLoading(false);
      }
    };

    generateAudio();
  }, [language, assetId]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (!audioRef.current.paused) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setPlaying(true))
        .catch(err => {
          console.error("Playback failed:", err);
          setError("Audio playback failed. Please try again.");
        });
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const curr = audioRef.current.currentTime;
    const dur = audioRef.current.duration;
    setProgress(curr);
    setDuration(dur || 0);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setProgress(val);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto w-full bg-styrud-panel border border-white/[0.06] rounded-3xl p-6 shadow-xl">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-550 hover:text-white transition duration-300 w-fit"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Styrud
        </button>

        <button
          onClick={() => exportAndLaunchNotebookLM('audio', assetId)}
          title="Download sources and generate in Google NotebookLM"
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 hover:text-white rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Open in NotebookLM ↗</span>
        </button>
      </div>

      <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
        <Volume2 className="w-5 h-5 text-rose-450" />
        <div>
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">Audio Briefing</h2>
          <p className="text-[10px] text-zinc-500 mt-0.5 font-semibold">Podcast synthesis in {language}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-zinc-500">
          <div className="relative">
            <Disc className="w-12 h-12 text-rose-500 animate-spin" />
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-350">Synthesizing Voice...</span>
          <p className="text-[11px] text-zinc-600 text-center max-w-xs leading-relaxed font-semibold">
            Translating core pillars and structuring human-like dialogue files.
          </p>
        </div>
      ) : error ? (
        <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl flex gap-3 text-zinc-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider">Failed to generate</h4>
            <p className="text-xs text-zinc-500 mt-1">{error}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center py-4 gap-6">
          <audio 
            ref={audioRef}
            src={audioUrl || ''}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
          />

          {/* Glowing Red Jelly Player stage */}
          <div 
            className="relative w-44 h-44 bg-gradient-to-br from-rose-500 to-red-650 rounded-3xl flex items-center justify-center group overflow-hidden shadow-[0_0_25px_rgba(244,63,94,0.3)] animate-float cursor-pointer select-none"
            onClick={togglePlay}
          >
            {playing && (
              <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none"></div>
            )}
            <button
              type="button"
              className="relative z-10 w-20 h-20 bg-white hover:bg-zinc-200 active:scale-95 text-black rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 shadow-lg hover:shadow-white/10"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              aria-label={playing ? "Pause audio" : "Play audio"}
            >
              {playing ? <Pause className="w-8 h-8 fill-black text-black" /> : <Play className="w-8 h-8 fill-black text-black ml-1" />}
            </button>
          </div>

          <div className="w-full flex flex-col gap-2">
            <input 
              type="range"
              min={0}
              max={duration || 100}
              value={progress}
              onChange={handleSeek}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-rose-500 transition-all duration-300"
            />
            
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="w-full p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl text-zinc-400 text-xs leading-relaxed">
            <h4 className="font-bold text-rose-450 uppercase tracking-wider text-[10px] mb-1.5">Tutor Notes</h4>
            <p className="leading-relaxed font-medium">
              This overview discusses core definitions, stages, and structural parameters extracted from focused assets.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

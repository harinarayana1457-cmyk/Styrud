import React, { useState, useEffect, useRef } from 'react';
import { PlaySquare, ChevronLeft, Play, Pause, AlertCircle, Volume2, RotateCcw } from 'lucide-react';

interface Slide {
  title: string;
  bullets: string[];
  visualCue: string;
}

interface VideoOverviewProps {
  assetId: string | null;
  onBack: () => void;
}

export default function VideoOverview({ assetId, onBack }: VideoOverviewProps) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(60);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const slideUrl = assetId ? `/api/generate/slides?asset_id=${assetId}` : '/api/generate/slides';
        const slideRes = await fetch(slideUrl);
        if (!slideRes.ok) throw new Error("Failed to load slide content.");
        const slideData = await slideRes.json();
        setSlides(slideData.slides || []);

        const audioRes = await fetch('/api/audio-overview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: 'english', asset_id: assetId })
        });
        if (!audioRes.ok) throw new Error("Failed to generate narration audio.");
        const audioData = await audioRes.json();
        setAudioUrl(audioData.audio_url);
      } catch (err: any) {
        setError(err.message || "Error loading video components.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [assetId]);

  const handleTimeUpdate = () => {
    if (!audioRef.current || slides.length === 0) return;
    const current = audioRef.current.currentTime;
    const total = audioRef.current.duration || duration;
    
    setProgress(current);
    
    const slideDuration = total / slides.length;
    const index = Math.floor(current / slideDuration);
    if (index >= 0 && index < slides.length) {
      setCurrentSlide(index);
    }
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  };

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
          setError("Audio playback initialization failed.");
        });
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setProgress(0);
      setCurrentSlide(0);
      if (!playing) {
        audioRef.current.play().then(() => setPlaying(true));
      }
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full py-2">
      <button 
        onClick={onBack}
        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-555 hover:text-white transition duration-300 w-fit"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Styrud
      </button>

      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-4">
        <PlaySquare className="w-5 h-5 text-fuchsia-450" />
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Video Overview</h2>
          <p className="text-[10px] text-zinc-500 mt-0.5 font-semibold font-sans">Synchronized presentation reader stream</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-styrud-panel border border-white/[0.06] rounded-3xl h-[380px] flex flex-col items-center justify-center text-zinc-500 gap-3 shadow-xl">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-300">Assembling Video...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl flex gap-3 text-zinc-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <div>
            <h4 className="font-bold text-xs uppercase">Loading error</h4>
            <p className="text-xs text-zinc-500 mt-1">{error}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <audio 
            ref={audioRef}
            src={audioUrl || ''}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
          />

          {/* Fuchsia-Pink Gradient Synchronized Player Stage */}
          <div className="bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-600 border border-white/10 rounded-3xl aspect-video flex flex-col justify-between p-8 relative overflow-hidden shadow-[0_0_30px_rgba(217,70,239,0.15)] animate-float group">
            
            <div className="flex justify-between items-center z-10">
              <span className="text-[8px] bg-black/20 border border-white/10 text-white px-2.5 py-1 rounded-full font-bold uppercase tracking-widest font-mono">
                Video Briefing
              </span>
              <Volume2 className={`w-3.5 h-3.5 text-white ${playing ? 'animate-bounce' : 'opacity-40'}`} />
            </div>

            {/* Main Slide Content */}
            {slides.length > 0 && (
              <div className="my-auto z-10 flex flex-col justify-center max-w-lg mx-auto text-center text-white">
                <h3 className="text-lg md:text-xl font-black text-white mb-4 tracking-tight uppercase">
                  {slides[currentSlide].title}
                </h3>
                <div className="space-y-2">
                  {slides[currentSlide].bullets.map((bullet, bIdx) => (
                    <p key={bIdx} className="text-xs md:text-sm text-white/90 leading-relaxed font-bold uppercase tracking-wide">
                      {bullet}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Subtitles / Narration Visual Cue */}
            {slides.length > 0 && (
              <div className="bg-black/90 border border-white/10 p-3 rounded-2xl text-center backdrop-blur-md z-10 mx-auto max-w-lg">
                <p className="text-[8px] uppercase font-bold tracking-widest text-fuchsia-450 mb-1">Visual scene</p>
                <p className="text-[10px] text-zinc-400 italic">"{slides[currentSlide].visualCue}"</p>
              </div>
            )}
          </div>

          {/* Player controls */}
          <div className="bg-styrud-panel border border-white/[0.06] rounded-3xl p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="w-10 h-10 bg-white hover:bg-zinc-200 active:scale-95 text-black rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 shadow"
              >
                {playing ? <Pause className="w-5 h-5 fill-black text-black" /> : <Play className="w-5 h-5 fill-black text-black ml-0.5" />}
              </button>

              <button
                onClick={handleRestart}
                className="p-2 bg-white/[0.02] hover:bg-white/[0.05] text-zinc-400 hover:text-white border border-white/10 rounded-full transition-all duration-300 active:scale-95"
                title="Restart"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Video Progress Bar */}
            <div className="flex-1 mx-6 flex items-center gap-3">
              <div className="h-1 bg-white/10 rounded-full flex-1 overflow-hidden relative">
                <div 
                  className="h-full bg-fuchsia-500 rounded-full transition-all duration-100"
                  style={{ width: `${(progress / duration) * 100}%` }}
                ></div>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                {Math.floor(progress / 60)}:{(progress % 60) < 10 ? '0' : ''}{Math.floor(progress % 60)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

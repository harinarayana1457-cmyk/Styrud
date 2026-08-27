import React, { useState, useEffect } from 'react';
import { Presentation, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

interface Slide {
  title: string;
  bullets: string[];
  visualCue: string;
}

interface SlideDeckViewerProps {
  assetId: string | null;
  onBack: () => void;
}

export default function SlideDeckViewer({ assetId, onBack }: SlideDeckViewerProps) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSlides = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = assetId ? `/api/generate/slides?asset_id=${assetId}` : '/api/generate/slides';
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to generate slide deck.");
        const data = await res.json();
        setSlides(data.slides || []);
      } catch (err: any) {
        setError(err.message || "Error generating presentation.");
      } finally {
        setLoading(false);
      }
    };

    fetchSlides();
  }, [assetId]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full py-2">
      <button 
        onClick={onBack}
        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-555 hover:text-white transition duration-300 w-fit"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Studio
      </button>

      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-2">
          <Presentation className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Slide Deck Viewer</h2>
            <p className="text-[10px] text-zinc-500 mt-0.5 font-semibold">Geometric visual outline cards</p>
          </div>
        </div>
        <div className="text-[10px] text-zinc-500 font-mono">
          {slides.length > 0 ? currentSlide + 1 : 0} / {slides.length}
        </div>
      </div>

      {loading ? (
        <div className="bg-studio-panel border border-white/[0.06] rounded-3xl h-[380px] flex flex-col items-center justify-center text-zinc-500 gap-3 shadow-xl">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-300">Assembling Slides...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl text-zinc-400 text-xs">
          {error}
        </div>
      ) : slides.length === 0 ? (
        <div className="bg-studio-panel border border-white/[0.06] rounded-3xl h-[380px] flex items-center justify-center text-zinc-500 shadow-xl text-xs uppercase tracking-wider font-bold">
          No slides found
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Cyber Yellow Slide Stage */}
          <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 border border-white/10 rounded-3xl h-[360px] flex flex-col shadow-[0_0_30px_rgba(245,158,11,0.15)] relative overflow-hidden group text-black">
            <div className="flex-1 p-8 flex flex-col justify-between">
              
              {/* Slide Title */}
              <div>
                <h3 className="text-xl font-black text-black tracking-tight border-b border-black/10 pb-4 mb-6 uppercase">
                  {slides[currentSlide].title}
                </h3>
                
                {/* Slide Bullets */}
                <ul className="space-y-4">
                  {slides[currentSlide].bullets.map((b, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-black">
                      <span className="w-1.5 h-1.5 rounded-full bg-black mt-1.5 shrink-0 opacity-50"></span>
                      <span className="text-sm md:text-base leading-relaxed font-bold uppercase tracking-wide">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Slide footer branding */}
              <div className="flex justify-between items-center text-[9px] text-black/50 uppercase tracking-widest font-mono font-bold">
                <span>Visual Studio Model</span>
                <span>{currentSlide + 1} of {slides.length}</span>
              </div>
            </div>

            {/* Slide Visual Cue overlay on hover */}
            <div className="absolute inset-x-0 bottom-0 bg-black/90 border-t border-white/10 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex gap-3 z-10 backdrop-blur-md">
              <Eye className="w-4 h-4 text-amber-450 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[9px] font-bold text-amber-450 uppercase tracking-wider mb-1">Director's Stage Cue</h4>
                <p className="text-xs text-zinc-400 italic leading-relaxed">"{slides[currentSlide].visualCue}"</p>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center bg-studio-panel border border-white/[0.06] rounded-3xl p-4 shadow-md">
            <button
              onClick={handlePrev}
              disabled={currentSlide === 0}
              className={`px-5 py-2.5 border border-white/10 hover:bg-white/5 text-zinc-350 hover:text-white rounded-full font-bold text-xs transition duration-300 flex items-center gap-1 active:scale-95 ${
                currentSlide === 0 ? 'opacity-30 cursor-not-allowed' : ''
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </button>

            {/* Dot indicators */}
            <div className="flex gap-1.5">
              {slides.map((_, idx) => (
                <span
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-all duration-300 ${
                    idx === currentSlide ? 'bg-amber-450 scale-125' : 'bg-white/10 hover:bg-white/30'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={currentSlide === slides.length - 1}
              className={`px-5 py-2.5 bg-white hover:bg-zinc-200 text-black rounded-full font-bold text-xs transition duration-300 flex items-center gap-1 active:scale-95 ${
                currentSlide === slides.length - 1 ? 'opacity-30 cursor-not-allowed' : ''
              }`}
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

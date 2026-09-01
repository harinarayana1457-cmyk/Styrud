import React, { useState, useEffect } from 'react';
import { Layers, ChevronLeft, RotateCw, CheckCircle2, Sparkles } from 'lucide-react';
import { exportAndLaunchNotebookLM } from '../utils/notebooklmBridge';

interface Flashcard {
  front: string;
  back: string;
}

interface FlashcardViewerProps {
  assetId: string | null;
  onBack: () => void;
}

export default function FlashcardViewer({ assetId, onBack }: FlashcardViewerProps) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [knownCards, setKnownCards] = useState<boolean[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = assetId ? `/api/generate/flashcards?asset_id=${assetId}` : '/api/generate/flashcards';
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load flashcards.");
        const data = await res.json();
        const loaded = data.flashcards || [];
        setCards(loaded);
        setKnownCards(new Array(loaded.length).fill(false));
      } catch (err: any) {
        setError(err.message || "Error generating flashcards.");
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, [assetId]);

  const handleNext = () => {
    setFlipped(false);
    if (currentIdx < cards.length - 1) {
      setCurrentIdx(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setFlipped(false);
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
    }
  };

  const toggleKnown = () => {
    const updated = [...knownCards];
    const newState = !updated[currentIdx];
    updated[currentIdx] = newState;
    setKnownCards(updated);
    setKnownCount(updated.filter(Boolean).length);
  };

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto w-full py-2">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-555 hover:text-white transition duration-300 w-fit"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Styrud
        </button>

        <button
          onClick={() => exportAndLaunchNotebookLM('flashcards', assetId)}
          title="Download sources and generate in Google NotebookLM"
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 hover:text-white rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Open in NotebookLM ↗</span>
        </button>
      </div>

      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-400" />
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Recall Flashcards</h2>
            <p className="text-[10px] text-zinc-500 mt-0.5 font-semibold">Verify memory retrieval retention metrics</p>
          </div>
        </div>
        {!loading && cards.length > 0 && (
          <div className="text-[10px] text-zinc-500 font-mono">
            {currentIdx + 1} / {cards.length}
          </div>
        )}
      </div>

      {loading ? (
        <div className="bg-styrud-panel border border-white/[0.06] rounded-3xl h-[300px] flex flex-col items-center justify-center text-zinc-500 gap-3 shadow-xl">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-300">Drafting Cards...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl text-zinc-400 text-xs">
          {error}
        </div>
      ) : cards.length === 0 ? (
        <div className="bg-styrud-panel border border-white/[0.06] rounded-3xl h-[300px] flex items-center justify-center text-zinc-500 shadow-xl text-xs uppercase tracking-wider font-bold">
          No cards generated
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Card Flashing Board with Deep Purple Gradient */}
          <div 
            onClick={() => setFlipped(!flipped)}
            className="perspective-1000 w-full h-64 cursor-pointer select-none group"
          >
            <div className={`relative w-full h-full duration-500 transform-style-3d ${flipped ? 'rotate-y-180' : ''}`}>
              
              {/* Front Side: Deep Purple Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-650 border border-white/10 rounded-3xl p-6 flex flex-col justify-between items-center text-center backface-hidden shadow-[0_0_25px_rgba(139,92,246,0.2)] group-hover:scale-[1.01] hover:border-white/20 transition-all duration-300">
                <span className="text-[8px] border border-white/15 text-zinc-200 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest font-mono">
                  Prompt
                </span>
                
                <h3 className="text-sm md:text-base font-bold text-white max-w-sm leading-relaxed px-4 uppercase tracking-wider">
                  {cards[currentIdx].front}
                </h3>
                
                <div className="flex items-center gap-1 text-[10px] text-white/50 font-bold uppercase tracking-wider">
                  <RotateCw className="w-3 h-3 group-hover:animate-spin" />
                  <span>Reveal explanation</span>
                </div>
              </div>

              {/* Back Side: White Bubble style */}
              <div className="absolute inset-0 bg-white text-black border border-white rounded-3xl p-6 flex flex-col justify-between items-center text-center backface-hidden rotate-y-180 shadow-xl">
                <span className="text-[8px] bg-black/5 text-black/50 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest font-mono">
                  Concept Solution
                </span>

                <p className="text-xs md:text-sm font-semibold leading-relaxed overflow-y-auto max-h-40 px-2">
                  {cards[currentIdx].back}
                </p>

                <div className="text-[8px] text-black/45 font-bold uppercase tracking-widest">
                  Styrud Active Recall
                </div>
              </div>

            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-between items-center bg-styrud-panel border border-white/[0.06] rounded-3xl p-4 shadow-md">
            <button
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className={`px-4 py-2 border border-white/10 hover:bg-white/5 text-zinc-350 hover:text-white rounded-full font-bold text-[10px] uppercase tracking-wider transition-all duration-300 flex items-center gap-1 active:scale-95 ${
                currentIdx === 0 ? 'opacity-30 cursor-not-allowed' : ''
              }`}
            >
              Prev
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleKnown();
              }}
              className={`px-4 py-2 border rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-1.5 active:scale-95 ${
                knownCards[currentIdx]
                  ? 'bg-white border-white text-black'
                  : 'bg-transparent border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
              }`}
            >
              {knownCards[currentIdx] ? 'Mastered' : 'Mark Mastered'}
            </button>

            <button
              onClick={handleNext}
              disabled={currentIdx === cards.length - 1}
              className={`px-4 py-2 border border-white/10 hover:bg-white/5 text-zinc-355 hover:text-white rounded-full font-bold text-[10px] uppercase tracking-wider transition-all duration-300 flex items-center gap-1 active:scale-95 ${
                currentIdx === cards.length - 1 ? 'opacity-30 cursor-not-allowed' : ''
              }`}
            >
              Next
            </button>
          </div>

          {/* Mastery metrics */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
              <span>Card retention rate</span>
              <span>{knownCount} / {cards.length} cards mastered</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden border border-white/[0.03]">
              <div 
                className="h-full bg-white transition-all duration-500"
                style={{ width: `${(knownCount / cards.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

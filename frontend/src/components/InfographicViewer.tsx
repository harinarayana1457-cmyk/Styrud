import React, { useState, useEffect } from 'react';
import { BarChart4, ChevronLeft, Calendar, ArrowRight, Tag, Sparkles } from 'lucide-react';
import { exportAndLaunchNotebookLM } from '../utils/notebooklmBridge';

interface InfographicItem {
  label: string;
  value: string;
  description: string;
}

interface InfographicSegment {
  title: string;
  type: string;
  items: InfographicItem[];
}

interface InfographicViewerProps {
  assetId: string | null;
  onBack: () => void;
}

export default function InfographicViewer({ assetId, onBack }: InfographicViewerProps) {
  const [infographics, setInfographics] = useState<InfographicSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInfographic = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = assetId ? `/api/generate/infographic?asset_id=${assetId}` : '/api/generate/infographic';
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to generate infographic schema.");
        const data = await res.json();
        setInfographics(data.infographics || []);
      } catch (err: any) {
        setError(err.message || "Error generating infographic.");
      } finally {
        setLoading(false);
      }
    };

    fetchInfographic();
  }, [assetId]);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full py-2">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-555 hover:text-white transition duration-300 w-fit"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Styrud
        </button>

        <button
          onClick={() => exportAndLaunchNotebookLM('infographic', assetId)}
          title="Download sources and generate in Google NotebookLM"
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 hover:text-white rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Open in NotebookLM ↗</span>
        </button>
      </div>

      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-2">
          <BarChart4 className="w-5 h-5 text-pink-450 animate-pulse" />
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Visual Infographics</h2>
            <p className="text-[10px] text-zinc-500 mt-0.5 font-semibold">Structured milestone graphs and metric cards</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-styrud-panel border border-white/[0.06] rounded-3xl h-[380px] flex flex-col items-center justify-center text-zinc-500 gap-3 shadow-xl">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-300">Assembling Infographics...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl text-zinc-400 text-xs">
          {error}
        </div>
      ) : infographics.length === 0 ? (
        <div className="bg-styrud-panel border border-white/[0.06] rounded-3xl h-[380px] flex items-center justify-center text-zinc-500 shadow-xl text-xs uppercase tracking-wider font-bold">
          No datasets parsed
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {infographics.map((seg, sIdx) => {
            const isStat = seg.type === 'stat';
            const isTimeline = seg.type === 'timeline' || seg.type === 'process';
            
            return (
              <div key={sIdx} className="bg-styrud-panel border border-white/[0.06] rounded-3xl p-6 shadow-xl flex flex-col gap-5">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping"></span>
                    {seg.title}
                  </h3>
                  <p className="text-[9px] text-zinc-550 uppercase tracking-widest font-mono">Format: {seg.type}</p>
                </div>

                {/* Stat Grid with neon cyan and pink outlines */}
                {isStat && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {seg.items.map((item, idx) => (
                      <div key={idx} className="bg-black border border-white/[0.06] p-5 rounded-2xl flex flex-col justify-between h-36 hover:border-pink-500/20 hover:shadow-[0_0_15px_rgba(236,72,153,0.1)] transition-all duration-500 animate-float">
                        <div className="text-2xl font-black text-white tracking-tighter">{item.value}</div>
                        <div className="mt-2">
                          <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">{item.label}</h4>
                          <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Timeline Horizontal flow with curvy lime highlight outlines */}
                {isTimeline && (
                  <div className="flex flex-col lg:flex-row items-stretch gap-4 overflow-x-auto pb-2">
                    {seg.items.map((item, idx) => (
                      <React.Fragment key={idx}>
                        <div className="bg-black border border-white/[0.06] p-5 rounded-2xl flex-1 min-w-[220px] flex flex-col justify-between hover:border-lime-500/20 hover:shadow-[0_0_15px_rgba(132,204,22,0.1)] transition-all duration-500">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-[8px] font-bold text-lime-400 border border-lime-500/20 bg-lime-500/[0.03] px-2.5 py-1 rounded-full font-mono uppercase tracking-widest">
                              Stage {item.value}
                            </span>
                            <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider mb-1">{item.label}</h4>
                            <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">{item.description}</p>
                          </div>
                        </div>
                        {idx < seg.items.length - 1 && (
                          <div className="hidden lg:flex items-center justify-center text-zinc-700 animate-pulse">
                            <ArrowRight className="w-4 h-4 shrink-0 opacity-40" />
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {/* Key Value list card layout */}
                {!isStat && !isTimeline && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {seg.items.map((item, idx) => (
                      <div key={idx} className="bg-black border border-white/[0.06] p-4.5 rounded-2xl flex gap-3.5 hover:border-white/20 transition-all duration-300">
                        <div className="p-2.5 bg-white/[0.03] border border-white/5 text-purple-400 rounded-xl h-fit">
                          <Tag className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider mb-0.5">{item.label}</h4>
                          {item.value && <span className="text-[10px] text-purple-400 font-mono font-bold tracking-widest">{item.value}</span>}
                          <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed font-medium">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

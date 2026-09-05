import React, { useState, useEffect } from 'react';
import { Network, ChevronLeft, ChevronRight, ChevronDown, Sparkles } from 'lucide-react';
import { exportAndLaunchNotebookLM } from '../utils/notebooklmBridge';

interface MindNode {
  name: string;
  children?: MindNode[];
}

interface MindMapViewerProps {
  assetId: string | null;
  onBack: () => void;
}

function TreeNode({ node, depth = 0 }: { node: MindNode; depth: number }) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col ml-6 border-l border-white/5 pl-4 my-2 relative">
      {/* Lime pulse dot indicator */}
      <span className="w-1.5 h-1.5 rounded-full bg-lime-400 absolute -left-[4.5px] top-3.5 shadow-[0_0_5px_#84cc16]"></span>
      
      <div className="flex items-center gap-1.5 group">
        {hasChildren && (
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-white/5 text-zinc-550 hover:text-white rounded transition duration-305"
          >
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        )}
        <div className={`px-4 py-2 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all duration-500 hover:scale-[1.03] ${
          depth === 0 
            /* Root node: Lime green theme */
            ? 'bg-gradient-to-br from-lime-400 to-green-500 text-black border-transparent shadow-[0_0_20px_rgba(132,204,22,0.3)] animate-float' 
            : depth === 1
            ? 'bg-gradient-to-br from-styrud-panel to-styrud-panel border-white/10 text-zinc-200 shadow'
            : 'bg-transparent border-white/[0.04] text-zinc-500 font-bold'
        }`}>
          {node.name}
        </div>
      </div>
      
      {isOpen && hasChildren && (
        <div className="flex flex-col mt-1.5">
          {node.children!.map((child, idx) => (
            <TreeNode key={idx} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

import { safeFetchJson, getSeededData } from '../utils/seededData';

export default function MindMapViewer({ assetId, onBack }: MindMapViewerProps) {
  const [mindmap, setMindmap] = useState<MindNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMindmap = async () => {
      setLoading(true);
      setError(null);
      try {
        const fallback = getSeededData('mindmap');
        const url = assetId ? `/api/generate/mindmap?asset_id=${assetId}` : '/api/generate/mindmap';
        const data = await safeFetchJson(url, fallback);
        setMindmap(data.mindmap || fallback.mindmap || null);
      } catch (err: any) {
        const fallback = getSeededData('mindmap');
        setMindmap(fallback.mindmap);
      } finally {
        setLoading(false);
      }
    };

    fetchMindmap();
  }, [assetId]);

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full py-2">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-555 hover:text-white transition duration-300 w-fit"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Styrud
        </button>

        <button
          onClick={() => exportAndLaunchNotebookLM('mindmap', assetId)}
          title="Download sources and generate in Google NotebookLM"
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 hover:text-white rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Open in NotebookLM ↗</span>
        </button>
      </div>

      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-lime-450 animate-pulse" />
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Concept Node Map</h2>
            <p className="text-[10px] text-zinc-500 mt-0.5 font-semibold">Interactive logical node hierarchies</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-styrud-panel border border-white/[0.06] rounded-3xl h-[380px] flex flex-col items-center justify-center text-zinc-500 gap-3 shadow-xl">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-300">Structuring Map...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl text-zinc-400 text-xs">
          {error}
        </div>
      ) : !mindmap ? (
        <div className="bg-styrud-panel border border-white/[0.06] rounded-3xl h-[380px] flex items-center justify-center text-zinc-500 shadow-xl text-xs uppercase tracking-wider font-bold">
          No mind map generated
        </div>
      ) : (
        <div className="bg-styrud-panel border border-white/[0.06] rounded-3xl p-6 md:p-8 shadow-xl overflow-x-auto min-h-[420px] relative">
          <TreeNode node={mindmap} depth={0} />
        </div>
      )}
    </div>
  );
}

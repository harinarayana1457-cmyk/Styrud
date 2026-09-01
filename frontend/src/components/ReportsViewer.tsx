import React, { useState, useEffect } from 'react';
import { FileText, ChevronLeft, Sparkles } from 'lucide-react';
import { exportAndLaunchNotebookLM } from '../utils/notebooklmBridge';

interface ReportsViewerProps {
  assetId: string | null;
  onBack: () => void;
}

export default function ReportsViewer({ assetId, onBack }: ReportsViewerProps) {
  const [report, setReport] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = assetId ? `/api/generate/report?asset_id=${assetId}` : '/api/generate/report';
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to generate comprehensive report.");
        const data = await res.json();
        setReport(data.data || '');
      } catch (err: any) {
        setError(err.message || "Error generating report.");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [assetId]);

  // Self-contained light Markdown renderer to avoid npm installation complexity
  const renderMarkdown = (md: string) => {
    if (!md) return null;
    return md.split('\n').map((line, idx) => {
      const cleanLine = line.trim();
      
      if (cleanLine.startsWith('# ')) {
        return (
          <h1 key={idx} className="text-2xl font-black text-white mt-6 mb-4 border-b border-white/[0.06] pb-3 uppercase tracking-wider">
            {cleanLine.slice(2)}
          </h1>
        );
      }
      if (cleanLine.startsWith('## ')) {
        return (
          <h2 key={idx} className="text-base font-bold text-white mt-6 mb-3 uppercase tracking-wide flex items-center gap-2">
            <span className="w-1 h-3.5 bg-cyan-400 rounded animate-pulse"></span>
            {cleanLine.slice(3)}
          </h2>
        );
      }
      if (cleanLine.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-sm font-bold text-zinc-300 mt-4 mb-2 uppercase">
            {cleanLine.slice(4)}
          </h3>
        );
      }
      if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
        const bulletText = cleanLine.slice(2);
        const boldParts = bulletText.split('**');
        return (
          <li key={idx} className="ml-6 list-disc text-zinc-400 my-1.5 leading-relaxed text-xs md:text-sm font-semibold">
            {boldParts.map((p, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-white font-bold">{p}</strong> : p)}
          </li>
        );
      }
      if (cleanLine === '') {
        return <div key={idx} className="h-3"></div>;
      }
      
      const boldParts = cleanLine.split('**');
      return (
        <p key={idx} className="text-zinc-400 leading-relaxed my-2.5 text-xs md:text-sm font-semibold">
          {boldParts.map((p, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-white font-bold">{p}</strong> : p)}
        </p>
      );
    });
  };

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
          onClick={() => exportAndLaunchNotebookLM('reports', assetId)}
          title="Download sources and generate in Google NotebookLM"
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 hover:text-white rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Open in NotebookLM ↗</span>
        </button>
      </div>

      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-cyan-400 animate-bounce" />
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Research Summary Report</h2>
            <p className="text-[10px] text-zinc-500 mt-0.5 font-semibold">Deep logic synthesis outlines</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-styrud-panel border border-white/[0.06] rounded-3xl h-[400px] flex flex-col items-center justify-center text-zinc-500 gap-3 shadow-xl">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-300">Compiling Report Documents...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl text-zinc-400 text-xs">
          {error}
        </div>
      ) : (
        <div className="bg-styrud-panel border border-white/[0.06] rounded-3xl p-6 md:p-8 shadow-xl">
          <div className="prose prose-invert max-w-none">
            {renderMarkdown(report)}
          </div>
        </div>
      )}
    </div>
  );
}

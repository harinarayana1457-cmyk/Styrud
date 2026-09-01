import React, { useState } from 'react';
import { 
  ExternalLink, 
  Copy, 
  Check, 
  Download, 
  Sparkles, 
  X, 
  ArrowUpRight, 
  FileText 
} from 'lucide-react';
import { copyToClipboard, triggerFileDownload } from '../utils/notebooklmBridge';

interface NotebookLMModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolTitle: string;
  prompt: string;
  filename: string;
  assetsCount: number;
  fileContent?: string;
}

export default function NotebookLMModal({
  isOpen,
  onClose,
  toolTitle,
  prompt,
  filename,
  assetsCount,
  fileContent
}: NotebookLMModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    const success = await copyToClipboard(prompt);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleRedownload = () => {
    if (fileContent) {
      triggerFileDownload(filename, fileContent);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg liquid-glass border border-purple-500/30 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(168,85,247,0.25)] flex flex-col gap-6 text-white">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with gradient badge */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-2xl shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                Bridge Active
              </span>
            </div>
            <h2 className="text-xl font-bold uppercase tracking-wide text-white mt-1">
              Google NotebookLM
            </h2>
          </div>
        </div>

        {/* Step Guide */}
        <div className="flex flex-col gap-3.5 bg-black/40 border border-white/10 rounded-2xl p-4 text-xs">
          
          {/* Step 1: Download File */}
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-lime-500/20 text-lime-400 font-bold font-mono text-[11px] shrink-0 mt-0.5 border border-lime-500/30">
              1
            </div>
            <div className="flex-1">
              <span className="font-semibold text-zinc-200">Sources Packaged & Downloaded</span>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                <span className="text-lime-400 font-mono font-semibold">{filename}</span> ({assetsCount} sources combined) was saved to your downloads.
              </p>
            </div>
            {fileContent && (
              <button
                onClick={handleRedownload}
                title="Download file again"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Step 2: Prompt Copied */}
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold font-mono text-[11px] shrink-0 mt-0.5 border border-cyan-500/30">
              2
            </div>
            <div className="flex-1">
              <span className="font-semibold text-zinc-200">{toolTitle} Prompt Copied</span>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Specialized prompt for NotebookLM is already on your clipboard!
              </p>
            </div>
            <button
              onClick={handleCopy}
              title="Copy prompt again"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-lime-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Step 3: Execute in NotebookLM */}
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 font-bold font-mono text-[11px] shrink-0 mt-0.5 border border-purple-500/30">
              3
            </div>
            <div className="flex-1">
              <span className="font-semibold text-zinc-200">Drop into NotebookLM</span>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Drop the downloaded file into Google NotebookLM and paste your clipboard prompt (<kbd className="bg-white/10 px-1 py-0.5 rounded font-mono text-[10px]">Ctrl+V</kbd>).
              </p>
            </div>
          </div>
        </div>

        {/* Prompt Preview Snippet */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-zinc-400">
            <span>Specialized Prompt:</span>
            <button 
              onClick={handleCopy} 
              className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition"
            >
              {copied ? <Check className="w-3 h-3 text-lime-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy Prompt'}
            </button>
          </div>
          <div className="bg-black/60 border border-white/10 rounded-xl p-3 text-[11px] text-zinc-300 italic max-h-24 overflow-y-auto leading-relaxed">
            "{prompt}"
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition"
          >
            Done / Close
          </button>

          <button
            onClick={() => window.open('https://notebooklm.google.com', '_blank')}
            className="flex-1 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 active:scale-95 text-white rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
          >
            <span>Open NotebookLM Tab</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}

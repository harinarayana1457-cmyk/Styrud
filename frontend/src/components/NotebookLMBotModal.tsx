import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X, 
  KeyRound, 
  Play, 
  Eye, 
  ArrowUpRight 
} from 'lucide-react';

interface NotebookLMBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolId: string;
  toolTitle: string;
  assetId: string | null;
}

export default function NotebookLMBotModal({
  isOpen,
  onClose,
  toolId,
  toolTitle,
  assetId
}: NotebookLMBotModalProps) {
  const [running, setRunning] = useState(false);
  const [visibleMode, setVisibleMode] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<string>('idle');

  if (!isOpen) return null;

  const handleStartBot = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    setStep('launching');

    try {
      setStep('connecting');
      const res = await fetch('/api/notebooklm-bot/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_id: toolId,
          asset_id: assetId,
          visible: visibleMode
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Bot execution encountered an issue.');
      }

      const data = await res.json();
      if (!data.success) {
        if (data.needs_login) {
          setError(data.message || 'Google Login required. Please log into Google in the opened browser.');
        } else {
          setError(data.message || data.error || 'Failed to complete task in NotebookLM.');
        }
      } else {
        setResult(data);
        setStep('done');
      }
    } catch (err: any) {
      console.error('Bot execution error:', err);
      setError(err.message || 'Error executing Playwright NotebookLM bot.');
    } finally {
      setRunning(false);
    }
  };

  const handleOpenGoogleLogin = async () => {
    try {
      await fetch('/api/notebooklm-bot/login', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl liquid-glass border border-purple-500/30 rounded-3xl p-6 md:p-8 shadow-[0_0_60px_rgba(168,85,247,0.3)] flex flex-col gap-6 text-white">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 rounded-2xl shadow-lg">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-purple-300 bg-purple-500/20 px-2.5 py-0.5 rounded-full border border-purple-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" />
                Playwright Automation Bot
              </span>
            </div>
            <h2 className="text-xl font-bold uppercase tracking-wide text-white mt-1">
              Automate {toolTitle} in NotebookLM
            </h2>
          </div>
        </div>

        {/* Description & Mode Controls */}
        <div className="flex flex-col gap-3 bg-black/40 border border-white/10 rounded-2xl p-4 text-xs">
          <p className="text-zinc-300 leading-relaxed">
            This bot controls a local Chrome session with your saved Google profile, automatically creates a new notebook in Google NotebookLM, pastes your study source materials, and triggers <strong>{toolTitle}</strong>!
          </p>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div className="flex items-center gap-2 text-zinc-300">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold text-[11px]">Visible Browser Window</span>
            </div>
            <button
              onClick={() => setVisibleMode(!visibleMode)}
              className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-300 ${
                visibleMode ? 'bg-purple-600' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                  visibleMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Progress or Status */}
        {running ? (
          <div className="flex flex-col items-center justify-center p-6 bg-purple-950/20 border border-purple-500/20 rounded-2xl gap-3">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest text-purple-200">
              {step === 'launching' && '🚀 Launching Chrome Browser Session...'}
              {step === 'connecting' && '🌐 Connecting to NotebookLM & Creating Notebook...'}
            </span>
            <p className="text-[11px] text-zinc-400 text-center max-w-sm">
              Watch your browser window as it creates the notebook and uploads the sources automatically!
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-200">
            <div className="flex items-center gap-2 font-bold text-rose-300">
              <AlertCircle className="w-4 h-4" />
              <span>Authentication or Automation Notice</span>
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-300">{error}</p>
            <button
              onClick={handleOpenGoogleLogin}
              className="mt-1 self-start px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-[10px] font-bold uppercase tracking-wider text-white transition flex items-center gap-1.5"
            >
              <KeyRound className="w-3 h-3 text-yellow-400" />
              <span>Open Google Sign-In Window</span>
            </button>
          </div>
        ) : result ? (
          <div className="flex flex-col gap-3 p-4 bg-lime-500/10 border border-lime-500/30 rounded-2xl text-xs text-lime-200">
            <div className="flex items-center gap-2 font-bold text-lime-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Notebook Created & Executed Successfully!</span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              Your source material was uploaded and the task was triggered inside Google NotebookLM.
            </p>
            {result.notebook_url && (
              <button
                onClick={() => window.open(result.notebook_url, '_blank')}
                className="mt-1 self-start px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow-md"
              >
                <span>View Notebook in Tab</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition"
          >
            Cancel
          </button>

          <button
            onClick={handleStartBot}
            disabled={running}
            className="flex-1 px-6 py-2.5 bg-gradient-to-r from-purple-500 via-indigo-600 to-pink-600 hover:from-purple-400 hover:to-indigo-500 active:scale-95 disabled:opacity-50 text-white rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{running ? 'Running Automation...' : 'Launch Bot in NotebookLM'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}

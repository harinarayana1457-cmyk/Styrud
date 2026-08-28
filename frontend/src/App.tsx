import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderOpen, 
  Plus, 
  Link2, 
  FileText, 
  Trash2, 
  Send, 
  HelpCircle, 
  Network, 
  LayoutDashboard,
  Brain,
  AlertCircle,
  Database,
  Volume2,
  Presentation,
  PlaySquare,
  Layers,
  BarChart4,
  Table,
  Key,
  X
} from 'lucide-react';

// View components
import StyrudDashboard from './components/StyrudDashboard';
import RecallGraph from './components/RecallGraph';
import AudioOverview from './components/AudioOverview';
import SlideDeckViewer from './components/SlideDeckViewer';
import VideoOverview from './components/VideoOverview';
import MindMapViewer from './components/MindMapViewer';
import ReportsViewer from './components/ReportsViewer';
import FlashcardViewer from './components/FlashcardViewer';
import QuizViewer from './components/QuizViewer';
import InfographicViewer from './components/InfographicViewer';
import DataTableViewer from './components/DataTableViewer';
import MagnificationDock from './components/MagnificationDock';

interface Asset {
  id: string;
  title: string;
  type: string;
  created_at: string;
  content_preview: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface Status {
  status: string;
  api_keys_configured: {
    gemini: boolean;
    claude: boolean;
  };
  is_fallback_mode: boolean;
  assets_count: number;
}

export default function App() {
  // Sidebar states
  const [assets, setAssets] = useState<Asset[]>([]);
  const [status, setStatus] = useState<Status | null>(null);
  const [uploading, setUploading] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [showAddLink, setShowAddLink] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Dynamic layout width variables (resizable sidebars)
  const [leftWidth, setLeftWidth] = useState(300);
  const [rightWidth, setRightWidth] = useState(330);

  // App layouts
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [showRecallGraph, setShowRecallGraph] = useState(false);
  const [extraParams, setExtraParams] = useState<any>(null);

  // Chat/multitasking states
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // API Key modal states
  const [showKeysModal, setShowKeysModal] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [claudeKeyInput, setClaudeKeyInput] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.5;
    }
  }, []);


  // Load backend status and assets list
  const fetchStatusAndAssets = async () => {
    try {
      const statusRes = await fetch('/api/status');
      const statusData = await statusRes.json();
      setStatus(statusData);

      // Auto prompt on startup if Gemini key not set and not skipped yet
      if (!statusData.api_keys_configured.gemini && !sessionStorage.getItem('keys_prompt_dismissed')) {
        setShowKeysModal(true);
      }

      const assetsRes = await fetch('/api/assets');
      const assetsData = await assetsRes.json();
      setAssets(assetsData);
    } catch (e) {
      console.error("Error connecting to backend:", e);
    }
  };

  useEffect(() => {
    fetchStatusAndAssets();
  }, [refreshTrigger]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', files[0]);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.detail || "Upload failed.");
      } else {
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error connecting to upload endpoint.");
    } finally {
      setUploading(false);
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkTitle || !linkUrl) return;

    try {
      const res = await fetch('/api/add-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: linkTitle, url: linkUrl }),
      });

      if (res.ok) {
        setLinkTitle('');
        setLinkUrl('');
        setShowAddLink(false);
        setRefreshTrigger(prev => prev + 1);
      } else {
        alert("Failed to add link.");
      }
    } catch (err) {
      console.error("Add link error:", err);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!confirm("Are you sure you want to delete this learning source?")) return;
    try {
      const res = await fetch(`/api/delete-asset/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        if (selectedAssetId === id) setSelectedAssetId(null);
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      console.error("Delete asset error:", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: chatInput };
    setChatHistory(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage.content,
          history: chatHistory,
          asset_id: selectedAssetId
        }),
      });

      if (!res.ok) throw new Error("Q&A search failed.");
      const data = await res.json();
      
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      console.error("Q&A request failed:", err);
      setChatHistory(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an issue querying the source database." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSaveKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/save-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gemini_api_key: geminiKeyInput,
          anthropic_api_key: claudeKeyInput
        })
      });
      if (res.ok) {
        alert("API keys saved and configured successfully.");
        setShowKeysModal(false);
        setRefreshTrigger(prev => prev + 1);
      } else {
        alert("Failed to save keys.");
      }
    } catch (err) {
      console.error("Error saving keys:", err);
    }
  };

  const handleSkipKeys = () => {
    sessionStorage.setItem('keys_prompt_dismissed', 'true');
    setShowKeysModal(false);
  };

  // Drag handler for Left Sidebar resizing
  const handleLeftMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(240, Math.min(450, startWidth + (moveEvent.clientX - startX)));
      setLeftWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Drag handler for Right Sidebar resizing
  const handleRightMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(260, Math.min(480, startWidth - (moveEvent.clientX - startX)));
      setRightWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const dockItems = [
    {
      icon: <LayoutDashboard size={20} />,
      label: 'Dashboard',
      onClick: () => {
        setShowRecallGraph(false);
        setActiveTool(null);
      },
      className: 'bg-white text-black border-transparent shadow-[0_0_15px_rgba(255,255,255,0.15)]'
    },
    {
      icon: <Network size={20} />,
      label: 'Recall Graph',
      onClick: () => {
        setShowRecallGraph(true);
        setActiveTool(null);
      },
      className: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-650 shadow-[0_0_15px_rgba(139,92,246,0.25)]'
    },
    {
      icon: <Volume2 size={20} />,
      label: 'Audio Overview',
      onClick: () => {
        setShowRecallGraph(false);
        setActiveTool('audio');
        setExtraParams({ language: 'english' });
      },
      className: 'bg-gradient-to-br from-rose-500 to-red-650 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
    },
    {
      icon: <Presentation size={20} />,
      label: 'Slide deck',
      onClick: () => {
        setShowRecallGraph(false);
        setActiveTool('slides');
      },
      className: 'bg-gradient-to-br from-amber-400 to-yellow-550 text-black shadow-[0_0_15px_rgba(245,158,11,0.25)]'
    },
    {
      icon: <PlaySquare size={20} />,
      label: 'Video Overview',
      onClick: () => {
        setShowRecallGraph(false);
        setActiveTool('video');
      },
      className: 'bg-gradient-to-br from-fuchsia-400 to-pink-500 shadow-[0_0_15px_rgba(217,70,239,0.25)]'
    },
    {
      icon: <Network size={20} />,
      label: 'Mind Map',
      onClick: () => {
        setShowRecallGraph(false);
        setActiveTool('mindmap');
      },
      className: 'bg-gradient-to-br from-lime-400 to-green-500 text-black shadow-[0_0_15px_rgba(132,204,22,0.25)]'
    },
    {
      icon: <FileText size={20} />,
      label: 'Reports',
      onClick: () => {
        setShowRecallGraph(false);
        setActiveTool('reports');
      },
      className: 'bg-gradient-to-br from-cyan-400 to-blue-500 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
    },
    {
      icon: <Layers size={20} />,
      label: 'Flashcards',
      onClick: () => {
        setShowRecallGraph(false);
        setActiveTool('flashcards');
      },
      className: 'bg-gradient-to-br from-violet-500 to-purple-650 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
    },
    {
      icon: <HelpCircle size={20} />,
      label: 'Quiz',
      onClick: () => {
        setShowRecallGraph(false);
        setActiveTool('quiz');
      },
      className: 'bg-gradient-to-br from-indigo-500 to-violet-650 shadow-[0_0_15px_rgba(99,102,241,0.25)]'
    },
    {
      icon: <BarChart4 size={20} />,
      label: 'Infographic',
      onClick: () => {
        setShowRecallGraph(false);
        setActiveTool('infographic');
      },
      className: 'bg-gradient-to-br from-pink-500 to-fuchsia-600 shadow-[0_0_15px_rgba(236,72,153,0.25)]'
    },
    {
      icon: <Table size={20} />,
      label: 'Data table',
      onClick: () => {
        setShowRecallGraph(false);
        setActiveTool('datatable');
      },
      className: 'bg-gradient-to-br from-teal-400 to-green-600 shadow-[0_0_15px_rgba(20,184,166,0.25)]'
    }
  ];

  // Self-contained light Markdown renderer to render chat assistant responses
  const renderMarkdown = (md: string) => {
    if (!md) return null;
    return md.split('\n').map((line, idx) => {
      const cleanLine = line.trim();
      
      if (cleanLine.startsWith('# ')) {
        return <h1 key={idx} className="text-sm font-bold text-white mt-4 mb-2">{cleanLine.slice(2)}</h1>;
      }
      if (cleanLine.startsWith('## ')) {
        return <h2 key={idx} className="text-xs font-bold text-white mt-3 mb-1">{cleanLine.slice(3)}</h2>;
      }
      if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
        const boldParts = cleanLine.slice(2).split('**');
        return (
          <li key={idx} className="ml-4 list-disc text-zinc-400 my-1 text-xs">
            {boldParts.map((p, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-zinc-200">{p}</strong> : p)}
          </li>
        );
      }
      if (cleanLine === '') {
        return <div key={idx} className="h-1.5"></div>;
      }
      
      const boldParts = cleanLine.split('**');
      return (
        <p key={idx} className="text-zinc-400 my-1 text-xs leading-relaxed">
          {boldParts.map((p, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-zinc-200">{p}</strong> : p)}
        </p>
      );
    });
  };

  return (
    <div className="h-screen flex bg-black overflow-hidden font-sans select-none antialiased relative">
      
      {/* BACKGROUND VIDEO */}
      <video 
        ref={videoRef}
        src="https://designerstephen.github.io/public-assets/videos/observe-hero.mp4" 
        className="absolute inset-0 w-full h-full object-cover object-bottom pointer-events-none select-none z-0 opacity-40"
        muted 
        autoPlay 
        loop 
        playsInline 
        preload="auto" 
      />

      {/* 1. LEFT SIDEBAR: Source files, Recall adding, and API config */}
      <aside 
        style={{ width: leftWidth }} 
        className="liquid-glass border-r border-white/10 flex flex-col shrink-0 overflow-hidden z-10"
      >
        
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center justify-center">
            <img 
              src="/logo.jpg" 
              alt="Styrud" 
              className="h-12 object-contain hover:scale-105 transition-transform duration-300 select-none pointer-events-none mix-blend-screen filter brightness-125 contrast-110 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]"
            />
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => {
                setShowRecallGraph(false);
                setActiveTool(null);
              }}
              className={`p-1.5 rounded-lg transition-all duration-300 ${!showRecallGraph && !activeTool ? 'bg-white/10 text-white' : 'text-styrud-textMuted hover:text-white'}`}
              title="Dashboard"
            >
              <LayoutDashboard className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setShowRecallGraph(true);
                setActiveTool(null);
              }}
              className={`p-1.5 rounded-lg transition-all duration-300 ${showRecallGraph ? 'bg-white/10 text-white' : 'text-styrud-textMuted hover:text-white'}`}
              title="Recall Knowledge Graph"
            >
              <Network className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Source Addition Buttons */}
        <div className="p-5 border-b border-styrud-border flex flex-col gap-2">
          <h3 className="text-[10px] font-semibold text-styrud-textMuted uppercase tracking-wider mb-1">Add Source Assets</h3>
          
          <div className="flex gap-2">
            {/* File uploader */}
            <label className={`flex-1 py-2 px-3 border border-white/10 hover:border-white/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-300 ${uploading ? 'opacity-50' : ''}`}>
              <Plus className="w-3.5 h-3.5 text-zinc-300" />
              <span className="text-zinc-200">{uploading ? 'Uploading...' : 'Upload File'}</span>
              <input 
                type="file" 
                accept=".pdf,.txt,.md,.json" 
                className="hidden" 
                onChange={handleFileUpload} 
                disabled={uploading}
              />
            </label>

            <button
              onClick={() => setShowAddLink(!showAddLink)}
              className="py-2 px-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-white/20 rounded-xl text-xs font-semibold text-zinc-200 flex items-center justify-center gap-1.5 transition-all duration-300"
            >
              <Link2 className="w-3.5 h-3.5 text-zinc-300" />
              Link
            </button>
          </div>

          {/* Inline Link form */}
          {showAddLink && (
            <form onSubmit={handleAddLink} className="mt-3 p-3.5 bg-styrud-dark/50 border border-white/10 rounded-xl flex flex-col gap-2.5">
              <input 
                type="text" 
                placeholder="Title" 
                value={linkTitle} 
                onChange={e => setLinkTitle(e.target.value)}
                className="bg-styrud-panel border border-white/10 focus:border-white/30 px-3 py-2 rounded-lg text-xs text-white placeholder:text-zinc-650 focus:outline-none transition-all duration-300"
                required
              />
              <input 
                type="url" 
                placeholder="https://" 
                value={linkUrl} 
                onChange={e => setLinkUrl(e.target.value)}
                className="bg-styrud-panel border border-white/10 focus:border-white/30 px-3 py-2 rounded-lg text-xs text-white placeholder:text-zinc-650 focus:outline-none transition-all duration-300"
                required
              />
              <button 
                type="submit" 
                className="w-full py-2 bg-white hover:bg-white/90 text-black font-semibold rounded-lg text-xs transition-all duration-300 shadow-md"
              >
                Add Ingestion
              </button>
            </form>
          )}
        </div>

        {/* Source Items Ingested List */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-semibold text-styrud-textMuted uppercase tracking-wider">Sources List</h3>
            <button
              onClick={() => setSelectedAssetId(null)}
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full transition-all duration-300 border ${
                selectedAssetId === null 
                  ? 'bg-white border-white text-black' 
                  : 'border-white/10 hover:border-white/20 text-styrud-textMuted hover:text-white'
              }`}
            >
              All Focus
            </button>
          </div>

          {assets.length === 0 ? (
            <div className="text-center py-8 text-xs text-zinc-650 italic">
              No sources ingested yet.
            </div>
          ) : (
            <div className="space-y-2">
              {assets.map((asset) => (
                <div 
                  key={asset.id}
                  onClick={() => setSelectedAssetId(asset.id)}
                  className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition-all duration-300 ${
                    selectedAssetId === asset.id
                      ? 'bg-white/[0.04] border-white/30'
                      : 'bg-transparent border-white/[0.04] hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className={`w-4 h-4 shrink-0 ${selectedAssetId === asset.id ? 'text-white font-bold scale-110' : 'text-zinc-500'} transition-all duration-300`} />
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-zinc-200 truncate">{asset.title}</h4>
                      <p className="text-[10px] text-zinc-550 mt-0.5 truncate">{asset.content_preview}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAsset(asset.id);
                    }}
                    className="p-1 text-zinc-650 hover:text-rose-500 rounded transition-all duration-300 shrink-0 ml-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* API Status panel (Click to configure keys modal) */}
        <div 
          onClick={() => setShowKeysModal(true)}
          className="p-5 border-t border-styrud-border bg-styrud-panel/50 hover:bg-white/[0.02] text-xs flex flex-col gap-2 cursor-pointer transition-all duration-300 group"
        >
          <div className="flex items-center justify-between text-styrud-textMuted font-semibold uppercase tracking-wider group-hover:text-white transition duration-300">
            <span>Model Config</span>
            <Database className="w-3.5 h-3.5 text-zinc-650 group-hover:text-purple-400 transition duration-300" />
          </div>
          {status ? (
            <div className="space-y-1.5 text-[11px] text-zinc-400">
              <div className="flex justify-between">
                <span>Gemini API (Reasoning)</span>
                <span className={status.api_keys_configured.gemini ? "text-white font-bold" : "text-zinc-500"}>
                  {status.api_keys_configured.gemini ? "Connected" : "Mock Mode"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Claude API (Visuals)</span>
                <span className={status.api_keys_configured.claude ? "text-white font-bold" : "text-zinc-500"}>
                  {status.api_keys_configured.claude ? "Connected" : "Gemini Fallback"}
                </span>
              </div>
              {status.is_fallback_mode && (
                <div className="mt-2.5 p-2 bg-purple-500/[0.04] border border-purple-500/10 rounded-xl flex items-center gap-1.5 text-[10px] text-purple-300">
                  <Key className="w-3 h-3 text-purple-400" />
                  <span>Click to add API credentials</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-zinc-700 animate-pulse">Connecting...</div>
          )}
        </div>

      </aside>

      {/* LEFT SIDEBAR RESIZER BAR - Invisible but glows when hovered/dragged */}
      <div 
        onMouseDown={handleLeftMouseDown} 
        className="w-1 cursor-col-resize hover:bg-lime-500/20 bg-transparent active:bg-lime-500/40 transition-colors duration-300 self-stretch shrink-0 z-30 relative group"
      >
        <div className="absolute inset-y-0 -left-1.5 -right-1.5 cursor-col-resize"></div>
      </div>

      {/* 2. CENTER STAGE: Main styrud tools dashboard & content visualizers */}
      <main className="flex-1 flex flex-col overflow-hidden bg-transparent p-6 md:p-8 relative z-10">
        
        {/* Main Stage Top Navigation context bar with Lime curves outline */}
        <div className="mb-6 flex justify-between items-center text-xs text-zinc-400 liquid-glass rounded-2xl px-5 py-3.5 shadow-sm transition duration-300">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-ping"></span>
            <span className="text-zinc-550 text-[11px] uppercase tracking-wider">FOCUS:</span>
            <span className="text-white font-semibold uppercase tracking-wider text-shadow-observe">
              {selectedAssetId 
                ? assets.find(a => a.id === selectedAssetId)?.title || 'Focused Source' 
                : 'All Combined Sources'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-550">
            <span className="text-[11px] uppercase tracking-wider">LAYOUT: </span>
            <span className="text-white font-serif-instrument italic text-base lowercase tracking-wide text-shadow-observe">
              {showRecallGraph ? 'Recall Graph' : activeTool || 'Styrud Grid'}
            </span>
          </div>
        </div>

        {/* Dynamic Tool Router Container */}
        <div className="flex-1 overflow-y-auto w-full pr-1 pb-28 flex justify-center items-start">
          {showRecallGraph ? (
            <RecallGraph 
              onSelectAsset={(id) => {
                setSelectedAssetId(id);
                setShowRecallGraph(false);
              }}
              refreshTrigger={refreshTrigger}
            />
          ) : activeTool === 'audio' ? (
            <AudioOverview 
              language={extraParams?.language || 'english'}
              assetId={selectedAssetId}
              onBack={() => setActiveTool(null)}
            />
          ) : activeTool === 'slides' ? (
            <SlideDeckViewer 
              assetId={selectedAssetId}
              onBack={() => setActiveTool(null)}
            />
          ) : activeTool === 'video' ? (
            <VideoOverview 
              assetId={selectedAssetId}
              onBack={() => setActiveTool(null)}
            />
          ) : activeTool === 'mindmap' ? (
            <MindMapViewer 
              assetId={selectedAssetId}
              onBack={() => setActiveTool(null)}
            />
          ) : activeTool === 'reports' ? (
            <ReportsViewer 
              assetId={selectedAssetId}
              onBack={() => setActiveTool(null)}
            />
          ) : activeTool === 'flashcards' ? (
            <FlashcardViewer 
              assetId={selectedAssetId}
              onBack={() => setActiveTool(null)}
            />
          ) : activeTool === 'quiz' ? (
            <QuizViewer 
              assetId={selectedAssetId}
              onBack={() => setActiveTool(null)}
            />
          ) : activeTool === 'infographic' ? (
            <InfographicViewer 
              assetId={selectedAssetId}
              onBack={() => setActiveTool(null)}
            />
          ) : activeTool === 'datatable' ? (
            <DataTableViewer 
              assetId={selectedAssetId}
              onBack={() => setActiveTool(null)}
            />
          ) : (
            <StyrudDashboard 
              onSelectTool={(tool, params) => {
                setActiveTool(tool);
                if (params) setExtraParams(params);
              }}
            />
          )}
        </div>

        {/* Floating Magnification Dock at bottom center */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 hidden md:block">
          <MagnificationDock items={dockItems} magnification={72} baseItemSize={48} panelHeight={60} />
        </div>

      </main>

      {/* RIGHT SIDEBAR RESIZER BAR - Invisible but glows when hovered/dragged */}
      <div 
        onMouseDown={handleRightMouseDown} 
        className="w-1 cursor-col-resize hover:bg-purple-500/20 bg-transparent active:bg-purple-500/40 transition-colors duration-300 self-stretch shrink-0 z-30 relative group"
      >
        <div className="absolute inset-y-0 -left-1.5 -right-1.5 cursor-col-resize"></div>
      </div>

      {/* 3. RIGHT SIDEBAR: Multitasking Reasoning panel (Gemini Q&A) */}
      <section 
        style={{ width: rightWidth }} 
        className="liquid-glass border-l border-white/10 flex flex-col shrink-0 overflow-hidden z-10"
      >
        
        {/* Chat Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-zinc-400" />
            <span className="font-semibold text-white font-serif-instrument italic text-base tracking-wide text-shadow-observe">Gemini Assistant</span>
          </div>
          <button 
            onClick={() => setChatHistory([])}
            className="text-[9px] text-zinc-550 hover:text-white font-bold uppercase tracking-wider transition duration-300"
          >
            Clear
          </button>
        </div>

        {/* Chat stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {chatHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center h-full text-zinc-500 p-4 gap-3">
              <Brain className="w-8 h-8 text-zinc-700" />
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Reasoning Panel</p>
                <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed max-w-[200px] mx-auto">
                  Ask details, compare insights, or trace document clusters.
                </p>
              </div>
            </div>
          ) : (
            chatHistory.map((msg, idx) => (
              <div 
                key={idx}
                className={`flex flex-col max-w-[88%] rounded-2xl p-3.5 transition-all duration-300 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-rose-500 to-red-650 text-white ml-auto font-bold shadow-[0_0_15px_rgba(239,68,68,0.25)] hover:scale-[1.02] animate-jelly-hover'
                    : 'bg-gradient-to-br from-violet-950/20 to-purple-950/5 border border-purple-500/20 text-zinc-200 shadow-[0_0_15px_rgba(139,92,246,0.08)]'
                }`}
              >
                <span className={`text-[8px] uppercase tracking-widest mb-1.5 font-bold select-none ${
                  msg.role === 'user' ? 'text-white/60' : 'text-purple-400'
                }`}>
                  {msg.role === 'user' ? 'You' : 'Gemini'}
                </span>
                <div className="text-xs leading-relaxed break-words">
                  {msg.role === 'user' ? msg.content : renderMarkdown(msg.content)}
                </div>
              </div>
            ))
          )}

          {chatLoading && (
            <div className="flex flex-col max-w-[88%] rounded-2xl p-3.5 bg-gradient-to-br from-violet-950/15 to-purple-950/5 border border-purple-500/10 text-zinc-300">
              <span className="text-[8px] text-purple-400 uppercase tracking-widest mb-1.5 font-bold animate-pulse">
                Gemini is reasoning...
              </span>
              <div className="flex items-center gap-1.5 py-1">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}
        </div>

        {/* Chat input box */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-black/20">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Ask a question..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              className="w-full bg-black/40 border border-white/10 focus:border-purple-500/30 rounded-xl py-2.5 pl-4 pr-11 text-xs text-white focus:outline-none placeholder-zinc-650 transition-all duration-300"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || chatLoading}
              className="absolute right-1.5 p-1.5 bg-white hover:bg-white/90 active:scale-95 text-black rounded-lg transition-all duration-300 disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5 fill-black" />
            </button>
          </div>
        </form>

      </section>

      {/* PREMIUM GLASSMORPHISM API KEY MODAL DIALOG */}
      {showKeysModal && (
        <div className="fixed inset-0 bg-black/85 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="liquid-glass border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative animate-float">
            
            {/* Header */}
            <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-white">
                <Key className="w-5 h-5 text-purple-400 animate-pulse" />
                <span className="font-serif-instrument italic font-normal text-base lowercase tracking-wide text-white">model credentials config</span>
              </div>
              <button 
                onClick={handleSkipKeys}
                className="p-1 hover:bg-white/5 text-zinc-500 hover:text-white rounded-lg transition duration-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSaveKeys} className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2">
                  Gemini API Key (Required for study synthesis)
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={geminiKeyInput}
                  onChange={e => setGeminiKeyInput(e.target.value)}
                  className="w-full bg-styrud-dark border border-white/10 focus:border-purple-500/30 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-700 focus:outline-none transition duration-300"
                  required
                />
                <p className="text-[9px] text-zinc-550 mt-1.5 leading-relaxed font-semibold">
                  Used to generate voice overviews, mind maps, quizzes, and reasoning queries.
                </p>
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2">
                  Claude API Key (Optional)
                </label>
                <input
                  type="password"
                  placeholder="sk-ant-..."
                  value={claudeKeyInput}
                  onChange={e => setClaudeKeyInput(e.target.value)}
                  className="w-full bg-styrud-dark border border-white/10 focus:border-purple-500/30 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-700 focus:outline-none transition duration-300"
                />
                <p className="text-[9px] text-zinc-550 mt-1.5 leading-relaxed font-semibold">
                  Powers secondary visual assets rendering. Defaults to Gemini if skipped.
                </p>
              </div>

              {/* NotebookLM Note Alert */}
              <div className="p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-2xl flex items-start gap-2.5 text-[10px] text-zinc-400 leading-relaxed font-medium">
                <AlertCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Note:</strong> NotebookLM is a proprietary consumer product and does not issue public API keys. Styrud uses the official Google Gemini Developer API to power equivalent features locally.
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={handleSkipKeys}
                  className="flex-1 py-3 border border-white/10 hover:bg-white/5 text-zinc-300 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 active:scale-95"
                >
                  Skip for Now
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-white hover:bg-zinc-200 text-black rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 active:scale-95 shadow-lg"
                >
                  Save Credentials
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

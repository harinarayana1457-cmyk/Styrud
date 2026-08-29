import React, { useState } from 'react';
import { 
  Volume2, 
  Presentation, 
  PlaySquare, 
  Network, 
  FileText, 
  Layers, 
  HelpCircle, 
  BarChart4, 
  Table,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface StyrudDashboardProps {
  onSelectTool: (tool: string, extra?: any) => void;
}

export default function StyrudDashboard({ onSelectTool }: StyrudDashboardProps) {
  const [selectedLanguage, setSelectedLanguage] = useState('english');

  const languages = [
    { name: 'English', native: 'English', id: 'english' },
    { name: 'Hindi', native: 'हिन्दी', id: 'hindi' },
    { name: 'Bengali', native: 'বাংলা', id: 'bengali' },
    { name: 'Gujarati', native: 'ગુજરાતી', id: 'gujarati' },
    { name: 'Kannada', native: 'ಕನ್ನಡ', id: 'kannada' },
    { name: 'Malayalam', native: 'മലയാളം', id: 'malayalam' },
    { name: 'Marathi', native: 'मराठी', id: 'marathi' },
    { name: 'Punjabi', native: 'ਪੰਜਾਬੀ', id: 'punjabi' },
    { name: 'Tamil', native: 'தமிழ்', id: 'tamil' },
    { name: 'Telugu', native: 'తెలుగు', id: 'telugu' }
  ];

  const tools = [
    {
      id: 'audio',
      title: 'Audio Overview',
      icon: Volume2,
      description: 'Engaging, multi-speaker voice briefings',
      textColor: 'text-red-450',
      borderColor: 'border-red-500/25',
      shadow: 'hover:shadow-[0_0_30px_rgba(239,68,68,0.25)]',
      beta: false
    },
    {
      id: 'slides',
      title: 'Slide deck',
      icon: Presentation,
      description: 'Geometric structured visual presentations',
      textColor: 'text-amber-400',
      borderColor: 'border-amber-500/25',
      shadow: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.22)]',
      beta: true
    },
    {
      id: 'video',
      title: 'Video Overview',
      icon: PlaySquare,
      description: 'Synchronized slide narration voice player',
      textColor: 'text-fuchsia-400',
      borderColor: 'border-fuchsia-500/25',
      shadow: 'hover:shadow-[0_0_30px_rgba(217,70,239,0.25)]',
      beta: false
    },
    {
      id: 'mindmap',
      title: 'Mind Map',
      icon: Network,
      description: 'Concept nodes and hierarchy trees',
      textColor: 'text-lime-400',
      borderColor: 'border-lime-500/25',
      shadow: 'hover:shadow-[0_0_30px_rgba(132,204,22,0.22)]',
      beta: false
    },
    {
      id: 'reports',
      title: 'Reports',
      icon: FileText,
      description: 'Deep summary reports and breakdown sheets',
      textColor: 'text-cyan-400',
      borderColor: 'border-cyan-500/25',
      shadow: 'hover:shadow-[0_0_30px_rgba(6,182,212,0.25)]',
      beta: false
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      icon: Layers,
      description: 'Active recall training cards',
      textColor: 'text-purple-400',
      borderColor: 'border-purple-500/25',
      shadow: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.25)]',
      beta: false
    },
    {
      id: 'quiz',
      title: 'Quiz',
      icon: HelpCircle,
      description: 'Multiple choice conceptual evaluations',
      textColor: 'text-indigo-400',
      borderColor: 'border-indigo-500/25',
      shadow: 'hover:shadow-[0_0_30px_rgba(99,102,241,0.25)]',
      beta: false
    },
    {
      id: 'infographic',
      title: 'Infographic',
      icon: BarChart4,
      description: 'Step timelines and data graphics templates',
      textColor: 'text-pink-400',
      borderColor: 'border-pink-500/25',
      shadow: 'hover:shadow-[0_0_30px_rgba(236,72,153,0.25)]',
      beta: true
    },
    {
      id: 'datatable',
      title: 'Data table',
      icon: Table,
      description: 'Extracted matrices and parameter comparisons',
      textColor: 'text-teal-400',
      borderColor: 'border-teal-500/25',
      shadow: 'hover:shadow-[0_0_30px_rgba(20,184,166,0.22)]',
      beta: false
    }
  ];

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full py-4">
      
      {/* Dynamic Animated Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-5">
        <div>
          <h2 className="text-lg tracking-wider flex items-center gap-2 font-sans font-bold uppercase text-white text-shadow-observe">
            Motion Styrud Hub
          </h2>
          <p className="text-xs text-zinc-400 mt-1 text-shadow-observe">Experience animated interactive learning dashboards built directly from your notes.</p>
        </div>
      </div>

      {/* Language select bubble banner */}
      <div className="liquid-glass border border-white/10 rounded-3xl p-6 shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 transition duration-300">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
            <h3 className="font-semibold text-sm text-zinc-200 tracking-tight text-shadow-observe">Audio Overview Briefings</h3>
          </div>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed text-shadow-observe">
            Generate voice reviews directly in various Indian regional languages to review on the go.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {languages.map((l) => (
              <button
                key={l.id}
                onClick={() => setSelectedLanguage(l.id)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide uppercase transition-all duration-300 border ${
                  selectedLanguage === l.id
                    ? 'bg-gradient-to-r from-rose-500 to-red-650 border-transparent text-white shadow-md'
                    : 'bg-transparent border-white/10 hover:border-white/20 text-zinc-400 hover:text-white'
                }`}
              >
                {l.native}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => onSelectTool('audio', { language: selectedLanguage })}
          className="shrink-0 px-6 py-3 bg-white hover:bg-zinc-200 active:scale-95 text-black rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1 shadow-lg hover:shadow-white/10"
        >
          Generate Audio
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Playful Floating Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((t, idx) => {
          const IconComponent = t.icon;
          return (
            <div
              key={t.id}
              onClick={() => onSelectTool(t.id, t.id === 'audio' ? { language: selectedLanguage } : undefined)}
              className={`relative overflow-hidden p-5 liquid-glass rounded-3xl cursor-pointer border border-white/10 hover:border-white/20 hover:-translate-y-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 flex flex-col justify-between h-40 shadow-lg ${t.shadow} group`}
            >
              {/* Background large rotated watermark icon */}
              <div className={`absolute right-[-12px] bottom-[-12px] opacity-[0.03] group-hover:opacity-10 ${t.textColor} pointer-events-none group-hover:rotate-12 group-hover:scale-125 transition-all duration-500`}>
                <IconComponent size={100} strokeWidth={1} />
              </div>

              {/* Card Top Row */}
              <div className="flex items-start justify-between z-10">
                {/* Micro Badge for Index */}
                <span className={`text-[9px] font-mono font-bold tracking-widest ${t.textColor} opacity-60`}>
                  {`0${idx + 1} / MODEL`}
                </span>
                
                {/* Beta tag or standard badge */}
                {t.beta ? (
                  <span className={`text-[7px] bg-white/5 border ${t.borderColor} px-2 py-0.5 rounded-full font-bold uppercase tracking-widest font-mono ${t.textColor}`}>
                    Beta
                  </span>
                ) : (
                  <span className="text-[7px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest font-mono text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Open →
                  </span>
                )}
              </div>

              {/* Card Bottom Content */}
              <div className="mt-auto z-10">
                {/* Icon & Title Row */}
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`p-1.5 bg-white/5 border border-white/10 rounded-lg group-hover:scale-105 transition-transform duration-300 ${t.textColor}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <span className="font-sans font-bold text-sm uppercase tracking-wider text-white text-shadow-observe">
                    {t.title}
                  </span>
                </div>
                {/* Description */}
                <p className="text-[11px] text-zinc-400 group-hover:text-zinc-200 leading-relaxed text-shadow-observe transition-colors duration-300">
                  {t.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

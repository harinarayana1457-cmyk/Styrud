import React, { useState, useEffect, useRef } from 'react';
import { Network, FileText, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

interface Node {
  id: string;
  title: string;
  x: number;
  y: number;
  cluster_id: number;
  cluster_label: string;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  similarity: number;
}

interface Cluster {
  id: number;
  label: string;
  color: string;
}

interface RecallGraphProps {
  onSelectAsset: (id: string) => void;
  refreshTrigger: number;
}

export default function RecallGraph({ onSelectAsset, refreshTrigger }: RecallGraphProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 300, y: 300 });
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const fetchGraphData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cluster');
      const data = await res.json();
      setNodes(data.nodes || []);
      setEdges(data.edges || []);
      
      // Seed cluster descriptions
      const colors = ["#EF4444", "#8B5CF6", "#F59E0B", "#EC4899", "#84CC16", "#06B6D4"];
      const rawClusters = data.clusters || [];
      const styledClusters = rawClusters.map((c: any, idx: number) => ({
        ...c,
        color: colors[idx % colors.length]
      }));
      setClusters(styledClusters);
    } catch (e) {
      console.error("Error loading knowledge graph:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraphData();
  }, [refreshTrigger]);

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as HTMLElement).tagName === 'svg') {
      setIsDragging(true);
      dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getClusterColor = (clusterId: number) => {
    const cluster = clusters.find(c => c.id === clusterId);
    return cluster ? cluster.color : '#8E8E93';
  };

  return (
    <div className="bg-styrud-panel border border-white/[0.06] rounded-3xl overflow-hidden h-[600px] flex flex-col relative w-full shadow-lg">
      
      {/* Header controls */}
      <div className="p-5 bg-styrud-panel border-b border-white/[0.06] flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <Network className="w-5 h-5 text-white animate-spin" style={{ animationDuration: '6s' }} />
          <div>
            <h3 className="font-semibold text-xs text-white uppercase tracking-wider">Recall Bubble Clusters</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">Float clusters of similar conceptual files</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setZoom(prev => Math.min(2, prev + 0.1))}
            className="p-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 rounded-xl text-zinc-300 transition duration-300"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
            className="p-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 rounded-xl text-zinc-300 transition duration-300"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setPan({ x: 300, y: 300 })}
            className="p-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 rounded-xl text-zinc-300 transition duration-300"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-3 bg-black">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-350">Floating nodes...</span>
        </div>
      ) : nodes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-8 text-center bg-black">
          <Network className="w-10 h-10 text-zinc-800 mb-3 animate-bounce" />
          <p className="text-xs uppercase tracking-wider font-bold">No sources ingested yet</p>
          <p className="text-[10px] text-zinc-600 mt-1.5 max-w-xs leading-relaxed font-semibold">
            Add files on the uploader sidebar to plot 3D bubble layout links.
          </p>
        </div>
      ) : (
        <div className="flex-1 relative flex bg-black">
          {/* Main SVG Canvas */}
          <svg 
            className="w-full h-full cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* SVG Definitions for Glossy Radial 3D bubble gradients */}
            <defs>
              <radialGradient id="grad-0" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#fda4af" />
                <stop offset="60%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#9f1239" />
              </radialGradient>
              <radialGradient id="grad-1" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="60%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#5b21b6" />
              </radialGradient>
              <radialGradient id="grad-2" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="60%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#854d0e" />
              </radialGradient>
              <radialGradient id="grad-3" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="60%" stopColor="#db2777" />
                <stop offset="100%" stopColor="#86198f" />
              </radialGradient>
              <radialGradient id="grad-4" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#bef264" />
                <stop offset="60%" stopColor="#84cc16" />
                <stop offset="100%" stopColor="#3f6212" />
              </radialGradient>
              <radialGradient id="grad-5" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#67e8f9" />
                <stop offset="60%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#0f766e" />
              </radialGradient>
            </defs>

            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Draw Edges / Links */}
              {edges.map(edge => {
                const sourceNode = nodes.find(n => n.id === edge.source);
                const targetNode = nodes.find(n => n.id === edge.target);
                if (!sourceNode || !targetNode) return null;
                
                return (
                  <line
                    key={edge.id}
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke="rgba(255, 255, 255, 0.12)"
                    strokeWidth={2}
                    className="transition-all duration-300"
                  />
                );
              })}

              {/* Draw Nodes */}
              {nodes.map(node => {
                const gradientUrl = `url(#grad-${node.cluster_id % 6})`;
                const isSelected = selectedNode?.id === node.id;
                
                return (
                  <g 
                    key={node.id} 
                    transform={`translate(${node.x}, ${node.y})`}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(node);
                    }}
                  >
                    {/* Shadow glow on select */}
                    {isSelected && (
                      <circle
                        r={22}
                        fill="rgba(255,255,255,0.06)"
                        stroke="#ffffff"
                        strokeWidth={1}
                        strokeDasharray="2 2"
                        className="animate-ping"
                      />
                    )}
                    
                    {/* 3D Glossy bubble node */}
                    <circle
                      r={isSelected ? 16 : 12}
                      fill={gradientUrl}
                      stroke={isSelected ? '#ffffff' : 'rgba(255,255,255,0.15)'}
                      strokeWidth={isSelected ? 3 : 1}
                      className="transition-all duration-300 hover:scale-125"
                    />
                    
                    <text
                      y={24}
                      textAnchor="middle"
                      fill="#e2e8f0"
                      fontSize="9px"
                      className="font-bold font-sans uppercase tracking-wider select-none bg-black px-1.5"
                    >
                      {node.title.length > 14 ? node.title.substring(0, 14) + '...' : node.title}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Clusters Legend Overlay */}
          <div className="absolute bottom-4 left-4 bg-styrud-panel/90 border border-white/[0.06] p-4 rounded-2xl backdrop-blur-md max-w-xs shadow-lg">
            <h4 className="text-[9px] font-black text-zinc-400 mb-2 uppercase tracking-widest">Concept Zones</h4>
            <div className="space-y-2">
              {clusters.map(cluster => (
                <div key={cluster.id} className="flex items-center gap-2">
                  <span 
                    className="w-3.5 h-3.5 rounded-full border border-white/10 shadow" 
                    style={{ backgroundColor: getClusterColor(cluster.id) }}
                  ></span>
                  <span className="text-[11px] font-bold text-zinc-300 tracking-wide uppercase">{cluster.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Node Inspector Sidebar Overlay */}
          {selectedNode && (
            <div className="absolute top-4 right-4 bottom-4 w-72 bg-styrud-panel/95 border border-white/[0.08] rounded-2xl p-5 backdrop-blur-md flex flex-col shadow-2xl z-20 transition duration-300">
              <div className="flex-1 overflow-y-auto">
                <div className="flex items-center gap-2 mb-4">
                  <span 
                    className="w-3 h-3 rounded-full border border-white/10 shrink-0" 
                    style={{ backgroundColor: getClusterColor(selectedNode.cluster_id) }}
                  ></span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                    {selectedNode.cluster_label}
                  </span>
                </div>
                
                <h4 className="font-bold text-white text-base mb-2 tracking-tight uppercase">{selectedNode.title}</h4>
                <p className="text-[9px] text-zinc-600 font-mono mb-4">ID: {selectedNode.id.substring(0, 8)}</p>
                
                <button
                  onClick={() => onSelectAsset(selectedNode.id)}
                  className="w-full py-2.5 bg-white hover:bg-zinc-200 text-black rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 mb-5 flex items-center justify-center gap-1.5 shadow"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Focus on Document
                </button>
                
                <div className="border-t border-white/[0.06] pt-4">
                  <h5 className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Linked Concepts</h5>
                  <div className="space-y-2">
                    {edges
                      .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
                      .map(e => {
                        const otherId = e.source === selectedNode.id ? e.target : e.source;
                        const otherNode = nodes.find(n => n.id === otherId);
                        if (!otherNode) return null;
                        return (
                          <div 
                            key={e.id}
                            onClick={() => setSelectedNode(otherNode)}
                            className="p-2.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] rounded-xl text-xs text-zinc-300 cursor-pointer flex justify-between items-center transition-all duration-300"
                          >
                            <span className="truncate max-w-[140px] font-bold uppercase tracking-wider">{otherNode.title}</span>
                            <span className="text-[9px] text-zinc-500 font-mono">{(e.similarity * 100).toFixed(0)}% sim</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedNode(null)}
                className="mt-4 w-full py-2 text-center bg-white/[0.03] hover:bg-white/[0.06] text-xs text-zinc-400 hover:text-white rounded-xl transition duration-300 border border-white/5 uppercase font-bold"
              >
                Close Inspector
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

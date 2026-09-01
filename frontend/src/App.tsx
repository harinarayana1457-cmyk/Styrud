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
  X,
  Sun,
  Moon,
  Sparkles,
  Bot
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
import NotebookLMModal from './components/NotebookLMModal';
import NotebookLMBotModal from './components/NotebookLMBotModal';
import { NOTEBOOKLM_TASKS, triggerFileDownload, copyToClipboard } from './utils/notebooklmBridge';

// Helper component to filter out dark background textures from logo images programmatically
function TransparentLogo({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [processedSrc, setProcessedSrc] = useState<string | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setProcessedSrc(src);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Remove dark pixels (charcoal background texture)
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Threshold: if all R, G, B channels are dark (< 60), make transparent
        if (r < 60 && g < 60 && b < 60) {
          data[i + 3] = 0;
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      setProcessedSrc(canvas.toDataURL());
    };
    img.onerror = () => {
      setProcessedSrc(src);
    };
  }, [src]);

  if (!processedSrc) {
    return <div className="h-12 w-28 bg-transparent" />;
  }

  return (
    <img 
      src={processedSrc} 
      alt={alt} 
      className={className} 
    />
  );
}


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

// --- WebGL Warp Stripes Shader Constants ---
const VERTEX_SHADER_SOURCE = `
  attribute vec2 position;
  varying vec2 v_uv;
  void main() {
    v_uv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER_SOURCE = `
  precision highp float;
  varying vec2 v_uv;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_mouse;
  uniform float u_intensity;

  uniform vec3 u_ground_color;
  uniform vec3 u_accent1_color;
  uniform vec3 u_accent2_color;

  #define GroundColor u_ground_color
  #define Accent1 u_accent1_color
  #define Accent2 u_accent2_color

  // 2D Hash function
  float hash(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 19.19);
    return fract(p.x * p.y);
  }

  // 2D Value Noise
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    float a = hash(i + vec2(0.0, 0.0));
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  // 6-Octave Fractional Brownian Motion (FBM)
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 6; i++) {
      value += amplitude * noise(p * frequency);
      p = rot * p * 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  // Two-Level Domain Warp Helper
  float domainWarp(vec2 p, out vec2 q, out vec2 r, float time) {
    q.x = fbm(p + vec2(0.0, 0.0) + vec2(0.05 * time, 0.03 * time));
    q.y = fbm(p + vec2(5.2, 1.3) + vec2(-0.02 * time, 0.06 * time));
    
    r.x = fbm(p + 4.0 * q + vec2(1.7, 9.2) + vec2(0.04 * time, -0.04 * time));
    r.y = fbm(p + 4.0 * q + vec2(8.3, 2.8) + vec2(0.05 * time, 0.02 * time));
    
    return fbm(p + 4.0 * r);
  }

  void main() {
    // Normalize coordinates to maintain aspect ratio across viewports
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    vec2 noiseUV = uv * 1.5;
    vec2 mouseUV = (u_mouse * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    
    // Proximity to the cursor
    float distToMouse = length(uv - mouseUV);
    float localCursorInfluence = exp(-distToMouse * distToMouse * 3.0);
    float activeIntensity = u_intensity;
    
    vec2 q;
    vec2 r;
    // Evaluate domain warp using the shared preamble
    float warpVal = domainWarp(noiseUV, q, r, u_time * 0.15);
    
    // Generate diagonal stripes
    vec2 stripeDir = normalize(vec2(1.0, 0.8));
    float stripeCoord = dot(uv, stripeDir) * 12.0;
    
    // Displace the stripe PHASE rather than coordinate, holding the lattice structure
    float warpStrength = 2.0 + activeIntensity * 4.0 + (localCursorInfluence * activeIntensity * 6.0);
    float phase = stripeCoord - u_time * 0.3 + warpVal * warpStrength;
    
    // Combine primary wave and a harmonic frequency for detailed sub-stripes
    float stripePattern = sin(phase);
    float harmonic = sin(phase * 3.0 + 1.5) * 0.25;
    float combinedPattern = stripePattern + harmonic;
    
    // Map stripes pattern to ground/accent boundaries
    float stripes = smoothstep(-0.2, 0.6, combinedPattern);
    
    // Shift color using the domain warp values q and r to create material depth
    float colorMix = 0.5 + 0.5 * sin(warpVal * 5.0 + dot(q, r) * 2.0 + u_time * 0.1);
    vec3 stripeColor = mix(Accent1, Accent2, colorMix);
    
    // Sub-glow for texture
    float glow = smoothstep(-0.8, 0.8, combinedPattern) * 0.35;
    vec3 col = mix(GroundColor, stripeColor, stripes);
    col += stripeColor * glow * 0.2;
    
    // Vignette
    vec2 vignetteUV = gl_FragCoord.xy / u_resolution.xy;
    float vignette = vignetteUV.x * vignetteUV.y * (1.0 - vignetteUV.x) * (1.0 - vignetteUV.y);
    vignette = clamp(pow(vignette * 16.0, 0.25), 0.0, 1.0);
    col *= mix(0.7, 1.0, vignette);
    
    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function App() {
  // Theme state and toggle function
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    const root = window.document.documentElement;
    if (nextTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  useEffect(() => {
    // Ensure dark mode is active by default on mount
    window.document.documentElement.classList.add('dark');
  }, []);

  // --- WebGL Shader Hooks & State ---
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [webglSupported, setWebglSupported] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const mousePosRef = useRef({ x: 0, y: 0 });
  const targetMousePosRef = useRef({ x: 0, y: 0 });
  const intensityRef = useRef(0);
  const targetIntensityRef = useRef(0);
  const isMouseOverRef = useRef(false);
  const lastMoveTimeRef = useRef(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl = canvas.getContext('webgl2', { alpha: false, antialias: true }) as WebGL2RenderingContext | WebGLRenderingContext | null;
    if (!gl) {
      gl = canvas.getContext('webgl', { alpha: false, antialias: true }) as WebGLRenderingContext | null;
    }

    if (!gl) {
      setWebglSupported(false);
      return;
    }

    const createShader = (glCtx: WebGLRenderingContext | WebGL2RenderingContext, type: number, source: string) => {
      const shader = glCtx.createShader(type);
      if (!shader) return null;
      glCtx.shaderSource(shader, source);
      glCtx.compileShader(shader);
      if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        console.error('Shader compile error:', glCtx.getShaderInfoLog(shader));
        glCtx.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
    if (!vs || !fs) {
      setWebglSupported(false);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      setWebglSupported(false);
      return;
    }

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      setWebglSupported(false);
      return;
    }

    const positionAttributeLocation = gl.getAttribLocation(program, 'position');
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    
    const positions = [
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
    const timeUniformLocation = gl.getUniformLocation(program, 'u_time');
    const mouseUniformLocation = gl.getUniformLocation(program, 'u_mouse');
    const intensityUniformLocation = gl.getUniformLocation(program, 'u_intensity');
    
    const groundColorUniformLocation = gl.getUniformLocation(program, 'u_ground_color');
    const accent1ColorUniformLocation = gl.getUniformLocation(program, 'u_accent1_color');
    const accent2ColorUniformLocation = gl.getUniformLocation(program, 'u_accent2_color');
 
    const resize = () => {
      const displayWidth = window.innerWidth;
      const displayHeight = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.floor(displayWidth * dpr);
      const height = Math.floor(displayHeight * dpr);
      
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        if (gl) {
          gl.viewport(0, 0, width, height);
        }
      }
    };
    window.addEventListener('resize', resize);
    resize();

    targetMousePosRef.current = { x: canvas.width / 2, y: canvas.height / 2 };
    mousePosRef.current = { x: canvas.width / 2, y: canvas.height / 2 };

    let animationFrameId: number;
    const startTime = performance.now();

    const render = () => {
      if (!canvas || !gl) return;

      const time = (performance.now() - startTime) * 0.001;
      const now = performance.now();
      
      if (isMouseOverRef.current && now - lastMoveTimeRef.current > 1500) {
        targetIntensityRef.current = 0.25;
      }
      
      const intensitySpeed = targetIntensityRef.current > intensityRef.current ? 0.05 : 0.02;
      intensityRef.current += (targetIntensityRef.current - intensityRef.current) * intensitySpeed;

      mousePosRef.current.x += (targetMousePosRef.current.x - mousePosRef.current.x) * 0.08;
      mousePosRef.current.y += (targetMousePosRef.current.y - mousePosRef.current.y) * 0.08;

      let groundColor: [number, number, number];
      let accent1Color: [number, number, number];
      let accent2Color: [number, number, number];

      if (theme === 'dark') {
        // Deep crimson-charcoal base: #080203
        groundColor = [8 / 255, 2 / 255, 3 / 255];
        // Bright red: #EF4444
        accent1Color = [239 / 255, 68 / 255, 68 / 255];
        // Soft rose pink: #FCA5A5
        accent2Color = [252 / 255, 165 / 255, 165 / 255];
      } else {
        // Warm pale rose base: #FFF1F2
        groundColor = [255 / 255, 241 / 255, 242 / 255];
        // Dark cherry red: #9F1239
        accent1Color = [159 / 255, 18 / 255, 57 / 255];
        // Deep rose-red: #E11D48
        accent2Color = [225 / 255, 29 / 255, 72 / 255];
      }

      gl.clearColor(groundColor[0], groundColor[1], groundColor[2], 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);

      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
      gl.uniform1f(timeUniformLocation, time);
      gl.uniform2f(mouseUniformLocation, mousePosRef.current.x, mousePosRef.current.y);
      gl.uniform1f(intensityUniformLocation, intensityRef.current);
      
      gl.uniform3f(groundColorUniformLocation, groundColor[0], groundColor[1], groundColor[2]);
      gl.uniform3f(accent1ColorUniformLocation, accent1Color[0], accent1Color[1], accent1Color[2]);
      gl.uniform3f(accent2ColorUniformLocation, accent2Color[0], accent2Color[1], accent2Color[2]);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
      if (gl) {
        gl.deleteBuffer(positionBuffer);
        gl.deleteProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
      }
    };
  }, [prefersReducedMotion, theme]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    targetMousePosRef.current = {
      x: (e.clientX - rect.left) * dpr,
      y: (rect.height - (e.clientY - rect.top)) * dpr
    };
    isMouseOverRef.current = true;
    targetIntensityRef.current = 1.0;
    lastMoveTimeRef.current = performance.now();
  };

  const handleMouseEnter = () => {
    isMouseOverRef.current = true;
    targetIntensityRef.current = 0.5;
  };

  const handleMouseLeave = () => {
    isMouseOverRef.current = false;
    targetIntensityRef.current = 0.0;
  };

  const shouldRenderStaticPath = prefersReducedMotion || !webglSupported;

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
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatLoading]);

  // API Key modal states
  const [showKeysModal, setShowKeysModal] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [claudeKeyInput, setClaudeKeyInput] = useState('');

  // NotebookLM Bridge modal states
  const [notebookModalOpen, setNotebookModalOpen] = useState(false);
  const [notebookModalData, setNotebookModalData] = useState<{
    toolTitle: string;
    prompt: string;
    filename: string;
    assetsCount: number;
    fileContent?: string;
  }>({
    toolTitle: 'Study Materials',
    prompt: '',
    filename: 'Styrud_NotebookLM_Sources.txt',
    assetsCount: 0
  });

  const handleLaunchNotebookLM = async (toolId: string = 'reports') => {
    try {
      const url = selectedAssetId ? `/api/export-sources?asset_id=${selectedAssetId}` : '/api/export-sources';
      const res = await fetch(url);
      if (!res.ok) throw new Error("No sources found to export. Please add study files or links first.");
      const data = await res.json();
      
      const taskInfo = NOTEBOOKLM_TASKS[toolId] || NOTEBOOKLM_TASKS.reports;
      const filename = data.filename || 'Styrud_NotebookLM_Sources.txt';
      
      // 1. Trigger source file download
      triggerFileDownload(filename, data.content);
      
      // 2. Copy specialized prompt to clipboard
      await copyToClipboard(taskInfo.prompt);
      
      // 3. Open Google NotebookLM in new tab
      window.open('https://notebooklm.google.com', '_blank');
      
      // 4. Open modal guide
      setNotebookModalData({
        toolTitle: taskInfo.title,
        prompt: taskInfo.prompt,
        filename: filename,
        assetsCount: data.assets_count,
        fileContent: data.content
      });
      setNotebookModalOpen(true);
    } catch (err: any) {
      console.error("NotebookLM launch error:", err);
      alert(err.message || "Failed to launch Google NotebookLM bridge.");
    }
  };

  // Playwright Automation Bot modal states
  const [botModalOpen, setBotModalOpen] = useState(false);
  const [botModalData, setBotModalData] = useState<{
    toolId: string;
    toolTitle: string;
  }>({
    toolId: 'reports',
    toolTitle: 'Research Report'
  });

  const handleOpenBotModal = (toolId: string = 'reports') => {
    const titleMap: Record<string, string> = {
      audio: 'Audio Overview',
      reports: 'Research Report',
      quiz: 'Interactive Quiz',
      flashcards: 'Recall Flashcards',
      slides: 'Slide Deck Presentation',
      video: 'Video Overview',
      mindmap: 'Concept Mind Map',
      infographic: 'Infographic Timeline',
      datatable: 'Comparison Data Table',
      summary: 'Executive Summary'
    };
    setBotModalData({
      toolId,
      toolTitle: titleMap[toolId] || 'Study Materials'
    });
    setBotModalOpen(true);
  };

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
    },
    {
      icon: <Sparkles size={20} className="animate-pulse text-purple-200" />,
      label: 'NotebookLM ↗',
      onClick: () => {
        handleLaunchNotebookLM(activeTool || 'reports');
      },
      className: 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 shadow-[0_0_20px_rgba(168,85,247,0.4)] text-white'
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
    <div 
      className="h-screen flex bg-transparent overflow-hidden font-sans select-none antialiased relative"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background Shader Canvas / SVG Backdrop */}
      {!shouldRenderStaticPath ? (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full block z-0 pointer-events-none"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none transition-colors duration-300" style={{ backgroundColor: theme === 'dark' ? '#080203' : '#FFF1F2' }}>
          <svg 
            className="absolute inset-0 w-full h-full opacity-90" 
            viewBox="0 0 1000 1000" 
            preserveAspectRatio="xMidYMid slice"
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="1000" height="1000" fill={theme === 'dark' ? '#080203' : '#FFF1F2'}/>
            <path d="M-100,800 C300,750 400,500 600,450 C800,400 900,200 1100,100" stroke={theme === 'dark' ? '#EF4444' : '#E11D48'} strokeWidth="20" strokeLinecap="round" opacity="0.8"/>
            <path d="M-100,700 C280,630 380,420 580,360 C780,300 880,120 1100,-20" stroke={theme === 'dark' ? '#FCA5A5' : '#9F1239'} strokeWidth="16" strokeLinecap="round" opacity="0.9"/>
            <path d="M-100,900 C320,870 420,580 620,540 C820,500 920,280 1100,220" stroke={theme === 'dark' ? '#EF4444' : '#E11D48'} strokeWidth="24" strokeLinecap="round" opacity="0.5"/>
            <path d="M-100,600 C260,510 360,340 560,270 C760,200 860,40 1100,-140" stroke={theme === 'dark' ? '#EF4444' : '#E11D48'} strokeWidth="14" strokeLinecap="round" opacity="0.4"/>
            <path d="M-100,500 C240,390 340,260 540,180 C740,100 840,-40 1100,-260" stroke={theme === 'dark' ? '#FCA5A5' : '#9F1239'} strokeWidth="12" strokeLinecap="round" opacity="0.7"/>
          </svg>
        </div>
      )}

      {/* Fallback Message Layer (Only visible when WebGL is unsupported and motion is NOT reduced) */}
      {!webglSupported && !prefersReducedMotion && (
        <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm text-zinc-400 p-8 font-sans pointer-events-none">
          <div className="w-16 h-16 rounded-full border border-rose-500/30 flex items-center justify-center bg-black/90 mb-4 shadow-2xl">
            <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-sm font-semibold text-rose-500 tracking-wider mb-1" style={{ fontFamily: 'var(--font-serif-instrument, "Instrument Serif", serif)' }}>
            Warp Stripes Fallback
          </h1>
          <p className="text-[10px] max-w-xs text-center leading-relaxed text-zinc-500">
            WebGL is disabled or unsupported. Displaying static vector background.
          </p>
        </div>
      )}

      {/* 1. LEFT SIDEBAR: Source files, Recall adding, and API config */}
      <aside 
        style={{ width: leftWidth }} 
        className="liquid-glass border-r border-white/10 flex flex-col shrink-0 overflow-hidden z-10"
      >
        
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center justify-center">
            <TransparentLogo 
              src="/logo.jpg" 
              alt="Styrud" 
              className="h-12 object-contain hover:scale-105 transition-transform duration-300 select-none pointer-events-none"
            />
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg transition-all duration-300 text-zinc-450 hover:text-white hover:bg-white/5"
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>
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
        <div className="mb-6 flex flex-wrap justify-between items-center text-xs text-zinc-400 liquid-glass rounded-2xl px-5 py-3.5 shadow-sm transition duration-300 gap-3">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-ping"></span>
            <span className="text-zinc-550 text-[11px] uppercase tracking-wider">FOCUS:</span>
            <span className="text-white font-semibold uppercase tracking-wider text-shadow-observe">
              {selectedAssetId 
                ? assets.find(a => a.id === selectedAssetId)?.title || 'Focused Source' 
                : 'All Combined Sources'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Export to Google NotebookLM Button */}
            <button
              onClick={() => handleLaunchNotebookLM(activeTool || 'reports')}
              title="Download packaged sources and open in Google NotebookLM"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/50 hover:to-indigo-600/50 border border-purple-500/40 text-purple-200 hover:text-white rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 active:scale-95 shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span>Open in NotebookLM ↗</span>
            </button>

            {/* Playwright Bot Auto-Runner Button */}
            <button
              onClick={() => handleOpenBotModal(activeTool || 'reports')}
              title="Launch Playwright Bot to automatically create notebook & execute task"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-pink-600/30 to-purple-600/30 hover:from-pink-600/50 hover:to-purple-600/50 border border-pink-500/40 text-pink-200 hover:text-white rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 active:scale-95 shadow-md"
            >
              <Bot className="w-3.5 h-3.5 text-pink-400" />
              <span>Auto-Bot 🤖</span>
            </button>

            <div className="flex items-center gap-1.5 text-zinc-550 pl-2 border-l border-white/10">
              <span className="text-[11px] uppercase tracking-wider">LAYOUT: </span>
              <span className="text-white font-bold capitalize text-shadow-observe">
                {showRecallGraph ? 'Recall Graph' : activeTool || 'Styrud Grid'}
              </span>
            </div>
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
              onLaunchNotebookLM={handleLaunchNotebookLM}
              onLaunchBot={handleOpenBotModal}
            />
          )}
        </div>

        {/* Floating Magnification Dock at bottom center */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 hidden md:block max-w-[calc(100%-2rem)]">
          <MagnificationDock items={dockItems} magnification={56} baseItemSize={40} panelHeight={60} />
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
            <span className="font-semibold text-zinc-200 text-sm tracking-tight text-shadow-observe">Gemini Assistant</span>
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
          <div ref={chatBottomRef} />
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
                <span className="font-bold text-sm uppercase tracking-wider text-white">Model Credentials Config</span>
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

      {/* Google NotebookLM Export & Launch Modal */}
      <NotebookLMModal 
        isOpen={notebookModalOpen}
        onClose={() => setNotebookModalOpen(false)}
        toolTitle={notebookModalData.toolTitle}
        prompt={notebookModalData.prompt}
        filename={notebookModalData.filename}
        assetsCount={notebookModalData.assetsCount}
        fileContent={notebookModalData.fileContent}
      />

      {/* Playwright Automation Bot Modal */}
      <NotebookLMBotModal 
        isOpen={botModalOpen}
        onClose={() => setBotModalOpen(false)}
        toolId={botModalData.toolId}
        toolTitle={botModalData.toolTitle}
        assetId={selectedAssetId}
      />

    </div>
  );
}

/**
 * Google NotebookLM Integration Bridge for Styrud
 * 
 * Automatically packages active workspace sources, prepares specialized
 * feature prompts, copies them to clipboard, downloads source files,
 * and launches Google NotebookLM in a new tab.
 */

export interface NotebookLMTask {
  toolId: string;
  title: string;
  prompt: string;
  description: string;
}

export const NOTEBOOKLM_TASKS: Record<string, NotebookLMTask> = {
  audio: {
    toolId: 'audio',
    title: 'Audio Overview Briefing',
    prompt: 'Please generate a comprehensive, multi-speaker Audio Overview podcast briefing synthesizing the core concepts, architecture, and real-world applications from these uploaded study sources.',
    description: 'Generates a deep-dive 2-host audio briefing in Google NotebookLM.'
  },
  reports: {
    toolId: 'reports',
    title: 'Academic Research Report',
    prompt: 'Please create an in-depth, academic-grade research briefing report with executive summary, technical breakdown, comparative analysis, and key study takeaways based strictly on these uploaded sources.',
    description: 'Generates an extensive study guide and deep-dive report.'
  },
  quiz: {
    toolId: 'quiz',
    title: 'Interactive Evaluation Quiz',
    prompt: 'Please generate a 5-question multiple choice evaluation quiz with 4 distinct options and detailed concept explanations for each correct answer based on these uploaded sources.',
    description: 'Tests retention with multiple-choice questions.'
  },
  flashcards: {
    toolId: 'flashcards',
    title: 'Active Recall Flashcards',
    prompt: 'Please create 8 high-yield active recall flashcards for exam preparation covering core definitions, formulas, component functions, and architectures from these sources.',
    description: 'Generates active recall question/answer study cards.'
  },
  slides: {
    toolId: 'slides',
    title: 'Slide Deck Presentation',
    prompt: 'Please generate a structured 6-slide presentation deck with clear headlines, high-impact bullet points, and visual illustration cues based on these uploaded sources.',
    description: 'Creates a visual presentation deck outline.'
  },
  video: {
    toolId: 'video',
    title: 'Video Overview Presentation',
    prompt: 'Please create a video overview presentation script with synchronized narration cues and key bullet points based on these uploaded sources.',
    description: 'Generates a video slide narration outline.'
  },
  mindmap: {
    toolId: 'mindmap',
    title: 'Hierarchical Concept Tree',
    prompt: 'Please construct a hierarchical concept map and knowledge tree breaking down all main themes, subtopics, and granular definitions from these uploaded sources.',
    description: 'Maps concepts into a structured tree breakdown.'
  },
  infographic: {
    toolId: 'infographic',
    title: 'Infographic Timeline & Process',
    prompt: 'Please extract the key evolutionary milestones, hardware generations, and engineering design parameters into a structured infographic timeline and process map.',
    description: 'Structures data for visual timeline and process infographics.'
  },
  datatable: {
    toolId: 'datatable',
    title: 'Comparative Data Matrix',
    prompt: 'Please build a structured comparative data matrix distinguishing architectures, technical specifications, and processor categories from these uploaded sources.',
    description: 'Generates comparison tables of technical parameters.'
  },
  chat: {
    toolId: 'chat',
    title: 'Grounded Reasoning Q&A',
    prompt: 'Analyze these uploaded study materials and answer questions with grounded source citations.',
    description: 'Enables grounded reasoning with source citations.'
  }
};

/**
 * Downloads a text file directly to the user's browser.
 */
export function triggerFileDownload(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copies text to the user's system clipboard safely.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-999999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      return successful;
    }
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    return false;
  }
}

/**
 * Main Bridge Action: Exports workspace sources, copies prompt, downloads file,
 * and opens Google NotebookLM in a new browser tab.
 */
export async function exportAndLaunchNotebookLM(
  toolId: string = 'reports',
  assetId?: string | null
): Promise<{ success: boolean; prompt: string; filename: string; assetsCount: number; error?: string }> {
  try {
    const url = assetId ? `/api/export-sources?asset_id=${encodeURIComponent(assetId)}` : '/api/export-sources';
    const res = await fetch(url);
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to export workspace sources');
    }
    
    const data = await res.json();
    const taskInfo = NOTEBOOKLM_TASKS[toolId] || NOTEBOOKLM_TASKS.reports;
    
    // 1. Trigger source file download
    const filename = data.filename || 'Styrud_NotebookLM_Sources.txt';
    triggerFileDownload(filename, data.content);
    
    // 2. Copy specialized prompt to clipboard
    await copyToClipboard(taskInfo.prompt);
    
    // 3. Open Google NotebookLM in new tab
    const notebookLMUrl = data.notebooklm_url || 'https://notebooklm.google.com';
    window.open(notebookLMUrl, '_blank');
    
    return {
      success: true,
      prompt: taskInfo.prompt,
      filename,
      assetsCount: data.assets_count
    };
  } catch (err: any) {
    console.error('NotebookLM Bridge error:', err);
    return {
      success: false,
      prompt: '',
      filename: '',
      assetsCount: 0,
      error: err.message || 'Unknown error launching NotebookLM'
    };
  }
}

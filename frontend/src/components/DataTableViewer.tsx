import React, { useState, useEffect } from 'react';
import { Table, ChevronLeft, Sparkles } from 'lucide-react';
import { exportAndLaunchNotebookLM } from '../utils/notebooklmBridge';

import { safeFetchJson, getSeededData } from '../utils/seededData';

interface DataTableViewerProps {
  assetId: string | null;
  onBack: () => void;
}

export default function DataTableViewer({ assetId, onBack }: DataTableViewerProps) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDataTable = async () => {
      setLoading(true);
      setError(null);
      try {
        const fallback = getSeededData('datatable');
        const defaultTable = fallback.datatable?.tables?.[1] || fallback.datatable?.tables?.[0] || { headers: [], rows: [] };
        const url = assetId ? `/api/generate/datatable?asset_id=${assetId}` : '/api/generate/datatable';
        const data = await safeFetchJson(url, fallback);
        
        if (data.headers && data.rows) {
          setHeaders(data.headers);
          setRows(data.rows);
        } else if (data.datatable?.tables?.[0]) {
          const selected = data.datatable.tables[1] || data.datatable.tables[0];
          setHeaders(selected.headers);
          setRows(selected.rows);
        } else {
          setHeaders(defaultTable.headers);
          setRows(defaultTable.rows);
        }
      } catch (err: any) {
        const fallback = getSeededData('datatable');
        const defaultTable = fallback.datatable?.tables?.[1] || { headers: [], rows: [] };
        setHeaders(defaultTable.headers);
        setRows(defaultTable.rows);
      } finally {
        setLoading(false);
      }
    };

    fetchDataTable();
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
          onClick={() => exportAndLaunchNotebookLM('datatable', assetId)}
          title="Download sources and generate in Google NotebookLM"
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 hover:text-white rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Open in NotebookLM ↗</span>
        </button>
      </div>

      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-2">
          <Table className="w-5 h-5 text-teal-400 animate-pulse" />
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Tabular Breakdown</h2>
            <p className="text-[10px] text-zinc-500 mt-0.5 font-semibold">Extracted parameter values and classifications</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-styrud-panel border border-white/[0.06] rounded-3xl h-[350px] flex flex-col items-center justify-center text-zinc-500 gap-3 shadow-xl">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-300">Parsing Data Matrices...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl text-zinc-400 text-xs">
          {error}
        </div>
      ) : headers.length === 0 ? (
        <div className="bg-styrud-panel border border-white/[0.06] rounded-3xl h-[350px] flex items-center justify-center text-zinc-500 shadow-xl text-xs uppercase tracking-wider font-bold">
          No comparison tables compiled
        </div>
      ) : (
        <div className="bg-styrud-panel border border-white/[0.06] rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black border-b border-white/[0.06] text-zinc-400 text-[10px] font-black uppercase tracking-widest">
                  {headers.map((h, idx) => (
                    <th key={idx} className="p-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-zinc-300 text-xs font-semibold">
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-white/[0.01] transition-colors duration-300">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-4 leading-relaxed">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

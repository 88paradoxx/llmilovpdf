import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ImageState } from '../../types';
import {
  FileSpreadsheet,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Home,
  Zap,
  Search,
  Table as TableIcon
} from 'lucide-react';
import { utils, write } from 'xlsx';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Helper to get the actual library object
const getPdfLib = () => {
  return pdfjsLib;
};

interface Props {
  image: ImageState;
  setIsProcessing: (loading: boolean) => void;
  setLivePreview?: (node: React.ReactNode) => void;
  file?: File | null;
  onBack: () => void;
}

export default function PdfToExcelTool({ image, setIsProcessing, setLivePreview, file, onBack }: Props) {
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'converting' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const isAnalyzingRef = useRef(false);

  const analyzePdf = useCallback(async (file: File) => {
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      return;
    }

    if (isAnalyzingRef.current) return;
    isAnalyzingRef.current = true;
    setIsAnalyzing(true);
    setThumbnails([]);

    try {
      const lib = getPdfLib();
      if (!lib.GlobalWorkerOptions.workerSrc) {
        lib.GlobalWorkerOptions.workerSrc = pdfWorker || `https://unpkg.com/pdfjs-dist@${lib.version}/build/pdf.worker.min.mjs`;
      }

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = lib.getDocument({
        data: new Uint8Array(arrayBuffer),
        cMapUrl: 'https://unpkg.com/pdfjs-dist@5.4.449/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@5.4.449/standard_fonts/',
      });

      const pdfDoc = await loadingTask.promise;
      const generatedThumbnails: string[] = [];
      const maxPreviewPages = Math.min(pdfDoc.numPages, 10);

      for (let i = 1; i <= maxPreviewPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 1.0 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const targetWidth = 1500;
        const scale = targetWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        if (ctx) {
          await page.render({ canvasContext: ctx, viewport: scaledViewport, canvas }).promise;
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          generatedThumbnails.push(dataUrl);
          setThumbnails([...generatedThumbnails]);
        }
      }

      await pdfDoc.destroy();
    } catch (err) {
      console.error("Analysis Error:", err);
    } finally {
      setIsAnalyzing(false);
      isAnalyzingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (file && pdfFiles.length === 0) {
      setPdfFiles([file]);
      analyzePdf(file);
    }
  }, [analyzePdf, pdfFiles.length, file]);

  useEffect(() => {
    if (!setLivePreview) return;

    if (isAnalyzing) {
      setLivePreview(
        <div className="w-full h-full bg-[#0d0d12] flex flex-col items-center justify-center text-green-500">
          <div className="relative mb-6">
            <Loader2 size={48} className="animate-spin opacity-20" />
            <Search size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em]">Scanning Tables</p>
        </div>
      );
      return;
    }

    if (thumbnails.length > 0) {
      setLivePreview(
        <div className="w-full h-full bg-[#0d0d12] overflow-y-auto p-4 md:p-12 scrollbar-hide flex flex-col items-center gap-12">
          <div className="w-full max-w-3xl space-y-12">
            <div className="flex flex-col gap-8">
              {thumbnails.map((thumb, idx) => (
                <div
                  key={idx}
                  className="group relative w-full aspect-[1.414/1] bg-white rounded-2xl shadow-[0_40px_80px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-500 border border-white/5 transition-all hover:scale-[1.01]"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="absolute top-6 left-6 z-20 px-3 py-1.5 bg-green-600/90 backdrop-blur-md text-white text-[9px] font-black rounded-lg uppercase tracking-widest border border-white/10 shadow-xl flex items-center gap-2">
                    <TableIcon size={12} /> Table View {idx + 1}
                  </div>
                  {/* Simulated spreadsheet grid overlay */}
                  <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:20px_20px]" />
                  <img src={thumb} className="w-full h-full object-contain bg-zinc-900/50 select-none" alt={`Page ${idx + 1}`} draggable={false} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
            <div className="h-20 shrink-0" />
          </div>
        </div>
      );
    }
  }, [isAnalyzing, thumbnails, setLivePreview]);

  const handleConvert = async () => {
    if (pdfFiles.length === 0) return;
    setIsProcessing(true);
    setStatus('converting');
    setProgress(10);

    try {
      const lib = getPdfLib();
      if (!lib.GlobalWorkerOptions.workerSrc) {
        lib.GlobalWorkerOptions.workerSrc = pdfWorker || `https://unpkg.com/pdfjs-dist@${lib.version}/build/pdf.worker.min.mjs`;
      }

      // Process the first file
      const fileToConvert = pdfFiles[0];
      const arrayBuffer = await fileToConvert.arrayBuffer();
      const loadingTask = lib.getDocument({
        data: new Uint8Array(arrayBuffer),
        cMapUrl: 'https://unpkg.com/pdfjs-dist@5.4.449/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@5.4.449/standard_fonts/',
      });

      const pdfDoc = await loadingTask.promise;
      const allRows: string[][] = [];
      const numPages = pdfDoc.numPages;

      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const content = await page.getTextContent();

        // 1. Extract and sort items
        const items = (content.items as any[]).map(item => ({
          str: item.str,
          x: item.transform[4],
          y: item.transform[5],
          h: item.height || item.transform[3] || 10,
          w: item.width || item.transform[0] || 0
        })).filter(i => i.str.trim().length > 0);

        // Sort by Y desc
        items.sort((a, b) => b.y - a.y);

        const pageRows: any[][] = [];
        if (items.length > 0) {
          let currentRow: any[] = [items[0]];
          let currentRowY = items[0].y;

          for (let j = 1; j < items.length; j++) {
            const item = items[j];
            if (Math.abs(item.y - currentRowY) < (item.h || 10)) {
              currentRow.push(item);
            } else {
              pageRows.push(currentRow.sort((a, b) => a.x - b.x));
              currentRow = [item];
              currentRowY = item.y;
            }
          }
          if (currentRow.length > 0) pageRows.push(currentRow.sort((a, b) => a.x - b.x));
        }

        // Add to global collection
        pageRows.forEach(row => {
          allRows.push(row.map(r => r.str));
        });
        // Add visual spacer row between pages (empty row)
        allRows.push([]);

        const percent = Math.round((i / numPages) * 100);
        setProgress(Math.max(10, percent));
      }

      await pdfDoc.destroy();

      setProgress(100);
      setStatus('completed');

      // Convert to XLSX using SheetJS
      const ws = utils.aoa_to_sheet(allRows);

      // Set default column width to ~20 chars to ensure dates are visible
      // Calculate max columns to apply width to all potential cols
      const maxCols = allRows.reduce((acc, row) => Math.max(acc, row.length), 0);
      const colWidths = Array(maxCols).fill({ wch: 20 });
      ws['!cols'] = colWidths;

      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Sheet1");

      const excelBuffer = write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = image.name.replace(/\.pdf$/i, '.xlsx');
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 1000);

    } catch (err) {
      console.error("Conversion failed:", err);
      setStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0d0d12] text-white overflow-hidden" onClick={(e) => e.stopPropagation()}>
      <div className="flex-1 flex flex-col p-3 md:p-4 overflow-y-auto scrollbar-hide space-y-4 md:space-y-5">
        {/* Navigation & Title - Compact */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center border border-white/10 shadow-lg shadow-green-500/20">
                <FileSpreadsheet size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-black uppercase tracking-tight text-[13px] leading-none text-white">PDF to Excel</h3>
                <p className="text-[9px] font-bold uppercase opacity-60 mt-1.5 tracking-widest text-green-400">Data Suite</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between w-full">
            <button
              onClick={onBack}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all border border-white/5 group mr-2"
            >
              <ArrowLeft size={10} className="group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-[8px] font-black uppercase tracking-widest">Back</span>
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all border border-white/5 group ml-2"
            >
              <Home size={10} />
              <span className="text-[8px] font-black uppercase tracking-widest">Home</span>
            </button>
          </div>
        </div>

        {/* File Info */}
        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/40">
              <FileSpreadsheet size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-white truncate">{image.name}</p>
              <p className="text-[9px] font-medium text-white/40 uppercase">{(image.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-4">
          {status === 'idle' && (
            <button
              onClick={handleConvert}
              disabled={isAnalyzing}
              className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 group"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Analyzing...</span>
                </>
              ) : (
                <>
                  <Zap size={14} className="group-hover:scale-110 transition-transform" />
                  Convert to Excel
                </>
              )}
            </button>
          )}

          {status === 'converting' && (
            <div className="space-y-4 p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-green-400">Processing...</span>
                <span className="text-[10px] font-black text-white">{progress}%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-green-500 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {status === 'completed' && (
            <div className="space-y-4">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
                  <CheckCircle2 size={16} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-green-400">Conversion Complete!</p>
              </div>
              <button
                onClick={handleConvert}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/10 flex items-center justify-center gap-2"
              >
                <Download size={14} />
                Download Again
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white">
                <AlertCircle size={16} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Conversion Failed</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


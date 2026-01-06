import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ImageState } from '../../types';
import { formatSize } from '../../services/imageService';
import {
  Scissors,
  Plus,
  Download,
  X,
  Loader2,
  Zap,
  Files,
  LayoutGrid,
  Hash,
  FileArchive,
  CheckCircle,
  AlertCircle,
  History,
  Layout,
  ArrowLeft,
  Home
} from 'lucide-react';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

interface Props {
  image: ImageState;
  setIsProcessing: (v: boolean) => void;
  setLivePreview?: (node: React.ReactNode) => void;
  file?: File | null;
  onBack?: () => void;
}

type SplitMode = 'ranges' | 'fixed' | 'explode';

export default function PdfSplitterTool({ image, setIsProcessing, setLivePreview, file, onBack }: Props) {
  const [splitMode, setSplitMode] = useState<SplitMode>('ranges');
  const [rangeStr, setRangeStr] = useState('1');
  const [chunkSize, setChunkSize] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPdfData = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert("Please select a valid PDF file.");
      return;
    }
    setIsProcessing(true);
    setCurrentFile(file);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      // Use unpkg CDN for the worker to ensure reliability across all environments
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.449/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        cMapUrl: 'https://unpkg.com/pdfjs-dist@5.4.449/cmaps/',
        cMapPacked: true,
      });
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;
      setTotalPages(numPages);

      const thumbs: string[] = [];
      const renderCount = Math.min(numPages, 100); // Limit preview for performance

      for (let i = 1; i <= renderCount; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { willReadFrequently: true });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        if (context) {
          await page.render({ canvasContext: context, viewport, canvas }).promise;
          thumbs.push(canvas.toDataURL('image/jpeg', 0.95));
        }
      }
      setThumbnails(thumbs);
      await pdfDoc.destroy();
    } catch (err) {
      console.error("PDF load failed:", err);
    } finally {
      setIsProcessing(false);
    }
  }, [setIsProcessing]);

  useEffect(() => {
    if (setLivePreview && thumbnails.length > 0) {
      setLivePreview(
        <div className="w-full h-full bg-[#0d0d12] overflow-y-auto p-4 md:p-12 scrollbar-hide flex flex-col items-center gap-12">
          <div className="w-full max-w-2xl flex flex-col gap-12">
            {thumbnails.map((src, idx) => {
              const pageNum = idx + 1;
              let isSelected = false;

              if (splitMode === 'explode') isSelected = true;
              else if (splitMode === 'fixed') {
                const groupIndex = Math.floor(idx / chunkSize);
                if (groupIndex % 2 === 0) isSelected = true;
              } else {
                const parts = rangeStr.split(',').map(p => p.trim());
                parts.forEach(r => {
                  if (r.includes('-')) {
                    const [s, e] = r.split('-').map(n => parseInt(n));
                    if (pageNum >= s && pageNum <= e) isSelected = true;
                  } else if (parseInt(r) === pageNum) isSelected = true;
                });
              }

              return (
                <div key={idx} className="flex flex-col gap-2 group animate-in fade-in zoom-in-95 duration-300" style={{ animationDelay: `${idx * 10}ms` }}>
                  <div className={`relative aspect-[1/1.414] bg-white border rounded-2xl overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.5)] transition-all duration-300 ${isSelected ? 'ring-4 ring-orange-500 scale-[1.01] shadow-orange-500/20' : 'border-white/5 opacity-40 group-hover:opacity-100 group-hover:border-white/10'}`}>
                    <img src={src} className="w-full h-full object-cover" alt={`Page ${pageNum}`} />
                    <div className="absolute top-6 left-6 px-3 py-1.5 bg-black/80 backdrop-blur-md text-white text-[9px] font-black rounded-lg uppercase tracking-widest border border-white/10 shadow-xl">
                      Page {pageNum}
                    </div>
                    {isSelected && (
                      <div className="absolute inset-0 bg-orange-500/5 pointer-events-none" />
                    )}
                  </div>
                </div>
              );
            })}
            {totalPages > 100 && (
              <div className="aspect-[1/1.414] bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center text-[10px] font-black text-slate-500 uppercase text-center p-6">
                +{totalPages - 100} more pages
              </div>
            )}
          </div>
        </div>
      );
    }
  }, [thumbnails, totalPages, setLivePreview, rangeStr, splitMode]);

  useEffect(() => {
    const enqueued = (window as any)._enqueuedPdf || file;
    if (enqueued && !currentFile) {
      loadPdfData(enqueued);
      if ((window as any)._enqueuedPdf) (window as any)._enqueuedPdf = null;
    }
  }, [loadPdfData, currentFile, file]);

  const parseRanges = (str: string, total: number): number[][] => {
    const parts = str.split(',').map(p => p.trim());
    const groups: number[][] = [];
    parts.forEach(part => {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(n => parseInt(n));
        if (!isNaN(start) && !isNaN(end)) {
          const range: number[] = [];
          for (let i = Math.max(1, start); i <= Math.min(total, end); i++) {
            range.push(i - 1);
          }
          if (range.length > 0) groups.push(range);
        }
      } else {
        const n = parseInt(part);
        if (!isNaN(n) && n >= 1 && n <= total) groups.push([n - 1]);
      }
    });
    return groups;
  };

  const handleSplit = async () => {
    if (!currentFile) return;
    setIsProcessing(true);
    setIsLibraryLoading(true);
    setProgress(5);

    try {
      const { PDFDocument } = await import('pdf-lib');
      const JSZip = (await import('jszip')).default;

      const arrayBuffer = await currentFile.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuffer);
      const total = srcDoc.getPageCount();

      let splitGroups: number[][] = [];

      if (splitMode === 'explode') {
        for (let i = 0; i < total; i++) splitGroups.push([i]);
      } else if (splitMode === 'fixed') {
        for (let i = 0; i < total; i += chunkSize) {
          const group = [];
          for (let j = i; j < Math.min(i + chunkSize, total); j++) group.push(j);
          splitGroups.push(group);
        }
      } else {
        splitGroups = parseRanges(rangeStr, total);
      }

      if (splitGroups.length === 0) throw new Error("No valid page ranges defined.");

      if (splitGroups.length === 1) {
        // Single file extract
        const outDoc = await PDFDocument.create();
        const pages = await outDoc.copyPages(srcDoc, splitGroups[0]);
        pages.forEach((p: any) => outDoc.addPage(p));
        const bytes = await outDoc.save();
        const blob = new Blob([bytes as any], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `extracted-${currentFile.name}`;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      } else {
        // Multi file split -> ZIP
        const zip = new JSZip();
        for (let i = 0; i < splitGroups.length; i++) {
          setProgress(Math.round((i / splitGroups.length) * 90));
          const outDoc = await PDFDocument.create();
          const copiedPages = await outDoc.copyPages(srcDoc, splitGroups[i]);
          copiedPages.forEach((p: any) => outDoc.addPage(p));
          const bytes = await outDoc.save();
          zip.file(`split-${i + 1}-${currentFile.name}`, bytes);
        }

        const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `split-collection-${Date.now()}.zip`;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
      setProgress(100);
    } catch (err: any) {
      alert(`Split failed: ${err?.message || "Verify your ranges."}`);
    } finally {
      setIsProcessing(false);
      setIsLibraryLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111114] text-white overflow-hidden p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-xl border border-white/10 shadow-orange-500/20">
              <Scissors size={20} />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-tight text-[13px] leading-none text-white">PDF Splitter</h3>
              <p className="text-[9px] font-bold uppercase opacity-60 mt-1.5 tracking-widest text-orange-400">Stack Architect</p>
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

      <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-6">
        {isLibraryLoading && (
          <div className="glass-surface-soft rounded-2xl p-5 text-white shadow-xl animate-in zoom-in-95 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest">Splitting Blocks</span>
              <span className="text-sm font-black">{progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden">
              <div className="h-full bg-white transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="space-y-4">
          {currentFile && (
            <div className="glass-surface-soft p-3 rounded-2xl border border-white/10 shadow-inner">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-xl shrink-0"><Scissors size={18} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase text-white truncate">{currentFile.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{totalPages} Pages</span>
                    <div className="w-1 h-1 bg-slate-700 rounded-full" />
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{formatSize(currentFile.size)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full glass-surface-soft border-2 border-dashed border-white/10 py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all group"
          >
            <Plus size={16} className="text-slate-500 group-hover:scale-110 group-hover:text-orange-500 transition-all" />
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
              {currentFile ? 'Change PDF File' : 'Select PDF File'}
            </span>
          </button>
          <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && loadPdfData(e.target.files[0])} className="hidden" accept="application/pdf" />
        </div>

        <div className="space-y-3">
          <p className="text-[8px] font-black text-purple-400 uppercase tracking-widest ml-1">Partition Mode</p>
          <div className="grid grid-cols-1 gap-2">
            {[
              { id: 'ranges', label: 'Custom Ranges', desc: 'Extract specific pages', icon: <Layout /> },
              { id: 'fixed', label: 'Fixed Chunks', desc: 'Split every X pages', icon: <LayoutGrid /> },
              { id: 'explode', label: 'Explode All', desc: 'Every page as a file', icon: <Scissors /> }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setSplitMode(m.id as SplitMode)}
                className={`group flex items-start gap-3 p-3 rounded-2xl border-2 transition-all text-left ${splitMode === m.id ? 'border-orange-500 bg-orange-500/10 shadow-xl shadow-orange-500/10' : 'border-white/5 glass-surface-soft hover:border-white/10'}`}
              >
                <div className={`mt-0.5 ${splitMode === m.id ? 'text-orange-500' : 'text-slate-500 group-hover:text-slate-300'}`}>
                  {React.cloneElement(m.icon as React.ReactElement<any>, { size: 14 })}
                </div>
                <div className="flex-1">
                  <span className={`block text-[9px] font-black uppercase tracking-widest ${splitMode === m.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{m.label}</span>
                  <p className="text-[7px] font-bold text-slate-500 uppercase tracking-tighter mt-0.5">{m.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-white/5 mx-2" />

        {splitMode === 'ranges' && (
          <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
            <div className="flex justify-between items-center px-1">
              <label className="text-[8px] font-black text-purple-400 uppercase tracking-widest">Defined Ranges</label>
              <Hash size={12} className="text-slate-600" />
            </div>
            <div className="glass-surface-soft border border-white/10 rounded-2xl p-2 shadow-inner">
              <input
                type="text"
                value={rangeStr}
                onChange={(e) => setRangeStr(e.target.value)}
                placeholder="e.g. 1-3, 5, 10-12"
                className="w-full px-3 py-2 bg-transparent text-white text-[10px] font-black outline-none placeholder:text-slate-700"
              />
            </div>
            <p className="text-[7px] font-bold text-slate-500 uppercase leading-relaxed px-1">
              Use commas for files, dashes for blocks. Preview updates live in workspace.
            </p>
          </div>
        )}

        {splitMode === 'fixed' && (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
            <div className="flex justify-between items-center px-1">
              <label className="text-[8px] font-black text-purple-400 uppercase tracking-widest">Pages Per Bundle</label>
              <LayoutGrid size={12} className="text-slate-600" />
            </div>
            <div className="flex items-center gap-4 px-1">
              <input
                type="range" min="1" max={Math.max(1, totalPages)} step="1"
                value={chunkSize} onChange={(e) => setChunkSize(parseInt(e.target.value))}
                className="flex-1 h-1 rounded-lg appearance-none cursor-pointer accent-orange-500 glass-slider-track"
              />
              <div className="bg-orange-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black shadow-lg">
                {chunkSize}
              </div>
            </div>
            <p className="text-[7px] font-bold text-slate-500 uppercase text-center tracking-widest">
              Creates approx. {Math.ceil(totalPages / chunkSize)} separate files
            </p>
          </div>
        )}

        <div className="glass-surface-soft border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3">
          <Zap size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[8px] font-bold text-amber-500/80 leading-relaxed uppercase tracking-tight">
            Native Partition: Preserves metadata, internal links, and vector quality across output files.
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-white/5 mt-4 glass-surface shrink-0">
        <button
          onClick={handleSplit}
          disabled={!currentFile || isLibraryLoading}
          className="w-full glass-button-primary text-white py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-20"
        >
          {isLibraryLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          <span className="ml-2">{isLibraryLoading ? 'SPLITTING...' : 'START SPLIT'}</span>
        </button>
      </div>
    </div>
  );
}


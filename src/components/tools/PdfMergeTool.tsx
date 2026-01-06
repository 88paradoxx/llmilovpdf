import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ImageState } from '../../types';
import { formatSize } from '../../services/imageService';
import { compressPdfNative } from '../../services/pdfCompressionService';
import {
  Combine,
  Plus,
  Loader2,
  X,
  ChevronUp,
  ChevronDown,
  Files,
  FileCheck,
  Zap,
  ShieldCheck,
  Layout,
  ArrowLeft,
  Home,
  Settings,
  Eye
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

interface PdfMetadata {
  id: string;
  file: File;
  thumbnail: string | null;
  pages: number;
}

const MAX_FILES = 100;

export default function PdfMergeTool({ image, setIsProcessing, setLivePreview, file, onBack }: Props) {
  const [pdfQueue, setPdfQueue] = useState<PdfMetadata[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processNewFile = useCallback(async (file: File) => {
    try {
      const pdfjsLibMod = await import('pdfjs-dist');
      const pdfjsLib = pdfjsLibMod.default || pdfjsLibMod;
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        cMapUrl: 'https://unpkg.com/pdfjs-dist@5.4.449/cmaps/',
        cMapPacked: true,
      }).promise;

      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      if (ctx) {
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      }

      const meta: PdfMetadata = {
        id: Math.random().toString(36).substring(2, 11),
        file,
        thumbnail: canvas.toDataURL('image/jpeg', 0.95),
        pages: pdf.numPages
      };

      setPdfQueue(prev => [...prev, meta]);
      await pdf.destroy();
    } catch (err) {
      console.error("File prep failed:", err);
    }
  }, []);

  // Capture initial file from Home Screen
  const hasProcessedInitial = useRef(false);
  useEffect(() => {
    // Check for array from Landing Page (multi-select)
    const enqueuedList = (window as any)._enqueuedPdfs as File[];
    const enqueuedSingle = (window as any)._enqueuedPdf || file;

    // Prevent double-processing (React StrictMode async race)
    if (hasProcessedInitial.current) return;

    if (enqueuedList && enqueuedList.length > 0) {
      hasProcessedInitial.current = true;
      enqueuedList.forEach(f => processNewFile(f));
      (window as any)._enqueuedPdfs = null;
    } else if (enqueuedSingle && pdfQueue.length === 0) {
      hasProcessedInitial.current = true;
      processNewFile(enqueuedSingle);
      if ((window as any)._enqueuedPdf) (window as any)._enqueuedPdf = null;
    }
  }, [processNewFile, file]); // Removed pdfQueue.length to avoid re-triggering logic unnecessarily

  // Visual Workspace Preview
  useEffect(() => {
    if (!setLivePreview) return;

    if (pdfQueue.length === 0) {
      setLivePreview(
        <div className="w-full h-full bg-[#030308] flex flex-col items-center justify-center text-slate-700 pointer-events-auto">
          <div className="w-24 h-24 bg-white/5 rounded-[40px] flex items-center justify-center mb-6 border border-white/5 animate-pulse shadow-2xl">
            <Combine size={40} className="text-slate-600" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-[0.4em] mb-2">Merge Studio</h3>
          <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Add documents to build the stack</p>
        </div>
      );
      return;
    }

    setLivePreview(
      <div className="w-full h-full bg-[#0d0d12] overflow-y-auto p-4 md:p-12 scrollbar-hide flex flex-col items-center gap-12 pointer-events-auto">
        <div className="w-full max-w-2xl flex flex-col gap-8">
          {pdfQueue.map((item, idx) => (
            <div
              key={item.id}
              className="relative w-full aspect-[1/1.414] bg-white rounded-2xl shadow-[0_40px_80px_rgba(0,0,0,0.5)] border border-white/5 overflow-hidden transition-all duration-500 animate-in fade-in slide-in-from-bottom-8"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              {item.thumbnail && <img src={item.thumbnail} className="w-full h-full object-cover" alt="PDF" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              <div className="absolute top-6 left-6 flex items-center gap-3">
                <div className="bg-black/60 backdrop-blur-md text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border border-white/10 shadow-xl">
                  Document {idx + 1}
                </div>
                <div className="bg-purple-600 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-lg shadow-xl">
                  {item.pages} Pages
                </div>
              </div>
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-white text-[11px] font-black uppercase tracking-widest truncate drop-shadow-lg">{item.file.name}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-2 mb-20">
          <div className="px-6 py-3 bg-[#5551FF]/10 border border-[#5551FF]/30 rounded-2xl flex items-center gap-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-4">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest">Total Payload</span>
              <span className="text-xl font-black text-white tabular-nums">
                {pdfQueue.reduce((acc, curr) => acc + curr.pages, 0)} <span className="text-[10px] text-slate-500">Pages</span>
              </span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest">Merged Stack</span>
              <span className="text-xl font-black text-white tabular-nums">
                {pdfQueue.length} <span className="text-[10px] text-slate-500">Docs</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }, [pdfQueue, setLivePreview]);

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = Array.from(e.target.files || []) as File[];
    const validPdfs = uploaded.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (validPdfs.length + pdfQueue.length > MAX_FILES) {
      alert(`The limit for this session is ${MAX_FILES} documents.`);
      return;
    }
    validPdfs.forEach(file => processNewFile(file));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (id: string) => setPdfQueue(prev => prev.filter(item => item.id !== id));

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const newQueue = [...pdfQueue];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= pdfQueue.length) return;
    [newQueue[index], newQueue[target]] = [newQueue[target], newQueue[index]];
    setPdfQueue(newQueue);
  };

  const mergePdfs = async () => {
    if (pdfQueue.length < 2) return;
    setIsProcessing(true);
    setIsMerging(true);
    try {
      const pdfLibMod = await import('pdf-lib');
      const { PDFDocument } = pdfLibMod;

      if (!PDFDocument) {
        throw new Error("Failed to initialize PDF primitives.");
      }

      const mergedPdf = await PDFDocument.create();
      for (const item of pdfQueue) {
        const ab = await item.file.arrayBuffer();
        const pdf = await PDFDocument.load(ab);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((p: any) => mergedPdf.addPage(p));
      }

      // Output preparation
      const rawBytes = await mergedPdf.save();

      // CRITICAL: Mandatory optimization pass to significantly reduce size
      const compressedResult = await compressPdfNative(rawBytes.buffer as ArrayBuffer);
      const outBlob = compressedResult.blob;

      const url = URL.createObjectURL(outBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `merged-stack-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 10000);

    } catch (err: any) {
      console.error("Merge failure:", err);
      alert(`Merging failed: ${err?.message || "Invalid PDF structure detected."}`);
    }
    finally {
      setIsProcessing(false);
      setIsMerging(false);
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col bg-[#111114] text-white overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto scrollbar-hide space-y-6">
        {/* HEADER */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#5551FF] rounded-xl flex items-center justify-center border border-white/10 shadow-lg shadow-[#5551FF]/20">
                <Combine size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-black uppercase tracking-tight text-[13px] leading-none text-white">PDF Merge</h3>
                <p className="text-[9px] font-bold uppercase opacity-60 mt-1.5 tracking-widest text-[#5551FF]">Stack Architect</p>
              </div>
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

        <div className="flex flex-col gap-6 flex">
          <div className="space-y-4">
            <input type="file" ref={fileInputRef} onChange={handlePdfUpload} className="hidden" multiple accept="application/pdf" />
          </div>

          <div className="flex-1 flex flex-col gap-3">
            <div className="flex items-center justify-between px-1 shrink-0">
              <label className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">Active Queue</label>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{pdfQueue.length} Items</span>
            </div>

            <div className="space-y-2 pb-10">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full group relative glass-surface-soft rounded-3xl p-3.5 border-2 border-dashed border-white/10 transition-all hover:bg-white/5 hover:border-purple-500/30 flex items-center gap-4"
              >
                <div className="w-10 h-10 bg-white/5 text-slate-500 rounded-2xl flex items-center justify-center shrink-0 border border-white/5 group-hover:bg-purple-600/10 group-hover:text-purple-500 transition-colors">
                  <Plus size={20} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[11px] font-black uppercase text-slate-500 group-hover:text-slate-300 transition-colors">Add More Files</p>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Select PDF from device</p>
                </div>
              </button>

              {pdfQueue.map((item, i) => (
                <div key={item.id} className="group relative glass-surface-soft rounded-3xl p-3.5 border-2 border-transparent transition-all hover:bg-white/10 shadow-lg animate-in slide-in-from-right-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-black/40 rounded-2xl overflow-hidden border border-white/5 shrink-0">
                      {item.thumbnail ? <img src={item.thumbnail} className="w-full h-full object-cover" alt="T" /> : <Files size={18} className="text-slate-700 m-auto" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black uppercase text-white truncate leading-none mb-0.5">{item.file.name}</p>
                      <div className="flex items-center gap-2 leading-none">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.pages} Pages</span>
                        <div className="w-1 h-1 bg-slate-700 rounded-full" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{formatSize(item.file.size)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <div className="flex flex-col gap-0.5 mr-1">
                        <button
                          onClick={() => moveFile(i, 'up')}
                          disabled={i === 0}
                          className="p-0.5 rounded-md text-slate-500 hover:text-white disabled:opacity-0 transition-all"
                        >
                          <ChevronUp size={10} />
                        </button>
                        <button
                          onClick={() => moveFile(i, 'down')}
                          disabled={i === pdfQueue.length - 1}
                          className="p-0.5 rounded-md text-slate-500 hover:text-white disabled:opacity-0 transition-all"
                        >
                          <ChevronDown size={10} />
                        </button>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(item.id);
                        }}
                        className="p-2 text-slate-500 hover:text-red-500 transition-colors shrink-0"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-surface-soft border border-emerald-500/20 p-4 rounded-[24px] flex items-start gap-3 shadow-sm mt-2">
              <ShieldCheck size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-[9px] font-bold text-emerald-500/60 leading-relaxed uppercase tracking-tight">
                Secure Processing: The engine uses client-side object stream compaction for a lightweight final output.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* STICKY FOOTER */}
      <div className="p-4 md:p-6 bg-[#111114]/80 backdrop-blur-xl border-t border-white/5 space-y-3 shrink-0 block">
        <button
          onClick={mergePdfs}
          disabled={pdfQueue.length < 2 || isMerging}
          className="w-full glass-button-primary text-white py-4 md:py-5 rounded-[24px] font-black text-[11px] md:text-[12px] uppercase tracking-[0.3em] transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-3"
        >
          {isMerging ? <Loader2 size={20} className="animate-spin" /> : <Combine size={20} />}
          <span>{isMerging ? 'PROCESSING...' : 'MERGE DOCUMENTS'}</span>
        </button>
      </div>
    </div>
  );
}


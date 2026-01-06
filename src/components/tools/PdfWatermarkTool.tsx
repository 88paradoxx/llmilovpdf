import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ImageState } from '../../types';
import { formatSize, loadImage } from '../../services/imageService';
import { 
  Lock, 
  Download, 
  Plus, 
  X, 
  Loader2, 
  Zap, 
  Files,
  Type,
  Hash,
  Palette,
  Eye,
  Settings,
  ArrowLeft,
  Home
} from 'lucide-react';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

interface Props {
  image: ImageState;
  setIsProcessing: (v: boolean) => void;
  updateImage: (url: string, updates?: Partial<ImageState>) => void;
  setLivePreview?: (node: React.ReactNode) => void;
  file?: File | null;
  onBack?: () => void;
}

type WatermarkPosition = 'topLeft' | 'topCenter' | 'topRight' | 'middleLeft' | 'center' | 'middleRight' | 'bottomLeft' | 'bottomCenter' | 'bottomRight';
type PageMode = 'all' | 'range';

export default function PdfWatermarkTool({ image, setIsProcessing, updateImage, setLivePreview, file, onBack }: Props) {
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFileName, setCurrentFileName] = useState('');
  
  // Watermark Settings
  const [text, setText] = useState('© ilovpdf.in');
  const [opacity, setOpacity] = useState(0.5);
  const [fontScale, setFontScale] = useState(5); 
  const [position, setPosition] = useState<WatermarkPosition>('bottomRight');
  const [color, setColor] = useState('#ffffff');
  const [hasShadow, setHasShadow] = useState(true);

  // Page Selection Settings
  const [pageMode, setPageMode] = useState<PageMode>('all');
  const [pageRange, setPageRange] = useState('1');
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const lastPreviewParamsRef = useRef<string>('');
  const isRenderingRef = useRef(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blobUrlsRef = useRef<Set<string>>(new Set());
  const updateImageRef = useRef(updateImage);

  // Keep updateImageRef current
  useEffect(() => {
    updateImageRef.current = updateImage;
  }, [updateImage]);

  const createSafeUrl = useCallback((blob: Blob) => {
    const url = URL.createObjectURL(blob);
    blobUrlsRef.current.add(url);
    return url;
  }, []);

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      blobUrlsRef.current.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  const parsePageIndices = (rangeStr: string, totalPages: number): number[] => {
    const indices: Set<number> = new Set();
    const parts = rangeStr.split(',').map(p => p.trim());

    parts.forEach(part => {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(n => parseInt(n.trim()));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
            if (i >= 1 && i <= totalPages) indices.add(i - 1);
          }
        }
      } else {
        const num = parseInt(part);
        if (!isNaN(num) && num >= 1 && num <= totalPages) {
          indices.add(num - 1);
        }
      }
    });

    return Array.from(indices).sort((a, b) => a - b);
  };

  const loadPreview = useCallback(async (file: File) => {
    const params = JSON.stringify({ fontScale, color, opacity, hasShadow, text, position, fileName: file.name, fileSize: file.size });
    if (params === lastPreviewParamsRef.current || isRenderingRef.current) {
      return;
    }
    
    console.log("DEBUG: PDF Watermark: loadPreview started", file.name);
    isRenderingRef.current = true;
    lastPreviewParamsRef.current = params;
    setIsPreviewLoading(true);
    setPreviewError(null);
    let isMounted = true;
    try {
      // @ts-ignore
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        cMapUrl: 'https://unpkg.com/pdfjs-dist@5.4.449/cmaps/',
        cMapPacked: true,
      });
      const pdfDoc = await loadingTask.promise;
      if (!isMounted) return;
      
      const totalPages = pdfDoc.numPages;
      const pagesToRender = Math.min(totalPages, 5); // Render up to 5 pages for preview
      const newPreviewUrls: string[] = [];

      for (let pageNum = 1; pageNum <= pagesToRender; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 }); // Increased scale for better preview quality
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Canvas context failed");
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        await page.render({ 
          canvasContext: ctx, 
          viewport: viewport,
          canvas: canvas
        }).promise;
        
        if (!isMounted) break;
        
        // Add watermark to preview
        const calculatedFontSize = Math.max(20, (canvas.width * fontScale) / 100);
        ctx.font = `bold ${calculatedFontSize}px Inter, sans-serif`;
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (hasShadow) {
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
        }

        const tm = ctx.measureText(text);
        const tw = tm.width;
        const padding = calculatedFontSize * 1.5;
        
        let x = canvas.width / 2;
        let y = canvas.height / 2;

        if (position.includes('Left')) x = padding + tw / 2;
        if (position.includes('Right')) x = canvas.width - padding - tw / 2;
        if (position.includes('top')) y = padding + calculatedFontSize / 2;
        if (position.includes('bottom')) y = canvas.height - padding - calculatedFontSize / 2;

        ctx.fillText(text, x, y);

        const previewBlob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.8));
        if (previewBlob && isMounted) {
          const url = createSafeUrl(previewBlob);
          newPreviewUrls.push(url);
          
          if (pageNum === 1) {
            updateImageRef.current(url, {
              width: canvas.width,
              height: canvas.height,
              size: file.size,
              name: file.name,
              format: 'application/pdf'
            });
          }
        }
      }

      if (isMounted) {
        setPreviewUrls(newPreviewUrls);
      }
      await pdfDoc.destroy();
    } catch (err: any) {
      console.error("DEBUG: PDF Watermark: Preview render failed:", err);
      setPreviewError(err?.message || "Failed to render PDF preview");
      setPreviewUrls([]);
    } finally {
      isRenderingRef.current = false;
      if (isMounted) {
        setIsPreviewLoading(false);
      }
    }
  }, [fontScale, color, opacity, hasShadow, text, position, createSafeUrl]);

  useEffect(() => {
    if (file && pdfFiles.length === 0) {
      setPdfFiles([file]);
      loadPreview(file);
    }
  }, [file, pdfFiles.length, loadPreview]);

  useEffect(() => {
    const enqueued = (window as any)._enqueuedPdf;
    if (enqueued && pdfFiles.length === 0) { 
      setPdfFiles([enqueued]); 
      loadPreview(enqueued);
      (window as any)._enqueuedPdf = null; 
    }
  }, [loadPreview, pdfFiles.length]);

  useEffect(() => {
    if (pdfFiles.length > 0) {
      const timeout = setTimeout(() => {
        loadPreview(pdfFiles[0]);
      }, 500); // Increased debounce to 500ms
      return () => clearTimeout(timeout);
    }
  }, [text, opacity, fontScale, position, color, hasShadow, pdfFiles, loadPreview]);

  const renderPreviewUI = useCallback(() => {
    const containerClasses = `w-full h-full flex flex-col items-center pointer-events-auto`;
    
    if (pdfFiles.length === 0) {
      return (
        <div className={`${containerClasses} justify-center bg-[#030308] text-slate-700 p-6 text-center`}>
           <div className="w-20 h-20 md:w-24 md:h-24 bg-white/5 rounded-[32px] md:rounded-[40px] flex items-center justify-center mb-6 border border-white/5 animate-pulse shadow-2xl">
              <Lock size={32} className="text-slate-600 md:hidden" />
              <Lock size={40} className="text-slate-600 hidden md:block" />
           </div>
           <h3 className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] mb-2 text-slate-500">Watermark Engine</h3>
           <p className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest opacity-40">Import PDF to preview watermarks</p>
        </div>
      );
    }

    return (
      <div className={`${containerClasses} bg-[#f1f3f9] dark:bg-[#08080c] overflow-y-auto p-4 md:p-12 z-[60] gap-8 md:gap-12 pb-24 md:pb-12`}>
        {previewUrls.length > 0 ? (
          previewUrls.map((url, idx) => (
            <div key={idx} className="relative w-full max-w-[900px] bg-white rounded-sm shadow-[0_30px_100px_rgba(0,0,0,0.12)] dark:shadow-[0_50px_150px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 border border-slate-200 dark:border-white/5 shrink-0 group">
                 <img 
                   src={url} 
                   className="w-full h-auto block select-none"
                   alt={`PDF Preview Page ${idx + 1}`}
                   draggable={false}
                 />
                 <div className="absolute top-0 left-0 right-0 h-1 bg-purple-600/50 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-20" />
                 <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 px-2 py-1 md:px-3 md:py-1 bg-black/60 backdrop-blur-md text-white text-[6px] md:text-[7px] font-black rounded-full uppercase tracking-widest md:opacity-0 md:group-hover:opacity-100 transition-all z-20 border border-white/10">
                   Page {idx + 1}
                 </div>
            </div>
          ))
        ) : previewError ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-red-500 p-8 text-center">
             <X size={32} className="opacity-20 md:hidden" />
             <X size={48} className="opacity-20 hidden md:block" />
             <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">{previewError}</p>
             <button 
               onClick={() => loadPreview(pdfFiles[0])}
               className="mt-4 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all"
             >
               Retry Preview
             </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-400">
             <Files size={32} className="opacity-20 md:hidden" />
             <Files size={48} className="opacity-20 hidden md:block" />
             <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Generating Preview...</p>
          </div>
        )}

        {isPreviewLoading && (
          <div className="fixed inset-0 bg-white/30 dark:bg-black/30 backdrop-blur-sm flex flex-col items-center justify-center z-[110]">
            <div className="bg-white/80 dark:bg-slate-900/80 p-6 md:p-8 rounded-[24px] md:rounded-[32px] shadow-2xl border border-white/10 flex flex-col items-center">
              <Loader2 size={24} className="text-purple-500 animate-spin md:hidden" />
              <Loader2 size={32} className="text-purple-500 animate-spin hidden md:block" />
              <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 dark:text-slate-400 mt-4">Updating Engine...</p>
            </div>
          </div>
        )}
      </div>
    );
  }, [pdfFiles, previewUrls, isPreviewLoading, previewError, loadPreview]);

  useEffect(() => {
    if (setLivePreview) {
      setLivePreview(renderPreviewUI());
    }
  }, [setLivePreview, renderPreviewUI]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = Array.from(e.target.files || []) as File[];
    if (uploaded.length === 0) return;
    setPdfFiles(prev => [...prev, ...uploaded]);
    if (pdfFiles.length === 0 && uploaded.length > 0) {
      loadPreview(uploaded[0]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setPdfFiles(prev => prev.filter((_, i) => i !== index));
  };

  const runWatermark = async () => {
    if (pdfFiles.length === 0) return;
    setIsProcessing(true);
    setIsLibraryLoading(true);
    setProgress(0);

    try {
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');

      if (!PDFDocument || !rgb || !StandardFonts) {
        throw new Error("Failed to load PDF library core components.");
      }
      
      const hexToRgb = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return { r, g, b };
      };
      const watermarkColor = hexToRgb(color);

      for (let fileIdx = 0; fileIdx < pdfFiles.length; fileIdx++) {
        const currentFile = pdfFiles[fileIdx];
        setCurrentFileName(currentFile.name);
        
        const arrayBuffer = await currentFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const pages = pdfDoc.getPages();
        const totalPages = pages.length;

        const targetIndices = pageMode === 'all' 
          ? pages.map((_, i) => i) 
          : parsePageIndices(pageRange, totalPages);

        if (targetIndices.length === 0 && pageMode === 'range') {
          throw new Error(`The range "${pageRange}" matches no pages in ${currentFile.name}.`);
        }

        for (let i = 0; i < pages.length; i++) {
          const pageProgress = Math.round(((fileIdx + ((i + 1) / totalPages)) / pdfFiles.length) * 100);
          setProgress(pageProgress);

          if (!targetIndices.includes(i)) continue;

          const page = pages[i];
          const { width, height } = page.getSize();
          
          const fontSize = Math.max(10, (width * fontScale) / 100);
          const textWidth = font.widthOfTextAtSize(text, fontSize);
          const padding = fontSize * 1.5;
          
          let x = width / 2 - textWidth / 2;
          let y = height / 2 - fontSize / 2;

          if (position.includes('Left')) x = padding;
          if (position.includes('Right')) x = width - padding - textWidth;
          if (position.includes('top')) y = height - padding - fontSize;
          if (position.includes('bottom')) y = padding;

          page.drawText(text, {
            x,
            y,
            size: fontSize,
            font,
            color: rgb(watermarkColor.r, watermarkColor.g, watermarkColor.b),
            opacity: opacity
          });
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
        const outUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = outUrl;
        link.download = currentFile.name.replace(/\.pdf$/i, '') + '-watermarked.pdf';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(outUrl);
        }, 5000);
      }
    } catch (err: any) {
      console.error("Watermarking failed:", err);
      alert(`Error: ${err?.message || "An unexpected error occurred."}`);
    } finally {
      setIsProcessing(false);
      setIsLibraryLoading(false);
      setProgress(0);
      setCurrentFileName('');
    }
  };

  const posList: WatermarkPosition[] = [
    'topLeft', 'topCenter', 'topRight', 
    'middleLeft', 'center', 'middleRight', 
    'bottomLeft', 'bottomCenter', 'bottomRight'
  ];

  return (
    <div className="w-full h-full flex flex-col bg-[#0d0d12] text-white overflow-hidden" onClick={(e) => e.stopPropagation()}>
      <div className="flex-1 flex flex-col p-3 md:p-4 overflow-y-auto scrollbar-hide space-y-4 md:space-y-5">
        {/* Navigation & Title - Compact */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center border border-white/10 shadow-lg shadow-purple-500/20">
                <Lock size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-black uppercase tracking-tight text-[13px] leading-none text-white">PDF Watermark</h3>
                <p className="text-[9px] font-bold uppercase opacity-60 mt-1.5 tracking-widest text-purple-400">Security Suite</p>
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

        <div className="flex-1 overflow-y-auto space-y-4 scrollbar-hide pb-10">
          {isLibraryLoading && (
            <div className="glass-surface-soft rounded-2xl p-5 text-white shadow-xl animate-in zoom-in-95 space-y-4 border border-purple-500/20 bg-purple-500/10 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-purple-400">Applying...</span>
                <span className="text-sm font-black text-white">{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                 <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-[8px] font-bold uppercase tracking-widest truncate opacity-60">{currentFileName}</p>
            </div>
          )}

          <div className="space-y-4">
             {pdfFiles.length > 0 && (
               <div className="space-y-2">
                 {pdfFiles.map((f, idx) => (
                   <div key={idx} className="glass-surface-soft p-3 rounded-2xl border border-white/5 shadow-inner flex items-center gap-3">
                     <div className="w-8 h-8 bg-purple-600/20 text-purple-400 rounded-xl flex items-center justify-center shrink-0">
                       <Files size={14}/>
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="text-[10px] font-black text-white truncate">{f.name}</p>
                       <p className="text-[8px] font-black text-slate-500 uppercase">{formatSize(f.size)}</p>
                     </div>
                     <button onClick={() => removeFile(idx)} className="p-1.5 text-slate-600 hover:text-red-500 transition-colors">
                       <X size={14}/>
                     </button>
                   </div>
                 ))}
               </div>
             )}
             <button 
               onClick={() => fileInputRef.current?.click()}
               className={`w-full glass-surface-soft border-2 border-dashed border-white/10 rounded-[32px] flex items-center justify-center gap-4 hover:bg-white/10 transition-all group ${pdfFiles.length > 0 ? 'py-3' : 'py-10 flex-col'}`}
              >
               <Plus size={pdfFiles.length > 0 ? 16 : 24} className="text-slate-500 group-hover:scale-110 group-hover:text-purple-500 transition-all" />
               <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                 {pdfFiles.length > 0 ? 'Add More Files' : 'Import PDF'}
               </span>
             </button>
             <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept="application/pdf" />
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 shadow-sm space-y-3">
            <div className="flex items-center justify-between px-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Mark Content</label>
              <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-lg border border-white/5">
                <Palette size={12} className="text-slate-500" />
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-4 h-4 rounded-full border-0 p-0 cursor-pointer overflow-hidden bg-transparent" />
              </div>
            </div>
            <div className="relative">
              <input 
                type="text" 
                value={text} 
                onChange={(e) => setText(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-xl text-xs font-bold text-white outline-none focus:border-purple-500/50 transition-all placeholder:text-slate-700"
                placeholder="Watermark text..."
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-700"><Type size={14}/></div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 shadow-sm space-y-2.5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Scope</label>
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
              <button 
                onClick={() => setPageMode('all')} 
                className={`flex-1 py-1.5 text-[8px] font-black uppercase rounded-lg transition-all ${pageMode === 'all' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
              >
                All Pages
              </button>
              <button 
                onClick={() => setPageMode('range')} 
                className={`flex-1 py-1.5 text-[8px] font-black uppercase rounded-lg transition-all ${pageMode === 'range' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
              >
                Range
              </button>
            </div>
            
            {pageMode === 'range' && (
              <div className="relative animate-in slide-in-from-top-1 duration-200">
                <input 
                  type="text" 
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  placeholder="e.g. 1, 3, 5-10"
                  className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-xl text-xs font-bold text-white outline-none focus:border-purple-500/50 transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-700"><Hash size={12}/></div>
              </div>
            )}
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 shadow-sm space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Positioning</label>
            <div className="grid grid-cols-3 gap-1 max-w-[110px] mx-auto">
              {posList.map(p => (
                <button key={p} onClick={() => setPosition(p)} className={`aspect-square rounded-lg border transition-all flex items-center justify-center ${position === p ? 'border-purple-500 bg-purple-500/10' : 'border-white/5 bg-black/20 hover:border-white/10'}`}>
                  <div className={`w-1 h-1 rounded-full ${position === p ? 'bg-purple-500 scale-125' : 'bg-white/10'}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 shadow-sm space-y-4">
             <div className="space-y-2.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Font Size</label>
                  <span className="text-[10px] font-black text-purple-400">{fontScale}%</span>
                </div>
                <input type="range" min="1" max="30" step="0.5" value={fontScale} onChange={(e) => setFontScale(Number(e.target.value))} className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-purple-500 bg-white/5" />
             </div>
             <div className="space-y-2.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Opacity</label>
                  <span className="text-[10px] font-black text-purple-400">{Math.round(opacity * 100)}%</span>
                </div>
                <input type="range" min="0.1" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-purple-500 bg-white/5" />
             </div>
             <button 
               onClick={() => setHasShadow(!hasShadow)}
               className={`w-full py-2.5 rounded-xl border transition-all text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 ${hasShadow ? 'bg-purple-600/20 border-purple-500/50 text-purple-400' : 'bg-black/20 border-white/5 text-slate-500'}`}
             >
               <Zap size={12} />
               Text Shadow {hasShadow ? 'ON' : 'OFF'}
             </button>
          </div>

          <div className="pt-2">
            <button
              disabled={pdfFiles.length === 0 || isLibraryLoading}
              onClick={runWatermark}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-xl shadow-purple-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLibraryLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {isLibraryLoading ? 'Processing...' : 'Export Protected PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


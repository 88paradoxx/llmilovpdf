import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ImageState } from '../../types';
import { formatSize, resizeByTargetKB } from '../../services/imageService';
import { compressPdfNative } from '../../services/pdfCompressionService';
import { 
  Scaling, 
  Download, 
  X, 
  Loader2, 
  Zap, 
  Plus, 
  ShieldCheck,
  Minimize2,
  CheckCircle2,
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

export default function PdfResizerTool({ image, setIsProcessing, updateImage, setLivePreview, file, onBack }: Props) {
  const [strategy, setStrategy] = useState<'native' | 'raster'>('native');
  const [resMode, setResMode] = useState<'high' | 'medium' | 'low'>('medium');
  const [targetSize, setTargetSize] = useState<number | ''>('');
  const [sizeUnit, setSizeUnit] = useState<'KB' | 'MB'>('KB');
  const [files, setFiles] = useState<File[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [totalPages, setTotalPages] = useState<Record<string, number>>({});
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFileName, setCurrentFileName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPreview = useCallback(async (file: File) => {
    setIsProcessing(true);
    setIsAnalyzing(true);
    try {
      const pdfjsModule = await import('pdfjs-dist');
      const pdfjsLib = pdfjsModule.default || pdfjsModule;
      
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ 
        data: new Uint8Array(arrayBuffer),
        cMapUrl: 'https://unpkg.com/pdfjs-dist@5.4.449/cmaps/',
        cMapPacked: true,
      });
      const pdfDoc = await loadingTask.promise;
      
      const fileId = file.name + file.size;
      setTotalPages(prev => ({ ...prev, [fileId]: pdfDoc.numPages }));
      
      const page = await pdfDoc.getPage(1);
      const viewport = page.getViewport({ scale: 1.0 }); 
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      // Use a reasonable thumbnail size
      const maxDim = 1200; // Increased for better quality
      const scale = Math.min(maxDim / viewport.width, maxDim / viewport.height);
      const thumbViewport = page.getViewport({ scale });
      
      canvas.width = thumbViewport.width;
      canvas.height = thumbViewport.height;
      
      if (context) {
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Wait for render to complete
        await page.render({ 
          canvasContext: context, 
          viewport: thumbViewport,
          intent: 'display',
          canvas: canvas
        }).promise;
        
        const thumb = canvas.toDataURL('image/jpeg', 0.9);
        setThumbnails(prev => ({ ...prev, [fileId]: thumb }));
      }

      updateImage('', {
        width: 0, height: 0,
        size: file.size,
        name: file.name,
        format: 'application/pdf'
      });
      
      await pdfDoc.destroy();
    } catch (err) {
      console.error("PDF preview generation failed:", err);
    } finally {
      setIsProcessing(false);
      setIsAnalyzing(false);
    }
  }, [setIsProcessing, updateImage]);

  useEffect(() => {
    if (!setLivePreview) return;

    if (files.length === 0) {
      setLivePreview(
        <div className="w-full h-full bg-[#030308] flex flex-col items-center justify-center text-slate-700 pointer-events-auto">
           <div className="w-24 h-24 bg-white/5 rounded-[40px] flex items-center justify-center mb-6 border border-white/5 animate-pulse shadow-2xl">
              <Scaling size={40} className="text-slate-600" />
           </div>
           <h3 className="text-xs font-black uppercase tracking-[0.4em] mb-2">Resizer Studio</h3>
           <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Add PDF documents to begin</p>
        </div>
      );
      return;
    }

    if (isAnalyzing && Object.keys(thumbnails).length === 0) {
      setLivePreview(
        <div className="w-full h-full bg-[#030308] flex flex-col items-center justify-center text-orange-500 pointer-events-auto">
           <div className="relative mb-8">
              <Loader2 size={64} className="animate-spin opacity-20" />
              <Scaling size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
           </div>
           <h3 className="text-xs font-black uppercase tracking-[0.4em] mb-2 animate-pulse">Analyzing Structure</h3>
           <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Mapping document layers</p>
        </div>
      );
      return;
    }

    setLivePreview(
      <div className="w-full h-full bg-[#f8fafc] dark:bg-[#030303] overflow-y-auto p-4 md:p-16 scrollbar-hide flex flex-col items-center gap-12 pointer-events-auto">
        <div className="w-full max-w-3xl flex flex-col gap-12">
           {files.map((file, idx) => {
             const fileId = file.name + file.size;
             const thumb = thumbnails[fileId];
             const pages = totalPages[fileId] || 0;
             
             return (
               <div 
                key={fileId + idx}
                className="relative w-full aspect-[1/1.414] bg-white rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] dark:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] border border-slate-200 dark:border-white/5 overflow-hidden transition-all duration-500 animate-in fade-in slide-in-from-bottom-12 flex items-center justify-center"
                style={{ animationDelay: `${idx * 150}ms` }}
               >
                 {thumb ? (
                   <img src={thumb} className="w-full h-full object-contain" alt="PDF Page" />
                 ) : (
                   <div className="flex flex-col items-center gap-6 text-slate-400 dark:text-slate-600">
                     <div className="relative">
                        <Loader2 size={48} className="animate-spin opacity-40" />
                        <Scaling size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />
                     </div>
                     <p className="text-[10px] font-black uppercase tracking-[0.3em]">Building Page View</p>
                   </div>
                 )}
                 
                 {/* Page Badge */}
                 <div className="absolute top-8 left-8 flex items-center gap-4 z-10">
                    <div className="bg-slate-900/90 dark:bg-black/80 backdrop-blur-xl text-white text-[10px] font-black uppercase px-4 py-2 rounded-2xl border border-white/10 shadow-2xl">
                       Page {idx + 1}
                    </div>
                    {pages > 0 && (
                      <div className="bg-purple-600 text-white text-[10px] font-black uppercase px-4 py-2 rounded-2xl shadow-2xl shadow-purple-500/20">
                        {pages} Pages Total
                      </div>
                    )}
                 </div>

                 {/* File Info Overlay (Visible on Hover) */}
                 <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent translate-y-full hover:translate-y-0 transition-transform duration-500 flex items-end justify-between">
                    <div>
                        <p className="text-white text-xs font-black uppercase tracking-widest truncate max-w-[200px]">{file.name}</p>
                        <p className="text-white/60 text-[9px] font-bold uppercase tracking-widest mt-1">{formatSize(file.size)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={14} className="text-emerald-400" />
                        <span className="text-[8px] font-black text-white uppercase tracking-tighter">Verified Local</span>
                    </div>
                 </div>
               </div>
             );
           })}
           
           {/* Bottom Spacer for easier scrolling */}
           <div className="h-20 w-full" />
        </div>
      </div>
    );
  }, [thumbnails, files, isAnalyzing, totalPages, setLivePreview]);

  useEffect(() => {
    const enqueued = (window as any)._enqueuedPdf || file;
    if (enqueued && files.length === 0) { 
      setFiles([enqueued]); 
      loadPreview(enqueued);
      if ((window as any)._enqueuedPdf) (window as any)._enqueuedPdf = null; 
    }
  }, [loadPreview, files.length, file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = Array.from(e.target.files || []) as File[];
    if (uploaded.length === 0) return;
    setFiles(prev => [...prev, ...uploaded]);
    uploaded.forEach(file => loadPreview(file));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    const fileToRemove = files[index];
    if (fileToRemove) {
      const fileId = fileToRemove.name + fileToRemove.size;
      setThumbnails(prev => {
        const next = { ...prev };
        delete next[fileId];
        return next;
      });
      setTotalPages(prev => {
        const next = { ...prev };
        delete next[fileId];
        return next;
      });
    }
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleModeSelection = (mode: 'high' | 'medium' | 'low') => {
    setResMode(mode);
    // If user hasn't set a target, provide a helpful suggestion based on mode
    if (files.length > 0 && (targetSize === '' || targetSize === 0)) {
       const originalKB = files[0].size / 1024;
       const ratios = { high: 0.7, medium: 0.4, low: 0.15 };
       setTargetSize(Math.round(originalKB * ratios[mode]));
       setSizeUnit('KB');
    }
  };

  const runOptimization = async () => {
    if (files.length === 0) return;
    setIsProcessing(true); 
    setIsLibraryLoading(true); 
    setProgress(0);
    
    let zip: any = null;
    try {
      const [jsPDFMod, pdfjs, JSZipMod] = await Promise.all([
        import('jspdf'),
        import('pdfjs-dist'),
        (files.length > 1) ? import('jszip') : Promise.resolve(null)
      ]);

      const jsPDFCtor = jsPDFMod.jsPDF;
      if (pdfjs.GlobalWorkerOptions) pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

      if (JSZipMod && files.length > 1) {
        const JSZip = JSZipMod.default;
        zip = new JSZip();
      }

      for (let fileIdx = 0; fileIdx < files.length; fileIdx++) {
        const currentFile = files[fileIdx];
        setCurrentFileName(currentFile.name);
        const arrayBuffer = await currentFile.arrayBuffer();

        if (strategy === 'native') {
          const compressed = await compressPdfNative(arrayBuffer);
          const outBlob = compressed.blob;
          const cleanName = currentFile.name.replace(/\.pdf$/i, '') + '-optimized.pdf';
          if (zip) zip.file(cleanName, outBlob);
          else {
            const outUrl = URL.createObjectURL(outBlob);
            const link = document.createElement('a');
            link.href = outUrl; link.download = cleanName;
            document.body.appendChild(link); link.click();
            setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(outUrl); }, 10000);
          }
          setProgress(Math.round(((fileIdx + 1) / files.length) * 100));
        } else {
          let finalPdfDoc: any = null;
          let fileObjectURL = URL.createObjectURL(currentFile);
          try {
            const loadingTask = pdfjs.getDocument(fileObjectURL);
            const pdf = await loadingTask.promise;
            const totalPagesCount = pdf.numPages;

            // --- RECALIBRATED PRECISION BUDGET ---
            let targetKBPerPage: number | null = null;
            if (targetSize && typeof targetSize === 'number') {
              const totalTargetKB = sizeUnit === 'MB' ? targetSize * 1024 : targetSize;
              const structuralOverhead = 1.5 + (totalPagesCount * 0.8);
              const netImageBudget = totalTargetKB - structuralOverhead;
              targetKBPerPage = Math.max(1, netImageBudget / totalPagesCount);
            }

            for (let i = 1; i <= totalPagesCount; i++) {
              setProgress(Math.round(((fileIdx + (i / totalPagesCount)) / files.length) * 100));
              const page = await pdf.getPage(i);
              
              // Fidelity Tier controls the initial rendering "Source DPI"
              // High (300DPI) = 2.5x, Medium (150DPI) = 1.2x, Low (72DPI) = 0.8x
              const renderScale = resMode === 'high' ? 2.5 : resMode === 'medium' ? 1.2 : 0.8;
              const vp = page.getViewport({ scale: renderScale });
              const canvas = document.createElement('canvas'); 
              canvas.width = vp.width; canvas.height = vp.height;
              const ctx = canvas.getContext('2d', { alpha: false });
              if (!ctx) continue;
              
              ctx.fillStyle = 'white'; 
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;
              
              let result = null;
              if (targetKBPerPage) {
                result = await resizeByTargetKB(canvas, targetKBPerPage, 'image/jpeg');
              }

              let pageImageBlob = result ? result.blob : null;
              let pageW = result ? result.width : vp.width;
              let pageH = result ? result.height : vp.height;

              if (!pageImageBlob) {
                const q = resMode === 'high' ? 0.95 : resMode === 'medium' ? 0.85 : 0.60;
                pageImageBlob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', q));
              }

              if (pageImageBlob) {
                const dataUrl = await new Promise<string>(resolve => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.readAsDataURL(pageImageBlob!);
                });
                
                const orient = pageW > pageH ? 'l' : 'p';
                if (!finalPdfDoc) {
                  finalPdfDoc = new jsPDFCtor({ 
                    orientation: orient, 
                    unit: 'px', 
                    format: [pageW, pageH],
                    compress: true,
                    hotfixes: ["px_scaling"]
                  });
                } else {
                  finalPdfDoc.addPage([pageW, pageH], orient);
                }
                finalPdfDoc.addImage(dataUrl, 'JPEG', 0, 0, pageW, pageH, undefined, 'FAST');
              }
              page.cleanup();
            }

            if (finalPdfDoc) {
              const outBlob = finalPdfDoc.output('blob');
              const cleanName = currentFile.name.replace(/\.pdf$/i, '') + '-optimized.pdf';
              if (zip) zip.file(cleanName, outBlob);
              else {
                const outUrl = URL.createObjectURL(outBlob);
                const link = document.createElement('a');
                link.href = outUrl; link.download = cleanName;
                document.body.appendChild(link); link.click();
                setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(outUrl); }, 10000);
              }
            }
            await pdf.destroy();
          } finally { URL.revokeObjectURL(fileObjectURL); }
        }
      }
      if (zip) {
        const zipBlob = await zip.generateAsync({ type: 'blob', compression: "DEFLATE" });
        const zipUrl = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = zipUrl; link.download = `optimized-files-${Date.now()}.zip`;
        document.body.appendChild(link); link.click();
        setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(zipUrl); }, 10000);
      }
    } catch (err: any) { 
      console.error(err); alert(`Error: ${err?.message || "File error."}`);
    } finally { 
      setIsProcessing(false); setIsLibraryLoading(false); setProgress(0); setCurrentFileName('');
    }
  };

  return (
    <div 
      className="w-full h-full flex flex-col p-3 md:p-4 z-[70] overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex-1 flex flex-col gap-3 md:gap-4 overflow-y-auto pr-1 scrollbar-hide">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center border border-white/10 shadow-lg shadow-orange-600/20">
                <Scaling size={20} className="text-white" />
              </div>
              <div>
              <h3 className="font-black uppercase tracking-tight text-[13px] leading-none text-white">PDF Resizer</h3>
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

        {isLibraryLoading && (
          <div className="glass-surface-soft border border-orange-500/30 rounded-2xl md:rounded-3xl p-3 md:p-4 text-white shadow-2xl animate-in zoom-in-95 space-y-3 md:space-y-4 shrink-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/10 to-transparent animate-pulse" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-orange-500">Processing...</span>
                <span className="text-base md:text-lg font-black tabular-nums text-orange-500 drop-shadow-sm">{progress}%</span>
              </div>
              <div className="w-full h-1.5 md:h-2 bg-black/40 rounded-full overflow-hidden border border-white/5 p-0.5 shadow-inner">
                 <div 
                   className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(249,115,22,0.4)]" 
                   style={{ width: `${progress}%` }} 
                 />
              </div>
              <p className="text-[7px] md:text-[8px] font-bold uppercase opacity-50 truncate tracking-widest mt-2 md:mt-3 text-slate-400">{currentFileName || 'Processing...'}</p>
            </div>
          </div>
        )}

        <div className="space-y-3 md:space-y-4">
           {!files.length ? (
             <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full glass-surface-soft border-2 border-dashed border-white/10 py-8 md:py-12 rounded-[24px] md:rounded-[32px] flex flex-col items-center justify-center gap-3 md:gap-4 hover:bg-white/10 transition-all group"
             >
               <Plus size={24} className="w-6 h-6 md:w-7 md:h-7 text-slate-500 group-hover:scale-110 group-hover:text-orange-500 transition-all" />
               <span className="text-[8px] md:text-[9px] font-black uppercase text-slate-500 tracking-widest">Import Source</span>
             </button>
           ) : (
            <div className="space-y-2 md:space-y-3">
              <div className="flex items-center justify-between px-1">
                <label className="text-[8px] md:text-[9px] font-black text-orange-400 uppercase tracking-widest">Enqueued Documents</label>
              </div>
              <div className="space-y-2">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full glass-surface-soft p-2.5 md:p-3 rounded-xl md:rounded-2xl border border-dashed border-white/10 shadow-inner group transition-all hover:bg-white/5 hover:border-orange-500/30 flex items-center gap-3"
                >
                  <div className="w-8 h-8 md:w-9 md:h-9 bg-white/5 text-slate-500 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 border border-white/5 group-hover:bg-orange-600/10 group-hover:text-orange-500 transition-colors">
                    <Plus size={14} className="w-3.5 h-3.5 md:w-4 md:h-4"/>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-[9px] md:text-[10px] font-black uppercase text-slate-500 group-hover:text-slate-300 transition-colors">Add More Files</p>
                    <p className="text-[7px] md:text-[8px] font-black text-slate-600 uppercase tracking-widest">Select PDF from device</p>
                  </div>
                </button>

                {files.map((file, idx) => (
                  <div key={idx} className="glass-surface-soft p-2.5 md:p-3 rounded-xl md:rounded-2xl border border-white/10 shadow-inner group transition-all hover:bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 md:w-9 md:h-9 bg-orange-600 text-white rounded-lg md:rounded-xl flex items-center justify-center shadow-xl shrink-0">
                        <Minimize2 size={14} className="w-3.5 h-3.5 md:w-4 md:h-4"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] md:text-[10px] font-black uppercase text-white truncate mb-0.5 md:mb-1">{file.name}</p>
                        <p className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest">{formatSize(file.size)}</p>
                      </div>
                      <button 
                        onClick={() => removeFile(idx)} 
                        className="p-1 md:p-1.5 text-slate-500 hover:text-red-500 transition-colors"
                      >
                        <X size={14} className="w-3.5 h-3.5 md:w-4 md:h-4"/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
           )}
           <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept="application/pdf" />
        </div>

        <div className="space-y-2 md:space-y-3">
          <p className="text-[8px] md:text-[9px] font-black text-orange-400 uppercase tracking-widest ml-1">Reduction Mode</p>
          <div className="grid grid-cols-1 gap-2">
            <button 
              onClick={() => setStrategy('native')}
              className={`flex items-start gap-3 p-2.5 md:p-3 rounded-xl border-2 transition-all text-left ${strategy === 'native' ? 'border-orange-500 bg-orange-50/10 shadow-2xl shadow-orange-500/10' : 'border-white/5 glass-surface-soft hover:border-white/10'}`}
            >
              <ShieldCheck size={16} className={`w-4 h-4 ${strategy === 'native' ? 'text-orange-500' : 'text-slate-500'}`} />
              <div>
                <span className={`block text-[9px] md:text-[10px] font-black uppercase tracking-widest ${strategy === 'native' ? 'text-white' : 'text-slate-500'}`}>Native Strategy</span>
                <p className="text-[7px] md:text-[7.5px] font-bold text-slate-600 uppercase tracking-tighter mt-0.5">Vector Optimization • Metadata Pruning</p>
              </div>
            </button>
            <button 
              onClick={() => setStrategy('raster')}
              className={`flex items-start gap-3 p-2.5 md:p-3 rounded-xl border-2 transition-all text-left ${strategy === 'raster' ? 'border-orange-500 bg-orange-50/10 shadow-2xl shadow-orange-500/10' : 'border-white/5 glass-surface-soft hover:border-white/10'}`}
            >
              <Zap size={16} className={`w-4 h-4 ${strategy === 'raster' ? 'text-orange-500' : 'text-slate-500'}`} />
              <div>
                <span className={`block text-[9px] md:text-[10px] font-black uppercase tracking-widest ${strategy === 'raster' ? 'text-white' : 'text-slate-500'}`}>Precise Target</span>
                <p className="text-[7px] md:text-[7.5px] font-bold text-slate-600 uppercase tracking-tighter mt-0.5">Raster Pruning • Binary KB Scaling</p>
              </div>
            </button>
          </div>
        </div>

        {strategy === 'raster' && (
          <div className="animate-in slide-in-from-top-2 duration-300 space-y-3">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-orange-400 uppercase tracking-widest ml-1">Fidelity (Input DPI)</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['high', 'medium', 'low'] as const).map(m => (
                  <button 
                    key={m} 
                    onClick={() => handleModeSelection(m)} 
                    className={`flex flex-col items-center py-1.5 rounded-lg border-2 transition-all ${resMode === m ? 'border-orange-500 bg-orange-50/10 text-orange-500 shadow-lg shadow-orange-500/10' : 'border-white/5 glass-surface-soft text-slate-300'}`}
                  >
                    <span className="text-[8px] font-black uppercase tracking-widest">{m}</span>
                    <span className="text-[6px] font-bold uppercase opacity-60 mt-0.5">{m === 'high' ? '300 DPI' : m === 'medium' ? '150 DPI' : '72 DPI'}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <label className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Maximum Target</label>
                <div className="flex glass-surface-soft p-0.5 rounded-lg border border-white/10 shadow-inner">
                  <button onClick={() => setSizeUnit('KB')} className={`px-1.5 py-0.5 text-[7px] font-black rounded ${sizeUnit === 'KB' ? 'bg-orange-500/80 text-white' : 'text-slate-400'}`}>KB</button>
                  <button onClick={() => setSizeUnit('MB')} className={`px-1.5 py-0.5 text-[7px] font-black rounded ${sizeUnit === 'MB' ? 'bg-orange-500/80 text-white' : 'text-slate-400'}`}>MB</button>
                </div>
              </div>
              <div className="relative glass-surface-soft border border-white/10 rounded-xl p-2 shadow-inner">
                <input 
                  type="number" 
                  placeholder={`Set Limit (${sizeUnit})...`}
                  value={targetSize}
                  onChange={(e) => {
                    setTargetSize(e.target.value === '' ? '' : Number(e.target.value));
                    setStrategy('raster');
                  }}
                  className="w-full px-2 py-0.5 bg-transparent text-white text-[11px] font-black outline-none placeholder:text-slate-800"
                />
              </div>
            </div>
          </div>
        )}

        <div className="mt-auto space-y-2 pb-1">
           <div className="glass-surface-soft border border-amber-500/20 p-3 rounded-xl flex items-start gap-2.5 shadow-sm">
              <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-[8px] font-bold text-amber-500/60 leading-relaxed uppercase tracking-tight">
                Zero Cloud: Calibration uses Linearized Byte Density mapping for maximum accuracy.
              </p>
           </div>
        </div>
      </div>

      <div className="pt-4 border-t border-white/5 mt-auto shrink-0 glass-surface">
        <button 
          onClick={runOptimization} 
          disabled={files.length === 0 || isLibraryLoading} 
          className="w-full glass-button-primary text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-2"
        >
          {isLibraryLoading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} 
          <span>{isLibraryLoading ? 'PROCESSING...' : 'START PROCESSING'}</span>
        </button>
      </div>
    </div>
  );
}


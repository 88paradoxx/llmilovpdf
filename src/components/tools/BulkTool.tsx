
import React, { useState } from 'react';
import { ImageState } from '../../types';
import { formatSize, loadImage, resizeByTargetKB } from '../../services/imageService';
import { Layers, Download, CheckCircle, Trash2, Zap, FileArchive, Loader2, Plus, Settings2, AlertCircle, ArrowLeft, Home, Maximize2 } from 'lucide-react';

interface Props {
  image?: ImageState;
  updateImage?: (url: string, updates?: Partial<ImageState>) => void;
  setIsProcessing: (v: boolean) => void;
  initialFiles?: File[];
  onBack?: () => void;
}

export default function BulkTool({ image, updateImage, setIsProcessing, initialFiles = [], onBack }: Props) {
  const [files, setFiles] = useState<File[]>(initialFiles);
  const [processedCount, setProcessedCount] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [targetSize, setTargetSize] = useState<number>(100);
  const [sizeUnit, setSizeUnit] = useState<'KB' | 'MB'>('KB');
  const [targetWidth, setTargetWidth] = useState<number>(1600);
  const [exportMode, setExportMode] = useState<'zip' | 'individual'>('zip');
  const [errorLog, setErrorLog] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Initialize with current image if available and files are empty
  React.useEffect(() => {
    const initFromImage = async () => {
      if (image && files.length === 0 && image.currentUrl) {
        try {
          const response = await fetch(image.currentUrl);
          const blob = await response.blob();
          const file = new File([blob], "image-1.jpg", { type: blob.type || 'image/jpeg' });
          setFiles([file]);
        } catch (e) {
          console.error("Batch init failed:", e);
        }
      }
    };
    initFromImage();
  }, []);

  const processFiles = (uploaded: File[]) => {
    const validFiles = uploaded.filter(f => {
      const isImage = f.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|avif|bmp|svg)$/i.test(f.name);
      const isUnderLimit = f.size <= 25 * 1024 * 1024; // 25MB
      return isImage && isUnderLimit;
    });

    if (validFiles.length === 0 && uploaded.length > 0) {
      alert("No valid image files found. Please ensure files are images and under 25MB.");
      return;
    }

    if (validFiles.length < uploaded.length) {
      const skippedCount = uploaded.length - validFiles.length;
      alert(`${skippedCount} files were skipped (either not images or over 25MB).`);
    }

    if (validFiles.length + files.length > 100) {
      alert("Maximum batch size is 100 files for browser stability.");
      const remainingSpace = 100 - files.length;
      setFiles(prev => [...prev, ...validFiles.slice(0, remainingSpace)]);
    } else {
      setFiles(prev => [...prev, ...validFiles]);
    }
    
    setIsDone(false);
    setProcessedCount(0);
    setErrorLog([]);
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = Array.from(e.target.files || []) as File[];
    processFiles(uploaded);
    // Reset input so the same file can be uploaded again if needed
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files) as File[];
    processFiles(droppedFiles);
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) setIsDone(false);
      return next;
    });
  };

  const startBulkProcessing = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProcessedCount(0);
    setIsDone(false);
    setErrorLog([]);

    let zip: any = null;

    try {
      if (exportMode === 'zip') {
        try {
          const JSZipModule = await import('jszip');
          const JSZip = (JSZipModule as any).default || JSZipModule;
          zip = new (JSZip as any)();
        } catch (zipErr) {
          console.error("JSZip load failed:", zipErr);
          throw new Error("Failed to load ZIP library. Please try 'Individual' mode.");
        }
      }

      const finalTargetKB = sizeUnit === 'MB' ? targetSize * 1024 : targetSize;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = URL.createObjectURL(file);
        
        try {
          const img = await loadImage(url);
          const canvas = document.createElement('canvas');
          const ratio = img.width / img.height;
          
          const finalW = Math.min(img.width, targetWidth);
          const finalH = Math.round(finalW / ratio);
          
          canvas.width = finalW;
          canvas.height = finalH;
          const ctx = canvas.getContext('2d', { alpha: false });
          
          if (ctx) {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, finalW, finalH);
            ctx.drawImage(img, 0, 0, finalW, finalH);
            
            let result = await resizeByTargetKB(canvas, finalTargetKB, 'image/jpeg');
            
            if (!result) {
               const fallbackBlob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.5));
               if (fallbackBlob) {
                 result = { blob: fallbackBlob, width: finalW, height: finalH };
               }
            }

            if (result) {
              const baseName = file.name.replace(/\.[^/.]+$/, "");
              const outName = `${baseName}-opt.jpg`;
              
              if (zip) {
                zip.file(outName, result.blob);
              } else {
                const outUrl = URL.createObjectURL(result.blob);
                const link = document.createElement('a');
                link.href = outUrl;
                link.download = outName;
                document.body.appendChild(link);
                link.click();
                
                setTimeout(() => {
                  document.body.removeChild(link);
                  URL.revokeObjectURL(outUrl);
                }, 10000);

                // Delay for individual mode to prevent browser blocking
                if (i < files.length - 1) {
                  await new Promise(r => setTimeout(r, 300));
                }
              }
            } else {
              setErrorLog(prev => [...prev, `Failed to process: ${file.name}`]);
            }
          }
          canvas.width = 0; canvas.height = 0;
        } catch (fileErr) {
          console.error(`Bulk file error (${file.name}):`, fileErr);
          setErrorLog(prev => [...prev, `Error processing ${file.name}: ${fileErr instanceof Error ? fileErr.message : 'Unknown error'}`]);
        } finally {
          URL.revokeObjectURL(url);
          setProcessedCount(i + 1);
        }
      }

      if (zip) {
        const zipBlob = await zip.generateAsync({ type: 'blob', compression: "DEFLATE" });
        const zipUrl = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = zipUrl;
        link.download = `ilovpdf-batch-${Date.now()}.zip`;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(zipUrl);
        }, 10000);
      }
      setIsDone(true);
    } catch (err: any) {
      console.error("Bulk process critical failure:", err);
      alert(`Processing failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const progressPercent = files.length > 0 ? Math.round((processedCount / files.length) * 100) : 0;

  return (
    <div className="flex flex-col h-full space-y-3 animate-in fade-in duration-300">
      {/* Standardized Header */}
      <div className="flex flex-col gap-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center border border-white/20 shadow-xl shadow-blue-500/20">
              <Layers size={16} className="text-white drop-shadow-md" />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-tighter text-[13px] leading-none text-white">Batch Processor</h3>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-blue-400/80">Turbo Mode</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={onBack}
            className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-white/40 hover:text-white transition-all border border-white/5 group"
          >
            <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[8px] font-black uppercase tracking-widest">Back</span>
          </button>
          <button 
            onClick={() => window.location.href = '/'}
            className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-white/40 hover:text-white transition-all border border-white/5 group"
          >
            <Home size={12} />
            <span className="text-[8px] font-black uppercase tracking-widest">Home</span>
          </button>
        </div>
      </div>

      <div 
        className={`border-2 border-dashed p-4 rounded-2xl text-center transition-all cursor-pointer shrink-0 group relative overflow-hidden ${
          isDragging 
            ? 'border-blue-500 bg-blue-500/10 scale-[1.02] shadow-2xl shadow-blue-500/20' 
            : 'border-white/10 bg-white/[0.02] hover:border-blue-500/40 hover:bg-blue-500/5'
        }`} 
        onClick={() => document.getElementById('bulk-up')?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={`absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent transition-opacity ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
        <input type="file" multiple onChange={handleBulkUpload} className="hidden" id="bulk-up" accept="image/*" />
        <div className="relative z-10 pointer-events-none">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2 transition-all duration-300 ${
            isDragging ? 'bg-blue-500/20 scale-110' : 'bg-white/5 group-hover:scale-110 group-hover:bg-blue-500/10'
          }`}>
            <Plus className={`transition-colors ${isDragging ? 'text-blue-400' : 'text-slate-300 group-hover:text-blue-400'}`} size={16} />
          </div>
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] block transition-colors ${
            isDragging ? 'text-white' : 'text-white/80 group-hover:text-white'
          }`}>
            {isDragging ? 'Drop Assets Now' : 'Add Assets to Queue'}
          </span>
          <p className="text-[8px] font-bold text-slate-500 uppercase mt-1.5 tracking-widest">Max 100 files • Up to 25MB each</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 space-y-3 scrollbar-hide">
        {files.length > 0 && (
          <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end px-1">
              <div>
                <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] block mb-1">Queue Status</span>
                <span className="text-xs font-black text-blue-400 uppercase tracking-tight">{files.length} Assets Loaded</span>
              </div>
              <button onClick={() => setFiles([])} className="text-[8px] text-red-400/60 hover:text-red-400 font-black uppercase tracking-widest transition-colors mb-0.5">Clear All</button>
            </div>
            <div className="space-y-1.5">
              {files.map((f, i) => (
                <div key={i} className="flex justify-between items-center bg-white/[0.03] p-2.5 rounded-xl border border-white/5 hover:border-white/10 transition-all group">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0 border border-blue-500/20">
                      <Settings2 size={12} className="text-blue-500/60" />
                    </div>
                    <span className="truncate font-bold text-white/80 text-[10px] uppercase tracking-tight">{f.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">{formatSize(f.size)}</span>
                    <button onClick={() => removeFile(i)} className="text-white/20 hover:text-red-500 transition-colors shrink-0">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-4 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
              <Settings2 size={30} className="text-blue-500" />
           </div>

           <div className="space-y-2 relative z-10">
                <div className="flex items-center gap-2 px-1">
                  <FileArchive size={12} className="text-blue-500" />
                  <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Export Strategy</label>
                </div>
                <div className="flex p-0.5 bg-black/40 rounded-xl border border-white/5">
                  <button 
                    onClick={() => setExportMode('zip')} 
                    className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all duration-300 ${exportMode === 'zip' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-white/30 hover:text-white/50'}`}
                  >
                    ZIP Archive
                  </button>
                  <button 
                    onClick={() => setExportMode('individual')} 
                    className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all duration-300 ${exportMode === 'individual' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-white/30 hover:text-white/50'}`}
                  >
                    Separate
                  </button>
                </div>
           </div>

           <div className="space-y-2 relative z-10">
             <div className="flex justify-between items-center px-1">
               <div className="flex items-center gap-2">
                 <Maximize2 size={12} className="text-blue-500" />
                 <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Width Limit</label>
               </div>
               <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">{targetWidth}px</span>
             </div>
             <input 
              type="range" min="400" max="4000" step="100" value={targetWidth} 
              onChange={(e) => setTargetWidth(Number(e.target.value))} 
              className="w-full h-1 bg-black/40 appearance-none rounded-full accent-blue-600 cursor-pointer" 
             />
           </div>
           
           <div className="space-y-2 relative z-10">
             <div className="flex items-center justify-between px-1">
               <div className="flex items-center gap-2">
                 <Download size={12} className="text-blue-500" />
                 <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Weight Target</label>
               </div>
               <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/5">
                  <button onClick={() => setSizeUnit('KB')} className={`px-2 py-1 text-[8px] font-black rounded-md transition-all ${sizeUnit === 'KB' ? 'bg-blue-600 text-white shadow-sm' : 'text-white/30 hover:text-white/50'}`}>KB</button>
                  <button onClick={() => setSizeUnit('MB')} className={`px-2 py-1 text-[8px] font-black rounded-md transition-all ${sizeUnit === 'MB' ? 'bg-blue-600 text-white shadow-sm' : 'text-white/30 hover:text-white/50'}`}>MB</button>
               </div>
             </div>
             <div className="relative">
               <input 
                type="number" value={targetSize} 
                onChange={(e) => setTargetSize(Number(e.target.value))} 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-[11px] font-bold text-white outline-none focus:border-blue-500/50 transition-all" 
               />
               <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-white/20 uppercase tracking-widest pointer-events-none">{sizeUnit}</span>
             </div>
           </div>

           {processedCount > 0 && (
             <div className="space-y-2 pt-3 border-t border-white/5 animate-in slide-in-from-top-4 relative z-10">
                <div className="flex justify-between items-center px-1">
                   <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Processing Batch</span>
                   <span className="text-[11px] font-black text-white">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
                   <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]" 
                    style={{ width: `${progressPercent}%` }} 
                   />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Loader2 size={10} className="text-blue-400 animate-spin" />
                  <p className="text-[8px] font-bold text-white/40 uppercase tracking-[0.2em]">
                    Optimizing Asset {processedCount} of {files.length}
                  </p>
                </div>
             </div>
           )}

           {errorLog.length > 0 && (
             <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[8px] font-bold uppercase tracking-tight relative z-10">
               <p className="flex items-center gap-1.5 mb-1.5 text-red-500 font-black text-[10px]"><AlertCircle size={12}/> Processing Exceptions:</p>
               <div className="space-y-1 max-h-20 overflow-y-auto scrollbar-hide">
                 {errorLog.map((err, idx) => <div key={idx} className="flex items-start gap-1.5"><span>•</span> {err}</div>)}
               </div>
             </div>
           )}

           <div className="flex gap-2 p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 items-start relative z-10">
             <Zap size={12} className="text-blue-500 shrink-0 mt-0.5"/>
             <p className="text-[8px] font-bold text-blue-400/80 uppercase leading-relaxed tracking-tight">
               Binary resolution search active. Optimized for speed and precision targeting per frame.
             </p>
           </div>
        </div>
      </div>

      <button 
        onClick={startBulkProcessing}
        disabled={files.length === 0}
        className={`w-full py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-2 shadow-xl ${isDone ? 'bg-green-600 text-white shadow-green-600/20' : 'bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-500 hover:shadow-blue-500/30'}`}
      >
        {processedCount > 0 && processedCount < files.length ? <Loader2 size={14} className="animate-spin" /> : isDone ? <CheckCircle size={14}/> : exportMode === 'zip' ? <FileArchive size={14} /> : <Download size={14} />}
        {processedCount > 0 && processedCount < files.length ? 'Processing...' : isDone ? 'Batch Complete' : 'Process Assets'}
      </button>
    </div>
  );
}


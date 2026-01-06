import React, { useState } from 'react';
import { ImageState } from '../../types';
import { loadImage, resizeByTargetKB, formatSize } from '../../services/imageService';
import { CheckCircle, Download, Zap, AlertCircle, ShieldCheck, ArrowLeft, Home } from 'lucide-react';

interface Props {
  image: ImageState;
  updateImage: (url: string, updates?: Partial<ImageState>) => void;
  setIsProcessing: (v: boolean) => void;
  onDownload: () => void;
  onBack?: () => void;
}

export default function CompressTool({ image, updateImage, setIsProcessing, onDownload, onBack }: Props) {
  const [targetKB, setTargetKB] = useState<number>(100);
  const [error, setError] = useState<string | null>(null);

  const applyCompress = async (kb?: number) => {
    const finalKB = kb || targetKB;
    if (finalKB <= 0) {
      setError("Value must be > 0");
      return;
    }
    setError(null);
    setIsProcessing(true);
    try {
      const img = await loadImage(image.originalUrl);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);

      const result = await resizeByTargetKB(canvas, finalKB, 'image/jpeg');
      if (result) {
        const url = URL.createObjectURL(result.blob);
        updateImage(url, { 
          size: result.blob.size, 
          format: 'image/jpeg', 
          originalUrl: url,
          width: result.width,
          height: result.height
        });
      } else {
        setError("File is too complex");
      }
    } catch (e) {
      setError("Compression failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#111114] text-white overflow-hidden" onClick={(e) => e.stopPropagation()}>
      <div className="flex-1 flex flex-col p-3 md:p-4 overflow-y-auto scrollbar-hide space-y-4 md:space-y-5">
        {/* Navigation & Title - Compact */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center border border-white/10 shadow-lg shadow-emerald-500/20">
                <Zap size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-black uppercase tracking-tight text-[13px] leading-none text-white">Image Compressor</h3>
                <p className="text-[9px] font-bold uppercase opacity-60 mt-1.5 tracking-widest text-emerald-400">Optimizer Active</p>
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

        <div className="glass-surface-soft p-2.5 md:p-3 rounded-xl md:rounded-2xl flex items-center justify-between shrink-0">
          <div className="flex flex-col">
            <span className="text-[6px] md:text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Current Size</span>
            <span className="text-[9px] md:text-sm font-black text-emerald-600 mt-0.5 md:mt-1">{formatSize(image.size)}</span>
          </div>
          <div className="text-right">
             <CheckCircle size={10} className="md:size-3.5 text-emerald-500 inline-block mb-0.5 md:mb-1" />
             <span className="block text-[6px] md:text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Quality Secured</span>
          </div>
        </div>

      <div className="grid grid-cols-2 gap-2 shrink-0">
        {[50, 100, 200, 500].map(kb => (
          <button 
            key={kb}
            onClick={() => applyCompress(kb)}
            className="relative p-1.5 md:p-2.5 rounded-[16px] bg-slate-900/40 border border-white/5 hover:border-purple-500/50 transition-all duration-500 group overflow-hidden active:scale-95 shadow-2xl"
          >
            {/* Background Glow */}
            <div className="absolute -right-2 -top-2 w-8 h-8 bg-purple-500/10 blur-xl group-hover:bg-purple-500/20 transition-all duration-500" />
            
            <div className="relative flex flex-col items-center justify-center">
              <div className="flex items-center gap-1">
                <Zap size={8} className="text-purple-400 group-hover:text-purple-300 transition-colors" />
                <span className="text-sm md:text-lg font-black text-white tracking-tighter group-hover:scale-105 transition-transform duration-500">
                  {kb}<span className="text-[8px] md:text-[10px] opacity-60 ml-0.5">KB</span>
                </span>
              </div>
              
              <div className="px-1.5 py-0 rounded-full bg-purple-500/10 border border-purple-500/20 group-hover:bg-purple-500/20 transition-all mt-0.5">
                <span className="text-[5px] md:text-[6px] text-purple-300 font-black uppercase tracking-[0.1em]">Instant Limit</span>
              </div>
            </div>

            {/* Hover Indicator Bar */}
            <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-transparent group-hover:w-full transition-all duration-700" />
          </button>
        ))}
      </div>

      <div className="glass-surface-soft p-2 md:p-3 rounded-xl md:rounded-2xl space-y-2 md:space-y-3 flex-1 overflow-y-auto scrollbar-hide">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-700"></div>
          <div className="relative space-y-1.5 md:space-y-2 py-2 md:py-3 bg-slate-900/40 rounded-[1.5rem] border border-white/5 backdrop-blur-md overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
            
            <div className="text-center">
              <label className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] block">Target Threshold</label>
              <div className="flex justify-center items-center gap-1 opacity-30 mt-0.5">
                <div className="h-px w-6 bg-gradient-to-r from-transparent to-slate-500"></div>
                <Zap size={6} className="text-emerald-500" />
                <div className="h-px w-6 bg-gradient-to-l from-transparent to-slate-500"></div>
              </div>
            </div>

            <div className="relative max-w-[100px] md:max-w-[140px] mx-auto group/input">
              <div className="absolute -inset-2 bg-emerald-500/10 rounded-full blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500"></div>
              <input 
                type="number" 
                value={targetKB}
                onChange={(e) => setTargetKB(Number(e.target.value))}
                className="relative glass-input w-full rounded-xl outline-none text-center py-1 md:py-2 text-lg md:text-2xl font-black tracking-tighter bg-transparent border-transparent focus:border-emerald-500/30 transition-all"
              />
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[5px] md:text-[6px] font-black uppercase shadow-[0_0_10px_rgba(16,185,129,0.3)] tracking-[0.1em] whitespace-nowrap border border-emerald-400/50">
                <div className="w-0.5 h-0.5 rounded-full bg-white animate-pulse" />
                Kilobytes Target
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center justify-center gap-1.5 text-red-600 text-[7px] md:text-[8px] font-black bg-red-50 dark:bg-red-950/20 p-2 rounded-lg border border-red-100 dark:border-red-900/30">
            <AlertCircle size={9} className="md:size-[10px]" /> {error}
          </div>
        )}
        
        <div className="pt-2 md:pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 md:space-y-3">
           <div className="flex items-center gap-2 md:gap-2.5">
             <Zap size={10} className="md:size-3 text-emerald-600 shrink-0" />
             <p className="text-[7px] md:text-[8px] text-slate-400 font-bold uppercase tracking-tight leading-tight">
               Precision search: The engine will hit the target within +/- 1KB accuracy.
             </p>
           </div>
           <div className="flex items-center gap-2 md:gap-2.5">
             <ShieldCheck size={10} className="md:size-3 text-blue-500 shrink-0" />
             <p className="text-[7px] md:text-[8px] text-slate-400 font-bold uppercase tracking-tight leading-tight">
               Local processing ensures MBs of bandwidth are saved during export.
             </p>
           </div>
        </div>
      </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
        <button onClick={() => applyCompress()} className="glass-button-primary text-white py-2.5 md:py-3 rounded-xl font-black text-[8px] md:text-[9px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5">
          <CheckCircle size={12} className="md:size-4" /> Optimize
        </button>
        <button onClick={onDownload} className="glass-button-secondary text-white dark:text-slate-100 py-2.5 md:py-3 rounded-xl font-black text-[8px] md:text-[9px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5">
          <Download size={12} className="md:size-4" /> Export
        </button>
      </div>
    </div>
  );
}


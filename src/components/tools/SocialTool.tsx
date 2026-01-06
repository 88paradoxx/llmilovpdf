import React, { useState, useEffect, useRef } from 'react';
import { ImageState, SocialPreset } from '../../types';
import { SOCIAL_PRESETS } from '../../constants';
import { loadImage } from '../../services/imageService';
import { CheckCircle, Download, Share2, Loader2, X, ArrowLeft, Home, Plus } from 'lucide-react';

interface Props {
  image: ImageState;
  updateImage: (url: string, updates?: Partial<ImageState>, skipHistory?: boolean) => void;
  setIsProcessing: (v: boolean) => void;
  onDownload: () => void;
  onBack: () => void;
}

export default function SocialTool({ image, updateImage, setIsProcessing, onDownload, onBack }: Props) {
  const [selectedPreset, setSelectedPreset] = useState<SocialPreset | null>(null);
  const [baseline] = useState<ImageState>(() => ({ ...image }));
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!selectedPreset) {
        updateImage(baseline.currentUrl, { width: baseline.width, height: baseline.height }, true);
        return;
      }
      const img = await loadImage(baseline.currentUrl);
      const canvas = document.createElement('canvas');
      canvas.width = selectedPreset.width; canvas.height = selectedPreset.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        const r = img.width / img.height; const tr = canvas.width / canvas.height;
        let dw, dh, dx, dy;
        if (r > tr) { dw = canvas.width; dh = dw / r; dx = 0; dy = (canvas.height - dh) / 2; }
        else { dh = canvas.height; dw = dh * r; dx = (canvas.width - dw) / 2; dy = 0; }
        ctx.drawImage(img, dx, dy, dw, dh);
        const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.8));
        if (active && blob) {
          const url = URL.createObjectURL(blob);
          if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
          previewUrlRef.current = url;
          updateImage(url, { width: canvas.width, height: canvas.height, size: blob.size }, true);
        }
      }
    };
    run();
    return () => { active = false; };
  }, [selectedPreset]);

  return (
    <div className="flex flex-col h-full bg-[#111114] text-white overflow-hidden p-4 md:p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-600 rounded-xl flex items-center justify-center border border-white/10 shadow-lg shadow-pink-500/20">
              <Share2 size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-tight text-[13px] leading-none text-white">Social Resizer</h3>
              <p className="text-[9px] font-bold uppercase opacity-60 mt-1.5 tracking-widest text-pink-400">Stack Architect</p>
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
        <button 
          onClick={() => (document.getElementById('static-image-upload') as HTMLInputElement)?.click()}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all border border-white/5 group"
        >
          <Plus size={14} className="group-hover:scale-110 transition-transform" />
          <span className="text-[8px] font-black uppercase tracking-widest">Upload New</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col space-y-3 overflow-y-auto pr-0.5 scrollbar-hide">
        <div className="flex items-center justify-between px-1 py-1.5 glass-surface-soft rounded-xl shrink-0 border border-white/5">
        <span className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest">Presets</span>
        {selectedPreset && <button onClick={() => setSelectedPreset(null)} className="text-[6px] md:text-[7px] font-black text-pink-500 hover:underline uppercase">Reset</button>}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 space-y-1 scrollbar-hide pb-2">
        {SOCIAL_PRESETS.map(p => (
          <button 
            key={p.id} 
            onClick={() => setSelectedPreset(p)} 
            className={`w-full flex items-center justify-between px-2.5 py-1.5 md:px-3 md:py-2 rounded-xl border transition-all glass-surface-soft ${selectedPreset?.id === p.id ? 'border-pink-500 text-pink-400' : 'border-slate-700/60 hover:border-pink-300/80'}`}
          >
            <div className="text-left leading-none">
              <span className="text-[5px] md:text-[6px] font-black uppercase opacity-60 block">{p.platform}</span>
              <span className="text-[8px] md:text-[9px] font-bold dark:text-slate-200">{p.name}</span>
            </div>
            <span className="text-[6px] md:text-[7px] font-mono text-slate-400">{p.width}×{p.height}</span>
          </button>
        ))}
      </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
        <button onClick={async () => { if (!selectedPreset) return; setIsProcessing(true); const result = await (async () => {
          const img = await loadImage(baseline.currentUrl);
          const canvas = document.createElement('canvas'); canvas.width = selectedPreset.width; canvas.height = selectedPreset.height;
          const ctx = canvas.getContext('2d'); if (!ctx) return null;
          ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
          const r = img.width / img.height; const tr = canvas.width / canvas.height;
          let dw, dh, dx, dy;
          if (r > tr) { dw = canvas.width; dh = dw / r; dx = 0; dy = (canvas.height - dh) / 2; }
          else { dh = canvas.height; dw = dh * r; dx = (canvas.width - dw) / 2; dy = 0; }
          ctx.drawImage(img, dx, dy, dw, dh);
          const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.95));
          return blob ? { blob, w: canvas.width, h: canvas.height } : null;
        })(); if (result) { const url = URL.createObjectURL(result.blob); updateImage(url, { width: result.w, height: result.h, size: result.blob.size, format: 'image/jpeg', originalUrl: url }, false); setSelectedPreset(null); } setIsProcessing(false); }} disabled={!selectedPreset} className="glass-button-primary disabled:opacity-30 text-white py-2.5 md:py-3 rounded-xl font-black text-[8px] md:text-[9px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5">
          <CheckCircle size={12} className="md:size-3.5" /> Bake
        </button>
        <button onClick={onDownload} className="glass-button-secondary text-white dark:text-slate-100 py-2.5 md:py-3 rounded-xl font-black text-[8px] md:text-[9px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5">
          <Download size={12} className="md:size-3.5" /> Export
        </button>
      </div>
    </div>
  );
}


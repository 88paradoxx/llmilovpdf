
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ImageState } from '../../types';
import { loadImage } from '../../services/imageService';
import { 
  CheckCircle, 
  Download, 
  Type, 
  LayoutGrid, 
  Copy, 
  Layers as ShadowIcon,
  Zap,
  Maximize,
  Move,
  Palette,
  ArrowLeft,
  Home,
  Plus
} from 'lucide-react';

interface Props {
  image: ImageState;
  updateImage: (url: string, updates?: Partial<ImageState>, skipHistory?: boolean) => void;
  setIsProcessing: (v: boolean) => void;
  onDownload: () => void;
  onBack: () => void;
}

type WatermarkPosition = 'topLeft' | 'topCenter' | 'topRight' | 'middleLeft' | 'center' | 'middleRight' | 'bottomLeft' | 'bottomCenter' | 'bottomRight' | 'tile' | 'custom';

export default function WatermarkTool({ image, updateImage, setIsProcessing, onDownload, onBack }: Props) {
  const [text, setText] = useState('© ilovpdf.in');
  const [opacity, setOpacity] = useState(0.5);
  const [fontScale, setFontScale] = useState(5);
  const [position, setPosition] = useState<WatermarkPosition>('bottomRight');
  const [customX, setCustomX] = useState(50);
  const [customY, setCustomY] = useState(90);
  const [color, setColor] = useState('#ffffff');
  const [hasShadow, setHasShadow] = useState(true);
  
  const prevPreviewUrl = useRef<string | null>(null);

  const colors = [
    '#ffffff', '#000000', '#ef4444', '#f59e0b', 
    '#10b981', '#3b82f6', '#6366f1', '#a855f7'
  ];

  const processWatermark = useCallback(async (isFinal: boolean = false) => {
    try {
      const img = await loadImage(image.originalUrl);
      const canvas = document.createElement('canvas');
      canvas.width = img.width; 
      canvas.height = img.height;
      const ctx = canvas.getContext('2d'); 
      if (!ctx) return null;

      ctx.drawImage(img, 0, 0); 

      const calculatedFontSize = Math.max(12, (canvas.width * fontScale) / 100);
      ctx.font = `bold ${calculatedFontSize}px Inter, -apple-system, sans-serif`;
      ctx.fillStyle = color; 
      ctx.globalAlpha = opacity;

      if (hasShadow) {
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = calculatedFontSize / 8;
        ctx.shadowOffsetX = calculatedFontSize / 20;
        ctx.shadowOffsetY = calculatedFontSize / 20;
      }

      const tm = ctx.measureText(text); 
      const tw = tm.width;
      
      const drawTextAt = (x: number, y: number) => { 
        ctx.save(); 
        ctx.translate(x, y); 
        ctx.textAlign = 'center'; 
        ctx.textBaseline = 'middle'; 
        ctx.fillText(text, 0, 0); 
        ctx.restore(); 
      };

      if (position === 'tile') { 
        const stepX = tw * 2;
        const stepY = calculatedFontSize * 5;
        for (let y = calculatedFontSize; y < canvas.height + stepY; y += stepY) {
          for (let x = tw / 2; x < canvas.width + stepX; x += stepX) {
            drawTextAt(x, y);
          }
        }
      } else if (position === 'custom') {
        const xPos = (customX / 100) * canvas.width;
        const yPos = (customY / 100) * canvas.height;
        drawTextAt(xPos, yPos);
      } else {
        let x = canvas.width / 2;
        let y = canvas.height / 2;
        const padding = calculatedFontSize * 1.5;

        if (position.includes('Left')) x = padding + tw / 2; 
        if (position.includes('Right')) x = canvas.width - padding - tw / 2;
        if (position.includes('top')) y = padding; 
        if (position.includes('bottom')) y = canvas.height - padding;
        
        drawTextAt(x, y);
      }

      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', isFinal ? 0.95 : 0.7));
      return blob ? { blob } : null;
    } catch (e) { 
      return null; 
    }
  }, [text, opacity, fontScale, position, customX, customY, color, hasShadow, image.originalUrl]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      const r = await processWatermark(false);
      if (r && active) {
        const url = URL.createObjectURL(r.blob);
        if (prevPreviewUrl.current) URL.revokeObjectURL(prevPreviewUrl.current);
        prevPreviewUrl.current = url; 
        updateImage(url, { size: r.blob.size }, true);
      }
    };
    const t = setTimeout(run, 60); 
    return () => { active = false; clearTimeout(t); };
  }, [processWatermark, updateImage]);

  const handleApply = async () => {
    setIsProcessing(true);
    const r = await processWatermark(true);
    if (r) {
      const url = URL.createObjectURL(r.blob);
      updateImage(url, { originalUrl: url, size: r.blob.size }, false);
    }
    setIsProcessing(false);
  };

  const posList: WatermarkPosition[] = [
    'topLeft', 'topCenter', 'topRight', 
    'middleLeft', 'center', 'middleRight', 
    'bottomLeft', 'bottomCenter', 'bottomRight'
  ];

  return (
    <div className="flex flex-col h-full bg-[#111114] text-white overflow-hidden p-4 md:p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center border border-white/10 shadow-lg shadow-cyan-500/20">
              <Type size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-tight text-[13px] leading-none text-white">Watermark</h3>
              <p className="text-[9px] font-bold uppercase opacity-60 mt-1.5 tracking-widest text-cyan-400">Stack Architect</p>
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

      <div className="flex-1 flex flex-col space-y-2.5 md:space-y-4 overflow-y-auto pr-1 scrollbar-hide pb-4">
        <div className="glass-surface-soft p-2 md:p-3 rounded-2xl md:rounded-[24px] space-y-2 md:space-y-3 border border-white/5 hover:border-cyan-500/30 transition-colors duration-500 shadow-2xl">
          <div className="space-y-1 md:space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <label className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-[0.25em]">Watermark Text</label>
              <Type size={8} className="text-cyan-500/50 animate-pulse" />
            </div>
            <div className="relative group">
              <input 
                type="text" 
                value={text} 
                onChange={(e) => setText(e.target.value)} 
                className="glass-input w-full rounded-lg md:rounded-xl outline-none py-1.5 md:py-2 px-3 bg-slate-900/20 focus:bg-slate-900/40 border-transparent focus:border-cyan-500/50 transition-all duration-300 text-[10px] md:text-xs" 
                placeholder="Type watermark..."
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                <div className="w-1 h-1 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 md:space-y-2">
             <div className="flex items-center justify-between px-1">
                <label className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-[0.25em]">Style & Color</label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                  <input 
                    type="color" 
                    value={color} 
                    onChange={(e) => setColor(e.target.value)}
                    className="relative w-4 h-4 md:w-5 md:h-5 rounded-full border-0 p-0 cursor-pointer overflow-hidden bg-transparent shadow-inner"
                  />
                </div>
             </div>
             <div className="flex flex-wrap gap-1.5 md:gap-2 justify-between items-center p-1.5 rounded-xl bg-white/5 border border-white/5">
                {colors.map(c => (
                  <button 
                    key={c} 
                    onClick={() => setColor(c)} 
                    className={`w-4 h-4 md:w-5 md:h-5 rounded-full transition-all duration-300 transform hover:scale-125 ${color === c ? 'ring-2 ring-cyan-500 ring-offset-1 ring-offset-slate-900 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'hover:shadow-lg'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
             </div>
          </div>
        </div>

        <div className="glass-surface-soft p-2 md:p-3 rounded-2xl md:rounded-[24px] space-y-2 md:space-y-3 border border-white/5 hover:border-cyan-500/30 transition-colors duration-500 shadow-2xl">
          <div className="flex items-center justify-between px-1">
            <label className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Placement</label>
            <div className="flex gap-1 md:gap-1.5">
               <button onClick={() => setPosition('tile')} className={`p-0.5 md:p-1 rounded-md border transition-all ${position === 'tile' ? 'bg-cyan-600 text-white border-cyan-700' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'}`} title="Tile Pattern Overlay"><Copy size={8} className="md:size-[10px]"/></button>
               <button onClick={() => setPosition('custom')} className={`p-0.5 md:p-1 rounded-md border transition-all ${position === 'custom' ? 'bg-cyan-600 text-white border-cyan-700' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'}`} title="Free Positioning Mode"><Move size={8} className="md:size-[10px]"/></button>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-0.5 md:gap-1 max-w-[80px] md:max-w-[120px] mx-auto">
            {posList.map(p => (
              <button 
                key={p} 
                onClick={() => setPosition(p)}
                className={`w-5 h-5 md:w-7 md:h-7 rounded-md border transition-all flex items-center justify-center ${position === p ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20' : 'border-slate-100 dark:border-slate-800'}`}
              >
                <div className={`w-0.5 h-0.5 md:w-1 md:h-1 rounded-full ${position === p ? 'bg-cyan-600 shadow-[0_0_8px_rgba(8,145,178,0.5)]' : 'bg-slate-200 dark:bg-slate-700'}`} />
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 md:gap-3 px-1">
            <div className="space-y-1 md:space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[6px] md:text-[7px] font-black text-slate-400 uppercase">Scale</label>
                <span className="text-[6px] md:text-[7px] font-bold text-cyan-600">{fontScale}%</span>
              </div>
              <input type="range" min="1" max="25" value={fontScale} onChange={(e) => setFontScale(Number(e.target.value))} className="w-full h-0.5 md:h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-600" />
            </div>
            <div className="space-y-1 md:space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[6px] md:text-[7px] font-black text-slate-400 uppercase">Opacity</label>
                <span className="text-[6px] md:text-[7px] font-bold text-cyan-600">{Math.round(opacity * 100)}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.1" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full h-0.5 md:h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-600" />
            </div>
          </div>
        </div>

        <button 
          onClick={() => setHasShadow(!hasShadow)}
          className={`w-full p-2.5 md:p-3 rounded-xl md:rounded-2xl border-2 transition-all flex items-center justify-between group ${hasShadow ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-900/10' : 'border-slate-100 dark:border-slate-800'}`}
        >
          <div className="flex items-center gap-2.5 md:gap-3">
            <div className={`p-1.5 md:p-2 rounded-lg ${hasShadow ? 'bg-cyan-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
              <ShadowIcon size={12} className="md:size-4" />
            </div>
            <div className="text-left">
              <span className={`block text-[8px] md:text-[10px] font-black uppercase tracking-tight ${hasShadow ? 'text-cyan-700 dark:text-cyan-400' : 'text-slate-400'}`}>High Contrast Shadow</span>
              <span className="block text-[6px] md:text-[7px] font-bold text-slate-400 uppercase tracking-widest">Enhanced Visibility Mode</span>
            </div>
          </div>
          <div className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-full border-2 flex items-center justify-center transition-all ${hasShadow ? 'border-cyan-600 bg-cyan-600' : 'border-slate-300'}`}>
            {hasShadow && <CheckCircle size={8} className="md:size-10 text-white" />}
          </div>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
        <button onClick={handleApply} className="glass-button-primary text-white py-2 md:py-3 rounded-xl font-black text-[8px] md:text-[9px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5">
          <CheckCircle size={12} className="md:size-3.5" /> Bake
        </button>
        <button onClick={onDownload} className="glass-button-secondary text-white dark:text-slate-100 py-2 md:py-3 rounded-xl font-black text-[8px] md:text-[9px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5">
          <Download size={12} className="md:size-3.5" /> Export
        </button>
      </div>
    </div>
  );
}



import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ImageState } from '../../types';
import { loadImage } from '../../services/imageService';
import { Palette, Settings2, Download, CheckCircle, RefreshCcw, Zap, ArrowLeft, Home } from 'lucide-react';

interface Props {
  image: ImageState;
  updateImage: (url: string, updates?: Partial<ImageState>, skipHistory?: boolean) => void;
  setIsProcessing: (v: boolean) => void;
  onDownload: () => void;
  onBack?: () => void;
}

interface FilterInstance {
  type: string;
  intensity: number;
}

interface FilterDefinition {
  type: string;
  name: string;
  category: 'Color' | 'Style' | 'B&W' | 'Details' | 'Film' | 'Creative';
  min: number;
  max: number;
  default: number;
  render: (i: number) => string;
}

const FILTER_TYPES: FilterDefinition[] = [
  // --- B&W CATEGORY ---
  { type: 'grayscale', name: 'Grayscale', category: 'B&W', min: 0, max: 100, default: 100, render: (i) => `grayscale(${i / 100})` },
  { type: 'noir', name: 'Noir', category: 'B&W', min: 0, max: 100, default: 100, render: (i) => `grayscale(1) contrast(${1 + (i / 100) * 0.8}) brightness(${1 - (i / 100) * 0.2})` },
  { type: 'silver', name: 'Silver', category: 'B&W', min: 0, max: 100, default: 100, render: (i) => `grayscale(1) brightness(${1 + (i / 100) * 0.3}) contrast(${1 + (i / 100) * 0.1})` },
  { type: 'carbon', name: 'Carbon', category: 'B&W', min: 0, max: 100, default: 100, render: (i) => `grayscale(1) contrast(${1 + (i / 100) * 1.2})` },
  { type: 'chalk', name: 'Chalk', category: 'B&W', min: 0, max: 100, default: 100, render: (i) => `grayscale(1) brightness(${1 + (i / 100) * 0.5}) contrast(${1 - (i / 100) * 0.4})` },
  { type: 'shadow', name: 'Shadow', category: 'B&W', min: 0, max: 100, default: 100, render: (i) => `grayscale(1) brightness(${1 - (i / 100) * 0.6})` },
  { type: 'cobalt_bw', name: 'Cobalt B&W', category: 'B&W', min: 0, max: 100, default: 100, render: (i) => `grayscale(1) brightness(0.9) contrast(1.4) hue-rotate(190deg) saturate(0.2)` },

  // --- COLOR CATEGORY ---
  { type: 'sepia', name: 'Sepia', category: 'Color', min: 0, max: 100, default: 80, render: (i) => `sepia(${i / 100})` },
  { type: 'golden', name: 'Golden Hour', category: 'Color', min: 0, max: 100, default: 100, render: (i) => `sepia(${0.4 * (i/100)}) saturate(${1 + (i/100)}) hue-rotate(-${10 * (i/100)}deg)` },
  { type: 'midnight', name: 'Midnight', category: 'Color', min: 0, max: 100, default: 100, render: (i) => `hue-rotate(${200 * (i/100)}deg) brightness(${1 - (i/100) * 0.4}) saturate(${1 + (i/100) * 0.6})` },
  { type: 'emerald', name: 'Emerald', category: 'Color', min: 0, max: 100, default: 100, render: (i) => `hue-rotate(${80 * (i/100)}deg) saturate(${1 + (i/100) * 0.5})` },
  { type: 'ruby', name: 'Ruby', category: 'Color', min: 0, max: 100, default: 100, render: (i) => `hue-rotate(-${20 * (i/100)}deg) saturate(${1 + (i/100) * 2})` },
  { type: 'aqua', name: 'Aqua', category: 'Color', min: 0, max: 100, default: 100, render: (i) => `hue-rotate(${160 * (i/100)}deg) saturate(${1 + (i/100) * 0.8})` },
  { type: 'matcha', name: 'Matcha', category: 'Color', min: 0, max: 100, default: 100, render: (i) => `hue-rotate(${40 * (i/100)}deg) sepia(${0.3 * (i/100)}) saturate(${1 - (i/100) * 0.3})` },
  { type: 'vibrant', name: 'Vibrant', category: 'Color', min: 0, max: 100, default: 100, render: (i) => `saturate(${1 + (i/100)}) contrast(${1 + (i/100) * 0.2})` },
  { type: 'sunset', name: 'Sunset', category: 'Color', min: 0, max: 100, default: 100, render: (i) => `sepia(0.2) saturate(2) hue-rotate(-20deg) brightness(0.9)` },
  { type: 'teal_orange', name: 'Teal & Orange', category: 'Color', min: 0, max: 100, default: 100, render: (i) => `saturate(1.2) contrast(1.1) hue-rotate(-10deg) brightness(0.95)` },

  // --- FILM CATEGORY ---
  { type: 'portra', name: 'Portra 400', category: 'Film', min: 0, max: 100, default: 100, render: (i) => `saturate(1.1) sepia(0.1) contrast(1.05) brightness(1.02)` },
  { type: 'ektachrome', name: 'Ektachrome', category: 'Film', min: 0, max: 100, default: 100, render: (i) => `saturate(1.4) contrast(1.2) brightness(0.95) hue-rotate(5deg)` },
  { type: 'agfa', name: 'Agfa Vista', category: 'Film', min: 0, max: 100, default: 100, render: (i) => `saturate(1.2) contrast(1.1) brightness(1.05) sepia(0.05)` },
  { type: 'kodachrome', name: 'Kodachrome', category: 'Film', min: 0, max: 100, default: 100, render: (i) => `contrast(1.3) saturate(1.5) brightness(0.9) sepia(0.1)` },
  { type: 'fuji_velvia', name: 'Fuji Velvia', category: 'Film', min: 0, max: 100, default: 100, render: (i) => `saturate(1.8) contrast(1.1) brightness(1.0)` },
  { type: 'tri_x', name: 'Tri-X 400', category: 'Film', min: 0, max: 100, default: 100, render: (i) => `grayscale(1) contrast(1.6) brightness(0.95)` },
  { type: 'ilford', name: 'Ilford HP5', category: 'Film', min: 0, max: 100, default: 100, render: (i) => `grayscale(1) contrast(1.2) brightness(1.1)` },

  // --- STYLE CATEGORY ---
  { type: 'lomo', name: 'Lomo', category: 'Style', min: 0, max: 100, default: 100, render: (i) => `saturate(${1 + (i/100)}) contrast(${1 + (i/100) * 0.6}) hue-rotate(-${10 * (i/100)}deg)` },
  { type: 'retro77', name: 'Retro 77', category: 'Style', min: 0, max: 100, default: 100, render: (i) => `sepia(${0.5 * (i/100)}) hue-rotate(-${25 * (i/100)}deg) contrast(${1 + (i/100) * 0.3})` },
  { type: 'cinematic', name: 'Cinematic', category: 'Style', min: 0, max: 100, default: 100, render: (i) => `contrast(${1 + (i/100) * 0.4}) saturate(${1 - (i/100) * 0.4}) brightness(${1 - (i/100) * 0.2})` },
  { type: 'drama', name: 'Drama', category: 'Style', min: 0, max: 100, default: 100, render: (i) => `contrast(${1 + (i/100) * 0.8}) brightness(${1 - (i/100) * 0.2}) saturate(${1 - (i/100) * 0.3})` },
  { type: 'bleach', name: 'Bleach Bypass', category: 'Style', min: 0, max: 100, default: 100, render: (i) => `saturate(${1 - (i/100) * 0.6}) contrast(${1 + (i/100) * 0.9})` },
  { type: 'cross', name: 'Cross Process', category: 'Style', min: 0, max: 100, default: 100, render: (i) => `hue-rotate(-${30 * (i/100)}deg) contrast(${1 + (i/100) * 0.4}) saturate(${1 + (i/100) * 0.3})` },
  { type: 'cyberpunk', name: 'Cyberpunk', category: 'Style', min: 0, max: 100, default: 100, render: (i) => `hue-rotate(-30deg) saturate(2) contrast(1.2) brightness(0.9)` },
  { type: 'synthwave', name: 'Synthwave', category: 'Style', min: 0, max: 100, default: 100, render: (i) => `hue-rotate(260deg) saturate(2.5) contrast(1.1) brightness(0.8)` },
  { type: 'vaporwave', name: 'Vaporwave', category: 'Style', min: 0, max: 100, default: 100, render: (i) => `hue-rotate(180deg) saturate(1.8) brightness(1.2) contrast(0.9)` },

  // --- DETAILS CATEGORY ---
  { type: 'blur', name: 'Blur', category: 'Details', min: 0, max: 20, default: 4, render: (i) => `blur(${i}px)` },
  { type: 'clarity', name: 'Clarity', category: 'Details', min: 0, max: 100, default: 50, render: (i) => `contrast(${1 + (i/100) * 0.5}) brightness(${1 + (i/100) * 0.05}) saturate(${1 + (i/100) * 0.1})` },
  { type: 'hdr', name: 'HDR', category: 'Details', min: 0, max: 100, default: 50, render: (i) => `contrast(${1 + (i/100) * 0.7}) saturate(${1 + (i/100) * 0.5}) brightness(${1 + (i/100) * 0.15})` },
  { type: 'bloom', name: 'Bloom', category: 'Details', min: 0, max: 100, default: 50, render: (i) => `brightness(${1 + (i/100) * 0.3}) blur(${i * 0.03}px) contrast(${1 + (i/100) * 0.1})` },
  { type: 'grain', name: 'Film Grain', category: 'Details', min: 0, max: 100, default: 30, render: (i) => `contrast(${1 + (i/100) * 0.15}) brightness(${1 - (i/100) * 0.05})` },
  { type: 'haze', name: 'Morning Haze', category: 'Details', min: 0, max: 100, default: 100, render: (i) => `opacity(0.9) brightness(1.1) blur(1px) contrast(0.9)` },

  // --- CREATIVE CATEGORY ---
  { type: 'invert', name: 'Invert', category: 'Creative', min: 0, max: 100, default: 100, render: (i) => `invert(${i / 100})` },
  { type: 'solarize', name: 'Solarize', category: 'Creative', min: 0, max: 100, default: 100, render: (i) => `invert(${0.5 * (i/100)}) contrast(${1 + (i/100)})` },
  { type: 'glitch', name: 'Glitch', category: 'Creative', min: 0, max: 50, default: 15, render: (i) => `hue-rotate(${i * 6}deg) saturate(${1 + (i/100) * 3})` },
  { type: 'gameboy', name: 'Gameboy', category: 'Creative', min: 0, max: 100, default: 100, render: (i) => `grayscale(1) sepia(1) hue-rotate(50deg) saturate(${2 + (i/100)}) contrast(${1.2 + (i/100) * 0.3})` },
  { type: 'duotone_gold', name: 'Duo Gold', category: 'Creative', min: 0, max: 100, default: 100, render: (i) => `grayscale(1) sepia(1) saturate(5) brightness(0.9)` },
  { type: 'duotone_purple', name: 'Duo Purple', category: 'Creative', min: 0, max: 100, default: 100, render: (i) => `grayscale(1) sepia(1) hue-rotate(240deg) saturate(4)` },
  { type: 'infra_red', name: 'Infrared', category: 'Creative', min: 0, max: 100, default: 100, render: (i) => `hue-rotate(180deg) saturate(2) brightness(1.1) contrast(1.3)` },
  { type: 'night_vision', name: 'Night Vision', category: 'Creative', min: 0, max: 100, default: 100, render: (i) => `grayscale(1) sepia(1) hue-rotate(80deg) saturate(8) brightness(0.8)` },
  { type: 'blueprint', name: 'Blueprint', category: 'Creative', min: 0, max: 100, default: 100, render: (i) => `grayscale(1) sepia(1) hue-rotate(190deg) invert(1) brightness(0.8)` },
];

export default function FilterTool({ image, updateImage, setIsProcessing, onDownload, onBack }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterInstance | null>(null);
  const [activeTab, setActiveTab] = useState<FilterDefinition['category']>('Color');
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const prevPreviewUrl = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    const createThumbnail = async () => {
      try {
        const img = await loadImage(image.originalUrl);
        const canvas = document.createElement('canvas');
        canvas.width = 120;
        canvas.height = 120;
        const ctx = canvas.getContext('2d');
        if (ctx && active) {
          const size = Math.min(img.width, img.height);
          ctx.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, 120, 120);
          setThumbnailUrl(canvas.toDataURL('image/jpeg', 0.6));
        }
      } catch (e) {}
    };
    createThumbnail();
    return () => { active = false; };
  }, [image.originalUrl]);

  const getCssFilterString = useCallback((filter: FilterInstance) => {
    const def = FILTER_TYPES.find(f => f.type === filter.type);
    if (!def) return 'none';
    return def.render(filter.intensity);
  }, []);

  const processActiveFilter = useCallback(async (isFinal: boolean = false) => {
    try {
      const img = await loadImage(image.originalUrl);
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return null;
      
      if (activeFilter) {
        ctx.filter = getCssFilterString(activeFilter);
      } else {
        ctx.filter = 'none';
      }
      
      ctx.drawImage(img, 0, 0);
      
      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, image.format, isFinal ? 0.95 : 0.6));
      return blob ? { blob } : null;
    } catch (e) { return null; }
  }, [image.originalUrl, activeFilter, image.format, getCssFilterString]);

  useEffect(() => {
    let active = true;
    const updatePreview = async () => {
      const result = await processActiveFilter(false);
      if (result && active) {
        const url = URL.createObjectURL(result.blob);
        if (prevPreviewUrl.current) URL.revokeObjectURL(prevPreviewUrl.current);
        prevPreviewUrl.current = url;
        updateImage(url, { size: result.blob.size }, true);
      }
    };
    const timer = setTimeout(updatePreview, 16);
    return () => { active = false; clearTimeout(timer); };
  }, [activeFilter, processActiveFilter, updateImage]);

  const selectFilter = (type: string) => {
    if (activeFilter?.type === type) { setActiveFilter(null); return; }
    const def = FILTER_TYPES.find(f => f.type === type);
    if (def) setActiveFilter({ type, intensity: def.default });
  };

  const categories: FilterDefinition['category'][] = ['Color', 'Film', 'Style', 'B&W', 'Details', 'Creative'];

  return (
    <div className="w-full h-full flex flex-col bg-[#111114] text-white overflow-hidden" onClick={(e) => e.stopPropagation()}>
      <div className="flex-1 flex flex-col p-3 md:p-4 overflow-y-auto scrollbar-hide space-y-4 md:space-y-5">
        {/* Navigation & Title - Compact */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center border border-white/10 shadow-lg shadow-rose-500/20">
                <Palette size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-black uppercase tracking-tight text-[13px] leading-none text-white">Filter Studio</h3>
                <p className="text-[9px] font-bold uppercase opacity-60 mt-1.5 tracking-widest text-rose-400">Creative Suite</p>
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

        <div className="flex gap-0.5 glass-surface-soft p-0.5 rounded-lg overflow-x-auto scrollbar-hide shrink-0">
        {categories.map(cat => (
          <button 
            key={cat} 
            onClick={() => setActiveTab(cat)} 
            className={`px-3 md:px-4 py-2 text-[8px] md:text-[9px] font-black uppercase tracking-tighter rounded transition-all shrink-0 ${activeTab === cat ? 'bg-white dark:bg-slate-700 shadow text-rose-600' : 'text-slate-400'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 space-y-2.5 md:space-y-3 scrollbar-hide">
        <div className="grid grid-cols-2 gap-2 md:gap-2.5">
          {FILTER_TYPES.filter(f => f.category === activeTab).map(f => (
            <button 
              key={f.type} 
              onClick={() => selectFilter(f.type)} 
              className={`group p-2 md:p-2.5 rounded-xl border-2 transition-all text-center glass-surface-soft ${activeFilter?.type === f.type ? 'border-rose-500' : 'border-slate-700/60 hover:border-rose-300/80'}`}
            >
              <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg mb-1 md:mb-1.5 overflow-hidden">
                {thumbnailUrl && (
                  <img 
                    src={thumbnailUrl} 
                    className="w-full h-full object-cover" 
                    style={{ filter: f.render(f.default) }} 
                    alt={f.name}
                  />
                )}
              </div>
              <span className="text-[8px] md:text-[9px] font-black uppercase text-slate-600 dark:text-slate-400 block truncate px-1">{f.name}</span>
            </button>
          ))}
        </div>
      </div>
      </div>

      {activeFilter && (
        <div className="glass-surface-soft p-2.5 md:p-3 rounded-2xl animate-in slide-in-from-bottom-2 duration-300 space-y-1.5 md:space-y-2">
           <div className="flex justify-between items-center px-1">
             <span className="text-[8px] md:text-[9px] font-black text-rose-500 uppercase tracking-widest">Intensity</span>
             <span className="text-[9px] md:text-[10px] font-black text-rose-600">{activeFilter.intensity}%</span>
           </div>
           <input 
             type="range" 
             min={FILTER_TYPES.find(f => f.type === activeFilter.type)?.min || 0} 
             max={FILTER_TYPES.find(f => f.type === activeFilter.type)?.max || 200} 
             value={activeFilter.intensity} 
             onChange={(e) => setActiveFilter({ ...activeFilter, intensity: Number(e.target.value) })} 
             className="w-full h-1.5 md:h-2 rounded-full appearance-none cursor-pointer accent-rose-500 bg-slate-200 dark:bg-slate-800"
           />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
        <button onClick={async () => {
          setIsProcessing(true);
          const result = await processActiveFilter(true);
          if (result) {
            const url = URL.createObjectURL(result.blob);
            updateImage(url, { originalUrl: url, size: result.blob.size }, false);
            setActiveFilter(null);
          }
          setIsProcessing(false);
        }} className="glass-button-primary text-white py-3 md:py-3.5 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2">
          <CheckCircle size={14} className="md:size-3.5" /> Commit
        </button>
        <button onClick={onDownload} className="glass-button-secondary text-white dark:text-slate-100 py-3 md:py-3.5 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2">
          <Download size={14} className="md:size-3.5" /> Export
        </button>
      </div>
    </div>
  );
}


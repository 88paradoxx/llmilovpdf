
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ImageState } from '../../types';
import { loadImage } from '../../services/imageService';
import {
  RotateCcw,
  RotateCw,
  Download,
  CheckCircle,
  Sliders,
  Crop as CropIcon,
  FlipHorizontal,
  FlipVertical,
  Maximize2,
  MousePointer2,
  History,
  Wind,
  EyeOff,
  ArrowLeft,
  Home,
  Scissors
} from 'lucide-react';

interface Props {
  image: ImageState;
  updateImage: (url: string, updates?: Partial<ImageState>, skipHistory?: boolean) => void;
  setIsProcessing: (v: boolean) => void;
  cropState: { x: number, y: number, w: number, h: number };
  setCropState: (c: { x: number, y: number, w: number, h: number }) => void;
  onCropModeToggle: (active: boolean) => void;
  onDownload: () => void;
  onBack?: () => void;
}

export default function EditTool({
  image,
  updateImage,
  setIsProcessing,
  cropState,
  setCropState,
  onCropModeToggle,
  onDownload,
  onBack
}: Props) {
  const [activeTab, setActiveTab] = useState<'adjust' | 'transform' | 'crop'>('adjust');
  const prevPreviewUrl = useRef<string | null>(null);

  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturate, setSaturate] = useState(100);
  const [exposure, setExposure] = useState(100);
  const [hue, setHue] = useState(0);
  const [sepia, setSepia] = useState(0);
  const [grayscale, setGrayscale] = useState(0);
  const [invert, setInvert] = useState(0);
  const [blur, setBlur] = useState(0);
  const [opacity, setOpacity] = useState(100);

  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  useEffect(() => {
    onCropModeToggle(activeTab === 'crop');
    return () => onCropModeToggle(false);
  }, [activeTab, onCropModeToggle]);

  const processEdit = useCallback(async (isFinal: boolean = false, applyCrop: boolean = true) => {
    try {
      const img = await loadImage(image.originalUrl);
      const sW = applyCrop ? (cropState.w / 100) * img.width : img.width;
      const sH = applyCrop ? (cropState.h / 100) * img.height : img.height;
      const sX = applyCrop ? (cropState.x / 100) * img.width : 0;
      const sY = applyCrop ? (cropState.y / 100) * img.height : 0;

      const canvas = document.createElement('canvas');
      const rad = (rotation * Math.PI) / 180;
      const absCos = Math.abs(Math.cos(rad));
      const absSin = Math.abs(Math.sin(rad));
      const newWidth = Math.round(sW * absCos + sH * absSin);
      const newHeight = Math.round(sW * absSin + sH * absCos);

      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rad);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

      const filters = [
        `brightness(${brightness * (exposure / 100)}%)`,
        `contrast(${contrast}%)`,
        `saturate(${saturate}%)`,
        `hue-rotate(${hue}deg)`,
        `sepia(${sepia}%)`,
        `grayscale(${grayscale}%)`,
        `invert(${invert}%)`,
        `blur(${blur}px)`
      ].join(' ');

      ctx.filter = filters;
      ctx.globalAlpha = opacity / 100;

      ctx.drawImage(img, sX, sY, sW, sH, -sW / 2, -sH / 2, sW, sH);
      ctx.restore();

      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, image.format, isFinal ? 0.95 : 0.7));
      return blob ? { blob, width: canvas.width, height: canvas.height } : null;
    } catch (e) {
      return null;
    }
  }, [
    image.originalUrl, rotation, flipH, flipV,
    brightness, exposure, contrast, saturate,
    hue, sepia, grayscale, invert, blur, opacity,
    image.format, cropState
  ]);

  useEffect(() => {
    let active = true;
    const updatePreview = async () => {
      const shouldApplyCropInPreview = activeTab !== 'crop';
      const result = await processEdit(false, shouldApplyCropInPreview);
      if (result && active) {
        const url = URL.createObjectURL(result.blob);
        if (prevPreviewUrl.current) URL.revokeObjectURL(prevPreviewUrl.current);
        prevPreviewUrl.current = url;
        updateImage(url, { size: result.blob.size, width: result.width, height: result.height }, true);
      }
    };
    const timer = setTimeout(updatePreview, 16);
    return () => { active = false; clearTimeout(timer); };
  }, [
    brightness, contrast, saturate, exposure,
    hue, sepia, grayscale, invert, blur, opacity,
    rotation, flipH, flipV, activeTab, processEdit, updateImage
  ]);

  const handleApply = async () => {
    setIsProcessing(true);
    const result = await processEdit(true, true);
    if (result) {
      const url = URL.createObjectURL(result.blob);
      updateImage(url, { originalUrl: url, size: result.blob.size, width: result.width, height: result.height }, false);

      // Reset states to prevent double-application
      setBrightness(100);
      setContrast(100);
      setSaturate(100);
      setExposure(100);
      setHue(0);
      setSepia(0);
      setGrayscale(0);
      setInvert(0);
      setBlur(0);
      setOpacity(100);

      setRotation(0);
      setFlipH(false);
      setFlipV(false);

      setCropState({ x: 0, y: 0, w: 100, h: 100 });
    }
    setIsProcessing(false);
  };

  const setCropPreset = (ratio?: number) => {
    if (!ratio) { setCropState({ x: 0, y: 0, w: 100, h: 100 }); return; }
    const imgRatio = image.width / image.height;
    if (imgRatio > ratio) {
      const newW = (ratio / imgRatio) * 100;
      setCropState({ w: newW, h: 100, x: (100 - newW) / 2, y: 0 });
    } else {
      const newH = (imgRatio / ratio) * 100;
      setCropState({ w: 100, h: newH, x: 0, y: (100 - newH) / 2 });
    }
  };

  const sliderClasses = "w-full h-1.5 md:h-2 rounded-full appearance-none cursor-pointer accent-purple-400 glass-slider-track focus:outline-none";

  return (
    <div className="w-full h-full flex flex-col bg-[#111114] text-white overflow-hidden" onClick={(e) => e.stopPropagation()}>
      <div className="flex-1 flex flex-col p-3 md:p-4 overflow-y-auto scrollbar-hide space-y-4 md:space-y-5">
        {/* Navigation & Title - Compact */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center border border-white/10 shadow-lg shadow-indigo-500/20">
                <Scissors size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-black uppercase tracking-tight text-[13px] leading-none text-white">Image Editor</h3>
                <p className="text-[9px] font-bold uppercase opacity-60 mt-1.5 tracking-widest text-indigo-400">Precision Suite</p>
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

        <div className="flex glass-surface-soft p-0.5 md:p-1 rounded-lg md:rounded-xl shrink-0">
          {(['adjust', 'transform', 'crop'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 md:py-2.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-md md:rounded-lg transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-700 shadow-sm text-purple-600' : 'text-slate-500'}`}>{tab}</button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 scrollbar-hide">
          {activeTab === 'adjust' && (
            <div className="space-y-2.5 md:space-y-4 animate-in fade-in duration-300">
              {[
                {
                  icon: <Sliders size={12} className="md:size-3" />, title: 'Basic Tones', items: [
                    { label: 'Brightness', val: brightness, set: setBrightness, min: 0, max: 200, unit: '%' },
                    { label: 'Contrast', val: contrast, set: setContrast, min: 0, max: 200, unit: '%' },
                    { label: 'Saturate', val: saturate, set: setSaturate, min: 0, max: 200, unit: '%' },
                  ]
                },
                {
                  icon: <Wind size={12} className="md:size-3" />, title: 'Advanced Color', items: [
                    { label: 'Hue Rotate', val: hue, set: setHue, min: 0, max: 360, unit: '°' },
                    { label: 'Sepia', val: sepia, set: setSepia, min: 0, max: 100, unit: '%' },
                    { label: 'Grayscale', val: grayscale, set: setGrayscale, min: 0, max: 100, unit: '%' },
                  ]
                },
                {
                  icon: <EyeOff size={12} className="md:size-3" />, title: 'Special FX', items: [
                    { label: 'Blur', val: blur, set: setBlur, min: 0, max: 20, unit: 'px' },
                    { label: 'Invert', val: invert, set: setInvert, min: 0, max: 100, unit: '%' },
                  ]
                }
              ].map((section, idx) => (
                <div key={idx} className="glass-surface-soft p-2.5 md:p-4 rounded-xl md:rounded-2xl space-y-2.5 md:space-y-5">
                  <div className="flex items-center gap-1.5 md:gap-2 text-purple-600">
                    {section.icon}
                    <h4 className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">{section.title}</h4>
                  </div>
                  {section.items.map(s => (
                    <div key={s.label} className="space-y-1 md:space-y-2">
                      <div className="flex justify-between items-center px-0.5">
                        <label className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</label>
                        <span className="text-[8px] md:text-[10px] font-black text-purple-600">{s.val}{s.unit}</span>
                      </div>
                      <input type="range" min={s.min} max={s.max} value={s.val} onChange={(e) => s.set(Number(e.target.value))} className={sliderClasses} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'transform' && (
            <div className="space-y-2.5 md:space-y-4 animate-in fade-in duration-300">
              <div className="glass-surface-soft p-2.5 md:p-4 rounded-xl md:rounded-2xl space-y-3 md:space-y-4">
                <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                  <button onClick={() => setFlipH(!flipH)} className={`flex items-center justify-center gap-1.5 md:gap-2 p-3 md:p-3.5 rounded-lg md:rounded-xl border transition-all ${flipH ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-600' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}>
                    <FlipHorizontal size={14} className="md:size-3.5" />
                    <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">Flip X</span>
                  </button>
                  <button onClick={() => setFlipV(!flipV)} className={`flex items-center justify-center gap-1.5 md:gap-2 p-3 md:p-3.5 rounded-lg md:rounded-xl border transition-all ${flipV ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-600' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}>
                    <FlipVertical size={14} className="md:size-3.5" />
                    <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">Flip Y</span>
                  </button>
                </div>

                <div className="space-y-1.5 md:space-y-2 pt-2 border-t border-slate-50 dark:border-slate-800">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">Rotation</label>
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <span className="text-[9px] md:text-[10px] font-black text-purple-600">{rotation}°</span>
                      <button onClick={() => setRotation(0)} className="text-slate-300 hover:text-purple-600"><RotateCcw size={12} className="md:size-3" /></button>
                    </div>
                  </div>
                  <input type="range" min="-180" max="180" value={rotation} onChange={(e) => setRotation(Number(e.target.value))} className={sliderClasses} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'crop' && (
            <div className="glass-surface-soft p-2.5 md:p-4 rounded-xl md:rounded-2xl space-y-3 md:space-y-5 animate-in fade-in duration-300">
              <div className="space-y-2 md:space-y-3">
                <label className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest block px-1">Ratio Presets</label>
                <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                  {[
                    { label: 'Original', ratio: undefined },
                    { label: '1:1 Square', ratio: 1 },
                    { label: '16:9 Cinema', ratio: 16 / 9 },
                    { label: '9:16 Story', ratio: 9 / 16 }
                  ].map(p => (
                    <button key={p.label} onClick={() => setCropPreset(p.ratio)} className="p-2.5 md:p-3 rounded-lg md:rounded-xl text-[7px] md:text-[9px] font-black uppercase text-slate-200 bg-white/5 dark:bg-slate-900/40 border border-white/10 hover:border-purple-500 hover:bg-purple-500/20 transition-all">
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
        <button onClick={handleApply} className="glass-button-primary text-white py-3 md:py-4 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2">
          <CheckCircle size={14} className="md:size-3.5" /> Commit
        </button>
        <button onClick={onDownload} className="glass-button-secondary text-white dark:text-slate-100 py-3 md:py-4 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2">
          <Download size={14} className="md:size-3.5" /> Export
        </button>
      </div>
    </div>
  );
}



import React, { useState } from 'react';
import { ImageState } from '../../types';
import { loadImage, resizeByTargetKB, formatSize } from '../../services/imageService';
import BulkTool from './BulkTool';
import {
  Link2,
  Link2Off,
  Download,
  CheckCircle,
  Layers,
  Image as ImageIcon,
  Zap,
  Info,
  Maximize2,
  ArrowLeft,
  Home,
  Plus
} from 'lucide-react';

interface Props {
  image: ImageState;
  updateImage: (url: string, updates?: Partial<ImageState>) => void;
  setIsProcessing: (v: boolean) => void;
  onDownload: () => void;
  onBack: () => void;
}

export default function ResizeTool({ image, updateImage, setIsProcessing, onDownload, onBack }: Props) {
  const [resizeMode, setResizeMode] = useState<'single' | 'batch'>('single');

  // Single Mode State
  const [width, setWidth] = useState(image.width);
  const [height, setHeight] = useState(image.height);
  const [percent, setPercent] = useState(100);
  const [unitMode, setUnitMode] = useState<'px' | 'percent'>('px');
  const [aspectRatioLocked, setAspectRatioLocked] = useState(true);
  const [targetKB, setTargetKB] = useState<number | ''>('');
  const [exportFormat, setExportFormat] = useState(image.format || 'image/jpeg');

  const ratio = image.width / image.height;

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (aspectRatioLocked) setHeight(Math.round(val / ratio));
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (aspectRatioLocked) setWidth(Math.round(val * ratio));
  };

  const handlePercentChange = (p: number) => {
    setPercent(p);
    setWidth(Math.round((image.width * p) / 100));
    setHeight(Math.round((image.height * p) / 100));
  };

  const applyResize = async () => {
    setIsProcessing(true);
    try {
      const img = await loadImage(image.currentUrl);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, width, height);

      let result;
      if (targetKB && typeof targetKB === 'number') {
        result = await resizeByTargetKB(canvas, targetKB, exportFormat);
      } else {
        const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, exportFormat, 0.95));
        result = blob ? { blob, width, height } : null;
      }

      if (result) {
        const url = URL.createObjectURL(result.blob);
        updateImage(url, {
          width: result.width,
          height: result.height,
          size: result.blob.size,
          format: exportFormat,
          originalUrl: url
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const labelClasses = "text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1.5 ml-0.5 block";
  const inputClasses = "w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-[11px] font-bold text-white outline-none focus:border-blue-500/50 focus:bg-white/[0.06] transition-all duration-300";

  return (
    <div className="flex flex-col h-full bg-[#0a0a0c] text-white overflow-hidden p-3 md:p-4 space-y-4">
      {/* HEADER */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center border border-white/20 shadow-xl shadow-blue-500/20">
              <Maximize2 size={16} className="text-white drop-shadow-md" />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-tighter text-[13px] leading-none text-white">Image Resize</h3>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-blue-400/80">Pro Engine</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onBack}
            className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-white/40 hover:text-white transition-all border border-white/5 group"
          >
            <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[8px] font-black uppercase tracking-widest">Back</span>
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-white/40 hover:text-white transition-all border border-white/5 group"
          >
            <Home size={12} />
            <span className="text-[8px] font-black uppercase tracking-widest">Home</span>
          </button>
          <button
            onClick={() => (document.getElementById('static-image-upload') as HTMLInputElement)?.click()}
            className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 transition-all border border-blue-500/20 group"
          >
            <Plus size={12} className="group-hover:rotate-90 transition-transform duration-300" />
            <span className="text-[8px] font-black uppercase tracking-widest">Upload</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col space-y-3 overflow-y-auto pr-1 scrollbar-hide">
        {/* Current Size Indicator */}
        <div className="glass-surface p-2.5 rounded-2xl flex items-center justify-between shrink-0 border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent">
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none">Active Size</span>
            <span className="text-sm font-black text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.3)]">{formatSize(image.size)}</span>
          </div>
          <div className="h-6 w-[1px] bg-white/10" />
          <div className="text-right flex flex-col gap-0.5">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none">Dimensions</span>
            <span className="block text-[11px] font-black text-slate-200">{image.width} × {image.height}</span>
          </div>
        </div>

        <div className="flex p-1 bg-white/[0.03] rounded-xl border border-white/5 shrink-0">
          <button
            onClick={() => setResizeMode('single')}
            className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all duration-300 ${resizeMode === 'single' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Single
          </button>
          <button
            onClick={() => setResizeMode('batch')}
            className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all duration-300 ${resizeMode === 'batch' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Batch
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-0.5 scrollbar-hide space-y-3">
          {resizeMode === 'single' ? (
            <>
              <div className="bg-white/[0.02] border border-white/5 p-3 rounded-2xl space-y-4">
                <div className="flex p-0.5 bg-black/20 rounded-lg shrink-0">
                  <button
                    onClick={() => setUnitMode('px')}
                    className={`flex-1 py-1 text-[8px] font-black uppercase rounded-md transition-all ${unitMode === 'px' ? 'bg-white/10 text-blue-400' : 'text-slate-500 hover:text-slate-400'}`}
                  >
                    Pixels
                  </button>
                  <button
                    onClick={() => setUnitMode('percent')}
                    className={`flex-1 py-1 text-[8px] font-black uppercase rounded-md transition-all ${unitMode === 'percent' ? 'bg-white/10 text-blue-400' : 'text-slate-500 hover:text-slate-400'}`}
                  >
                    Scale %
                  </button>
                </div>

                {unitMode === 'px' ? (
                  <div className="grid grid-cols-2 gap-2 relative">
                    <div className="space-y-0.5">
                      <label className={labelClasses}>Width</label>
                      <input type="number" value={width} onChange={(e) => handleWidthChange(Number(e.target.value))} className={inputClasses} />
                    </div>
                    <div className="absolute left-1/2 top-[62%] -translate-x-1/2 -translate-y-1/2 z-10">
                      <button
                        onClick={() => setAspectRatioLocked(!aspectRatioLocked)}
                        className={`p-1.5 rounded-xl border transition-all duration-300 ${aspectRatioLocked ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/30' : 'bg-white/5 text-slate-500 border-white/10'}`}
                      >
                        {aspectRatioLocked ? <Link2 size={10} /> : <Link2Off size={10} />}
                      </button>
                    </div>
                    <div className="space-y-0.5">
                      <label className={labelClasses}>Height</label>
                      <input type="number" value={height} onChange={(e) => handleHeightChange(Number(e.target.value))} className={inputClasses} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className={labelClasses}>Scale Factor</label>
                      <span className="text-[11px] font-black text-blue-400">{percent}%</span>
                    </div>
                    <div className="px-1">
                      <input
                        type="range"
                        min="1"
                        max="200"
                        value={percent}
                        onChange={(e) => handlePercentChange(Number(e.target.value))}
                        className="w-full h-1 rounded-full appearance-none bg-white/10 accent-blue-500 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white/[0.02] border border-white/5 p-3 rounded-2xl space-y-4">
                <div className="space-y-2">
                  <label className={labelClasses}>Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['image/jpeg', 'image/png', 'image/webp'].map(f => (
                      <button
                        key={f}
                        onClick={() => setExportFormat(f)}
                        className={`py-1.5 rounded-xl text-[9px] font-black uppercase border transition-all duration-300 ${exportFormat === f ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)]' : 'bg-white/[0.03] border-white/5 text-slate-500 hover:text-slate-400'}`}
                      >
                        {f.split('/')[1]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={labelClasses}>Target Size (KB)</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="Auto Quality"
                      value={targetKB}
                      onChange={(e) => setTargetKB(e.target.value === '' ? '' : Number(e.target.value))}
                      className={inputClasses}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-500 uppercase tracking-widest">KB</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <BulkTool
              image={image}
              updateImage={updateImage}
              setIsProcessing={setIsProcessing}
              onBack={() => setResizeMode('single')}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5 shrink-0">
        <button
          onClick={applyResize}
          className="group relative overflow-hidden bg-blue-600 text-white py-2 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <CheckCircle size={12} className="text-white/80" /> Bake
        </button>
        <button
          onClick={onDownload}
          className="bg-white/[0.03] hover:bg-white/[0.08] text-white py-2 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] border border-white/10 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Download size={12} className="text-white/40" /> Export
        </button>
      </div>
    </div>
  );
}


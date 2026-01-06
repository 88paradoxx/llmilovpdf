
import React, { useState, useRef, useEffect } from 'react';
import { ImageState } from '../../types';
import { loadImage } from '../../services/imageService';
import { 
  FileText, 
  Download, 
  Plus,
  Trash2,
  Settings2,
  Layout,
  Loader2,
  AlertCircle,
  Eye,
  Settings,
  ArrowLeft,
  Home
} from 'lucide-react';

interface Props {
  image: ImageState;
  updateImage?: (url: string, updates?: Partial<ImageState>) => void;
  setIsProcessing: (v: boolean) => void;
  onDownload?: () => void;
  setLivePreview?: (node: React.ReactNode) => void;
  onBack?: () => void;
}

type PageSize = 'a4' | 'letter' | 'legal' | 'fit';
type Orientation = 'p' | 'l';

interface ImagePage {
  id: string;
  url: string;
  name: string;
}

export default function ImageToPdfTool({ image, setIsProcessing, setLivePreview, onDownload, onBack }: Props) {
  const [pageSize, setPageSize] = useState<PageSize>('fit');
  const [orientation, setOrientation] = useState<Orientation>('p');
  const [margin, setMargin] = useState(0);
  const [pages, setPages] = useState<ImagePage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (image.currentUrl && pages.length === 0 && image.format !== 'application/pdf') {
      setPages([{ id: 'main', url: image.currentUrl, name: image.name }]);
    }
  }, [image]);

  const PAGE_DIMENSIONS: Record<string, { w: number, h: number }> = {
    a4: { w: 210, h: 297 },
    letter: { w: 215.9, h: 279.4 },
    legal: { w: 215.9, h: 355.6 },
  };

  const handleAddMore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = Array.from(e.target.files || []) as File[];
    if (uploaded.length === 0) return;

    const newPages = uploaded.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      url: URL.createObjectURL(file),
      name: file.name
    }));
    
    setPages(prev => [...prev, ...newPages]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePage = (id: string) => {
    setPages(prev => {
      const filtered = prev.filter(p => p.id !== id);
      const removed = prev.find(p => p.id === id);
      if (removed && removed.id !== 'main') URL.revokeObjectURL(removed.url);
      return filtered;
    });
  };

  // Live Preview Logic
  useEffect(() => {
    if (!setLivePreview) return;
    
    setLivePreview(
      <div className="w-full h-full bg-[#0d0d12] overflow-y-auto p-4 md:p-8 scrollbar-hide">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {pages.map((p, idx) => (
            <div key={p.id} className="flex flex-col gap-2 group animate-in fade-in zoom-in-95 duration-300">
               <div className="relative aspect-[3/4.2] bg-white border border-white/5 rounded-xl overflow-hidden shadow-2xl transition-all duration-300 group-hover:scale-[1.03]">
                  <img src={p.url} className="w-full h-full object-cover" alt={`Page ${idx + 1}`} />
                  <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/80 backdrop-blur-md text-white text-[10px] font-black rounded-lg uppercase tracking-widest border border-white/10 shadow-lg">
                    Page {idx + 1}
                  </div>
                  <button 
                    onClick={() => removePage(p.id)}
                    className="absolute top-4 right-4 p-2 bg-red-500/80 backdrop-blur-md text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
               </div>
               <p className="text-[10px] text-slate-500 font-medium truncate px-2">{p.name}</p>
            </div>
          ))}
          {pages.length === 0 && (
             <div className="col-span-full h-64 flex flex-col items-center justify-center text-slate-500">
                <FileText size={48} className="opacity-10 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">No images selected</p>
             </div>
          )}
        </div>
      </div>
    );
  }, [pages, setLivePreview]);

  const generatePDF = async () => {
    if (pages.length === 0) return;
    setIsProcessing(true);
    setIsGenerating(true);
    try {
      const { jsPDF } = await import('jspdf');
      
      let pdf: any = null;

      for (let i = 0; i < pages.length; i++) {
        const img = await loadImage(pages[i].url);
        
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        ctx.drawImage(img, 0, 0);
        const imgData = canvas.toDataURL('image/jpeg', 0.92);

        let pW, pH, pOrient;
        if (pageSize === 'fit') {
          pW = img.width; pH = img.height;
          pOrient = pW > pH ? 'l' : 'p';
        } else {
          const dim = PAGE_DIMENSIONS[pageSize];
          pW = orientation === 'p' ? dim.w : dim.h;
          pH = orientation === 'p' ? dim.h : dim.w;
          pOrient = orientation;
        }

        if (i === 0) {
          pdf = new jsPDF({
            orientation: pOrient as any,
            unit: pageSize === 'fit' ? 'px' : 'mm',
            format: pageSize === 'fit' ? [pW, pH] : pageSize
          });
        } else {
          pdf.addPage(pageSize === 'fit' ? [pW, pH] : pageSize, pOrient);
        }

        const canvasW = pdf.internal.pageSize.getWidth();
        const canvasH = pdf.internal.pageSize.getHeight();
        const m = pageSize === 'fit' ? 0 : margin;
        const availW = canvasW - (m * 2);
        const availH = canvasH - (m * 2);
        const imgRatio = img.width / img.height;
        const pageRatio = availW / availH;

        let drawW, drawH;
        if (imgRatio > pageRatio) {
          drawW = availW; drawH = availW / imgRatio;
        } else {
          drawH = availH; drawW = availH * imgRatio;
        }

        const x = m + (availW - drawW) / 2;
        const y = m + (availH - drawH) / 2;
        
        pdf.addImage(imgData, 'JPEG', x, y, drawW, drawH, undefined, 'FAST');
      }

      pdf.save(`${image.name.split('.')[0] || 'converted'}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Document generation failed.");
    } finally { 
      setIsProcessing(false);
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111114] text-white overflow-hidden p-4 md:p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center border border-white/10 shadow-lg shadow-purple-500/20">
            <FileText size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-black uppercase tracking-tight text-[13px] leading-none text-white">Image to PDF</h3>
            <p className="text-[9px] font-bold uppercase opacity-60 mt-1.5 tracking-widest text-purple-400">Stack Architect</p>
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

      <div className="space-y-3 md:space-y-4">
        <h3 className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-slate-500">Page Settings</h3>
        
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => setPageSize('fit')}
            className={`p-2.5 md:p-3 rounded-xl border transition-all text-left ${pageSize === 'fit' ? 'bg-purple-500/10 border-purple-500 text-purple-400' : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'}`}
          >
            <div className="text-[9px] md:text-[10px] font-black uppercase tracking-wider mb-1">Fit</div>
            <div className="text-[8px] md:text-[9px] opacity-60">Image Size</div>
          </button>
          <button 
            onClick={() => setPageSize('a4')}
            className={`p-2.5 md:p-3 rounded-xl border transition-all text-left ${pageSize === 'a4' ? 'bg-purple-500/10 border-purple-500 text-purple-400' : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'}`}
          >
            <div className="text-[9px] md:text-[10px] font-black uppercase tracking-wider mb-1">A4</div>
            <div className="text-[8px] md:text-[9px] opacity-60">Standard</div>
          </button>
        </div>

        {pageSize !== 'fit' && (
          <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2">
            <button 
              onClick={() => setOrientation('p')}
              className={`p-1.5 md:p-2 rounded-lg border text-[9px] md:text-[10px] font-bold uppercase tracking-wider transition-all ${orientation === 'p' ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-slate-500'}`}
            >
              Portrait
            </button>
            <button 
              onClick={() => setOrientation('l')}
              className={`p-1.5 md:p-2 rounded-lg border text-[9px] md:text-[10px] font-bold uppercase tracking-wider transition-all ${orientation === 'l' ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-slate-500'}`}
            >
              Landscape
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3 md:space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-slate-500">Images ({pages.length})</h3>
        </div>
        
        <div className="space-y-2 max-h-[250px] md:max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full group flex items-center gap-3 p-1.5 md:p-2 bg-white/[0.02] border border-dashed border-white/10 rounded-xl hover:bg-white/5 hover:border-purple-500/30 transition-all"
          >
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <Plus size={14} className="text-slate-500 group-hover:text-purple-400 transition-colors" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">Add More Images</p>
              <p className="text-[7px] md:text-[8px] text-slate-600 uppercase tracking-tighter">Select from device</p>
            </div>
          </button>

          {pages.map((p, idx) => (
            <div key={p.id} className="group flex items-center gap-3 p-1.5 md:p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg overflow-hidden shrink-0 border border-white/10">
                <img src={p.url} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] md:text-[10px] font-bold text-slate-300 truncate">{p.name}</p>
                <p className="text-[7px] md:text-[8px] text-slate-500 uppercase tracking-tighter">Page {idx + 1}</p>
              </div>
              <button 
                onClick={() => removePage(p.id)}
                className="p-1.5 md:p-2 text-slate-500 hover:text-red-400 transition-colors md:opacity-0 md:group-hover:opacity-100"
              >
                <Trash2 size={12} className="md:size-[14px]" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-3 md:pt-4 border-t border-white/5">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleAddMore} 
          className="hidden" 
          accept="image/*" 
          multiple 
        />
        <button 
          onClick={generatePDF}
          disabled={isGenerating || pages.length === 0}
          className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 md:py-4 rounded-2xl font-black text-[9px] md:text-[11px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <Loader2 size={14} className="md:size-[18px] animate-spin" />
          ) : (
            <Download size={14} className="md:size-[18px]" />
          )}
          <span>{isGenerating ? 'Converting...' : 'Convert to PDF'}</span>
        </button>
      </div>

      <div className="bg-purple-500/5 border border-purple-500/10 rounded-2xl p-3 md:p-4">
        <div className="flex items-start gap-3">
          <Settings2 size={14} className="md:size-[16px] text-purple-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-[8px] md:text-[9px] font-black text-purple-400 uppercase tracking-widest">Pro Tip</p>
            <p className="text-[9px] md:text-[10px] text-slate-400 leading-relaxed">
              Use "Fit" to keep original image dimensions, or choose "A4" for a consistent document layout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

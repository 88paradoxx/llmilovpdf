
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
  Settings
} from 'lucide-react';

interface Props {
  image: ImageState;
  setIsProcessing: (v: boolean) => void;
  setLivePreview?: (node: React.ReactNode) => void;
  file?: File | null;
  onBack?: () => void;
}

type PageSize = 'a4' | 'letter' | 'legal' | 'fit';
type Orientation = 'p' | 'l';

interface ImagePage {
  id: string;
  url: string;
  name: string;
}

export default function PdfTool({ image, setIsProcessing, setLivePreview, file }: Props) {
  const [pageSize, setPageSize] = useState<PageSize>('fit');
  const [orientation, setOrientation] = useState<Orientation>('p');
  const [margin, setMargin] = useState(0);
  const [pages, setPages] = useState<ImagePage[]>([]);
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit');
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (image.currentUrl && pages.length === 0 && image.format !== 'application/pdf') {
      setPages([{ id: 'main', url: image.currentUrl, name: image.name }]);
    } else if (file && pages.length === 0 && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
      // For PDF to Image conversion, we might need to render the PDF pages as images
      // But this tool seems to be for Image to PDF. 
      // If it's a PDF file being passed to an Image-to-PDF tool, we should handle it or ignore.
    }
  }, [image, file]);

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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-8 max-w-7xl mx-auto">
          {pages.map((p, idx) => (
            <div key={p.id} className="flex flex-col gap-2 group animate-in fade-in zoom-in-95 duration-300">
               <div className="relative aspect-[3/4.2] bg-white border border-white/5 rounded-xl overflow-hidden shadow-2xl transition-all duration-300 group-hover:scale-[1.03]">
                  <img src={p.url} className="w-full h-full object-cover" alt={`Page ${idx + 1}`} />
                  <div className="absolute top-2 left-2 px-2 py-1 bg-black/80 backdrop-blur-md text-white text-[9px] font-black rounded-lg uppercase tracking-widest border border-white/10 shadow-lg">
                    Page {idx + 1}
                  </div>
               </div>
            </div>
          ))}
          {pages.length === 0 && (
             <div className="col-span-full h-64 flex flex-col items-center justify-center text-slate-500">
                <FileText size={48} className="opacity-10 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">No pages in deck</p>
             </div>
          )}
        </div>
      </div>
    );
  }, [pages, setLivePreview]);

  const generatePDF = async () => {
    if (pages.length === 0) return;
    setIsProcessing(true);
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

      pdf.save(`ilovpdf-doc-${Date.now()}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Document generation failed.");
    } finally { 
      setIsProcessing(false); 
    }
  };

  return (
    <div 
      className="w-full h-full flex flex-col p-3 md:p-4 z-[70] overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex md:hidden glass-surface-soft p-1 rounded-xl shrink-0">
          <button 
            onClick={() => setMobileView('edit')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mobileView === 'edit' ? 'bg-white/10 text-red-300 shadow-lg' : 'text-slate-500'}`}
          >
            <Settings size={14} /> Configure
          </button>
          <button 
            onClick={() => setMobileView('preview')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mobileView === 'preview' ? 'bg-white/10 text-red-300 shadow-lg' : 'text-slate-500'}`}
          >
            <Eye size={14} /> Preview
          </button>
        </div>
        <button
          onClick={() => setIsPanelCollapsed(v => !v)}
          className="hidden md:inline-flex items-center justify-center w-7 h-7 rounded-lg border border-white/10 text-slate-500 hover:text-white hover:border-white/40 transition-all"
        >
          {isPanelCollapsed ? '›' : '‹'}
        </button>
      </div>

      <div className={`flex-1 flex flex-col gap-4 overflow-y-auto pr-1 scrollbar-hide ${mobileView === 'preview' ? 'hidden md:flex' : 'flex'} ${isPanelCollapsed ? 'hidden md:hidden' : ''}`}>
        <div className="glass-surface-soft rounded-2xl p-4 text-red-400 shadow-lg shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 text-white rounded-xl flex items-center justify-center shadow-xl">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-widest text-xs leading-none">Image to PDF</h3>
              <p className="text-[8px] font-black uppercase opacity-60 mt-1.5 tracking-widest">Page Assembler</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between px-1.5">
            <div className="flex items-center gap-2 text-purple-400">
               <Layout size={14} />
               <span className="text-[9px] font-black uppercase tracking-widest">{pages.length} Pages</span>
            </div>
            {pages.length > 0 && (
              <button onClick={() => setPages([])} className="text-[8px] font-black text-red-500 uppercase hover:underline">Flush All</button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pb-1">
            {pages.map((p, i) => (
              <div key={p.id} className="relative aspect-[3/4.2] glass-surface-soft border border-white/10 rounded-xl overflow-hidden group hover:border-red-500 transition-all shadow-xl">
                 <img src={p.url} className="w-full h-full object-cover" alt={`Page ${i+1}`} />
                 <button onClick={() => removePage(p.id)} className="absolute inset-0 bg-red-600/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white"><Trash2 size={16}/></button>
              </div>
            ))}
            <button onClick={() => fileInputRef.current?.click()} className="aspect-[3/4.2] glass-surface-soft border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-white/10 group transition-all">
               <Plus size={20} className="text-slate-600 group-hover:text-red-500" />
               <span className="text-[7px] font-black uppercase text-slate-600">Add</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleAddMore} className="hidden" multiple accept="image/*" />
          </div>
        </div>

        <div className="glass-surface-soft p-4 rounded-[28px] border border-white/10 shadow-sm space-y-5">
          <div className="space-y-3">
            <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block ml-1">Page Standard</label>
            <div className="grid grid-cols-2 gap-2">
              {['fit', 'a4', 'letter', 'legal'].map(p => (
                <button key={p} onClick={() => setPageSize(p as PageSize)} className={`py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border-2 transition-all ${pageSize === p ? 'bg-red-500/20 border-red-500 text-white shadow-lg' : 'border-white/5 bg-black/20 text-slate-500 hover:border-white/10'}`}>
                  {p === 'fit' ? 'Auto-Fit' : p}
                </button>
              ))}
            </div>
          </div>
          
          {pageSize !== 'fit' && (
            <div className="space-y-5 animate-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block ml-1">Orientation</label>
                <div className="flex glass-surface-soft p-1 rounded-xl gap-1 border border-white/10 shadow-inner">
                  <button onClick={() => setOrientation('p')} className={`flex-1 py-1.5 text-[8px] font-black uppercase rounded-lg transition-all ${orientation === 'p' ? 'bg-white/10 text-red-300 shadow-lg' : 'text-slate-500'}`}>Portrait</button>
                  <button onClick={() => setOrientation('l')} className={`flex-1 py-1.5 text-[8px] font-black uppercase rounded-lg transition-all ${orientation === 'l' ? 'bg-white/10 text-red-300 shadow-lg' : 'text-slate-500'}`}>Landscape</button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1"><label className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Margins</label><span className="text-[9px] font-black text-white">{margin}mm</span></div>
                <input type="range" min="0" max="40" value={margin} onChange={(e) => setMargin(Number(e.target.value))} className="w-full h-1 rounded-lg appearance-none cursor-pointer accent-red-500 glass-slider-track" />
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto space-y-3 pb-4">
           <div className="glass-surface-soft border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3">
              <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[8px] font-bold text-amber-500/80 leading-relaxed uppercase tracking-tight">
                Privacy Locked: PDF assembly occurs entirely in-memory. Your photos are never uploaded.
              </p>
           </div>
        </div>
      </div>

      {/* Mobile Preview Placeholder */}
      <div className={`flex-1 flex flex-col items-center justify-center text-center p-6 ${mobileView === 'preview' ? 'flex md:hidden' : 'hidden'}`}>
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/5 shadow-2xl">
             <Eye size={24} className="text-red-500 animate-pulse" />
          </div>
          <h4 className="text-xs font-black text-white uppercase tracking-widest mb-2">Live Preview Active</h4>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">The document layout is being rendered in the main workspace behind this panel.</p>
      </div>

      <div className="pt-4 border-t border-white/5 mt-4 shrink-0">
        <button 
          onClick={generatePDF} 
          disabled={pages.length === 0} 
          className="w-full glass-button-primary text-white py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-2"
        >
          <Download size={18} /> GENERATE DOCUMENT
        </button>
      </div>
    </div>
  );
}


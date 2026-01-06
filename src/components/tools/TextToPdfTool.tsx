
import React, { useState, useEffect, useRef } from 'react';
import { 
  FileType, 
  Download, 
  Settings, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Loader2,
  Zap,
  ShieldCheck,
  Plus,
  ImagePlus,
  Trash2, 
  Check,
  ArrowLeft,
  Home
} from 'lucide-react';

interface Props {
  setIsProcessing: (v: boolean) => void;
  setLivePreview?: (node: React.ReactNode) => void;
  onBack: () => void;
}

interface PdfPageData {
  id: string;
  content: string;
  image?: string;
}

type PageSize = 'a4' | 'letter' | 'legal';
type FontFamily = 'helvetica' | 'times' | 'courier';
type Alignment = 'left' | 'center' | 'right';

export default function TextToPdfTool({ setIsProcessing, setLivePreview, onBack }: Props) {
  const [pages, setPages] = useState<PdfPageData[]>([
    { id: '1', content: 'Start typing your document here...' }
  ]);
  const [title, setTitle] = useState('My Document');
  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [fontFamily, setFontFamily] = useState<FontFamily>('helvetica');
  const [fontSize, setFontSize] = useState(12);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [alignment, setAlignment] = useState<Alignment>('left');
  const [margins, setMargins] = useState(20);
  const [isGenerating, setIsGenerating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activePageFileId = useRef<string | null>(null);

  useEffect(() => {
    if (!setLivePreview) return;

    const fontStyle = fontFamily === 'times' ? 'serif' : fontFamily === 'courier' ? 'monospace' : 'sans-serif';

    setLivePreview(
      <div className="w-full h-full bg-[#0d0d12] overflow-y-auto p-4 md:p-12 scrollbar-hide flex flex-col items-center gap-12">
        {pages.map((page, idx) => (
          <div 
            key={page.id} 
            className="w-full max-w-2xl aspect-[1/1.414] bg-white rounded-xl shadow-[0_32px_64px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col p-12 relative animate-in fade-in zoom-in-95 duration-500 shrink-0"
          >
             {idx === 0 && title && (
               <h2 className="text-center font-black mb-8 text-slate-900 border-b border-slate-100 pb-4" style={{ 
                 fontSize: `${fontSize + 8}px`, 
                 fontFamily: fontStyle 
               }}>{title}</h2>
             )}
             
             <div className="flex-1 flex gap-6 overflow-hidden">
                <div 
                  className="flex-1 whitespace-pre-wrap text-slate-800 font-medium"
                  style={{ 
                    textAlign: alignment,
                    fontSize: `${fontSize}px`,
                    lineHeight: lineHeight,
                    fontFamily: fontStyle
                  }}
                >
                  {page.content}
                </div>
                {page.image && (
                  <div className="w-1/3 h-fit max-h-[40%] rounded-xl overflow-hidden border border-slate-100 shadow-sm shrink-0">
                    <img src={page.image} className="w-full h-full object-cover" alt="Page Visual" />
                  </div>
                )}
             </div>

             <div className="mt-auto pt-8 flex items-center justify-between border-t border-slate-50 text-[8px] text-slate-300 uppercase font-black tracking-[0.3em]">
               <span>ilovpdf Composer</span>
               <span>Page {idx + 1} of {pages.length}</span>
             </div>
          </div>
        ))}
        <div className="h-20 shrink-0" />
      </div>
    );
  }, [pages, title, pageSize, fontFamily, fontSize, lineHeight, alignment, margins, setLivePreview]);

  const addPage = () => {
    setPages([...pages, { id: Date.now().toString(), content: '' }]);
  };

  const updatePage = (id: string, updates: Partial<PdfPageData>) => {
    setPages(pages.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const removePage = (id: string) => {
    if (pages.length <= 1) return;
    setPages(pages.filter(p => p.id !== id));
  };

  const triggerImageUpload = (id: string) => {
    activePageFileId.current = id;
    fileInputRef.current?.click();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const id = activePageFileId.current;
    if (file && id) {
      const reader = new FileReader();
      reader.onload = () => {
        updatePage(id, { image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePdfFromText = async () => {
    if (pages.length === 0) return;
    setIsProcessing(true);
    setIsGenerating(true);
    try {
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: pageSize
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentMargins = margins;
      
      for (let i = 0; i < pages.length; i++) {
        if (i > 0) doc.addPage(pageSize, 'p');
        
        const pageData = pages[i];
        let currentY = contentMargins;

        // Draw Title only on first page
        if (i === 0 && title.trim()) {
          doc.setFont(fontFamily, 'bold');
          doc.setFontSize(fontSize + 6);
          const splitTitle = doc.splitTextToSize(title.trim(), pageWidth - (contentMargins * 2));
          doc.text(splitTitle, pageWidth / 2, currentY, { align: 'center' });
          currentY += (splitTitle.length * (fontSize + 6) * 0.4) + 10;
        }

        // Handle Image if present
        if (pageData.image) {
          const imgWidth = (pageWidth - contentMargins * 2) * 0.4;
          const imgHeight = imgWidth * 0.75;
          doc.addImage(pageData.image, 'JPEG', pageWidth - contentMargins - imgWidth, currentY, imgWidth, imgHeight);
        }

        // Draw Content
        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(fontSize);
        const textWidth = pageData.image ? (pageWidth - (contentMargins * 2)) * 0.55 : (pageWidth - (contentMargins * 2));
        const splitContent = doc.splitTextToSize(pageData.content, textWidth);
        
        let xPos = contentMargins;
        if (alignment === 'center') xPos = pageData.image ? contentMargins + (textWidth / 2) : pageWidth / 2;
        if (alignment === 'right') xPos = pageData.image ? contentMargins + textWidth : pageWidth - contentMargins;
        
        doc.text(splitContent, xPos, currentY, { align: alignment });
      }

      doc.save(`${title.trim() || 'document'}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Failed to generate PDF.");
    } finally {
      setIsProcessing(false);
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111114] text-white overflow-hidden p-4 md:p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center border border-white/10 shadow-lg shadow-purple-500/20">
              <FileType size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-tight text-[13px] leading-none text-white">Text to PDF</h3>
              <p className="text-[9px] font-bold uppercase opacity-60 mt-1.5 tracking-widest text-purple-400">Stack Architect</p>
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

      <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1 scrollbar-hide">
        <div className="space-y-4">
           <div className="space-y-1.5 px-1">
             <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Document Title</label>
             <div className="glass-surface-soft border border-white/10 rounded-xl px-1 py-0.5">
               <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-transparent text-xs font-black text-white outline-none placeholder:text-slate-700"
                placeholder="Untitled Document"
               />
             </div>
           </div>

           <div className="flex items-center justify-between px-1 shrink-0">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Pages ({pages.length})</label>
              <button 
                onClick={addPage}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[8px] font-black uppercase transition-all active:scale-95 shadow-md"
              >
                <Plus size={10} /> Add Page
              </button>
           </div>

           <div className="space-y-3">
             {pages.map((page, index) => (
               <div key={page.id} className="group bg-white/5 border border-white/5 rounded-2xl p-3 space-y-3 transition-all hover:bg-white/[0.08] shadow-lg">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 overflow-hidden">
                       <div className="w-5 h-5 bg-teal-600 text-white rounded-md flex items-center justify-center text-[9px] font-black shadow-md shrink-0">
                         {index + 1}
                       </div>
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">Sheet Content</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => triggerImageUpload(page.id)} className={`p-1.5 rounded-lg hover:bg-teal-500/20 ${page.image ? 'text-teal-400' : 'text-slate-400 hover:text-white'}`} title="Add Image">
                         <ImagePlus size={12}/>
                       </button>
                       <button onClick={() => removePage(page.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-500/10" title="Delete Page">
                         <Trash2 size={12}/>
                       </button>
                    </div>
                  </div>
                  
                  <textarea 
                    value={page.content}
                    onChange={(e) => updatePage(page.id, { content: e.target.value })}
                    className="w-full bg-black/30 border border-white/5 rounded-xl p-3 text-[10px] font-medium text-slate-300 outline-none focus:border-teal-500 transition-all resize-none leading-relaxed h-32 scrollbar-hide"
                    placeholder="Enter text for this page..."
                  />

                  {page.image && (
                    <div className="relative aspect-[4/3] bg-black/40 rounded-xl overflow-hidden border border-white/10">
                       <img src={page.image} className="w-full h-full object-cover opacity-80" alt="Preview" />
                       <button onClick={() => updatePage(page.id, { image: undefined })} className="absolute top-1.5 right-1.5 bg-black/60 text-white p-1 rounded-md hover:bg-red-500 transition-all"><Trash2 size={10}/></button>
                    </div>
                  )}
               </div>
             ))}
           </div>
        </div>

        <div className="space-y-4 glass-surface-soft p-4 rounded-[28px] border border-white/10">
          <div className="flex items-center gap-2 text-teal-500 mb-1">
             <Settings size={14} />
             <h4 className="text-[9px] font-black uppercase tracking-widest">Global Formatting</h4>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Standard</label>
              <select value={pageSize} onChange={(e) => setPageSize(e.target.value as any)} className="w-full glass-surface-soft border border-white/10 rounded-xl px-2 py-2 text-[9px] font-bold text-white outline-none">
                <option value="a4">A4</option>
                <option value="letter">Letter</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Typeface</label>
              <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value as any)} className="w-full glass-surface-soft border border-white/10 rounded-xl px-2 py-2 text-[9px] font-bold text-white outline-none">
                <option value="helvetica">Sans</option>
                <option value="times">Serif</option>
                <option value="courier">Mono</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Text Scale</label>
              <span className="text-[10px] font-black text-teal-500">{fontSize}pt</span>
            </div>
            <input type="range" min="8" max="32" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full h-1 rounded-full appearance-none accent-teal-500 glass-slider-track" />
          </div>

          <div className="space-y-1">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Alignment</label>
            <div className="flex glass-surface-soft p-1 rounded-xl gap-1 border border-white/10 shadow-inner">
                {(['left', 'center', 'right'] as Alignment[]).map(a => (
                  <button key={a} onClick={() => setAlignment(a)} className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-all ${alignment === a ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                    {a === 'left' ? <AlignLeft size={14}/> : a === 'center' ? <AlignCenter size={14}/> : <AlignRight size={14}/>}
                  </button>
                ))}
            </div>
          </div>
        </div>

        <div className="mt-auto glass-surface-soft border border-emerald-500/20 p-4 rounded-2xl flex items-start gap-3">
           <ShieldCheck size={16} className="text-emerald-500 shrink-0 mt-0.5" />
           <p className="text-[8px] font-bold text-emerald-500/80 leading-relaxed uppercase tracking-tight">
             Native Rendering: Your document is built from text primitives for maximum clarity and searchable content.
           </p>
        </div>
      </div>

      <div className="pt-4 border-t border-white/5 mt-4 glass-surface">
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
        <button 
          onClick={generatePdfFromText} 
          disabled={isGenerating || pages.length === 0}
          className="w-full glass-button-primary text-white py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-2"
        >
          {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} 
          <span>{isGenerating ? 'BUILDING...' : `EXPORT ${pages.length} PAGES (PDF)`}</span>
        </button>
      </div>
    </div>
  );
}


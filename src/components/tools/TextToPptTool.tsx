import React, { useState, useEffect, useRef } from 'react';
import { 
  MonitorPlay, 
  ArrowLeft,
  Home,
  Maximize2,
  Layout,
  Download, 
  Settings, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Loader2,
  Check,
  Zap,
  Plus,
  ImagePlus,
  Video,
  Trash2,
  Layout as LayoutIcon,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Play,
  Type,
  Palette
} from 'lucide-react';

interface Props {
  setIsProcessing: (v: boolean) => void;
  setLivePreview?: (node: React.ReactNode) => void;
  onBack?: () => void;
}

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  blob?: Blob;
  fit?: 'cover' | 'contain';
}

interface Slide {
  id: string;
  type: 'standard' | 'media-only';
  title: string;
  content: string;
  media: MediaItem[];
  mediaPosition?: 'left' | 'right';
  titleColor?: string;
  contentColor?: string;
}

type ThemePreset = 
  | 'corporate' | 'modern' | 'dark' | 'creative' | 'minimal' | 'midnight' 
  | 'vibrant' | 'luxury' | 'cyber' | 'nordic' | 'sunset' | 'forest' 
  | 'monochrome' | 'berry' | 'slate' | 'ocean';

type Alignment = 'left' | 'center' | 'right';

const THEME_STYLES: Record<ThemePreset, { bg: string, titleColor: string, bodyColor: string, accent: string, label: string }> = {
  corporate: { bg: 'FFFFFF', titleColor: '003366', bodyColor: '333333', accent: '0055A4', label: 'Corporate' },
  modern: { bg: 'F8F9FA', titleColor: '212529', bodyColor: '495057', accent: '6366F1', label: 'Modern' },
  dark: { bg: '1E293B', titleColor: 'F8FAFC', bodyColor: 'CBD5E1', accent: '818CF8', label: 'Studio Dark' },
  creative: { bg: 'FFF7ED', titleColor: '7C2D12', bodyColor: '9A3412', accent: 'EA580C', label: 'Creative' },
  minimal: { bg: 'FFFFFF', titleColor: '000000', bodyColor: '666666', accent: '000000', label: 'Minimalist' },
  midnight: { bg: '020617', titleColor: 'FFFFFF', bodyColor: '94A3B8', accent: '38BDF8', label: 'Midnight' },
  vibrant: { bg: 'FDF2F8', titleColor: 'BE185D', bodyColor: '4A044E', accent: 'EC4899', label: 'Vibrant' },
  luxury: { bg: '0F172A', titleColor: 'EAB308', bodyColor: 'F1F5F9', accent: 'EAB308', label: 'Luxury' },
  cyber: { bg: '000000', titleColor: '00FF41', bodyColor: '00FF41', accent: '00FF41', label: 'Cyber' },
  nordic: { bg: 'ECEFF4', titleColor: '2E3440', bodyColor: '4C566A', accent: '88C0D0', label: 'Nordic' },
  sunset: { bg: '451a03', titleColor: 'fde047', bodyColor: 'fdba74', accent: 'f97316', label: 'Sunset' },
  forest: { bg: '064e3b', titleColor: 'dcfce7', bodyColor: 'bbf7d0', accent: '22c55e', label: 'Forest' },
  monochrome: { bg: 'f8fafc', titleColor: '0f172a', bodyColor: '475569', accent: '94a3b8', label: 'Mono' },
  berry: { bg: '4c0519', titleColor: 'fff1f2', bodyColor: 'fecdd3', accent: 'e11d48', label: 'Berry' },
  slate: { bg: '334155', titleColor: 'f8fafc', bodyColor: 'cbd5e1', accent: '94a3b8', label: 'Slate' },
  ocean: { bg: '0c4a6e', titleColor: 'f0f9ff', bodyColor: 'bae6fd', accent: '0ea5e9', label: 'Ocean' }
};

export default function TextToPptTool({ setIsProcessing, setLivePreview, onBack }: Props) {
  const [slides, setSlides] = useState<Slide[]>([
    { id: '1', type: 'standard', title: 'Welcome to ilovpdf', content: '- Fast Processing\n- Zero Uploads\n- Professional Grade', media: [], titleColor: undefined, contentColor: undefined },
    { id: '2', type: 'standard', title: 'Why Client-Side?', content: '- 100% Privacy\n- Works Offline\n- No Server Delays', media: [], titleColor: undefined, contentColor: undefined }
  ]);
  const [presentationTitle, setPresentationTitle] = useState('My Presentation');
  const [theme, setTheme] = useState<ThemePreset>('modern');
  const [alignment, setAlignment] = useState<Alignment>('center');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const activeSlideFileId = useRef<string | null>(null);

  useEffect(() => {
    if (!setLivePreview) return;

    const s = THEME_STYLES[theme];

    setLivePreview(
      <div className="w-full h-full bg-[#0d0d12] overflow-y-auto p-4 md:p-12 scrollbar-hide flex flex-col items-center gap-12">
        {slides.length > 0 ? (
          slides.map((slide, idx) => {
            const bodyLines = slide.content.trim().split('\n');
            const isMediaOnly = slide.type === 'media-only';
            const firstMedia = slide.media[0];

            return (
              <div 
                key={slide.id}
                className="w-full max-w-4xl aspect-[16/9] flex flex-col p-8 md:p-10 overflow-hidden rounded-xl shadow-[0_40px_80px_rgba(0,0,0,0.5)] relative animate-in fade-in zoom-in-95 duration-500 shrink-0 border border-white/5" 
                style={{ backgroundColor: `#${s.bg}` }}
              >
                 {isMediaOnly && firstMedia ? (
                   <div className="absolute inset-0 w-full h-full">
                     {firstMedia.type === 'image' ? (
                       <img 
                         src={firstMedia.url} 
                         className={`w-full h-full ${firstMedia.fit === 'contain' ? 'object-contain' : 'object-cover'}`} 
                         alt="Visual" 
                       />
                     ) : (
                       <div className="relative w-full h-full">
                         <video 
                           src={firstMedia.url} 
                           className={`w-full h-full ${firstMedia.fit === 'contain' ? 'object-contain' : 'object-cover'}`} 
                           autoPlay muted loop
                         />
                       </div>
                     )}
                     {/* Media Overlay Title if exists */}
                     {slide.title && (
                       <div className="absolute bottom-10 left-10 right-10 z-10">
                         <h2 className="font-black leading-tight drop-shadow-2xl" style={{ color: slide.titleColor || (firstMedia.type === 'image' ? '#fff' : `#${s.titleColor}`), fontSize: '3vw', textAlign: alignment }}>{slide.title}</h2>
                       </div>
                     )}
                   </div>
                 ) : (
                   <>
                     <h2 className="font-black mb-4 md:mb-6 leading-tight" style={{ color: slide.titleColor || `#${s.titleColor}`, fontSize: '2.8vw', textAlign: alignment }}>{slide.title}</h2>
                     <div className={`flex-1 flex gap-6 overflow-hidden relative ${slide.mediaPosition === 'left' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className="flex-1 space-y-3" style={{ color: slide.contentColor || `#${s.bodyColor}`, fontSize: '1.4vw', textAlign: alignment }}>
                          {bodyLines.map((l, i) => (
                            <div key={i} className="mb-1.5 font-medium leading-relaxed">
                              {l.startsWith('- ') ? <span className="mr-2 opacity-40">•</span> : null}
                              {l.startsWith('- ') ? l.substring(2) : l}
                            </div>
                          ))}
                        </div>
                        {slide.media.length > 0 && (
                          <div className="w-[60%] flex flex-col gap-4 justify-center">
                            {slide.media.slice(0, 2).map(item => (
                              <div key={item.id} className="relative w-full aspect-video flex items-center justify-center bg-black/5 rounded-2xl border border-black/5 overflow-hidden group/preview shadow-2xl">
                                 {item.type === 'image' ? (
                                   <img 
                                     src={item.url} 
                                     className={`w-full h-full ${item.fit === 'contain' ? 'object-contain' : 'object-cover'}`} 
                                     alt="Visual" 
                                   />
                                 ) : (
                                   <div className="relative w-full h-full">
                                     <video 
                                       src={item.url} 
                                       className={`w-full h-full ${item.fit === 'contain' ? 'object-contain' : 'object-cover'}`} 
                                     />
                                     <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/preview:bg-black/40 transition-all">
                                       <Play size={32} className="text-white opacity-60 group-hover/preview:opacity-100 transition-all" />
                                     </div>
                                   </div>
                                 )}
                              </div>
                            ))}
                          </div>
                        )}
                     </div>
                   </>
                 )}
                 <div className="absolute bottom-8 left-8 text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-4 z-20" style={{ color: isMediaOnly && firstMedia ? '#fff' : `#${s.accent}` }}>
                   <span className="opacity-40">Slide {idx + 1} of {slides.length}</span>
                   <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isMediaOnly && firstMedia ? '#fff' : `#${s.accent}`, opacity: 0.3 }} />
                   <span className="opacity-40">{s.label} Theme</span>
                 </div>
                 <div className="absolute top-8 right-8 w-12 h-1 bg-current opacity-10 rounded-full z-20" style={{ color: isMediaOnly && firstMedia ? '#fff' : `#${s.accent}` }} />
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-4">
             <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center border border-white/5 animate-pulse">
                <MonitorPlay size={32} />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em]">No slides in deck</p>
          </div>
        )}
        <div className="h-20 shrink-0" />
      </div>
    );
  }, [slides, theme, alignment, setLivePreview]);

  const addSlide = (type: 'standard' | 'media-only' = 'standard') => {
    setSlides([...slides, { id: Date.now().toString(), type, title: type === 'standard' ? 'New Slide' : '', content: type === 'standard' ? '- New Point' : '', media: [] }]);
  };

  const updateSlide = (id: string, updates: Partial<Slide>) => {
    setSlides(slides.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeSlide = (id: string) => {
    if (slides.length <= 1) return;
    setSlides(slides.filter(s => s.id !== id));
  };

  const triggerImageUpload = (id: string) => {
    activeSlideFileId.current = id;
    fileInputRef.current?.click();
  };

  const triggerVideoUpload = (id: string) => {
    activeSlideFileId.current = id;
    videoInputRef.current?.click();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const id = activeSlideFileId.current;
    if (file && id) {
      const reader = new FileReader();
      reader.onload = () => {
        const newMedia: MediaItem = {
          id: Date.now().toString(),
          type: 'image',
          url: reader.result as string
        };
        const slide = slides.find(s => s.id === id);
        if (slide) {
          const isMediaOnly = slide.type === 'media-only';
          updateSlide(id, { media: isMediaOnly ? [newMedia] : [...slide.media, newMedia] });
        }
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const id = activeSlideFileId.current;
    if (file && id) {
      const url = URL.createObjectURL(file);
      const newMedia: MediaItem = {
        id: Date.now().toString(),
        type: 'video',
        url: url,
        blob: file
      };
      const slide = slides.find(s => s.id === id);
      if (slide) {
        const isMediaOnly = slide.type === 'media-only';
        updateSlide(id, { media: isMediaOnly ? [newMedia] : [...slide.media, newMedia] });
      }
    }
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const removeMedia = (slideId: string, mediaId: string) => {
    const slide = slides.find(s => s.id === slideId);
    if (slide) {
      const itemToRemove = slide.media.find(m => m.id === mediaId);
      if (itemToRemove?.type === 'video') {
        URL.revokeObjectURL(itemToRemove.url);
      }
      updateSlide(slideId, { media: slide.media.filter(m => m.id !== mediaId) });
    }
  };

  const toggleMediaFit = (slideId: string, mediaId: string) => {
    const slide = slides.find(s => s.id === slideId);
    if (slide) {
      const newMedia: MediaItem[] = slide.media.map(m => 
        m.id === mediaId ? { ...m, fit: m.fit === 'contain' ? 'cover' : 'contain' } : m
      );
      updateSlide(slideId, { media: newMedia });
    }
  };

  const toggleMediaPosition = (slideId: string) => {
    const slide = slides.find(s => s.id === slideId);
    if (slide) {
      updateSlide(slideId, { mediaPosition: slide.mediaPosition === 'left' ? 'right' : 'left' });
    }
  };

  const generatePptFromSlides = async () => {
    if (slides.length === 0) return;
    setIsProcessing(true);
    setIsGenerating(true);

    try {
      const PptxGenJS = (await import('pptxgenjs')).default;
      const pptx = new PptxGenJS();
      
      pptx.layout = 'LAYOUT_16x9'; 
      const themeStyle = THEME_STYLES[theme];

      for (let idx = 0; idx < slides.length; idx++) {
        const slideData = slides[idx];
        const slide = pptx.addSlide();
        slide.background = { fill: themeStyle.bg };
        
        const isMediaOnly = slideData.type === 'media-only';
        const firstMedia = slideData.media[0];

        if (isMediaOnly && firstMedia) {
          if (firstMedia.type === 'image') {
            slide.addImage({
              data: firstMedia.url,
              x: 0, y: 0, w: 10, h: 5.625, // Full slide 16:9
              sizing: { type: firstMedia.fit || 'cover', w: 10, h: 5.625 }
            });
          } else if (firstMedia.type === 'video') {
            slide.addMedia({
              type: 'video',
              path: firstMedia.url,
              x: 0, y: 0, w: 10, h: 5.625
            });
          }
          if (slideData.title) {
            slide.addText(slideData.title, {
              x: 0.5, y: 4.5, w: 9.0, h: 1.0,
              fontSize: 32, bold: true, color: 'FFFFFF', align: alignment,
              valign: 'middle'
            });
          }
        } else {
          // Title Textbox
          slide.addText(slideData.title, {
            x: 0.5, y: 0.4, w: 9.0, h: 0.8,
            fontSize: 32, bold: true, color: themeStyle.titleColor, align: alignment,
            valign: 'middle'
          });

          const hasMedia = slideData.media.length > 0;

          // Content Textbox
          if (slideData.content) {
            slide.addText(slideData.content, {
              x: slideData.mediaPosition === 'left' ? 6.2 : 0.5, 
              y: 1.4, 
              w: hasMedia ? 3.3 : 9.0, 
              h: 3.7,
              fontSize: 18, color: themeStyle.bodyColor, align: alignment,
              valign: 'top',
              bullet: slideData.content.includes('- ') ? { type: 'bullet', indent: 0.3 } : undefined
            });
          }

          // Media Frame
          if (hasMedia) {
            slideData.media.slice(0, 2).forEach((item, mIdx) => {
              const mX = slideData.mediaPosition === 'left' ? 0.5 : 4.0;
              const mY = 1.4 + (mIdx * 1.9);
              const mW = 5.5;
              const mH = 1.7;

              if (item.type === 'image') {
                slide.addImage({
                  data: item.url,
                  x: mX, y: mY, w: mW, h: mH,
                  sizing: { type: item.fit || 'cover', w: mW, h: mH }
                });
              } else if (item.type === 'video') {
                try {
                  slide.addMedia({
                    type: 'video',
                    path: item.url,
                    x: mX, y: mY, w: mW, h: mH
                  });
                } catch (e) {
                  console.warn("Video export failed", e);
                }
              }
            });
          }
        }

        // Footer Text
        slide.addText(`ilovpdf • ${presentationTitle} • Page ${idx + 1}`, {
          x: 0.5, y: 5.2, w: 9, h: 0.3,
          fontSize: 8, color: isMediaOnly ? 'FFFFFF' : themeStyle.accent, align: 'left',
          valign: 'bottom'
        });
      }

      const fileName = `${presentationTitle.replace(/[^a-z0-9]/gi, '_')}.pptx`;
      await pptx.writeFile({ fileName });
    } catch (err) {
      console.error("PPT Generation Error", err);
      alert("Export failed. Try again with fewer or smaller images.");
    } finally {
      setIsProcessing(false);
      setIsGenerating(false);
    }
  };

  return (
    <div 
      className="w-full h-full flex flex-col bg-[#111114] text-white overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* MODERN TOOLBAR - RESPONSIVE */}
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto scrollbar-hide space-y-6 md:space-y-8">
        {/* HEADER */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center border border-white/10 shadow-lg shadow-purple-500/20">
                <MonitorPlay size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-black uppercase tracking-tight text-[13px] leading-none text-white">Text to PPT</h3>
                <p className="text-[9px] font-bold uppercase opacity-60 mt-1.5 tracking-widest text-purple-400">Deck Builder</p>
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

        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           {/* PROJECT TITLE */}
           <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
             <div className="flex items-center justify-between px-1">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Project Title</label>
               <Layout size={14} className="text-white/10" />
             </div>
             <input 
              type="text" 
              value={presentationTitle}
              onChange={(e) => setPresentationTitle(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-purple-500/50 focus:outline-none transition-all"
              placeholder="Presentation Name..."
             />
           </div>

           {/* NEW SLIDE BUTTONS - MOVED BELOW TITLE & SHRUNK */}
           <div className="flex gap-2">
             <button 
               onClick={() => addSlide('standard')}
               className="flex-1 py-2 rounded-xl border border-dashed border-white/5 hover:border-purple-500/20 hover:bg-purple-500/5 transition-all group flex flex-col items-center justify-center gap-1"
             >
               <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-all">
                 <Plus size={12} />
               </div>
               <span className="text-[8px] font-black uppercase tracking-widest text-slate-600 group-hover:text-purple-400 transition-all">Standard</span>
             </button>
             <button 
               onClick={() => addSlide('media-only')}
               className="flex-1 py-2 rounded-xl border border-dashed border-white/5 hover:border-purple-500/20 hover:bg-purple-500/5 transition-all group flex flex-col items-center justify-center gap-1"
             >
               <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-all">
                 <ImagePlus size={12} />
               </div>
               <span className="text-[8px] font-black uppercase tracking-widest text-slate-600 group-hover:text-purple-400 transition-all">Media</span>
             </button>
           </div>

           {/* SLIDE MANAGEMENT */}
           <div className="space-y-4">
             <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Slides ({slides.length})</label>
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-500">Editor</span>
             </div>
             
             <div className="space-y-4">
               {slides.map((slide, sIdx) => (
                <div key={slide.id} className="group relative p-3 pt-9 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all space-y-3">
                   {/* Slide Title - Moved to top absolute */}
                   <div className="absolute top-2.5 left-3 right-3 flex items-center gap-2">
                     <div className="w-5 h-5 rounded-lg bg-white/5 flex items-center justify-center text-[9px] font-black text-slate-500 shrink-0">
                       {sIdx + 1}
                     </div>
                     <input 
                       value={slide.title}
                       onChange={(e) => updateSlide(slide.id, { title: e.target.value })}
                       className="bg-transparent border-none text-[10px] font-black text-white focus:ring-0 p-0 flex-1 placeholder:text-slate-700"
                       placeholder={slide.type === 'media-only' ? "Caption (Optional)..." : "Slide Title..."}
                     />
                     <span className="text-[7px] font-black uppercase tracking-widest text-slate-600/50">
                       {slide.type === 'media-only' ? 'Media' : 'Slide'}
                     </span>
                   </div>
                   
                   {slide.type === 'standard' && (
                     <textarea 
                       value={slide.content}
                       onChange={(e) => updateSlide(slide.id, { content: e.target.value })}
                       className="w-full bg-black/30 border border-white/5 rounded-xl p-3 text-[10px] font-medium text-slate-300 outline-none focus:border-purple-500/50 transition-all resize-none leading-relaxed h-24 scrollbar-hide"
                       placeholder="- List items&#10;- Subtopics..."
                     />
                   )}

                   {slide.media.length === 0 && slide.type === 'media-only' && (
                     <div className="flex gap-2">
                       <button 
                         onClick={() => triggerImageUpload(slide.id)}
                         className="flex-1 py-8 rounded-xl border border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-purple-500/30 transition-all flex flex-col items-center justify-center gap-2 group"
                       >
                         <ImagePlus className="w-5 h-5 text-slate-500 group-hover:text-purple-400" />
                         <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 group-hover:text-purple-400">Add Image</span>
                       </button>
                       <button 
                         onClick={() => triggerVideoUpload(slide.id)}
                         className="flex-1 py-8 rounded-xl border border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-purple-500/30 transition-all flex flex-col items-center justify-center gap-2 group"
                       >
                         <Video className="w-5 h-5 text-slate-500 group-hover:text-purple-400" />
                         <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 group-hover:text-purple-400">Add Video</span>
                       </button>
                     </div>
                   )}

                   {slide.media.length > 0 && (
                     <div className="flex flex-wrap gap-3">
                       {slide.media.slice(0, slide.type === 'media-only' ? 1 : 2).map(item => (
                         <div key={item.id} className="relative w-28 aspect-video bg-white/5 rounded-xl overflow-hidden border border-white/10 group/img shadow-lg">
                            {item.type === 'image' ? (
                              <img src={item.url} className={`w-full h-full ${item.fit === 'contain' ? 'object-contain' : 'object-cover'} opacity-90`} alt="Preview" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-purple-500/10">
                                <Play size={16} className="text-purple-400 opacity-60" />
                              </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover/img:opacity-100 transition-all bg-black/70 backdrop-blur-[2px]">
                              <button 
                                onClick={() => removeMedia(slide.id, item.id)} 
                                className="w-8 h-8 flex items-center justify-center bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                title="Remove"
                              >
                                <Trash2 size={14}/>
                              </button>
                            </div>
                         </div>
                       ))}
                     </div>
                   )}

                   <div className="flex items-center justify-end gap-1 opacity-40 group-hover:opacity-100 transition-all border-t border-white/5 pt-2">
                      <div className="flex items-center gap-2 mr-auto">
                        <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                          <Palette size={10} className="text-slate-500" />
                          <input 
                            type="color" 
                            value={slide.titleColor || '#ffffff'} 
                            onChange={(e) => updateSlide(slide.id, { titleColor: e.target.value })}
                            className="w-4 h-4 rounded-md overflow-hidden bg-transparent border-none cursor-pointer p-0"
                            title="Title Color"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                          <Type size={10} className="text-slate-500" />
                          <input 
                            type="color" 
                            value={slide.contentColor || '#ffffff'} 
                            onChange={(e) => updateSlide(slide.id, { contentColor: e.target.value })}
                            className="w-4 h-4 rounded-md overflow-hidden bg-transparent border-none cursor-pointer p-0"
                            title="Body Color"
                          />
                        </div>
                      </div>
                      
                      <button onClick={() => triggerImageUpload(slide.id)} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors" title="Add Image">
                        <ImagePlus size={14}/>
                      </button>
                      <button onClick={() => triggerVideoUpload(slide.id)} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors" title="Add Video">
                        <Video size={14}/>
                      </button>
                      <button onClick={() => removeSlide(slide.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-500/10 transition-colors" title="Delete Slide">
                        <Trash2 size={14}/>
                      </button>
                   </div>
                </div>
               ))}
             </div>
           </div>

            {/* THEME SELECTOR */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Visual Theme</label>
                <div className="flex items-center gap-2">
                  <Zap size={12} className="text-orange-500" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-orange-500">Premium</span>
                </div>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-4 gap-2">
                {(Object.keys(THEME_STYLES) as ThemePreset[]).map(t => {
                  const s = THEME_STYLES[t];
                  const isSelected = theme === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`aspect-square rounded-xl transition-all relative overflow-hidden group ${
                        isSelected ? 'ring-2 ring-purple-500 ring-offset-4 ring-offset-[#111114] scale-90' : 'opacity-40 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: `#${s.bg}` }}
                    >
                      <div 
                        className="absolute inset-x-0 bottom-0 h-1/3"
                        style={{ backgroundColor: `#${s.accent}` }}
                      />
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                          <Check className="w-4 h-4" style={{ color: `#${s.titleColor}` }} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ALIGNMENT CONTROLS */}
            <div className="space-y-4 pt-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Text Alignment</label>
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                {(['left', 'center', 'right'] as Alignment[]).map(a => (
                  <button
                    key={a}
                    onClick={() => setAlignment(a)}
                    className={`flex-1 py-2 flex items-center justify-center rounded-lg transition-all ${
                      alignment === a ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    {a === 'left' && <AlignLeft size={16} />}
                    {a === 'center' && <AlignCenter size={16} />}
                    {a === 'right' && <AlignRight size={16} />}
                  </button>
                ))}
              </div>
            </div>
        </div>

        {/* BOTTOM PADDING FOR FAB */}
        <div className="h-24" />
      </div>

      {/* FOOTER ACTION BAR */}
      <div className="p-4 md:p-6 bg-black/40 border-t border-white/5 backdrop-blur-xl">
        {isGenerating && (
          <div className="mb-4 space-y-2">
            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
              <span className="text-orange-500 animate-pulse">Generating PPTX...</span>
              <span className="text-white">Processing</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 animate-progress transition-all duration-300 w-full" />
            </div>
          </div>
        )}

        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
        <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={handleVideoUpload} />
        <button 
          onClick={generatePptFromSlides} 
          disabled={isGenerating || slides.length === 0}
          className="w-full glass-button-primary text-white py-3 md:py-4 rounded-[20px] font-black text-[10px] md:text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-2.5 shadow-xl shadow-purple-500/20"
        >
          {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} 
          <span>{isGenerating ? 'EXPORTING...' : `EXPORT ${slides.length} SLIDES (PPTX)`}</span>
        </button>

        {/* Spacer for mobile navigation buttons */}
        <div className="h-20 md:hidden" />
      </div>
    </div>
  );
}

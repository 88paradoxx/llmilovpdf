import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ImageState } from '../../types';

import {
  Presentation,
  Type,
  Image as ImageIcon,
  Plus,
  Download,
  Loader2,
  X,
  FileCheck,
  Search,
  Check,
  Trash2,
  Zap,
  ShieldCheck,
  FileText,
  Layout,
  ArrowLeft,
  Home,
  AlignLeft,
  LayoutTemplate,
  AlignCenter,
  AlignRight,
  Minus,
  Palette,
  AlertTriangle
} from 'lucide-react';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

interface Props {
  image: ImageState;
  setIsProcessing: (v: boolean) => void;
  setLivePreview?: (node: React.ReactNode) => void;
  file?: File | null;
  onBack?: () => void;
}

interface SlideStyle {
  align: 'left' | 'center' | 'right';
  fontSize: number;
  textColor?: string;
  fontFace: string;
}

interface PdfSlide {
  id: string;
  title: string;
  content: string;
  originalPage: number;
  thumbnail: string;
  isOverflow?: boolean;
  style: SlideStyle;
}

const SlideEditor = ({
  slide,
  idx,
  currentSlideIndex,
  selectedTheme,
  onUpdate,
  onSelect,
  onUpdateStyle,
  onUpdateTitle,
  onSplit
}: {
  slide: PdfSlide,
  idx: number,
  currentSlideIndex: number,
  selectedTheme: any,
  onUpdate: (content: string) => void,
  onSelect: (index: number) => void,
  onUpdateStyle: (style: SlideStyle) => void,
  onUpdateTitle: (title: string) => void,
  onSplit: () => void
}) => {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [localTitle, setLocalTitle] = React.useState(slide.title);
  const [selectionFontSize, setSelectionFontSize] = React.useState("16");
  const MAX_WORD_WARNING = 90;

  // Initial Sync
  React.useEffect(() => {
    if (contentRef.current && contentRef.current.innerHTML !== slide.content) {
      // Only sync if significantly different to avoid cursor jumps
      // But for initial load it's needed.
      const isPlain = !slide.content.includes('<');
      if (isPlain) {
        contentRef.current.innerHTML = slide.content.replace(/\n/g, '<br/>');
      } else {
        contentRef.current.innerHTML = slide.content;
      }
    }
  }, [slide.id]); // Only on slide change

  React.useEffect(() => { setLocalTitle(slide.title); }, [slide.title]);

  const wordCount = slide.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length;
  const isTooLong = wordCount > MAX_WORD_WARNING;

  const updateStyle = (updates: Partial<SlideStyle>) => {
    onUpdateStyle({ ...slide.style, ...updates });
  };

  const execCmd = (cmd: string, val?: string) => {
    // Enable CSS mode for better formatting (spans instead of font tags)
    try {
      // @ts-ignore
      document.execCommand('styleWithCSS', false, 'true');
    } catch (e) {
      console.warn("styleWithCSS not supported", e);
    }

    document.execCommand(cmd, false, val);
    // Rely on onInput handlers to sync state
  };

  const changeFontSize = (delta: number) => {
    // 1-7 scale logic
    let currentVal = 3; // default medium
    try {
      const current = document.queryCommandValue('fontSize');
      if (current) {
        if (current.includes('px')) {
          // map px to 1-7 roughly
          const px = parseInt(current);
          if (px <= 10) currentVal = 1;
          else if (px <= 13) currentVal = 2;
          else if (px <= 16) currentVal = 3;
          else if (px <= 18) currentVal = 4;
          else if (px <= 24) currentVal = 5;
          else if (px <= 32) currentVal = 6;
          else currentVal = 7;
        } else {
          const parsed = parseInt(current);
          if (!isNaN(parsed)) currentVal = parsed;
        }
      }
    } catch (e) { console.log("Font size query error", e); }

    let next = currentVal + delta;
    if (next < 1) next = 1;
    if (next > 7) next = 7;

    execCmd('fontSize', next.toString());
    updateToolbarState();
  };

  const updateToolbarState = () => {
    try {
      const current = document.queryCommandValue('fontSize');
      if (current) {
        let px = "16";
        if (current.includes('px')) {
          px = parseInt(current).toString();
        } else {
          // Map 1-7 to px
          const map: { [key: string]: string } = { "1": "10", "2": "13", "3": "16", "4": "18", "5": "24", "6": "32", "7": "48" };
          px = map[current] || "16";
        }
        setSelectionFontSize(px);
      }
    } catch (e) { }
  };

  return (
    <div
      className={`group relative w-full aspect-[16/9] rounded-[32px] shadow-[0_40px_100px_rgba(0,0,0,0.6)] overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 transition-all ${currentSlideIndex === idx ? 'ring-4 ring-orange-500/30' : 'ring-1 ring-white/10'
        }`}
      style={{ backgroundColor: selectedTheme.bgColor }}
      onClick={() => onSelect(idx)}
      onKeyUp={updateToolbarState}
      onMouseUp={updateToolbarState}
    >
      {/* Slide Editing Toolbar */}
      <div className={`absolute top-6 left-6 right-6 z-40 flex items-center justify-between gap-4 transition-opacity duration-300 ${currentSlideIndex === idx ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'
        }`}>
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl p-1.5 rounded-xl border border-white/10 shadow-2xl">
          {/* Font Size - Selection Based */}
          <button onMouseDown={(e) => { e.preventDefault(); changeFontSize(-1); }} className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors"><Minus size={14} /></button>
          <span className="text-[10px] font-bold text-white w-8 text-center">{selectionFontSize}px</span>
          <button onMouseDown={(e) => { e.preventDefault(); changeFontSize(1); }} className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors"><Plus size={14} /></button>
          <div className="w-px h-4 bg-white/20 mx-1" />

          {/* Alignment */}
          <button onMouseDown={(e) => { e.preventDefault(); updateStyle({ align: 'left' }); }} className={`p-1.5 rounded-lg transition-colors ${slide.style.align === 'left' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'}`}><AlignLeft size={14} /></button>
          <button onMouseDown={(e) => { e.preventDefault(); updateStyle({ align: 'center' }); }} className={`p-1.5 rounded-lg transition-colors ${slide.style.align === 'center' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'}`}><AlignCenter size={14} /></button>
          <button onMouseDown={(e) => { e.preventDefault(); updateStyle({ align: 'right' }); }} className={`p-1.5 rounded-lg transition-colors ${slide.style.align === 'right' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'}`}><AlignRight size={14} /></button>
          <div className="w-px h-4 bg-white/20 mx-1" />

          {/* Color for SELECTION */}
          <div className="relative group/color">
            <button className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors flex items-center gap-2">
              <Palette size={14} />
            </button>
            <input
              type="color"
              onChange={(e) => execCmd('foreColor', e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              title="Change Text Color"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        <div className={`px-3 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest border ${isTooLong ? 'border-red-500/50 text-red-400' : 'border-white/10 text-white/40'
          }`}>
          {wordCount} Words
        </div>
      </div>

      {/* Persistent Overflow Warning */}
      {isTooLong && (
        <div className="absolute top-4 right-6 z-30 flex items-center gap-2 px-3 py-1.5 bg-red-500/90 text-white text-[10px] font-bold uppercase tracking-wide rounded-full shadow-lg backdrop-blur-sm animate-pulse pointer-events-none">
          <AlertTriangle size={12} fill="currentColor" className="text-white" />
          <AlertTriangle size={12} fill="currentColor" className="text-white" />
          <span>Limit Exceeded</span>
          <button
            onClick={(e) => { e.stopPropagation(); onSplit(); }}
            className="ml-2 bg-white text-red-500 px-1.5 py-0.5 rounded text-[8px] hover:bg-white/90 cursor-pointer pointer-events-auto"
          >
            Split Slide
          </button>
        </div>
      )}

      {/* Editor Content */}
      <div className="absolute inset-0 p-16 md:p-20 flex flex-col gap-6">
        {/* Title Editor - Rich Text */}
        <div
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => {
            setLocalTitle(e.currentTarget.textContent || '');
            onUpdateTitle(e.currentTarget.textContent || '');
          }}
          onBlur={() => onUpdateTitle(localTitle)}
          className="w-full bg-transparent border-none focus:ring-0 text-center font-bold placeholder:text-white/20 outline-none"
          style={{
            fontSize: '2em',
            color: selectedTheme.accentColor,
            fontFamily: "'Inter', sans-serif"
          }}
        >
          {slide.title || "Slide Title"}
        </div>

        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => onUpdate(e.currentTarget.innerHTML)}
          onBlur={() => { if (contentRef.current) onUpdate(contentRef.current.innerHTML); }}
          onClick={(e) => { e.stopPropagation(); }}
          className="w-full h-full bg-transparent border-none focus:ring-0 text-center font-medium leading-relaxed outline-none overflow-auto scrollbar-hide"
          style={{
            color: slide.style.textColor || selectedTheme.textColor,
            fontSize: `${slide.style.fontSize}px`,
            textAlign: slide.style.align,
            fontFamily: "'Inter', sans-serif"
          }}
          spellCheck={false}
        />
      </div>

      <div className="absolute bottom-6 left-6 text-[10px] font-black uppercase tracking-widest text-white/10 select-none">
        {idx + 1}
      </div>
    </div>
  );
};

interface Theme {
  id: string;
  name: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
}

const THEMES: Theme[] = [
  { id: 'standard', name: 'Standard', bgColor: '#ffffff', textColor: '#000000', accentColor: '#ea580c' },
  { id: 'dark', name: 'Midnight', bgColor: '#1e293b', textColor: '#f8fafc', accentColor: '#38bdf8' },
  { id: 'royal', name: 'Royal', bgColor: '#4c1d95', textColor: '#f5f3ff', accentColor: '#fcd34d' },
  { id: 'minimal', name: 'Minimal Grey', bgColor: '#f1f5f9', textColor: '#334155', accentColor: '#475569' },
  { id: 'vibrant', name: 'Vibrant', bgColor: '#fdf2f8', textColor: '#831843', accentColor: '#db2777' }
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export default function PdfToPptTool({ image, setIsProcessing, setLivePreview, file, onBack }: Props) {
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [presentationTitle, setPresentationTitle] = useState('My Presentation');
  const [selectedTheme, setSelectedTheme] = useState<Theme>(THEMES[0]);
  const [isConverting, setIsConverting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(!!file);
  const [progress, setProgress] = useState(0);
  const [slides, setSlides] = useState<PdfSlide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [reconstructionMode, setReconstructionMode] = useState<'flow' | 'exact'>('flow');
  const [hasProcessedPropFile, setHasProcessedPropFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Consolidate Live Preview
  useEffect(() => {
    if (!setLivePreview) return;

    if (slides.length === 0) {
      setLivePreview(
        <div className="w-full h-full bg-[#0d0d12] flex flex-col items-center justify-center text-slate-600">
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-4 border border-white/5 animate-pulse">
            <Presentation size={32} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em]">Awaiting PDF Source</p>
        </div>
      );
      return;
    }

    if (isAnalyzing) {
      setLivePreview(
        <div className="w-full h-full bg-[#0d0d12] flex flex-col items-center justify-center text-orange-500">
          <div className="relative mb-6">
            <Loader2 size={48} className="animate-spin opacity-20" />
            <Search size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em]">Analyzing Document</p>
        </div>
      );
      return;
    }

    setLivePreview(
      <div className="w-full h-full bg-[#0d0d12] overflow-y-auto p-4 md:p-12 pb-32 scrollbar-hide flex flex-col items-center gap-12">
        <div className="w-full max-w-4xl space-y-16">
          {slides.map((slide, idx) => (
            <SlideEditor
              key={slide.id}
              slide={slide}
              idx={idx}
              currentSlideIndex={currentSlideIndex}
              selectedTheme={selectedTheme}
              onUpdate={(newContent) => {
                setSlides(prev => prev.map((s, i) => i === idx ? { ...s, content: newContent } : s));
              }}
              onSelect={setCurrentSlideIndex}
              onUpdateStyle={(newStyle) => {
                setSlides(prev => prev.map((s, i) => i === idx ? { ...s, style: newStyle } : s));
              }}
              onUpdateTitle={(newTitle) => {
                setSlides(prev => prev.map((s, i) => i === idx ? { ...s, title: newTitle } : s));
              }}
              onSplit={() => {
                setSlides(prev => {
                  const current = prev[idx];
                  const newSlide = {
                    ...current,
                    id: `${current.id}-split-${Date.now()}`,
                    title: `${current.title} (Cont.)`,
                    content: "<!-- Continue content here -->",
                    isOverflow: true
                  };
                  const newList = [...prev];
                  newList.splice(idx + 1, 0, newSlide);
                  return newList;
                });
                setTimeout(() => setCurrentSlideIndex(idx + 1), 100);
              }}
            />
          ))}
        </div>
      </div>
    );
  }, [slides, selectedTheme, currentSlideIndex, setLivePreview, setSlides, isAnalyzing]);

  const analyzePdf = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    setIsProcessing(true);
    setPresentationTitle(file.name.replace(/\.pdf$/i, '').replace(/\s+/g, ' '));
    setProgress(0);

    try {
      const pdfjsModule = await import('pdfjs-dist');
      const pdfjsLib = pdfjsModule.default || pdfjsModule;
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker || `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        cMapUrl: 'https://unpkg.com/pdfjs-dist@5.4.449/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@5.4.449/standard_fonts/',
      });
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;

      const newSlides: PdfSlide[] = [];
      const MAX_WORDS = 80; // Adjusted capacity to ~80 words as requested

      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();

        // 1. Group items into logical lines based on Y-coordinate
        const items = textContent.items as any[];
        const linesMap = new Map<number, any[]>();

        items.forEach(item => {
          const y = Math.round(item.transform[5]); // Round to group close items
          if (!linesMap.has(y)) linesMap.set(y, []);
          linesMap.get(y)?.push(item);
        });

        // Sort lines from Top to Bottom
        const sortedY = Array.from(linesMap.keys()).sort((a, b) => b - a);

        const pageLines: string[] = [];

        sortedY.forEach(y => {
          // Sort items in the line from Left to Right
          const lineItems = linesMap.get(y)?.sort((a, b) => a.transform[4] - b.transform[4]);

          if (lineItems && lineItems.length > 0) {
            let lineStr = "";
            let lastX = -1;

            lineItems.forEach((item, idx) => {
              // Add spacing for tables/columns
              if (lastX !== -1) {
                const gap = item.transform[4] - lastX;
                const itemWidth = item.width || (item.str.length * item.transform[0] * 0.5); // Estimate if missing
                // If gap is significantly larger than a space, treat as table column
                if (gap > 15) {
                  lineStr += "    "; // 4 spaces for visual column separation
                } else if (gap > 5) {
                  lineStr += " ";
                }
              }
              lineStr += item.str;
              lastX = item.transform[4] + (item.width || 0);
            });

            if (lineStr.trim().length > 0) {
              pageLines.push(lineStr);
            }
          }
        });

        // Thumbnail for preview
        const viewport = page.getViewport({ scale: 0.4 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        if (context) {
          await page.render({ canvasContext: context, viewport, canvas }).promise;
        }
        const thumbnail = canvas.toDataURL('image/jpeg', 0.6);

        // 2. Pagination: Group Lines into Slides
        // We accumulate lines until word count exceeds limit
        let currentSlideLines: string[] = [];
        let currentWordCount = 0;
        let slideIdx = 0;

        pageLines.forEach((line, lineIdx) => {
          const wordsInLine = line.split(/\s+/).length;

          // Heuristic: If adding this line exceeds limit significantly, push current and start new
          // Exception: If current is empty, we must take it (even if huge)
          if (currentSlideLines.length > 0 && (currentWordCount + wordsInLine) > (MAX_WORDS + 10)) {
            // Push Slide
            newSlides.push({
              id: `${i}-${slideIdx}-${Date.now()}`,
              title: i === 1 && slideIdx === 0 ? presentationTitle : "",
              content: currentSlideLines.join('\n\n'),
              originalPage: i,
              thumbnail,
              isOverflow: slideIdx > 0,
              style: {
                fontSize: 18,
                align: 'center',
                // textColor: undefined, // Default to theme
                fontFace: 'Arial'
              }
            });

            // Reset
            currentSlideLines = [line];
            currentWordCount = wordsInLine;
            slideIdx++;
          } else {
            currentSlideLines.push(line);
            currentWordCount += wordsInLine;
          }
        });

        // Push remaining lines
        if (currentSlideLines.length > 0) {
          newSlides.push({
            id: `${i}-${slideIdx}-${Date.now()}`,
            title: i === 1 && slideIdx === 0 ? presentationTitle : "",
            content: currentSlideLines.join('<br/><br/>'),
            originalPage: i,
            thumbnail,
            isOverflow: slideIdx > 0,
            style: {
              fontSize: 18,
              align: 'center',
              // textColor: undefined
              fontFace: 'Arial'
            }
          });
        }

        setProgress(Math.round((i / numPages) * 100));
      }

      setSlides(newSlides);
      setPdfFiles(prev => [...prev, file]);
      setCurrentFileIndex(pdfFiles.length);
      await pdfDoc.destroy();
    } catch (err) {
      console.error("PDF analysis failed:", err);
      alert("Failed to analyze PDF. Please ensure it's not password protected.");
    } finally {
      setIsAnalyzing(false);
      setIsProcessing(false);
      setProgress(0);
    }
  }, [pdfFiles.length, setIsProcessing, presentationTitle]);

  useEffect(() => {
    if (file && !hasProcessedPropFile) {
      setHasProcessedPropFile(true);
      analyzePdf(file);
    }
  }, [file, analyzePdf, hasProcessedPropFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      analyzePdf(selectedFile);
    }
  };

  const removeSlide = (id: string) => {
    setSlides(prev => {
      const filtered = prev.filter(s => s.id !== id);
      // Adjust current slide index if necessary
      if (currentSlideIndex >= filtered.length && filtered.length > 0) {
        setCurrentSlideIndex(filtered.length - 1);
      }
      return filtered;
    });
  };

  const handleDownload = async () => {
    if (slides.length === 0) return;

    setIsConverting(true);
    setIsProcessing(true);
    setProgress(0);

    try {
      const { default: pptxgen } = await import('pptxgenjs');
      const pres = new pptxgen();

      pres.title = presentationTitle;
      pres.layout = 'LAYOUT_16x9';

      slides.forEach((slide, idx) => {
        const pptSlide = pres.addSlide();
        pptSlide.background = { fill: selectedTheme.bgColor };

        if (slide.title && slide.title.trim().length > 0) {
          // Parse title HTML if it has styling now
          const titleStyle = {
            fontSize: 32,
            color: selectedTheme.accentColor.replace('#', ''),
            bold: true,
            fontFace: slide.style?.fontFace || 'Arial',
            align: pres.AlignH.center
          };
          // We'll treat title as potentially rich now too, mostly for consistency, 
          // though usually titles are simple.
          // For now, keep title textual but allow basic color if users managed to style it? 
          // HTML content in title might be rare, let's just strip layout tags if any or cleaner:
          // If we made it contentEditable, we should render it properly.

          // Simple text is safer for titles in PPT usually, but let's try to parse
          // Warning: parseHtmlToPptTextObjects handles div/p/br.

          // For robustness, let's just dump the text content of title for now to avoid layout issues in PPT headers
          // until we have a 'parseTitle' helper.
          pptSlide.addText(slide.title.replace(/<[^>]*>/g, ''), {
            x: '5%',
            y: '8%',
            w: '90%',
            h: 1.0,
            ...titleStyle
          });
        }

        // Add Main Content
        const contentY = (slide.title && slide.title.trim().length > 0) ? '25%' : '10%';
        const contentH = (slide.title && slide.title.trim().length > 0) ? '65%' : '80%';

        const defaultStyle = {
          fontSize: slide.style?.fontSize || 18,
          color: (slide.style?.textColor || selectedTheme.textColor).replace('#', ''),
          fontFace: slide.style?.fontFace || 'Arial',
          align: slide.style?.align === 'left' ? pres.AlignH.left : slide.style?.align === 'right' ? pres.AlignH.right : pres.AlignH.center,
          valign: pres.AlignV.top
        };

        const textObjects = parseHtmlToPptTextObjects(slide.content, defaultStyle);

        pptSlide.addText(textObjects, {
          x: '8%',
          y: contentY,
          w: '84%',
          h: contentH,
          ...defaultStyle, // Base styles
          margin: 10,
          shrinkText: true,
          wrap: true
        });

        setProgress(Math.round(((idx + 1) / slides.length) * 100));
      });

      await pres.writeFile({ fileName: `${presentationTitle}.pptx` });
    } catch (err) {
      console.error("PPT generation failed:", err);
      alert("Failed to generate PowerPoint file. Structural synthesis error.");
    } finally {
      setIsConverting(false);
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0d0d12] text-white overflow-hidden" onClick={(e) => e.stopPropagation()}>
      <div className="flex-1 flex flex-col p-3 md:p-4 overflow-y-auto scrollbar-hide space-y-4 md:space-y-5">
        {/* Navigation & Title - Compact */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center border border-white/10 shadow-lg shadow-orange-600/20">
                <Presentation size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-black uppercase tracking-tight text-[13px] leading-none text-white">PDF to PPT</h3>
                <p className="text-[9px] font-bold uppercase opacity-60 mt-1.5 tracking-widest text-orange-400">Presentation Pro</p>
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

          {slides.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSlides([]);
                  setPdfFiles([]);
                  setCurrentFileIndex(0);
                  setCurrentSlideIndex(0);
                  setIsAnalyzing(false);
                  setIsProcessing(false);
                  setProgress(0);
                  setHasProcessedPropFile(true); // Prevent re-triggering from prop
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                    fileInputRef.current.click();
                  }
                }}
                className="flex-[3] py-2.5 px-4 rounded-xl bg-orange-600/10 hover:bg-orange-600/20 text-orange-500 transition-all border border-orange-500/10 flex items-center justify-center gap-2 group"
              >
                <Plus size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Upload New PDF</span>
              </button>
              <button
                onClick={() => {
                  setSlides([]);
                  setPdfFiles([]);
                  setCurrentFileIndex(0);
                  setCurrentSlideIndex(0);
                  setIsAnalyzing(false);
                  setIsProcessing(false);
                  setProgress(0);
                  setHasProcessedPropFile(true); // Prevent re-triggering from prop
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all border border-red-500/10 flex items-center justify-center gap-2 group"
                title="Clear All"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        {/* PDF Upload Area */}
        {slides.length === 0 && !isAnalyzing && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[32px] bg-white/[0.02] hover:bg-white/[0.05] hover:border-orange-500/30 transition-all cursor-pointer group min-h-[300px] my-4"
          >
            <div className="w-20 h-20 bg-orange-600/10 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-500 border border-orange-500/20">
              <Plus size={32} className="text-orange-500" />
            </div>
            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-white mb-2">Upload PDF File</h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Select a document to convert</p>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf"
              onChange={handleFileChange}
            />
          </div>
        )}

        {/* Loading/Analysis State */}
        {isAnalyzing && (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full animate-pulse" />
              <Loader2 size={48} className="text-orange-500 animate-spin relative z-10" />
            </div>
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white mb-4">Analyzing Document</h4>
            <div className="w-48 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-orange-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[9px] font-black text-orange-500 mt-3 tracking-widest">{progress}%</span>
          </div>
        )}

        {/* Editorial Information */}
        {slides.length > 0 && (
          <div className="p-6 rounded-3xl bg-orange-600/5 border border-orange-500/10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white">
                <Zap size={18} />
              </div>
              <h4 className="text-xs font-black uppercase tracking-widest text-orange-400">Editorial Workspace</h4>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
              All slides above are live-editable. We have optimized the capacity to 80 words per slide and strictly maintained the PDF's structural reading order.
            </p>
          </div>
        )}

        {/* Theme Selection */}
        {slides.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Select Theme</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme)}
                  className={`p-3 rounded-xl border transition-all text-left space-y-2 group ${selectedTheme.id === theme.id
                    ? 'bg-white/10 border-orange-500/50 shadow-lg shadow-orange-500/10'
                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }`}
                >
                  <div className="w-full h-8 rounded-md mb-2 overflow-hidden border border-white/10 flex">
                    <div className="w-2/3 h-full" style={{ backgroundColor: theme.bgColor }} />
                    <div className="w-1/3 h-full" style={{ backgroundColor: theme.accentColor }} />
                  </div>
                  <div className="text-[9px] font-black uppercase tracking-wider">{theme.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Slides List */}
        {slides.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Presentation Slides ({slides.length})</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {slides.map((slide, index) => (
                <div
                  key={slide.id}
                  onClick={() => setCurrentSlideIndex(index)}
                  className={`relative aspect-[16/9] rounded-lg border overflow-hidden group cursor-pointer transition-all ${currentSlideIndex === index
                    ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-lg'
                    : 'bg-white/5 border-white/5 hover:border-white/20'
                    }`}
                >
                  <img src={slide.thumbnail} alt={`Slide ${index + 1}`} className={`w-full h-full object-cover transition-opacity ${currentSlideIndex === index ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`} />
                  <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-black transition-colors ${currentSlideIndex === index ? 'bg-orange-500 text-white' : 'bg-black/60 text-white/60'}`}>
                    {index + 1}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSlide(slide.id);
                    }}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500/80 hover:bg-red-500 text-white rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove Slide"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 mt-4">
          <button
            onClick={handleDownload}
            disabled={isConverting || slides.length === 0}
            className="w-full py-3.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 group"
          >
            {isConverting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span className="text-[11px] font-black uppercase tracking-widest">Converting {progress}%</span>
              </>
            ) : (
              <>
                <Download size={16} className="group-hover:translate-y-0.5 transition-transform" />
                <span className="text-[11px] font-black uppercase tracking-widest">Download PPTX</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


// Helper for Html Parsing
const rgbToHex = (rgb: string) => {
  const result = rgb.match(/\d+/g);
  if (!result) return "#000000";
  return ("#" + ((1 << 24) + (parseInt(result[0]) << 16) + (parseInt(result[1]) << 8) + parseInt(result[2])).toString(16).slice(1)).toUpperCase();
};

function parseHtmlToPptTextObjects(html: string, baseStyle: any) {
  const temp = document.createElement('div');
  temp.innerHTML = html;

  const tokens: any[] = [];

  function traverse(node: Node, currentStyle: any) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent) {
        tokens.push({ text: node.textContent, options: { ...currentStyle } });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      let newStyle = { ...currentStyle };

      // Styles
      if (el.style.fontWeight === 'bold' || el.tagName === 'B' || el.tagName === 'STRONG') newStyle.bold = true;
      if (el.style.fontStyle === 'italic' || el.tagName === 'I' || el.tagName === 'EM') newStyle.italic = true;
      if (el.style.textDecoration === 'underline' || el.tagName === 'U') newStyle.underline = true;
      if (el.style.color) newStyle.color = rgbToHex(el.style.color).replace('#', '');

      // Font Size from <font size="..."> or style
      // Mapping common browser sizes (1-7) to PT approx
      if (el.tagName === 'FONT' && el.getAttribute('size')) {
        const sizeAttr = parseInt(el.getAttribute('size') || "3");
        const sizeMap: { [key: number]: number } = { 1: 10, 2: 13, 3: 16, 4: 18, 5: 24, 6: 32, 7: 48 };
        newStyle.fontSize = sizeMap[sizeAttr] || 16;
      }
      if (el.style.fontSize) {
        // handle '18px'
        const px = parseInt(el.style.fontSize);
        if (!isNaN(px)) {
          newStyle.fontSize = px;
        } else {
          // handle keywords
          const keyMap: { [key: string]: number } = {
            "xx-small": 10, "x-small": 11, "small": 13, "medium": 16,
            "large": 18, "x-large": 24, "xx-large": 32, "xxx-large": 48,
            "smaller": 13, "larger": 18
          };
          if (keyMap[el.style.fontSize]) newStyle.fontSize = keyMap[el.style.fontSize];
        }
      }

      const isBlock = ['DIV', 'P', 'H1', 'H2', 'BR', 'LI'].includes(el.tagName);

      if (el.tagName === 'BR') {
        if (tokens.length > 0) tokens[tokens.length - 1].options.breakLine = true;
        return;
      }

      el.childNodes.forEach(child => traverse(child, newStyle));

      if (isBlock) {
        if (tokens.length > 0) tokens[tokens.length - 1].options.breakLine = true;
      }
    }
  }

  traverse(temp, baseStyle);
  return tokens.length > 0 ? tokens : [{ text: ' ', options: baseStyle }];
}

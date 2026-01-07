import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Moon,
  Sun,
  FileEdit,
  Presentation,
  Files,
  FileSpreadsheet,
  Share2,
  ShieldAlert,
  Sparkles,
  Layers
} from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import { ToolId } from './types';
import { TOOLS } from './constants';
import Footer from './components/Footer';
import FAQSection from './components/FAQSection';
import { storeFile } from './services/fileHandoff';

const MAX_PDF_SIZE = 100 * 1024 * 1024; // 100 MB

// Constants for ToolGridBox (copied and simplified from original)
const ToolGridBox = ({ title, tools, variant }: { title: string, tools: any[], variant: 'pdf' | 'image' }) => (
  <div className="w-full max-w-7xl mx-auto space-y-8">
    <div className="flex items-center gap-4 ml-6">
      <div className="w-[6px] h-6 rounded-full shadow-2xl bg-emerald-500 shadow-emerald-500/80"></div>
      <h2 className="text-xs md:text-sm font-black uppercase tracking-[0.4em] text-emerald-600 dark:text-emerald-400/90 emerald-title-glow">{title}</h2>
    </div>
    <div className="neon-box p-6 md:p-14 neon-emerald">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-8">
        {tools.map(t => {
          // Determine the HREF for this tool
          const href = (function () {
            const map: Partial<Record<ToolId, string>> = {
              pdf_editor: '/pdf-editor.html',
              pdf_to_word: '/pdf-to-word.html',
              pdf_splitter: '/pdf-split.html',
              pdf_watermark: '/pdf-watermark.html',
              pdf: '/image-to-pdf.html',
              pdf_resizer: '/pdf-compress.html',
              pdf_merge: '/pdf-merge.html',
              text_to_pdf: '/text-to-pdf.html',
              text_to_ppt: '/text-to-ppt.html',
              pdf_to_ppt: '/pdf-to-ppt.html',
              pdf_to_excel: '/pdf-to-excel.html',
              resize: '/image-resize.html',
              edit: '/image-editor.html',
              bg_remover: '/background-remover.html',
              compress: '/image-compress.html',
              filters: '/filters.html',
              converter: '/image-convert.html',
              watermark: '/watermark.html',
              text: '/text.html',
              drawing: '/drawing.html',
              social: '/social.html',
              bulk: '/bulk.html',
              home: '/',
            };
            return map[t.id] ?? '#';
          })();

          const content = (
            <>
              <div className={`icon-container-glow w-16 h-16 md:w-20 md:h-20 ${t.color} rounded-2xl md:rounded-[30px] flex items-center justify-center text-white mb-8 transition-all duration-500 relative shadow-2xl`}>
                {React.cloneElement(t.icon as React.ReactElement<any>, { size: 30, className: "drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]" })}
              </div>
              <span className="text-[10px] md:text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 group-hover/tile:text-purple-600 dark:group-hover/tile:text-white transition-colors tracking-widest text-center leading-tight">
                {t.name}
              </span>
            </>
          );

          return (
            <a
              key={t.id}
              href={href}
              className="tool-tile-modern aspect-[1/1.1] rounded-[44px] flex flex-col items-center justify-center p-8 group/tile"
            >
              {content}
            </a>
          );
        })}
      </div>
    </div>
  </div>
);

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const universalInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  const toolIdToPath = (toolId: ToolId) => {
    const map: Partial<Record<ToolId, string>> = {
      pdf_editor: '/pdf-editor.html',
      pdf_to_word: '/pdf-to-word.html',
      pdf_splitter: '/pdf-split.html',
      pdf_watermark: '/pdf-watermark.html',
      pdf: '/image-to-pdf.html',
      pdf_resizer: '/pdf-compress.html',
      pdf_merge: '/pdf-merge.html',
      text_to_pdf: '/text-to-pdf.html',
      text_to_ppt: '/text-to-ppt.html',
      pdf_to_ppt: '/pdf-to-ppt.html',
      pdf_to_excel: '/pdf-to-excel.html',
      resize: '/image-resize.html',
      edit: '/image-editor.html',
      bg_remover: '/background-remover.html',
      compress: '/image-compress.html',
      filters: '/filters.html',
      converter: '/image-convert.html',
      watermark: '/watermark.html',
      text: '/text.html',
      drawing: '/drawing.html',
      social: '/social.html',
      bulk: '/bulk.html',
      home: '/',
      about: '/about.html',
      privacy: '/privacy.html',
      terms: '/terms.html',
      contact: '/contact.html',
    };
    return map[toolId] ?? '#';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    const file = files[0];
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    try {
      await storeFile(file);
    } catch (error) {
      console.error("Failed to store file for handoff:", error);
      // Proceed anyway, user will just have to re-upload on the next page
    }

    if (isPdf) {
      if (file.size > MAX_PDF_SIZE) {
        alert("The PDF file is too large. Max 100MB.");
        return;
      }
      window.location.href = '/pdf-editor.html';
      return;
    }

    // Is Image
    window.location.href = '/image-editor.html';
  };

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const pdfTools = TOOLS.filter(t => ['pdf_editor', 'pdf_to_word', 'pdf_splitter', 'pdf_watermark', 'pdf', 'pdf_resizer', 'pdf_merge', 'text_to_pdf', 'text_to_ppt', 'pdf_to_ppt', 'pdf_to_excel'].includes(t.id));
  const imageTools = TOOLS.filter(t => ['resize', 'edit', 'bg_remover', 'compress', 'filters', 'converter', 'watermark', 'text', 'drawing', 'social', 'bulk'].includes(t.id));

  return (
    <div className="min-h-[100dvh] w-full flex flex-col font-sans antialiased overflow-x-hidden transition-colors duration-500 relative bg-[radial-gradient(circle_at_top,_#2e1065_0%,_#0f172a_50%,_black_100%)]" style={{ background: 'radial-gradient(circle at top left, #2e1065 0%, #0f172a 50%, #000000 100%)' }}>
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-500/5 dark:bg-fuchsia-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

      <header className="glass-toolbar px-4 md:px-6 py-2 md:py-2.5 flex items-center justify-between z-[60] shrink-0">
        <div className="flex items-center gap-2 md:gap-3 cursor-pointer group" onClick={() => window.location.href = '/'}>
          <div className="w-7 h-7 md:w-8 md:h-8 bg-purple-500/90 rounded-xl flex items-center justify-center text-white font-black text-base md:text-lg group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/40">i</div>
          <div className="flex flex-col">
            <span className="text-sm md:text-base font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none">ilovpdf</span>
            <span className="hidden sm:inline-block text-[7px] font-bold text-purple-500 dark:text-purple-400 uppercase tracking-[0.2em] mt-0.5">Free Online Studio</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-4">
          <button aria-label="Toggle Theme" onClick={toggleTheme} className="p-2 text-slate-300 hover:text-purple-300 dark:text-slate-400 dark:hover:text-purple-300 rounded-lg transition-all">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden relative min-h-0 z-10">
        <div className="flex-1 overflow-y-auto relative scrollbar-hide">
          <input
            type="file"
            className="hidden"
            ref={universalInputRef}
            onChange={handleFileUpload}
            accept="application/pdf,image/*"
          />

          <section className="px-6 py-12 md:py-24 text-center space-y-20 max-w-7xl mx-auto">
            <div className="space-y-16">
              <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-tight md:leading-none bg-gradient-to-br from-slate-900 via-slate-600 to-purple-600 dark:from-white dark:via-purple-100 dark:to-slate-500 bg-clip-text text-transparent drop-shadow-sm dark:drop-shadow-2xl animate-gradient-x">FREE ONLINE PDF & IMAGE EDITOR</h1>

              <div
                onClick={() => universalInputRef.current?.click()}
                onKeyDown={(e) => e.key === 'Enter' && universalInputRef.current?.click()}
                className="mx-auto w-full max-w-lg neon-box neon-emerald p-8 md:p-12 flex flex-col items-center justify-center cursor-pointer group transition-all duration-700 relative overflow-hidden"
                aria-label="Upload file"
                role="button"
                tabIndex={0}
              >
                <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <Upload size={36} className="text-emerald-500 mb-6 group-hover:-translate-y-2 transition-transform duration-700 drop-shadow-[0_0_15px_#10B981]" />
                <span className="text-xl md:text-3xl font-black uppercase bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-emerald-100 dark:to-white bg-clip-text text-transparent tracking-tighter">Start Processing</span>
                <p className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-3 opacity-60">100% Client-Side • PDF • JPG • PNG • DOCX • PPTX</p>
              </div>
            </div>

            <div className="space-y-24 max-w-7xl mx-auto">
              <ToolGridBox title="Document & PDF Solutions" tools={pdfTools} variant="pdf" />
              <ToolGridBox title="Advanced Photo & Design Studio" tools={imageTools} variant="image" />
            </div>

            {/* Contextual Internal Linking for SEO */}
            <div className="pt-16 -mb-8 text-center">
              <p className="text-[14px] text-slate-500 dark:text-slate-400 opacity-60">
                Popular tools:
                <a href="/pdf-editor.html" className="mx-1 hover:text-purple-600 transition-colors">PDF Editor</a>,
                <a href="/pdf-to-word.html" className="mx-1 hover:text-purple-600 transition-colors">PDF to Word</a>,
                <a href="/pdf-compress.html" className="mx-1 hover:text-purple-600 transition-colors">Compress PDF</a>,
                <a href="/pdf-merge.html" className="mx-1 hover:text-purple-600 transition-colors">Merge PDF</a>,
                <a href="/pdf-split.html" className="mx-1 hover:text-purple-600 transition-colors">Split PDF</a>,
                <a href="/pdf-to-excel.html" className="mx-1 hover:text-purple-600 transition-colors">PDF to Excel</a>,
                <a href="/image-to-pdf.html" className="mx-1 hover:text-purple-600 transition-colors">Image to PDF</a>,
                <a href="/image-resize.html" className="mx-1 hover:text-purple-600 transition-colors">Resize Image</a>,
                <a href="/background-remover.html" className="mx-1 hover:text-purple-600 transition-colors">Background Remover</a>,
                <a href="/image-compress.html" className="mx-1 hover:text-purple-600 transition-colors">Compress Image</a>
              </p>
            </div>

            {/* Advanced Features List */}
            <div className="text-center pt-20 md:pt-32 space-y-3">
              <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight bg-gradient-to-br from-slate-900 via-slate-500 to-slate-700 dark:from-white dark:via-purple-300 dark:to-purple-100 bg-clip-text text-transparent">Advanced Workspace Features</h2>
              <p className="text-slate-500 dark:text-slate-400 uppercase font-bold text-[9px] md:text-[10px] tracking-[0.4em]">High Performance Privacy-First Computing</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 max-w-7xl mx-auto pt-16 text-left pb-20">
              {[
                { id: 'pdf_editor' as ToolId, icon: <FileEdit className="text-purple-600" />, title: "Native Structural PDF Editor", desc: "The first true in-browser native PDF editor. Modify existing text, reflow content, and add structural elements without rasterizing pages or losing document metadata.", variant: 'pdf' as const },
                { id: 'pdf_to_word' as ToolId, icon: <Files className="text-blue-600" />, title: "Structural PDF to Word Conversion", desc: "Transform fixed PDF layouts into editable Word documents. Our structural engine analyzes paragraphs and alignment for high-fidelity conversion entirely in your browser.", variant: 'pdf' as const },
                { id: 'bg_remover' as ToolId, icon: <Sparkles className="text-fuchsia-600" />, title: "AI-Powered Background Eraser", desc: "Automatically remove image background using client-side AI. Isolate subjects for professional profile shots or social media kits without uploading photos to the cloud.", variant: 'image' as const },
                { id: 'pdf_to_ppt' as ToolId, icon: <Presentation className="text-orange-600" />, title: "PDF to PowerPoint Converter", desc: "Transform static documents into editable decks with our pdf to pptx converter. Ideal for turning meeting notes or reports into high-fidelity presentation slides instantly.", variant: 'pdf' as const },
                { id: 'pdf_to_excel' as ToolId, icon: <FileSpreadsheet className="text-emerald-600" />, title: "PDF to Excel Spreadsheet", desc: "Extract tables and structured data from PDF files into editable Excel spreadsheets. Our engine preserves cell formatting and data types for seamless analysis.", variant: 'pdf' as const },
                { id: 'bulk' as ToolId, icon: <Layers className="text-amber-600" />, title: "Bulk Image Processing Studio", desc: "Process up to 100 images at once. Resize, compress, or convert entire galleries in a single batch, then download everything in one secure ZIP archive.", variant: 'image' as const },
                { id: 'social' as ToolId, icon: <Share2 className="text-pink-600" />, title: "Social Media Asset Optimizer", desc: "Instantly create content for Instagram, YouTube, and LinkedIn. One-click presets ensure your banners and thumbnails are optimized for maximum platform engagement.", variant: 'image' as const },
                { id: 'pdf_watermark' as ToolId, icon: <ShieldAlert className="text-red-600" />, title: "Secure PDF Protection & Masking", desc: "Add professional watermarks or mask sensitive data in PDF documents. Perfect for securing personal identification or proprietary corporate reports before sharing.", variant: 'pdf' as const }
              ].map((item, idx) => (
                <a href={toolIdToPath(item.id)} key={idx} className={`neon-box flex flex-col sm:flex-row gap-6 md:gap-10 items-start group cursor-pointer p-8 md:p-14 transition-all duration-700 hover:-translate-y-2 ${item.variant === 'pdf' ? 'neon-pdf' : 'neon-image'}`}>
                  <div className="mt-1 w-14 h-14 md:w-20 md:h-20 bg-slate-100 dark:bg-white/5 rounded-[28px] flex items-center justify-center shadow-md dark:shadow-2xl border border-slate-200 dark:border-white/5 shrink-0 group-hover:scale-110 transition-transform">
                    {React.cloneElement(item.icon, { size: 28 })}
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-lg md:text-3xl font-black uppercase tracking-tight bg-gradient-to-r from-slate-900 via-slate-600 to-purple-600 dark:from-white dark:via-slate-300 dark:to-purple-400 bg-clip-text text-transparent leading-none group-hover:text-purple-600 transition-colors">{item.title}</h3>
                    <p className="text-xs md:text-base text-slate-500 dark:text-slate-400 font-medium leading-relaxed opacity-70">{item.desc}</p>
                  </div>
                </a>
              ))}
            </div>
          </section>

          <FAQSection />
          <Footer getToolPath={toolIdToPath} />
        </div>
      </main>
      <Analytics />
    </div>
  );
}

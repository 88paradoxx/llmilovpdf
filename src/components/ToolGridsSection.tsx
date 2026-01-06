import React from 'react';
import { TOOLS } from '../constants';
import { getToolPath } from '../utils/routes';
import { ToolId } from '../types';
import { FileEdit, Files, Sparkles, Presentation, FileSpreadsheet, Layers, Share2, ShieldAlert } from 'lucide-react';

// ToolGridBox Component
const ToolGridBox = ({ title, tools, variant }: { title: string, tools: any[], variant: 'pdf' | 'image' }) => (
    <div className="w-full max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-4 ml-6">
            <div className={`w-[6px] h-6 rounded-full shadow-2xl ${variant === 'pdf' ? 'bg-[#5551FF] shadow-[#5551FF]/80' : 'bg-purple-500 shadow-purple-500/80'}`}></div>
            <h2 className={`text-xs md:text-sm font-black uppercase tracking-[0.4em] ${variant === 'pdf' ? 'text-purple-600 dark:text-purple-400/90 pdf-title-glow' : 'text-purple-600 dark:text-purple-400/90 image-title-glow'}`}>{title}</h2>
        </div>
        <div className={`neon-box p-6 md:p-14 ${variant === 'pdf' ? 'neon-pdf' : 'neon-image'}`}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-8">
                {tools.map(t => {
                    const href = getToolPath(t.id);

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

// Advanced Features List - extracted to keep App.tsx clean
const AdvancedFeatures = () => (
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
            <a href={getToolPath(item.id)} key={idx} className={`neon-box flex flex-col sm:flex-row gap-6 md:gap-10 items-start group cursor-pointer p-8 md:p-14 transition-all duration-700 hover:-translate-y-2 ${item.variant === 'pdf' ? 'neon-pdf' : 'neon-image'}`}>
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
);

export default function ToolGridsSection() {
    const pdfTools = TOOLS.filter(t => ['pdf_editor', 'pdf_to_word', 'pdf_splitter', 'pdf_watermark', 'pdf', 'pdf_resizer', 'pdf_merge', 'text_to_pdf', 'text_to_ppt', 'pdf_to_ppt', 'pdf_to_excel'].includes(t.id));
    const imageTools = TOOLS.filter(t => ['resize', 'edit', 'bg_remover', 'compress', 'filters', 'converter', 'watermark', 'text', 'drawing', 'social', 'bulk'].includes(t.id));

    return (
        <>
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

            <AdvancedFeatures />
        </>
    );
}

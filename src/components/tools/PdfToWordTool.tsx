import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ImageState } from '../../types';
import { formatSize } from '../../services/imageService';
import {
  Files,
  Plus,
  Download,
  X,
  Loader2,
  Zap,
  Type,
  AlignLeft,
  FileType,
  FileSearch,
  LayoutTemplate,
  CheckCircle2,
  FileText,
  Search,
  ShieldCheck,
  Zap as ZapIcon,
  ArrowLeft,
  Home
} from 'lucide-react';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Helper to get the actual library object
const getPdfLib = () => {
  return pdfjsLib;
};

interface Props {
  image: ImageState;
  setIsProcessing: (v: boolean) => void;
  setLivePreview?: (node: React.ReactNode) => void;
  file?: File | null;
  onBack?: () => void;
}

export default function PdfToWordTool({ image, setIsProcessing, setLivePreview, file, onBack }: Props) {
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [outputTitle, setOutputTitle] = useState('Converted_Document');
  const [totalPages, setTotalPages] = useState(0);
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [reconstructionMode, setReconstructionMode] = useState<'flow' | 'exact'>('flow');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const isAnalyzingRef = useRef(false);
  const [viewMode, setViewMode] = useState<'list' | 'add'>('list');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzePdf = useCallback(async (file: File) => {
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      alert("Please upload a valid PDF file.");
      return;
    }

    if (isAnalyzingRef.current) return;
    isAnalyzingRef.current = true;

    console.log("analyzePdf: Starting for", file.name);

    // Reset states
    setIsAnalyzing(true);
    setIsProcessing(true);
    setProgress(0);
    setThumbnails([]);
    setOutputTitle(file.name.replace(/\.pdf$/i, '').replace(/\s+/g, '_'));

    const timeoutId = setTimeout(() => {
      console.error("analyzePdf: Timeout reached");
      setIsAnalyzing(false);
      setIsProcessing(false);
    }, 30000);

    try {
      const lib = getPdfLib();
      console.log("analyzePdf: Library loaded", !!lib);

      if (!lib.GlobalWorkerOptions.workerSrc) {
        console.log("analyzePdf: Setting worker source");
        // Use local worker with CDN fallback
        lib.GlobalWorkerOptions.workerSrc = pdfWorker || `https://unpkg.com/pdfjs-dist@${lib.version}/build/pdf.worker.min.mjs`;
      }

      const arrayBuffer = await file.arrayBuffer();
      console.log("analyzePdf: ArrayBuffer size", arrayBuffer.byteLength);

      const loadingTask = lib.getDocument({
        data: new Uint8Array(arrayBuffer),
        cMapUrl: 'https://unpkg.com/pdfjs-dist@5.4.449/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@5.4.449/standard_fonts/',
      });

      loadingTask.onProgress = (p: any) => {
        if (p.total > 0) {
          console.log(`analyzePdf: Loading progress ${Math.round((p.loaded / p.total) * 100)}%`);
        }
      };

      const pdfDoc = await loadingTask.promise;
      clearTimeout(timeoutId);
      console.log("analyzePdf: Document loaded, pages:", pdfDoc.numPages);

      setTotalPages(pdfDoc.numPages);

      const generatedThumbnails: string[] = [];
      const maxPreviewPages = Math.min(pdfDoc.numPages, 10);

      for (let i = 1; i <= maxPreviewPages; i++) {
        console.log(`analyzePdf: Rendering page ${i}`);
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 1.0 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const targetWidth = 1500;
        const scale = targetWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        if (ctx) {
          await page.render({ canvasContext: ctx, viewport: scaledViewport, canvas }).promise;
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          generatedThumbnails.push(dataUrl);
          setThumbnails([...generatedThumbnails]);
        }
        setProgress(Math.round((i / maxPreviewPages) * 100));
      }

      await pdfDoc.destroy();
      console.log("analyzePdf: Finished successfully");
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("analyzePdf: Error:", err);
      alert("Failed to analyze PDF. Please check if the file is valid.");
    } finally {
      setIsAnalyzing(false);
      isAnalyzingRef.current = false;
      setIsProcessing(false);
      setProgress(0);
    }
  }, []);

  useEffect(() => {
    const enqueued = (window as any)._enqueuedPdf || file;
    if (enqueued && pdfFiles.length === 0) {
      setPdfFiles([enqueued]);
      analyzePdf(enqueued);
      if ((window as any)._enqueuedPdf) (window as any)._enqueuedPdf = null;
    }
  }, [analyzePdf, pdfFiles.length, file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = Array.from(e.target.files || []) as File[];
    if (uploaded.length === 0) return;
    const newFiles = [...pdfFiles, ...uploaded];
    setPdfFiles(newFiles);
    setViewMode('list');
    if (pdfFiles.length === 0) {
      analyzePdf(uploaded[0]);
      setCurrentFileIndex(0);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    const newFiles = pdfFiles.filter((_, i) => i !== index);
    setPdfFiles(newFiles);
    if (newFiles.length === 0) {
      setThumbnails([]);
      setTotalPages(0);
    } else if (index === currentFileIndex) {
      const nextIndex = Math.max(0, index - 1);
      setCurrentFileIndex(nextIndex);
      analyzePdf(newFiles[nextIndex]);
    } else if (index < currentFileIndex) {
      setCurrentFileIndex(currentFileIndex - 1);
    }
  };

  useEffect(() => {
    if (!setLivePreview) return;

    if (pdfFiles.length === 0) {
      setLivePreview(
        <div className="w-full h-full bg-[#0d0d12] flex flex-col items-center justify-center text-slate-600">
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-4 border border-white/5 animate-pulse">
            <FileText size={32} />
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
      <div className="w-full h-full bg-[#0d0d12] overflow-y-auto p-4 md:p-12 scrollbar-hide flex flex-col items-center gap-12">
        <div className="w-full max-w-3xl space-y-12">
          {/* Single Column Page Layout */}
          <div className="flex flex-col gap-12">
            {thumbnails.map((thumb, idx) => (
              <div
                key={idx}
                className="group relative w-full aspect-[1/1.414] bg-white rounded-2xl shadow-[0_40px_80px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-500 border border-white/5 transition-all hover:scale-[1.01]"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="absolute top-6 left-6 z-20 px-3 py-1.5 bg-black/60 backdrop-blur-md text-white text-[9px] font-black rounded-lg uppercase tracking-widest border border-white/10 shadow-xl">
                  Page {idx + 1}
                </div>
                <img src={thumb} className="w-full h-full object-cover select-none" alt={`Page ${idx + 1}`} draggable={false} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>

          <div className="h-20 shrink-0" />
        </div>
      </div>
    );
  }, [pdfFiles, isAnalyzing, thumbnails, totalPages, setLivePreview]);

  const handleConvert = async () => {
    if (pdfFiles.length === 0) return;
    setIsProcessing(true);
    setIsLibraryLoading(true);
    setProgress(0);

    try {
      const lib = getPdfLib();
      if (!lib.GlobalWorkerOptions.workerSrc) {
        lib.GlobalWorkerOptions.workerSrc = pdfWorker || `https://unpkg.com/pdfjs-dist@${lib.version}/build/pdf.worker.min.mjs`;
      }

      const docx = await import('docx');
      const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, SectionType } = docx;

      const allFilesSections: any[] = [];

      for (let fIdx = 0; fIdx < pdfFiles.length; fIdx++) {
        const file = pdfFiles[fIdx];
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = lib.getDocument({
          data: new Uint8Array(arrayBuffer),
          cMapUrl: 'https://unpkg.com/pdfjs-dist@5.4.449/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@5.4.449/standard_fonts/',
        });
        const pdfDoc = await loadingTask.promise;

        const currentTitle = file.name.replace(/\.pdf$/i, '').replace(/\s+/g, '_');

        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const overallProgress = ((fIdx * 100) / pdfFiles.length) + ((i / pdfDoc.numPages) * (100 / pdfFiles.length));
          setProgress(Math.round(overallProgress * 0.95));

          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: 1.0 });
          const textContent = await page.getTextContent();

          const children: any[] = [];
          const items = textContent.items as any[];

          if (items.length > 0) {
            // Group items into rows by Y coordinate
            const sortedItems = [...items].sort((a, b) => b.transform[5] - a.transform[5]);
            const rows: any[][] = [];
            let currentRow: any[] = [];
            let lastY = -1;

            sortedItems.forEach((item) => {
              const y = item.transform[5];
              const fontSize = Math.abs(item.transform[0] || item.transform[3] || 10);
              const tolerance = fontSize * 0.4;

              if (lastY !== -1 && Math.abs(lastY - y) > tolerance) {
                rows.push(currentRow.sort((a, b) => a.transform[4] - b.transform[4]));
                currentRow = [];
              }
              currentRow.push(item);
              lastY = y;
            });
            if (currentRow.length > 0) rows.push(currentRow.sort((a, b) => a.transform[4] - b.transform[4]));

            // Detect Tables: A sequence of rows with similar column structures
            let idx = 0;
            while (idx < rows.length) {
              const startIdx = idx;
              let tableRows: any[][] = [];

              // Find consecutive rows that look like a table
              while (idx < rows.length) {
                const row = rows[idx];
                if (row.length < 2) break;

                if (tableRows.length > 0) {
                  const prevRow = tableRows[tableRows.length - 1];
                  // If col count is extremely different, it's not the same table
                  if (Math.abs(prevRow.length - row.length) > 2) break;
                }

                tableRows.push(row);
                idx++;
              }

              if (tableRows.length >= 2) {
                // Find max columns to avoid corrupting Word (which likes consistent cell counts)
                const maxCols = Math.max(...tableRows.map(r => r.length));

                const table = new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: tableRows.map(row => {
                    const rowChildren = row.map(cellItem => new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({
                          text: cellItem.str || " ",
                          size: Math.round(Math.abs(cellItem.transform[0] || 10) * 2),
                          bold: (cellItem.fontName || "").toLowerCase().includes('bold'),
                          font: "Calibri"
                        })],
                        alignment: AlignmentType.CENTER
                      })],
                      borders: reconstructionMode === 'exact' ? {
                        top: { style: BorderStyle.NONE },
                        bottom: { style: BorderStyle.NONE },
                        left: { style: BorderStyle.NONE },
                        right: { style: BorderStyle.NONE },
                      } : {
                        top: { style: BorderStyle.SINGLE, size: 1 },
                        bottom: { style: BorderStyle.SINGLE, size: 1 },
                        left: { style: BorderStyle.SINGLE, size: 1 },
                        right: { style: BorderStyle.SINGLE, size: 1 },
                      }
                    }));

                    // Pad row if it has fewer cells than maxCols
                    while (rowChildren.length < maxCols) {
                      rowChildren.push(new TableCell({ children: [new Paragraph("")] }));
                    }

                    return new TableRow({ children: rowChildren });
                  })
                });
                children.push(table);
                children.push(new Paragraph({ text: "" }));
              } else {
                const row = rows[startIdx];
                const paraChildren: any[] = [];
                let rowLastX = -1;

                row.forEach((item) => {
                  const x = item.transform[4];
                  const fontSize = Math.abs(item.transform[0] || 10);
                  const fontName = (item.fontName || "").toLowerCase();

                  if (rowLastX !== -1 && x - rowLastX > fontSize * 1.5) {
                    paraChildren.push(new TextRun({ text: "\t" }));
                  } else if (rowLastX !== -1 && x - rowLastX > fontSize * 0.2) {
                    paraChildren.push(new TextRun({ text: " " }));
                  }

                  paraChildren.push(new TextRun({
                    text: item.str || "",
                    size: Math.round(fontSize * 2),
                    bold: fontName.includes('bold') || fontName.includes('black'),
                    italics: fontName.includes('italic') || fontName.includes('oblique'),
                    font: "Calibri"
                  }));
                  rowLastX = x + (item.width || item.str.length * fontSize * 0.5);
                });

                if (paraChildren.length > 0) {
                  // Safeguard: Clamp left indent to avoid Word crash (indents > 0)
                  const leftX = row[0].transform[4];
                  const indentValue = Math.max(0, Math.round(leftX * 20));

                  children.push(new Paragraph({
                    children: paraChildren,
                    spacing: { before: 80, after: 80 },
                    indent: reconstructionMode === 'exact' ? { left: indentValue } : undefined
                  }));
                }
                idx = startIdx + 1;
              }
            }
          }

          if (children.length === 0) {
            children.push(new Paragraph({ text: "" }));
          }

          allFilesSections.push({
            properties: {
              type: i === 1 && fIdx === 0 ? undefined : SectionType.NEXT_PAGE
            },
            children
          });
        }

        await pdfDoc.destroy();
      }

      const doc = new Document({
        title: outputTitle,
        sections: allFilesSections
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${outputTitle}.docx`;
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        URL.revokeObjectURL(url);
        if (link.parentNode) document.body.removeChild(link);
      }, 10000);

      setProgress(100);
    } catch (err: any) {
      console.error("Conversion error:", err);
      alert(`Synthesis failed: ${err.message || 'Unknown error'}. Error mapping structural tree.`);
    } finally {
      setIsProcessing(false);
      setIsLibraryLoading(false);
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
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center border border-white/10 shadow-lg shadow-blue-600/20">
                <FileText size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-black uppercase tracking-tight text-[13px] leading-none text-white">PDF to Word</h3>
                <p className="text-[9px] font-bold uppercase opacity-60 mt-1.5 tracking-widest text-blue-400">Document Suite</p>
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

        {/* Action Button */}
        <button
          onClick={handleConvert}
          disabled={isLibraryLoading || thumbnails.length === 0}
          className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 group mt-2"
        >
          {isLibraryLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span className="text-[11px] font-black uppercase tracking-widest">Converting {progress}%</span>
            </>
          ) : (
            <>
              <Download size={16} className="group-hover:translate-y-0.5 transition-transform" />
              <span className="text-[11px] font-black uppercase tracking-widest">Download Word</span>
            </>
          )}
        </button>

        {/* Reconstruction Mode */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Reconstruction Mode</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setReconstructionMode('flow')}
              className={`p-3 rounded-xl border transition-all text-left space-y-1 ${reconstructionMode === 'flow'
                ? 'bg-blue-600/10 border-blue-500/50'
                : 'bg-white/5 border-white/5 hover:bg-white/10'
                }`}
            >
              <AlignLeft size={14} className={reconstructionMode === 'flow' ? 'text-blue-400' : 'text-white/40'} />
              <div className="text-[9px] font-black uppercase tracking-wider">Flow</div>
            </button>
            <button
              onClick={() => setReconstructionMode('exact')}
              className={`p-3 rounded-xl border transition-all text-left space-y-1 ${reconstructionMode === 'exact'
                ? 'bg-blue-600/10 border-blue-500/50'
                : 'bg-white/5 border-white/5 hover:bg-white/10'
                }`}
            >
              <LayoutTemplate size={14} className={reconstructionMode === 'exact' ? 'text-blue-400' : 'text-white/40'} />
              <div className="text-[9px] font-black uppercase tracking-wider">Exact</div>
            </button>
          </div>
        </div>

        {/* Thumbnails Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Page Previews ({totalPages})</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {thumbnails.map((thumb, idx) => (
              <div key={idx} className="relative aspect-[3/4] bg-white/5 rounded-lg border border-white/5 overflow-hidden group">
                <img src={thumb} alt={`Page ${idx + 1}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-black text-white/60">
                  {idx + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

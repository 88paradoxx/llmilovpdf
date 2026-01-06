
import React, { useState, useRef, useEffect } from 'react';
import { ImageState } from '../../types';
import { formatSize } from '../../services/imageService';
import { Combine, Plus, Trash2, Download, ChevronUp, ChevronDown, Files, Loader2, X } from 'lucide-react';

interface Props {
  image: ImageState;
  setIsProcessing: (v: boolean) => void;
}

const MAX_FILES = 10;

export default function PdfMergeTool({ setIsProcessing }: Props) {
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = Array.from(e.target.files || []) as File[];
    const validPdfs = uploaded.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (validPdfs.length + pdfFiles.length > MAX_FILES) {
      alert(`Max ${MAX_FILES} files.`);
      return;
    }
    setPdfFiles(prev => [...prev, ...validPdfs]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => setPdfFiles(prev => prev.filter((_, i) => i !== index));

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const newFiles = [...pdfFiles];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= pdfFiles.length) return;
    [newFiles[index], newFiles[target]] = [newFiles[target], newFiles[index]];
    setPdfFiles(newFiles);
  };

  const mergePdfs = async () => {
    if (pdfFiles.length < 2) return;
    setIsProcessing(true); setIsMerging(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const mergedPdf = await PDFDocument.create();
      for (const file of pdfFiles) {
        const ab = await file.arrayBuffer();
        const pdf = await PDFDocument.load(ab);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((p: any) => mergedPdf.addPage(p));
      }
      const bytes = await mergedPdf.save();
      const blob = new Blob([bytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = `merged-${Date.now()}.pdf`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } catch (err) { alert("Merge failed."); }
    finally { setIsProcessing(false); setIsMerging(false); }
  };

  return (
    <div className="flex flex-col h-full space-y-3 animate-in fade-in duration-300">
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-100 dark:border-slate-800 p-4 rounded-xl text-center hover:bg-violet-50 dark:hover:bg-violet-950/20 cursor-pointer group shrink-0"
      >
        <Plus size={20} className="text-violet-500 mx-auto mb-1" />
        <span className="text-[9px] font-black uppercase text-slate-400">Append Documents</span>
      </div>
      <input type="file" ref={fileInputRef} onChange={handlePdfUpload} className="hidden" multiple accept=".pdf" />

      <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 space-y-1.5 scrollbar-hide">
        {pdfFiles.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{pdfFiles.length} In Queue</span>
            </div>
            {pdfFiles.map((file, i) => (
              <div key={i} className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-50 dark:border-slate-800 group transition-all">
                <div className="w-6 h-6 bg-violet-600 text-white rounded-md flex items-center justify-center text-[8px] font-black shrink-0">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[8px] font-black uppercase text-slate-700 dark:text-slate-200 truncate leading-none">{file.name}</p>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => moveFile(i, 'up')} disabled={i === 0} className="p-0.5 text-slate-400 hover:text-violet-600 disabled:opacity-10"><ChevronUp size={12} /></button>
                  <button onClick={() => moveFile(i, 'down')} disabled={i === pdfFiles.length - 1} className="p-0.5 text-slate-400 hover:text-violet-600 disabled:opacity-10"><ChevronDown size={12} /></button>
                  <button onClick={() => removeFile(i)} className="p-0.5 text-slate-300 hover:text-red-500"><X size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button 
        onClick={mergePdfs} 
        disabled={pdfFiles.length < 2 || isMerging}
        className="bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg active:scale-95 disabled:opacity-20"
      >
        {isMerging ? <Loader2 size={14} className="animate-spin inline mr-2" /> : <Combine size={14} className="inline mr-2" />}
        Merge PDF
      </button>
    </div>
  );
}


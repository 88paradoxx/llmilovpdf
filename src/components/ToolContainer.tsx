
import React from 'react';
import { ToolId, ImageState, DrawingPath, DrawingSettings, TextLayer } from '../types';
import { TOOLS } from '../constants';
import { Home, LogOut } from 'lucide-react';
import ResizeTool from './tools/ResizeTool';
import EditTool from './tools/EditTool';
import CompressTool from './tools/CompressTool';
import FilterTool from './tools/FilterTool';
import ConverterTool from './tools/ConverterTool';
import WatermarkTool from './tools/WatermarkTool';
import SocialTool from './tools/SocialTool';
import DrawingTool from './tools/DrawingTool';
import TextTool from './tools/TextTool';
import BulkTool from './tools/BulkTool';
import PdfTool from './tools/PdfTool';
import PdfResizerTool from './tools/PdfResizerTool';
import PdfMergeTool from './tools/PdfMergeTool';
import PdfToWordTool from './tools/PdfToWordTool';
import TextToPdfTool from './tools/TextToPdfTool';
import TextToPptTool from './tools/TextToPptTool';
import PdfWatermarkTool from './tools/PdfWatermarkTool';
import BackgroundRemoverTool from './tools/BackgroundRemoverTool';
import PdfEditorTool from './tools/PdfEditorTool';
import PdfSplitterTool from './tools/PdfSplitterTool';
import PdfToPptTool from './tools/PdfToPptTool';

interface Props {
  activeTool: ToolId;
  setActiveTool?: (id: ToolId) => void;
  handleExitToHome?: () => void;
  image: ImageState | null;
  updateImage: (url: string, updates?: Partial<ImageState>, skipHistory?: boolean) => void;
  setIsProcessing: (v: boolean) => void;
  cropState?: { x: number, y: number, w: number, h: number };
  setCropState?: (c: { x: number, y: number, w: number, h: number }) => void;
  onCropModeToggle?: (active: boolean) => void;

  // Drawing Props
  drawingPaths?: DrawingPath[];
  setPaths?: (paths: DrawingPath[] | ((prev: DrawingPath[]) => DrawingPath[])) => void;
  drawingSettings?: DrawingSettings;
  setDrawingSettings?: (s: DrawingSettings) => void;

  // Text Props
  textLayers?: TextLayer[];
  setTextLayers?: (l: TextLayer[] | ((prev: TextLayer[]) => TextLayer[])) => void;
  editingTextId?: string | null;
  setEditingTextId?: (id: string | null) => void;

  // Action Callbacks
  onCommit?: () => Promise<ImageState | null>;
  onDownload?: () => void;

  // New Live Preview Prop
  setLivePreview?: (node: React.ReactNode) => void;

  // Global Viewport Props
  zoom?: number;
  setZoom?: (z: number | ((prev: number) => number)) => void;

  // PDF SubTool Props
  pdfSubTool?: 'draw' | 'text' | 'layers' | 'sync' | 'shapes' | 'eraser';
  setPdfSubTool?: (mode: 'draw' | 'text' | 'layers' | 'sync' | 'shapes' | 'eraser') => void;

  // File Prop
  file?: File | null;
}

export default function ToolContainer({
  activeTool,
  setActiveTool,
  handleExitToHome,
  image,
  updateImage,
  setIsProcessing,
  cropState,
  setCropState,
  onCropModeToggle,
  drawingPaths,
  setPaths,
  drawingSettings,
  setDrawingSettings,
  textLayers,
  setTextLayers,
  editingTextId,
  setEditingTextId,
  onCommit,
  onDownload,
  setLivePreview,
  zoom,
  setZoom,
  pdfSubTool,
  setPdfSubTool,
  file
}: Props) {
  if (!image && !['text_to_pdf', 'text_to_ppt', 'bulk'].includes(activeTool)) {
    return null;
  }

  // Handle Home/Menu State within the Workspace
  if (activeTool === 'home') {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-500 pointer-events-auto p-4 md:p-6 bg-slate-900/40 h-full overflow-y-auto">
        <button
          onClick={handleExitToHome}
          className="w-full flex items-center gap-4 p-4 bg-slate-900 dark:bg-purple-600 rounded-2xl text-white shadow-xl hover:bg-black dark:hover:bg-purple-700 transition-all active:scale-95 group"
        >
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Home size={20} />
          </div>
          <div className="text-left">
            <span className="block text-[10px] font-black uppercase tracking-widest">Return to Home</span>
            <span className="text-[7px] font-bold opacity-60 uppercase tracking-widest">Close active project</span>
          </div>
        </button>

        <div className="h-px bg-slate-100 dark:bg-slate-800 mx-2 my-2"></div>

        <div className="grid grid-cols-2 gap-3 pb-8">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTool?.(t.id)}
              className="flex flex-col items-center p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl hover:border-purple-500 hover:shadow-lg transition-all group active:scale-95"
            >
              <div className={`w-10 h-10 ${t.color} rounded-xl flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform shadow-md`}>
                {t.icon}
              </div>
              <span className="text-[9px] font-black uppercase text-slate-800 dark:text-slate-200 tracking-tight text-center leading-none">
                {t.name}
              </span>
            </button>
          ))}
        </div>

        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-800">
          <p className="text-[9px] font-bold text-purple-900 dark:text-purple-400 uppercase tracking-widest text-center">
            Pro Studio Mode Active
          </p>
        </div>
      </div>
    );
  }

  switch (activeTool) {
    case 'pdf_editor':
      return (
        <div className="w-full h-full pointer-events-auto">
          <PdfEditorTool
            image={image!}
            updateImage={updateImage}
            setIsProcessing={setIsProcessing}
            drawingPaths={drawingPaths!}
            setPaths={setPaths!}
            drawingSettings={drawingSettings!}
            setDrawingSettings={setDrawingSettings!}
            textLayers={textLayers!}
            setTextLayers={setTextLayers!}
            onCommit={onCommit as any}
            onDownload={onDownload!}
            zoom={zoom!}
            setZoom={setZoom!}
            pdfSubTool={pdfSubTool!}
            setPdfSubTool={setPdfSubTool!}
            setLivePreview={setLivePreview!}
            file={file}
            onBack={handleExitToHome}
          />
        </div>
      );
    case 'pdf_splitter':
      return <div className="w-full h-full pointer-events-auto"><PdfSplitterTool image={image!} setIsProcessing={setIsProcessing} setLivePreview={setLivePreview} file={file} onBack={handleExitToHome!} /></div>;
    case 'pdf_to_ppt':
      return <div className="w-full h-full pointer-events-auto"><PdfToPptTool image={image!} setIsProcessing={setIsProcessing} setLivePreview={setLivePreview} file={file} onBack={handleExitToHome!} /></div>;
    case 'pdf_to_word':
      return <div className="w-full h-full pointer-events-auto"><PdfToWordTool image={image!} setIsProcessing={setIsProcessing} setLivePreview={setLivePreview} file={file} onBack={handleExitToHome!} /></div>;
    case 'resize':
      return <ResizeTool image={image!} updateImage={updateImage} setIsProcessing={setIsProcessing} onDownload={onDownload!} onBack={handleExitToHome!} />;
    case 'edit':
      return (
        <EditTool
          image={image!}
          updateImage={updateImage}
          setIsProcessing={setIsProcessing}
          cropState={cropState!}
          setCropState={setCropState!}
          onCropModeToggle={onCropModeToggle!}
          onDownload={onDownload!}
          onBack={handleExitToHome!}
        />
      );
    case 'bg_remover':
      return (
        <BackgroundRemoverTool
          image={image!}
          updateImage={updateImage}
          setIsProcessing={setIsProcessing}
          onDownload={onDownload!}
          onBack={handleExitToHome!}
        />
      );
    case 'compress':
      return <CompressTool image={image!} updateImage={updateImage} setIsProcessing={setIsProcessing} onDownload={onDownload!} onBack={handleExitToHome!} />;
    case 'filters':
      return <FilterTool image={image!} updateImage={updateImage} setIsProcessing={setIsProcessing} onDownload={onDownload!} onBack={handleExitToHome!} />;
    case 'converter':
      return <ConverterTool image={image!} updateImage={updateImage} setIsProcessing={setIsProcessing} onDownload={onDownload!} onBack={handleExitToHome!} />;
    case 'watermark':
      return <WatermarkTool image={image!} updateImage={updateImage} setIsProcessing={setIsProcessing} onDownload={onDownload!} onBack={handleExitToHome!} />;
    case 'social':
      return <SocialTool image={image!} updateImage={updateImage} setIsProcessing={setIsProcessing} onDownload={onDownload!} onBack={handleExitToHome!} />;
    case 'drawing':
      return (
        <DrawingTool
          paths={drawingPaths!}
          setPaths={setPaths!}
          settings={drawingSettings!}
          setSettings={setDrawingSettings!}
          textLayers={textLayers!}
          setTextLayers={setTextLayers!}
          activeTool={(pdfSubTool as any) || 'draw'}
          setActiveTool={(setPdfSubTool as any) || (() => { })}
          onCommit={onCommit as any}
          onDownload={onDownload!}
          onBack={handleExitToHome}
        />
      );
    case 'text':
      return (
        <TextTool
          image={image!}
          layers={textLayers!}
          setLayers={setTextLayers!}
          onCommit={onCommit as any}
          onDownload={onDownload!}
          onBack={handleExitToHome!}
          editingId={editingTextId!}
          setEditingId={setEditingTextId!}
        />
      );
    case 'bulk':
      return <BulkTool image={image!} updateImage={updateImage} setIsProcessing={setIsProcessing} onBack={handleExitToHome} />;
    case 'pdf':
      return <div className="w-full h-full pointer-events-auto"><PdfTool image={image!} setIsProcessing={setIsProcessing} setLivePreview={setLivePreview} file={file} onBack={handleExitToHome!} /></div>;
    case 'pdf_resizer':
      return <div className="w-full h-full pointer-events-auto"><PdfResizerTool image={image!} setIsProcessing={setIsProcessing} updateImage={updateImage} setLivePreview={setLivePreview} file={file} onBack={handleExitToHome!} /></div>;
    case 'pdf_merge':
      return <div className="w-full h-full pointer-events-auto"><PdfMergeTool image={image!} setIsProcessing={setIsProcessing} setLivePreview={setLivePreview} file={file} onBack={handleExitToHome!} /></div>;
    case 'text_to_pdf':
      return <div className="w-full h-full pointer-events-auto"><TextToPdfTool setIsProcessing={setIsProcessing} setLivePreview={setLivePreview} onBack={handleExitToHome!} /></div>;
    case 'text_to_ppt':
      return <div className="w-full h-full pointer-events-auto"><TextToPptTool setIsProcessing={setIsProcessing} setLivePreview={setLivePreview} onBack={handleExitToHome!} /></div>;
    case 'pdf_watermark':
      return <div className="w-full h-full pointer-events-auto"><PdfWatermarkTool image={image!} setIsProcessing={setIsProcessing} updateImage={updateImage} setLivePreview={setLivePreview} file={file} onBack={handleExitToHome!} /></div>;
    default:
      return null;
  }
}


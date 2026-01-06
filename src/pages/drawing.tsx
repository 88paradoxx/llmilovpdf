import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import DrawingTool from '../components/tools/DrawingTool';
import StudioCanvas from '../components/canvas/StudioCanvas';
import { ImageState, DrawingPath, DrawingSettings, TextLayer } from '../types';
import { bakeDrawingToImage } from '../services/imageService';

function DrawingPage() {
  const [image, setImage] = useState<ImageState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<'draw' | 'text'>('draw');
  const [settings, setSettings] = useState<DrawingSettings>({
    mode: 'brush',
    brushSize: 5,
    color: '#ef4444',
    opacity: 1,
    style: 'solid'
  });

  useEffect(() => {
    const input = document.getElementById('static-image-upload') as HTMLInputElement;
    const section = document.getElementById('static-upload-section');

    const onChange = (e: Event) => {
      const t = e.target as HTMLInputElement;
      const f = t.files?.[0];
      if (!f) return;

      const isImage = f.type.startsWith('image/');
      if (!isImage) { alert('Please select an image'); return; }
      if (f.size > 50 * 1024 * 1024) { alert('Max 50MB'); return; }

      const url = URL.createObjectURL(f);
      const img = new Image();
      img.onload = () => {
        const initial: ImageState = {
          originalUrl: url,
          currentUrl: url,
          width: img.width,
          height: img.height,
          format: f.type,
          size: f.size,
          name: f.name
        };
        setImage(initial);
        if (section) section.style.display = 'none';
      };
      img.src = url;
    };

    input?.addEventListener('change', onChange);
    return () => input?.removeEventListener('change', onChange);
  }, []);

  const updateImage = (url: string, updates?: Partial<ImageState>) => {
    setImage(prev => prev ? { ...prev, currentUrl: url, ...updates } : null);
  };

  const handleDownload = () => {
    if (!image) return;
    const link = document.createElement('a');
    link.href = image.currentUrl;
    link.download = `drawing-annotation-${image.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCommit = async () => {
    if (!image) return;
    setIsProcessing(true);
    try {
      const bakedUrl = await bakeDrawingToImage(image.originalUrl, paths, textLayers);
      updateImage(bakedUrl);
      setPaths([]); // Clear paths after baking
      setTextLayers([]); // Clear text layers after baking
      setActiveTool('draw');
    } catch (error) {
      console.error('Baking failed:', error);
      alert('Failed to save drawing to image');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!image) return null;

  return (
    <div className="w-full h-screen bg-[#0d0d12] flex flex-col">
      <div className="flex-1 flex flex-row overflow-hidden">
        {/* Sidebar Controls */}
        <aside className="flex w-48 md:w-64 lg:w-80 h-full bg-[#0d0d12] border-r border-white/5 overflow-hidden shrink-0 transition-all duration-300 z-[70]">
          <DrawingTool
            paths={paths}
            setPaths={setPaths}
            settings={settings}
            setSettings={setSettings}
            textLayers={textLayers}
            setTextLayers={setTextLayers}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            onCommit={handleCommit}
            onDownload={handleDownload}
            onBack={() => {
              const section = document.getElementById('static-upload-section');
              if (section) section.style.display = 'block';
              setImage(null);
            }}
          />
        </aside>

        {/* Main Preview Area */}
        <div className="flex flex-1 relative bg-[#08080c] flex-col items-center justify-center p-2 md:p-4 overflow-hidden z-[50]">
          <StudioCanvas
            imageUrl={image.currentUrl}
            drawingPaths={paths}
            setDrawingPaths={setPaths}
            drawingSettings={settings}
            textLayers={textLayers}
            setTextLayers={setTextLayers}
            isDrawingActive={activeTool === 'draw'}
            isTextActive={activeTool === 'text'}
            zoom={1}
            editingTextId={editingTextId}
            setEditingTextId={setEditingTextId}
          />
          {isProcessing && (
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center pointer-events-none z-50">
              <div className="text-xs font-black uppercase tracking-[0.3em] text-white">Processing</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<DrawingPage />);
}

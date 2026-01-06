import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import ToolContainer from '../components/ToolContainer';
import CropOverlay from '../components/CropOverlay';
import InlineTextEditor from '../components/InlineTextEditor';
import { ImageState } from '../types';
import { retrieveFile, clearFile } from '../services/fileHandoff';

function ImageEditorPage() {
  const [image, setImage] = useState<ImageState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTool, setActiveTool] = useState<any>('edit');
  const [isCropMode, setIsCropMode] = useState(false);
  const [cropState, setCropState] = useState({ x: 10, y: 10, w: 80, h: 80 });

  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initFile = async () => {
      try {
        const f = await retrieveFile();
        if (f) {
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
            const section = document.getElementById('static-upload-section');
            if (section) section.style.display = 'none';
            clearFile();
          };
          img.src = url;
        }
      } catch (e) {
        console.error("Failed to retrieve file", e);
      }
    };
    initFile();
  }, []);

  useEffect(() => {
    const input = document.getElementById('static-image-upload') as HTMLInputElement;
    const section = document.getElementById('static-upload-section');

    const onChange = (e: Event) => {
      const t = e.target as HTMLInputElement;
      const f = t.files?.[0];
      if (!f) return;

      const isImage = f.type.startsWith('image/');
      if (!isImage) { alert('Please select an image'); return; }
      if (f.size > 100 * 1024 * 1024) { alert('Max 100MB'); return; }

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

  // Bake layers into image for download/commit
  const bakeLayers = async () => {
    if (!image) return null;
    setIsProcessing(true);

    try {
      const canvas = document.createElement('canvas');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise(r => { img.onload = r; img.src = image.currentUrl; });

      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // 1. Draw Base Image
      ctx.drawImage(img, 0, 0);

      const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, image.format, 1.0));
      return blob;
    } catch (e) {
      console.error(e);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommit = async () => {
    const blob = await bakeLayers();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const newState: ImageState = { ...image!, currentUrl: url, size: blob.size };
      updateImage(url, { currentUrl: url, size: blob.size });
      return newState;
    }
    return null;
  };

  const handleDownload = async () => {
    const blob = await bakeLayers();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `edited-${image?.name || 'image'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!image) return null;

  return (
    <div className="w-full h-screen bg-[#0d0d12] flex flex-col">
      <div className="flex-1 flex flex-row overflow-hidden">
        {/* Sidebar Controls */}
        <aside className="flex w-48 md:w-64 lg:w-80 h-full bg-[#0d0d12] border-r border-white/5 overflow-hidden shrink-0 transition-all duration-300 z-[70]">
          <ToolContainer
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            image={image}
            updateImage={updateImage}
            setIsProcessing={setIsProcessing}

            // Edit Props
            cropState={cropState}
            setCropState={setCropState}
            onCropModeToggle={setIsCropMode}

            onCommit={handleCommit}
            onDownload={handleDownload}
            handleExitToHome={() => {
              const section = document.getElementById('static-upload-section');
              if (section) section.style.display = 'block';
              setImage(null);
            }}
          />
        </aside>

        {/* Main Preview Area */}
        <div className="flex flex-1 relative bg-[#08080c] flex-col items-center justify-center p-4 md:p-8 overflow-hidden">
          <div className="relative inline-flex max-w-full max-h-full" ref={containerRef}>
            {/* Base Image */}
            <img
              src={image.currentUrl}
              alt="Preview"
              className="max-w-full max-h-[calc(100vh-120px)] object-contain shadow-2xl rounded-lg pointer-events-none select-none border border-white/5"
            />

            {isCropMode && (
              <CropOverlay crop={cropState} setCrop={setCropState} />
            )}
          </div>

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

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <ImageEditorPage />
    </React.StrictMode>
  );
}



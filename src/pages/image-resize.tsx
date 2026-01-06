import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import ResizeTool from '../components/tools/ResizeTool';
import { ImageState } from '../types';

function ImageResizePage() {
  const [image, setImage] = useState<ImageState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
    link.download = `resized-${image.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!image) return null;

  return (
    <div className="w-full h-screen bg-[#060608] flex overflow-hidden font-inter">
      <div className="flex-1 flex flex-row overflow-hidden">
        {/* Sidebar Controls */}
        <aside className="flex w-48 md:w-64 lg:w-80 h-full bg-[#0a0a0c] border-r border-white/5 overflow-hidden shrink-0 transition-all duration-300 z-[70] shadow-2xl">
          <ResizeTool
            image={image}
            updateImage={updateImage}
            setIsProcessing={setIsProcessing}
            onDownload={handleDownload}
            onBack={() => {
              const section = document.getElementById('static-upload-section');
              if (section) section.style.display = 'block';
              setImage(null);
            }}
          />
        </aside>

        {/* Main Preview Area */}
        <div className="flex flex-1 relative bg-[#040406] flex-col items-center justify-center p-3 md:p-6 overflow-hidden">
          <div className="relative group max-w-full max-h-full">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-[#0a0a0c] rounded-xl overflow-hidden shadow-2xl border border-white/5">
              <img
                src={image.currentUrl}
                alt="Preview"
                className="max-w-full max-h-[calc(100vh-100px)] object-contain"
              />
            </div>
          </div>

          {isProcessing && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center pointer-events-none z-[100] animate-in fade-in duration-500">
              <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-6" />
              <div className="text-sm font-black uppercase tracking-[0.4em] text-white animate-pulse">Baking Optimization</div>
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
      <ImageResizePage />
    </React.StrictMode>
  );
}



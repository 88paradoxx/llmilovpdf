import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import ImageToPdfTool from '../components/tools/ImageToPdfTool'; // Assuming this component exists or will be created
import { ImageState } from '../types';

function ImageToPdfPage() {
  const [image, setImage] = useState<ImageState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [livePreview, setLivePreview] = useState<React.ReactNode | null>(null);

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

  if (!image) return null;

  return (
    <div className="w-full h-screen bg-[#0d0d12] flex flex-col">
      <div className="flex-1 relative overflow-hidden flex flex-row">
        {/* Sidebar Controls */}
        <aside className="flex w-48 md:w-64 lg:w-80 h-full bg-[#0d0d12] border-r border-white/5 overflow-hidden shrink-0 transition-all duration-500 z-30">
          <ImageToPdfTool
            image={image}
            setIsProcessing={setIsProcessing}
            setLivePreview={setLivePreview}
            onBack={() => {
              const section = document.getElementById('static-upload-section');
              if (section) section.style.display = 'block';
              setImage(null);
            }}
          />
        </aside>

        {/* Main Preview Area */}
        <main className="flex flex-1 relative bg-[#08080c] flex flex-col overflow-hidden">
          {livePreview}

          {isProcessing && (
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center pointer-events-none z-50">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-xs font-black uppercase tracking-[0.3em] text-white">Converting to PDF</div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <ImageToPdfPage />
    </React.StrictMode>
  );
}



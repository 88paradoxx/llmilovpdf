import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import PdfResizerTool from '../components/tools/PdfResizerTool';
import { ImageState } from '../types';

function PdfCompressPage() {
  const [image, setImage] = useState<ImageState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [livePreview, setLivePreview] = useState<React.ReactNode | null>(null);

  useEffect(() => {
    const input = document.getElementById('static-pdf-upload') as HTMLInputElement;
    const section = document.getElementById('static-upload-section');
    const onChange = (e: Event) => {
      const t = e.target as HTMLInputElement;
      const f = t.files?.[0];
      if (!f) return;
      const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) { alert('Please select a PDF'); return; }
      if (f.size > 50 * 1024 * 1024) { alert('Max 50MB'); return; }
      const initial: ImageState = { originalUrl: '', currentUrl: '', width: 0, height: 0, format: 'application/pdf', size: f.size, name: f.name };
      setImage(initial);
      setFile(f);
      (window as any)._enqueuedPdf = f;
      if (section) section.style.display = 'none';
    };
    input?.addEventListener('change', onChange);
    return () => input?.removeEventListener('change', onChange);
  }, []);

  if (!file) return null;

  return (
    <div className="w-full h-screen bg-[#0d0d12] flex flex-col">
      <div className="flex-1 relative overflow-hidden flex flex-row">
        {/* Sidebar Controls */}
        <aside className="flex w-48 md:w-64 lg:w-80 h-full bg-[#0d0d12] border-r border-white/5 overflow-hidden shrink-0 z-[70]">
          <PdfResizerTool
            image={image!}
            setIsProcessing={setIsProcessing}
            updateImage={(url, updates) => setImage(prev => ({ ...(prev as ImageState), currentUrl: url, ...(updates || {}) }))}
            setLivePreview={setLivePreview}
            file={file}
            onBack={() => {
              const section = document.getElementById('static-upload-section');
              if (section) section.style.display = 'block';
              setFile(null);
            }}
          />
        </aside>

        {/* Main Preview Area */}
        <main className="flex-1 relative bg-[#08080c] flex flex-col overflow-hidden z-[50]">
          {livePreview}
          {isProcessing && (
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center pointer-events-none z-50">
              <div className="text-xs font-black uppercase tracking-[0.3em] text-white">Processing</div>
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
      <PdfCompressPage />
    </React.StrictMode>
  );
}



import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import PdfMergeTool from '../components/tools/PdfMergeTool';
import { ImageState } from '../types';

function PdfMergePage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [image, setImage] = useState<ImageState | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [livePreview, setLivePreview] = useState<React.ReactNode | null>(null);

  useEffect(() => {
    const input = document.getElementById('static-pdf-upload') as HTMLInputElement;
    const section = document.getElementById('static-upload-section');
    const onChange = (e: Event) => {
      const t = e.target as HTMLInputElement;
      const fs = Array.from(t.files || []);
      const valid = fs.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
      if (valid.length === 0) { alert('Select at least one PDF'); return; }

      const f = valid[0];
      // Pass all files to the tool via global (bridge between extraction and React tool)
      (window as any)._enqueuedPdfs = valid;

      const initial: ImageState = { originalUrl: '', currentUrl: '', width: 0, height: 0, format: 'application/pdf', size: f.size, name: f.name };
      setImage(initial);
      setFile(f);
      setHasStarted(true);
      if (section) section.style.display = 'none';
    };
    input?.addEventListener('change', onChange);
    return () => input?.removeEventListener('change', onChange);
  }, []);

  if (!hasStarted) return null;

  return (
    <div className="w-full h-screen bg-[#0d0d12] flex flex-col">
      <div className="flex-1 relative overflow-hidden flex flex-row">
        {/* Sidebar Controls - Modern Sidebar */}
        <aside className="flex w-48 md:w-64 lg:w-80 h-full bg-[#0d0d12] border-r border-white/5 overflow-hidden shrink-0 z-[70]">
          <PdfMergeTool
            image={image!}
            file={file}
            setIsProcessing={setIsProcessing}
            setLivePreview={setLivePreview}
            onBack={() => {
              const section = document.getElementById('static-upload-section');
              if (section) section.style.display = 'block';
              setHasStarted(false);
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
      <PdfMergePage />
    </React.StrictMode>
  );
}



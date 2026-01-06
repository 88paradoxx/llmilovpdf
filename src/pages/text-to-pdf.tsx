import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import TextToPdfTool from '../components/tools/TextToPdfTool';

function TextToPdfPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [livePreview, setLivePreview] = useState<React.ReactNode | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  useEffect(() => {
    const startBtn = document.getElementById('start-creating-btn');
    const section = document.getElementById('static-upload-section');
    const onStart = () => {
      setIsStarted(true);
      if (section) section.style.display = 'none';
    };
    startBtn?.addEventListener('click', onStart);
    return () => startBtn?.removeEventListener('click', onStart);
  }, []);

  if (!isStarted) return null;

  return (
    <div className="w-full h-screen bg-[#0d0d12] flex flex-col">
      <div className="flex-1 relative overflow-hidden flex flex-row">
        {/* Sidebar Controls */}
        <aside className="flex w-48 md:w-64 lg:w-80 h-full bg-[#0d0d12] border-r border-white/5 overflow-hidden shrink-0 z-30">
          <TextToPdfTool
            setIsProcessing={setIsProcessing}
            setLivePreview={setLivePreview}
            onBack={() => {
              const section = document.getElementById('static-upload-section');
              if (section) section.style.display = 'block';
              setIsStarted(false);
            }}
          />
        </aside>

        {/* Live Preview Area */}
        <main className="flex flex-1 relative bg-[#08080c] flex flex-col overflow-hidden">
          {livePreview}
          {isProcessing && (
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50">
              <div className="text-xs font-black uppercase tracking-[0.3em] text-white">Generating PDF</div>
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
      <TextToPdfPage />
    </React.StrictMode>
  );
}



import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import BulkTool from '../components/tools/BulkTool';
import { ImageState } from '../types';
import { Layers } from 'lucide-react';

function BulkPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [initialFiles, setInitialFiles] = useState<File[]>([]);

  useEffect(() => {
    const input = document.getElementById('static-image-upload') as HTMLInputElement;
    const section = document.getElementById('static-upload-section');
    const label = input?.closest('label');

    const handleFiles = (uploaded: File[]) => {
      if (uploaded.length === 0) return;

      const validFiles = uploaded.filter(f => {
        const isImage = f.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|avif|bmp|svg)$/i.test(f.name);
        const isUnderLimit = f.size <= 25 * 1024 * 1024;
        return isImage && isUnderLimit;
      });

      if (validFiles.length === 0) {
        alert('Please select valid image files (up to 25MB each)');
        return;
      }

      if (validFiles.length > 100) {
        alert('Maximum batch size is 100 files');
        setInitialFiles(validFiles.slice(0, 100));
      } else {
        setInitialFiles(validFiles);
      }

      setHasStarted(true);
      if (section) section.style.display = 'none';
    };

    const onChange = (e: Event) => {
      const t = e.target as HTMLInputElement;
      handleFiles(Array.from(t.files || []));
    };

    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (label) label.style.borderColor = '#3b82f6';
    };

    const onDragLeave = () => {
      if (label) label.style.borderColor = '';
    };

    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      if (label) label.style.borderColor = '';
      const droppedFiles = Array.from(e.dataTransfer?.files || []);
      handleFiles(droppedFiles as File[]);
    };

    input?.addEventListener('change', onChange);
    label?.addEventListener('dragover', onDragOver);
    label?.addEventListener('dragleave', onDragLeave);
    label?.addEventListener('drop', onDrop);

    return () => {
      input?.removeEventListener('change', onChange);
      label?.removeEventListener('dragover', onDragOver);
      label?.removeEventListener('dragleave', onDragLeave);
      label?.removeEventListener('drop', onDrop);
    };
  }, []);

  if (!hasStarted) return null;

  return (
    <div className="w-full h-screen bg-[#060608] flex flex-col overflow-hidden font-inter">
      <div className="flex-1 flex flex-row overflow-hidden">
        {/* Sidebar Controls */}
        <aside className="flex w-48 md:w-64 lg:w-80 h-full bg-[#0a0a0c] border-r border-white/5 overflow-hidden shrink-0 transition-all duration-300 z-[70] shadow-2xl">
          <div className="flex-1 overflow-y-auto p-2.5 md:p-4 scrollbar-hide">
            <BulkTool
              setIsProcessing={setIsProcessing}
              initialFiles={initialFiles}
              onBack={() => {
                const section = document.getElementById('static-upload-section');
                if (section) section.style.display = 'block';
                setHasStarted(false);
                setInitialFiles([]);
              }}
            />
          </div>
        </aside>

        {/* Main Preview Area */}
        <div className="flex flex-1 relative bg-[#040406] flex-col items-center justify-center p-3 md:p-6 overflow-hidden">
          {/* Decorative background */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div className="relative group text-center z-10">
            <div className="absolute -inset-8 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-[3rem] blur-3xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2rem] flex items-center justify-center border border-white/20 shadow-2xl shadow-blue-500/20 mx-auto mb-8 group-hover:scale-110 transition-transform duration-500">
                <Layers size={48} className="text-white drop-shadow-lg" />
              </div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Batch Engine Active</h2>
              <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <p className="text-blue-400 text-xs font-black uppercase tracking-[0.2em]">{initialFiles.length} Assets in Queue</p>
              </div>
              <p className="mt-8 text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] max-w-xs mx-auto leading-relaxed">
                Optimizing multiple assets simultaneously with pro-grade precision targeting
              </p>
            </div>
          </div>
        </div>
      </div>

      {isProcessing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[100] animate-in fade-in duration-500">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 bg-blue-600/20 rounded-full animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="text-sm font-black uppercase tracking-[0.4em] text-white animate-pulse">Baking Batch</div>
              <div className="text-[10px] font-bold text-blue-400/60 uppercase tracking-widest">Applying precise compression</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <BulkPage />
    </React.StrictMode>
  );
}

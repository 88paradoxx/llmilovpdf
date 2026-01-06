import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import TextTool from '../components/tools/TextTool';
import InlineTextEditor from '../components/InlineTextEditor';
import { ImageState, TextLayer } from '../types';
import { retrieveFile, clearFile } from '../services/fileHandoff';
import { Type, Download, Home, ArrowLeft, Loader2 } from 'lucide-react';

function TextPage() {
  const [image, setImage] = useState<ImageState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Drag State
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // File Handlers
  useEffect(() => {
    const initFile = async () => {
      try {
        const f = await retrieveFile();
        if (f) {
          const url = URL.createObjectURL(f);
          const img = new Image();
          img.onload = () => {
            setImage({
              originalUrl: url,
              currentUrl: url,
              width: img.width,
              height: img.height,
              format: f.type,
              size: f.size,
              name: f.name
            });
            const section = document.getElementById('static-upload-section');
            if (section) section.style.display = 'none';
            clearFile();
          };
          img.src = url;
        }
      } catch (e) { console.error(e); }
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
      const url = URL.createObjectURL(f);
      const img = new Image();
      img.onload = () => {
        setImage({
          originalUrl: url,
          currentUrl: url,
          width: img.width,
          height: img.height,
          format: f.type,
          size: f.size,
          name: f.name
        });
        if (section) section.style.display = 'none';
      };
      img.src = url;
    };
    input?.addEventListener('change', onChange);
    return () => input?.removeEventListener('change', onChange);
  }, []);

  // Resize Observer for Font Scaling
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.target instanceof HTMLElement) {
          entry.target.style.setProperty('--con-h', `${entry.contentRect.height}px`);
        }
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Interaction Handlers
  const handleTextMouseDown = (e: React.MouseEvent, id: string, currentX: number, currentY: number) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingId(id);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const mouseXPercent = (mouseX / rect.width) * 100;
      const mouseYPercent = (mouseY / rect.height) * 100; // Corrected: was width, should be height for Y

      setDragOffset({
        x: mouseXPercent - currentX,
        y: mouseYPercent - currentY
      });
    }
  };

  const handleGlobalMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !containerRef.current) return;
    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newX = (mouseX / rect.width) * 100 - dragOffset.x;
    const newY = (mouseY / rect.height) * 100 - dragOffset.y;

    setTextLayers(prev => prev.map(l => l.id === draggingId ? { ...l, x: newX, y: newY } : l));
  };

  const handleGlobalMouseUp = () => {
    setDraggingId(null);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (draggingId || editingTextId) return;
    if (!containerRef.current) return;

    // Don't create new text if clicking on existing text
    const target = e.target as HTMLElement;
    if (target.closest('[data-text-layer]')) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newLayer: TextLayer = {
      id: Date.now().toString(),
      text: 'Type here...',
      x,
      y,
      fontSize: 5,
      fontFamily: 'Inter, sans-serif',
      color: '#000000',
      fontWeight: '700',
      fontStyle: 'normal',
      opacity: 1,
      textAlign: 'center',
      verticalAlign: 'middle',
      shadow: false,
      shadowColor: '#000000',
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      strokeWidth: 0,
      strokeColor: '#000000',
      boxWidth: 50,
      boxHeight: 10
    };

    setTextLayers([...textLayers, newLayer]);
    setEditingTextId(newLayer.id);
  };

  // Baking & Export
  const bakeImage = async () => {
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

      // Draw Base
      ctx.drawImage(img, 0, 0);

      // Draw Text
      textLayers.forEach(l => {
        ctx.save();
        const x = (l.x / 100) * canvas.width;
        const y = (l.y / 100) * canvas.height;
        // Calculate font size relative to image height (l.fontSize is % of height)
        const fontSize = (l.fontSize * canvas.height) / 100;

        ctx.font = `${l.fontStyle} ${l.fontWeight} ${fontSize}px ${l.fontFamily}`;
        ctx.fillStyle = l.color;
        ctx.textAlign = l.textAlign;
        ctx.textBaseline = l.verticalAlign;

        if (l.shadow) {
          ctx.shadowColor = l.shadowColor;
          ctx.shadowBlur = l.shadowBlur;
          ctx.shadowOffsetX = l.shadowOffsetX;
          ctx.shadowOffsetY = l.shadowOffsetY;
        }

        ctx.fillText(l.text, x, y);
        ctx.restore();
      });

      const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, image.format, 1.0));
      return blob;
    } catch (e) {
      console.error(e);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    const blob = await bakeImage();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `text-added-${image?.name || 'image'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!image) return null;

  return (
    <div
      className="w-full h-screen bg-[#0d0d12] flex flex-col"
      onMouseMove={handleGlobalMouseMove}
      onMouseUp={handleGlobalMouseUp}
    >
      <div className="flex-1 flex flex-row overflow-hidden">
        {/* Sidebar */}
        <aside className="flex w-48 md:w-64 lg:w-80 h-full bg-[#0d0d12] border-r border-white/5 overflow-hidden shrink-0 transition-all duration-300 z-[70]">
          <TextTool
            image={image}
            layers={textLayers}
            setLayers={setTextLayers}
            onDownload={handleDownload}
            onBack={() => {
              const section = document.getElementById('static-upload-section');
              if (section) section.style.display = 'block';
              setImage(null);
            }}
            editingId={editingTextId}
            setEditingId={setEditingTextId}
            onCommit={() => {/* Bake logic is handleDownload essentially, or we could support "Save" but user asked for simple */ }}
            hideFooter={false}
          />
        </aside>

        {/* Preview */}
        <div className="flex flex-1 relative bg-[#08080c] flex-col items-center justify-center p-4 overflow-hidden">
          <div className="relative inline-flex max-w-full max-h-full" ref={containerRef}>
            <img
              src={image.currentUrl}
              alt="Preview"
              className="max-w-full max-h-[85vh] object-contain shadow-2xl rounded-lg pointer-events-none select-none border border-white/5"
            />

            {/* Interaction Overlay */}
            <div
              className="absolute inset-0 w-full h-full cursor-text"
              onClick={handleCanvasClick}
            >
              {textLayers.map(l => {
                const isEditing = editingTextId === l.id;

                if (isEditing) {
                  const containerH = containerRef.current?.clientHeight || window.innerHeight;
                  const pxSize = (l.fontSize * containerH) / 100;

                  return (
                    <InlineTextEditor
                      key={l.id}
                      initialValue={l.text}
                      initialColor={l.color}
                      initialFontSize={pxSize}
                      initialFontFamily={l.fontFamily}
                      initialFontWeight={l.fontWeight as any}
                      initialFontStyle={l.fontStyle as any}
                      allowedTabs={['text', 'font']}
                      onSave={(text, color, bg, size, family, weight, style) => {
                        const newFontSize = size ? (size / containerH) * 100 : l.fontSize;
                        setTextLayers(prev => prev.map(pl => pl.id === l.id ? {
                          ...pl,
                          text,
                          color: color || pl.color,
                          fontSize: newFontSize,
                          fontFamily: family || pl.fontFamily,
                          fontWeight: (weight as any) || pl.fontWeight,
                          fontStyle: (style as any) || pl.fontStyle
                        } : pl));
                        setEditingTextId(null);
                      }}
                      onCancel={() => setEditingTextId(null)}
                      style={{
                        left: `${l.x}%`,
                        top: `${l.y}%`,
                        transform: 'translate(-50%, -50%)',
                        minWidth: '50px'
                      }}
                    />
                  );
                }

                return (
                  <div
                    key={l.id}
                    data-text-layer="true"
                    className={`absolute whitespace-nowrap transition-colors ${editingTextId === l.id ? 'opacity-0' : 'hover:ring-1 hover:ring-white/50 cursor-move'}`}
                    style={{
                      left: `${l.x}%`,
                      top: `${l.y}%`,
                      transform: 'translate(-50%, -50%)',
                      color: l.color,
                      fontSize: `max(12px, calc(var(--con-h, 100vh) * ${l.fontSize} / 100))`,
                      fontFamily: l.fontFamily,
                      fontWeight: l.fontWeight as any,
                      fontStyle: l.fontStyle as any,
                      opacity: l.opacity,
                      textAlign: l.textAlign as any,
                      textShadow: l.shadow ? `${l.shadowOffsetX}px ${l.shadowOffsetY}px ${l.shadowBlur}px ${l.shadowColor}` : 'none',
                      padding: '4px',
                      userSelect: 'none',
                      pointerEvents: 'auto'
                    }}
                    onMouseDown={(e) => handleTextMouseDown(e, l.id, l.x, l.y)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingTextId(l.id);
                    }}
                  >
                    {l.text}
                  </div>
                );
              })}
            </div>
          </div>

          {isProcessing && (
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center pointer-events-none z-50">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <div className="text-xs font-black uppercase tracking-[0.3em] text-white">Processing</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<TextPage />);
}


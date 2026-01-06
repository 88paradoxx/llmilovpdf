import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Type, Hand, Minus, Plus, Undo, X,
  FileEdit, ChevronDown, ChevronUp, Download, Save, Check,
  Bold, Italic, Home, Type as FontType, Pipette, RefreshCcw
} from 'lucide-react';
// @ts-ignore
import { fabric } from 'fabric';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

import { applyNativeEdits } from '../../services/pdfEditorService';
import { NativeTextEdit, NativeTextItem, DrawingSettings, TextLayer, PdfPage, AddedText } from '../../types';


// --- Components ---

// --- Components ---

const InlineTextEditor = ({
  initialValue,
  onSave,
  onCancel,
  style,
  initialColor,
  initialBackgroundColor,
  initialFontSize,
  initialFontFamily,
  initialFontWeight,
  initialFontStyle,
  allowedTabs = ['text', 'bg', 'font']
}: {
  initialValue: string,
  onSave: (text: string, color?: string, bg?: string, size?: number, family?: string, weight?: string, fontStyle?: string) => void,
  onCancel: () => void,
  style: React.CSSProperties,
  initialColor?: string,
  initialBackgroundColor?: string,
  initialFontSize?: number,
  initialFontFamily?: string,
  initialFontWeight?: string,
  initialFontStyle?: string,
  allowedTabs?: ('text' | 'bg' | 'font')[]
}) => {
  const [text, setText] = useState(initialValue);
  const [color, setColor] = useState(initialColor || '#000000');
  const [bgColor, setBgColor] = useState(initialBackgroundColor || 'transparent');
  const [fontSize, setFontSize] = useState(initialFontSize || 16);
  const [fontFamily, setFontFamily] = useState(initialFontFamily || 'sans-serif');
  const [fontWeight, setFontWeight] = useState(initialFontWeight || 'normal');
  const [fontStyle, setFontStyle] = useState(initialFontStyle || 'normal');
  const [mode, setMode] = useState<'text' | 'bg' | 'font'>(allowedTabs[0] || 'text');

  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!allowedTabs.includes(mode)) {
      setMode(allowedTabs[0] || 'text');
    }
    // Focus and select contents
    if (divRef.current) {
      divRef.current.focus({ preventScroll: true });
      const range = document.createRange();
      range.selectNodeContents(divRef.current);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [allowedTabs]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSave(divRef.current?.innerText || text, color, bgColor, fontSize, fontFamily, fontWeight, fontStyle);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const colors = [
    '#000000', '#ffffff', '#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', 'transparent'
  ];

  const fonts = [
    { name: 'Sans', val: 'sans-serif' },
    { name: 'Serif', val: 'serif' },
    { name: 'Mono', val: 'monospace' },
    { name: 'Cursive', val: 'cursive' }
  ];

  // Determine position of toolbar
  const [toolbarPos, setToolbarPos] = useState<'top' | 'bottom'>('top');

  React.useLayoutEffect(() => {
    const updatePos = () => {
      if (divRef.current) {
        const rect = divRef.current.getBoundingClientRect();
        // If closer than 150px to top edge, flip to bottom
        // We check relative to viewport top (0)
        setToolbarPos(rect.top < 150 ? 'bottom' : 'top');
      }
    };
    // Update on mount, scroll, and resize
    updatePos();
    window.addEventListener('scroll', updatePos);
    window.addEventListener('resize', updatePos);
    return () => {
      window.removeEventListener('scroll', updatePos);
      window.removeEventListener('resize', updatePos);
    };
  }, []);

  // Click outside to save
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleOutside = (e: PointerEvent) => {
      // If clicking outside the wrapper (which includes toolbar and content)
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        // Save current state
        onSave(
          divRef.current?.innerText || text,
          color,
          bgColor === 'transparent' ? undefined : bgColor,
          fontSize,
          fontFamily,
          fontWeight,
          fontStyle
        );
      }
    };
    document.addEventListener('pointerdown', handleOutside);
    return () => document.removeEventListener('pointerdown', handleOutside);
  }, [color, bgColor, fontSize, fontFamily, fontWeight, fontStyle, text, onSave]);

  // Extract transform from style to apply to the wrapper instead of the inner div
  // This ensures the wrapper (relative to which the toolbar is positioned) matches the visual location of the text box
  const { transform, left, top, ...contentStyle } = style;

  return (
    <div ref={wrapperRef} className="absolute z-50 text-xs pointer-events-auto" style={{ left, top, transform }}>
      {/* Toolbar */}
      <div
        className={`absolute left-0 p-2 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl w-48 text-white flex flex-col gap-2 ${toolbarPos === 'top' ? 'bottom-full mb-8' : 'top-full mt-12'}`}
        onMouseDown={e => e.preventDefault()}
      >
        <div className="flex gap-1 border-b border-white/10 pb-2">
          {allowedTabs.includes('text') && <div role="button" onMouseDown={(e) => { e.preventDefault(); setMode('text'); }} className={`flex-1 py-1 rounded cursor-pointer text-center ${mode === 'text' ? 'bg-purple-600' : 'hover:bg-white/10'}`}>Color</div>}
          {allowedTabs.includes('bg') && <div role="button" onMouseDown={(e) => { e.preventDefault(); setMode('bg'); }} className={`flex-1 py-1 rounded cursor-pointer text-center ${mode === 'bg' ? 'bg-purple-600' : 'hover:bg-white/10'}`}>Bg</div>}
          {allowedTabs.includes('font') && <div role="button" onMouseDown={(e) => { e.preventDefault(); setMode('font'); }} className={`flex-1 py-1 rounded cursor-pointer text-center ${mode === 'font' ? 'bg-purple-600' : 'hover:bg-white/10'}`}>Font</div>}
        </div>

        <div className="py-1">
          {mode === 'text' && allowedTabs.includes('text') && (
            <div className="flex gap-1 flex-wrap">
              {colors.map(c => (
                <div key={c} role="button" onMouseDown={(e) => { e.preventDefault(); setColor(c); }} className={`w-5 h-5 rounded-full border border-white/20 cursor-pointer ${color === c ? 'ring-2 ring-white' : ''}`} style={{ backgroundColor: c === 'transparent' ? 'transparent' : c }} />
              ))}
            </div>
          )}
          {mode === 'bg' && allowedTabs.includes('bg') && (
            <div className="flex gap-1 flex-wrap">
              {colors.map(c => (
                <div key={c} role="button" onMouseDown={(e) => { e.preventDefault(); setBgColor(c); }} className={`w-5 h-5 rounded-full border border-white/20 cursor-pointer ${bgColor === c ? 'ring-2 ring-white' : ''}`} style={{ backgroundColor: c === 'transparent' ? 'transparent' : c }} />
              ))}
            </div>
          )}
          {mode === 'font' && allowedTabs.includes('font') && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div role="button" onMouseDown={(e) => { e.preventDefault(); setFontSize(s => Math.max(8, s - 2)); }} className="p-1 hover:bg-white/10 rounded cursor-pointer"><Minus size={12} /></div>
                <span className="font-mono">{fontSize}px</span>
                <div role="button" onMouseDown={(e) => { e.preventDefault(); setFontSize(s => Math.min(72, s + 2)); }} className="p-1 hover:bg-white/10 rounded cursor-pointer"><Plus size={12} /></div>
              </div>
              <div className="flex gap-1">
                <div
                  role="button"
                  onMouseDown={(e) => { e.preventDefault(); setFontWeight(prev => prev === 'bold' ? 'normal' : 'bold'); }}
                  className={`flex-1 py-1 rounded flex items-center justify-center border border-white/10 cursor-pointer ${fontWeight === 'bold' ? 'bg-purple-600' : 'hover:bg-white/10'}`}
                >
                  <Bold size={14} />
                </div>
                <div
                  role="button"
                  onMouseDown={(e) => { e.preventDefault(); setFontStyle(prev => prev === 'italic' ? 'normal' : 'italic'); }}
                  className={`flex-1 py-1 rounded flex items-center justify-center border border-white/10 cursor-pointer ${fontStyle === 'italic' ? 'bg-purple-600' : 'hover:bg-white/10'}`}
                >
                  <Italic size={14} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {fonts.map(f => (
                  <div key={f.val} role="button" onMouseDown={(e) => { e.preventDefault(); setFontFamily(f.val); }} className={`px-2 py-1 rounded text-left cursor-pointer ${fontFamily === f.val ? 'bg-white/20' : 'hover:bg-white/10'}`}>
                    {f.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-2 border-t border-white/10 mt-1">
          <div role="button" onMouseDown={(e) => { e.preventDefault(); onCancel(); }} className="text-white/50 hover:text-white cursor-pointer"><X size={14} /></div>
          <div role="button" onMouseDown={(e) => {
            e.preventDefault();
            // Correct order: text, color, bg, size, family, weight, style
            onSave(divRef.current?.innerText || text, color, bgColor === 'transparent' ? undefined : bgColor, fontSize, fontFamily, fontWeight, fontStyle);
          }} className="text-green-400 hover:text-green-300 cursor-pointer"><Check size={14} /></div>
        </div>
      </div>

      <div
        ref={divRef}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => setText(e.currentTarget.innerText)}
        onKeyDown={handleKeyDown}
        // onBlur removed to prevent closing when clicking toolbar
        className="outline-none overflow-hidden selection:bg-purple-500/30 whitespace-pre-wrap word-break-all"
        style={{
          ...contentStyle,
          left: 0, top: 0,
          background: bgColor,
          boxShadow: '0 0 0 1px #8b5cf6',
          borderRadius: '2px',
          color: color,
          fontSize: `${fontSize}px`,
          fontFamily: fontFamily,
          fontWeight: fontWeight,
          fontStyle: fontStyle,
          minWidth: contentStyle.minWidth || contentStyle.width || '100px',
          width: 'auto',
          height: 'auto',
          minHeight: contentStyle.minHeight || '1.2em',
          lineHeight: '1.2',
          display: 'inline-block'
        }}
      >
        {initialValue}
      </div>
    </div>
  );
};


// --- Types ---
interface Viewport { x: number; y: number; scale: number; }

const PdfPageRenderer = ({
  page,
  pdfDoc,
  scale,
  textLayers,
  nativeTextItems,
  nativeEdits,
  onTextAction,
  editingId,
  onSaveEdit,
  onCancelEdit,
  tool,
  onFabricInit
}: {
  page: PdfPage,
  pdfDoc: any,
  scale: number,
  textLayers: TextLayer[],
  nativeTextItems: NativeTextItem[],
  nativeEdits: Record<string, NativeTextEdit>,
  onTextAction: (action: string, id: string | null, extra?: any) => void,
  editingId: string | null,
  onSaveEdit: (val: string, color?: string, bg?: string, size?: number, family?: string, weight?: string, fontStyle?: string) => void,
  onCancelEdit: () => void,
  tool: string,
  onFabricInit: (pageId: string, fc: fabric.Canvas) => void
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [loaded, setLoaded] = useState(false);
  const currentRenderTaskRef = useRef<any>(null);

  useEffect(() => {
    if (overlayCanvasRef.current && !fabricCanvasRef.current) {
      const fc = new fabric.Canvas(overlayCanvasRef.current, {
        selection: true,
        allowTouchScrolling: true,
        enableRetinaScaling: true,
        renderOnAddRemove: true
      });
      fabricCanvasRef.current = fc;
      onFabricInit(page.id, fc);

      // Ensure the wrapper fills the container
      const container = fc.getElement().parentElement;
      if (container) {
        container.style.width = '100%';
        container.style.height = '100%';
      }

      return () => {
        if (fc) {
          fc.dispose();
          fabricCanvasRef.current = null;
        }
      };
    }
  }, [page.id, loaded]);

  // Sync fabric dimensions on scale changes
  useEffect(() => {
    if (fabricCanvasRef.current) {
      const qualityFactor = 2;
      fabricCanvasRef.current.setDimensions({
        width: page.width * scale * qualityFactor,
        height: page.height * scale * qualityFactor
      });
      fabricCanvasRef.current.setZoom(qualityFactor);
      fabricCanvasRef.current.renderAll();
    }
  }, [scale, page.width, page.height]);

  // Sync fabric interactivity with tool
  useEffect(() => {
    if (fabricCanvasRef.current) {
      const isInteractionTool = tool === 'edit';
      fabricCanvasRef.current.selection = false;
      fabricCanvasRef.current.forEachObject((obj) => {
        obj.selectable = isInteractionTool;
        obj.evented = isInteractionTool;
      });
      fabricCanvasRef.current.renderAll();
    }
  }, [tool]);

  useEffect(() => {
    let active = true;
    const render = async () => {
      if (!pdfDoc || !canvasRef.current || !isFinite(scale) || scale <= 0) return;

      if (currentRenderTaskRef.current) {
        currentRenderTaskRef.current.cancel();
        currentRenderTaskRef.current = null;
      }

      try {
        const p = await pdfDoc.getPage(page.index + 1);
        const viewport = p.getViewport({ scale: scale * 2 });
        const canvas = canvasRef.current;
        if (canvas && isFinite(viewport.width) && isFinite(viewport.height)) {
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const renderTask = p.render({ canvasContext: ctx, viewport });
            currentRenderTaskRef.current = renderTask;
            await renderTask.promise;
            if (active) setLoaded(true);
          }
        }
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
          console.error(err);
        }
      }
    };
    render();
    return () => {
      active = false;
      if (currentRenderTaskRef.current) {
        currentRenderTaskRef.current.cancel();
        currentRenderTaskRef.current = null;
      }
    };
  }, [pdfDoc, page.index, scale]);

  const isInteractionTool = tool === 'edit';
  const canEditNative = tool === 'edit';

  const rgbToHex = (r: number, g: number, b: number) => {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  };

  const getBackgroundColor = (x: number, y: number, w: number, h: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return '#ffffff';
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return '#ffffff';

    const s = scale * 2;
    // Sample a small region just outside the top-left to avoid text anti-aliasing
    const rx = Math.max(0, Math.floor(x * s) - 4);
    const ry = Math.max(0, Math.floor((page.height - y - h) * s) - 4);

    try {
      const data = ctx.getImageData(rx, ry, 3, 3).data;
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0) {
          r += data[i]; g += data[i + 1]; b += data[i + 2];
          count++;
        }
      }
      if (count === 0) return '#ffffff';
      return rgbToHex(Math.round(r / count), Math.round(g / count), Math.round(b / count));
    } catch (e) {
      return '#ffffff';
    }
  };

  const getTextColor = (x: number, y: number, w: number, h: number, bgHex: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return '#000000';
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return '#000000';

    const s = scale * 2;
    // Sample the entire bounding box to find the actual text color
    const rx = Math.max(0, Math.floor(x * s));
    const ry = Math.max(0, Math.floor((page.height - y - h) * s));
    const rw = Math.max(1, Math.floor(w * s));
    const rh = Math.max(1, Math.floor(h * s));

    try {
      // Limit size to avoid performance issues on large blocks, but cover typical text
      const data = ctx.getImageData(rx, ry, Math.min(rw, 100), Math.min(rh, 50)).data;

      const bgR = parseInt(bgHex.slice(1, 3), 16);
      const bgG = parseInt(bgHex.slice(3, 5), 16);
      const bgB = parseInt(bgHex.slice(5, 7), 16);

      let bestColor = (bgR + bgG + bgB) / 3 > 128 ? '#000000' : '#ffffff';
      let maxDiff = -1;

      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue; // Skip semi-transparent pixels
        const r = data[i], g = data[i + 1], b = data[i + 2];
        // Weighted contrast for better perceptual matching
        const diff = (Math.abs(r - bgR) * 0.299) + (Math.abs(g - bgG) * 0.587) + (Math.abs(b - bgB) * 0.114);
        if (diff > maxDiff) {
          maxDiff = diff;
          bestColor = rgbToHex(r, g, b);
        }
      }

      return bestColor;
    } catch (e) {
      return '#000000';
    }
  };

  return (
    <div
      data-page-index={page.index}
      className="relative bg-white shadow-2xl mb-8 select-none origin-top-left"
      style={{
        width: page.width * scale,
        height: page.height * scale,
      }}
      onDoubleClick={(e) => {
        e.preventDefault();
        // Fallback for clicking empty areas or nearby text
        const rect = e.currentTarget.getBoundingClientRect();
        const localX = (e.clientX - rect.left) / scale;
        const localY = (e.clientY - rect.top) / scale;

        const items = nativeTextItems || [];
        const hit = items.find(item => {
          const itemTopY = page.height - item.y - item.h;
          const itemBottomY = page.height - item.y;
          return (
            localX >= item.x - 10 &&
            localX <= item.x + item.w + 10 &&
            localY >= itemTopY - 10 &&
            localY <= itemBottomY + 10
          );
        });

        if (hit) {
          onTextAction('editNative', hit.id, hit);
        }
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className={`absolute inset-0 z-50 ${tool === 'addText' || tool === 'edit' ? '' : 'pointer-events-none'}`}>
        <canvas ref={overlayCanvasRef} className="w-full h-full" />
      </div>

      {/* Native Text Overlays */}
      <div className={`absolute inset-0 pointer-events-none ${isInteractionTool ? 'z-[60]' : 'z-10'}`}>
        {nativeTextItems.map(item => {
          const edit = nativeEdits[item.id];
          const isEdited = !!edit;
          const isEditing = editingId === item.id;

          const fontSize = edit?.fontSize || item.h || 12;

          let fontFam = 'sans-serif';
          let weight = edit?.fontWeight || 'normal';
          let style_val = edit?.fontStyle || 'normal';

          if (edit?.fontFamily) {
            fontFam = edit.fontFamily;
          } else if (item.fontName) {
            const low = item.fontName.toLowerCase();
            if (low.includes('serif') || low.includes('times')) fontFam = 'serif';
            else if (low.includes('mono') || low.includes('courier')) fontFam = 'monospace';

            if (!edit) {
              if (low.includes('bold') || low.includes('700')) weight = 'bold';
              if (low.includes('italic') || low.includes('oblique')) style_val = 'italic';
            }
          }

          if (isEditing) {
            // Auto detect bg if not set
            const autoBg = edit?.backgroundColor || getBackgroundColor(item.x, item.y, item.w, item.h);
            // Auto detect text color if not set
            const autoColor = edit?.color || getTextColor(item.x, item.y, item.w, item.h, autoBg);

            return (
              <InlineTextEditor
                key={item.id}
                initialValue={edit?.text || item.str || ''}
                initialColor={autoColor}
                initialBackgroundColor={autoBg}
                initialFontSize={fontSize * scale}
                initialFontFamily={fontFam}
                initialFontWeight={weight}
                initialFontStyle={style_val}
                allowedTabs={['text', 'font']}
                onSave={(val, c, bg, sz, fam, w, s) => {
                  if (!isEdited && val === item.str && c === autoColor && w === weight && s === style_val) {
                    onCancelEdit();
                  } else {
                    onSaveEdit(val, c || autoColor, bg || autoBg, sz, fam, w, s);
                  }
                }}
                onCancel={onCancelEdit}
                style={{
                  left: item.x * scale,
                  top: (page.height - item.y - item.h) * scale,
                  minWidth: item.w * scale,
                  minHeight: item.h * scale,
                  width: 'auto',
                  height: 'auto',
                }}
              />
            );
          }

          return (
            <div
              key={item.id}
              className={`absolute cursor-text transition-colors pointer-events-auto flex items-center whitespace-pre
                  ${isEditing ? 'z-[100]' : isEdited ? 'z-20' : `z-10 ${canEditNative ? 'hover:bg-purple-500/10' : ''}`}
               `}
              style={{
                left: item.x * scale,
                top: (page.height - item.y - item.h) * scale,
                width: item.w * scale,
                height: item.h * scale * 1.3,
                fontSize: `${fontSize * scale}px`,
                lineHeight: 1,
                color: isEdited ? (edit.color || '#000000') : 'transparent',
                backgroundColor: isEdited ? (edit.backgroundColor || '#ffffff') : 'transparent',
                fontFamily: fontFam,
                fontWeight: weight,
                fontStyle: style_val
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (canEditNative) onTextAction('editNative', item.id, item);
              }}
              onDoubleClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTextAction('editNative', item.id, item);
              }}
            >
              {isEdited ? edit?.text : ''}
            </div>
          );
        })}
      </div>

      {/* Added User Text Layers */}
      <div className={`absolute inset-0 overflow-hidden z-30 ${isInteractionTool ? '' : 'pointer-events-none'}`}>
        {textLayers.filter(l => l.pageId === page.id).map(layer => {
          const isEditing = editingId === layer.id;
          if (isEditing) {
            return (
              <InlineTextEditor
                key={layer.id}
                initialValue={layer.text}
                initialColor={layer.color}
                initialFontSize={layer.fontSize * scale}
                initialFontFamily={layer.fontFamily}
                initialFontWeight={layer.fontWeight}
                initialFontStyle={layer.fontStyle}
                onSave={onSaveEdit}
                onCancel={onCancelEdit}
                style={{
                  left: `${layer.x}%`,
                  top: `${layer.y}%`,
                  transform: 'translate(-50%, -50%)',
                  minWidth: '50px'
                }}
              />
            )
          }
          return (
            <div
              key={layer.id}
              className={`absolute cursor-move group rounded pointer-events-auto ${isInteractionTool ? 'hover:ring-2 ring-purple-500/50' : ''}`}
              style={{
                left: `${layer.x}%`,
                top: `${layer.y}%`,
                transform: 'translate(-50%, -50%)',
                minWidth: '20px',
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                if (isInteractionTool) onTextAction('startDragLayer', layer.id, { x: e.clientX, y: e.clientY });
              }}
              onDoubleClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isInteractionTool) onTextAction('editLayer', layer.id);
              }}
            >
              <div
                className="px-2 py-1 whitespace-pre-wrap select-none"
                style={{
                  fontSize: `${layer.fontSize * scale}px`,
                  color: layer.color,
                  fontFamily: layer.fontFamily,
                  fontWeight: layer.fontWeight,
                  fontStyle: layer.fontStyle,
                  lineHeight: 1.2
                }}
              >
                {layer.text}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- Main Component ---
export default function PdfEditorTool({
  file,
  onBack,
  setIsProcessing,
  textLayers: externalTextLayers,
  setTextLayers: setExternalTextLayers,
  pdfSubTool,
  setPdfSubTool
}: any) {
  // State
  const [tool, setTool] = useState<'hand' | 'edit'>('hand');
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, scale: 1 });

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [isAutoFit, setIsAutoFit] = useState(true);
  const [isScrollingWheel, setIsScrollingWheel] = useState(false);
  const wheelTimeout = useRef<any>(null);

  // Data
  const [textLayers, setTextLayers] = useState<TextLayer[]>(externalTextLayers || []);

  // Sync with external state if provided
  useEffect(() => {
    if (externalTextLayers) setTextLayers(externalTextLayers);
  }, [externalTextLayers]);

  useEffect(() => {
    if (setExternalTextLayers) setExternalTextLayers(textLayers);
  }, [textLayers, setExternalTextLayers]);
  const [detectedText, setDetectedText] = useState<Record<string, NativeTextItem[]>>({});
  const [nativeEdits, setNativeEdits] = useState<Record<string, NativeTextEdit>>({});

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<'layer' | 'native' | null>(null);
  const [settings, setSettings] = useState<DrawingSettings>({ color: '#000000', brushSize: 20, mode: 'brush', opacity: 1, style: 'solid' });

  // Dragging State
  const [draggingLayerId, setDraggingLayerId] = useState<string | null>(null);

  const [isActivelyPanning, setIsActivelyPanning] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const fabricCanvases = useRef<Map<string, fabric.Canvas>>(new Map());
  const nativeEditsRef = useRef<Record<string, NativeTextEdit>>(nativeEdits);
  const textLayersRef = useRef<TextLayer[]>(textLayers);
  const toolRef = useRef<'hand' | 'edit'>(tool);

  // Sync refs with state for reliable access in async handlers/closures
  useEffect(() => { nativeEditsRef.current = nativeEdits; }, [nativeEdits]);
  useEffect(() => { textLayersRef.current = textLayers; }, [textLayers]);
  useEffect(() => { toolRef.current = tool; }, [tool]);

  // Gestures
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const activePointers = useRef<Map<number, { x: number, y: number }>>(new Map());
  const initialPinchDist = useRef<number | null>(null);
  const initialScale = useRef<number>(1);

  // Helpers
  const clampViewport = useCallback((v: Viewport, currentScale?: number) => {
    if (!containerRef.current || pages.length === 0) return v;
    const rect = containerRef.current.getBoundingClientRect();
    const scale = currentScale ?? v.scale;

    const maxWidth = Math.max(...pages.map(p => p.width));
    const totalHeight = pages.reduce((acc, p) => acc + p.height, 0) + (pages.length - 1) * 32;
    const scaledHeight = totalHeight * scale;
    const scaledWidth = maxWidth * scale;

    const PADDING = 20;
    let minX, maxX, minY, maxY;

    if (scaledWidth <= rect.width) {
      minX = maxX = (rect.width - scaledWidth) / 2;
    } else {
      maxX = PADDING;
      minX = rect.width - scaledWidth - PADDING;
    }

    if (scaledHeight <= rect.height) {
      minY = maxY = (rect.height - scaledHeight) / 2;
    } else {
      maxY = PADDING;
      minY = rect.height - scaledHeight - PADDING;
    }

    return {
      ...v,
      scale,
      x: Math.max(Math.min(minX, maxX), Math.min(Math.max(minX, maxX), v.x)),
      y: Math.max(Math.min(minY, maxY), Math.min(Math.max(minY, maxY), v.y))
    };
  }, [pages]);

  const fitToScreen = useCallback((keepScroll: boolean = false) => {
    if (!containerRef.current || pages.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const isMobile = window.innerWidth < 768;
    const margin = isMobile ? 8 : 40;

    const maxWidth = Math.max(...pages.map(p => p.width));
    const totalHeight = pages.reduce((acc, p) => acc + p.height, 0) + (pages.length - 1) * 32;

    // Scale to fit width primarily
    const fitWidthScale = (rect.width - margin * 2) / maxWidth;
    const scale = Math.min(2.25, Math.max(0.1, fitWidthScale));

    setViewport(v => {
      // Use the calculated fit scale IF in auto-fit mode, 
      // OR IF we are performing a hard reset (keepScroll is false)
      const targetScale = (isAutoFit || !keepScroll) ? scale : v.scale;
      const targetScaledWidth = maxWidth * targetScale;

      const initialV = {
        // PRESERVE X IF KEEPSCROLL (prevents horizontal shift on resize/edit)
        x: keepScroll ? v.x : (rect.width - targetScaledWidth) / 2,
        y: keepScroll ? v.y : margin,
        scale: targetScale
      };

      // If keeping scroll AND scale changed significantly (e.g. orientation swap)
      if (keepScroll && Math.abs(targetScale - v.scale) > 0.01) {
        // Adjust relative position for scale change
        const docY = (margin - v.y) / v.scale;
        initialV.y = margin - (docY * targetScale);

        // Adjust relative X too if we were off-center
        const centeredX = (rect.width - (maxWidth * v.scale)) / 2;
        const offX = v.x - centeredX;
        const newCenteredX = (rect.width - (maxWidth * targetScale)) / 2;
        initialV.x = newCenteredX + (offX * (targetScale / v.scale));
      }

      return clampViewport(initialV, targetScale);
    });
  }, [pages, clampViewport, isAutoFit]);

  // Effects
  // Load PDF & Extract Text
  useEffect(() => {
    const load = async () => {
      if (!file) return;
      if (setIsProcessing) setIsProcessing(true);
      try {
        const lib = pdfjsLib;
        lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        const arrayBuffer = await file.arrayBuffer();
        const doc = await lib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        setPdfDoc(doc);
        fabricCanvases.current.clear();

        const ps: PdfPage[] = [];
        const textData: Record<string, NativeTextItem[]> = {};

        for (let i = 0; i < doc.numPages; i++) {
          const p = await doc.getPage(i + 1);
          const v = p.getViewport({ scale: 1 });
          const pageId = `p${i}`;
          ps.push({ id: pageId, index: i, width: v.width, height: v.height });

          // Extract Text
          const content = await p.getTextContent();
          textData[pageId] = content.items.map((item: any, idx: number) => ({
            id: `n_${pageId}_${idx}`,
            str: item.str,
            dir: item.dir,
            width: item.width,
            height: item.height || Math.hypot(item.transform[0], item.transform[1]),
            transform: item.transform,
            fontName: item.fontName,
            x: item.transform[4],
            y: item.transform[5],
            pageIndex: i,
            w: item.width,
            h: item.height || Math.hypot(item.transform[0], item.transform[1]),
            bgColor: { r: 255, g: 255, b: 255 }
          }));
        }
        setPages(ps);
        setDetectedText(textData);
        // Initial fit will be handled by fitToScreen after setPages updates
      } catch (e) { console.error(e); }
      if (setIsProcessing) setIsProcessing(false);
    };
    load();
  }, [file, setIsProcessing]);

  // Trigger initial fit when pages load
  const hasInitiallyFit = useRef(false);
  useEffect(() => {
    if (pages.length > 0 && !hasInitiallyFit.current) {
      fitToScreen(false);
      hasInitiallyFit.current = true;
    }
  }, [pages.length, fitToScreen]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => fitToScreen(true);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitToScreen]);

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Multi-touch Pan
    if (activePointers.current.size === 2) {
      const points = Array.from(activePointers.current.values());
      const midX = (points[0].x + points[1].x) / 2;
      const midY = (points[0].y + points[1].y) / 2;

      lastPos.current = { x: midX, y: midY };
      return;
    }

    if (editingId || draggingLayerId) return;

    if (activePointers.current.size === 1) {
      isDragging.current = true;
      setIsActivelyPanning(true);
      lastPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (activePointers.current.has(e.pointerId)) {
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // Handle Multi-finger Pan Only (No pinch-to-zoom)
    if (activePointers.current.size === 2) {
      const points = Array.from(activePointers.current.values());
      const midX = (points[0].x + points[1].x) / 2;
      const midY = (points[0].y + points[1].y) / 2;

      const dx = midX - lastPos.current.x;
      const dy = midY - lastPos.current.y;
      lastPos.current = { x: midX, y: midY };

      setViewport(v => clampViewport({ ...v, x: v.x + dx, y: v.y + dy }));
      return;
    }

    if (draggingLayerId) {
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };

      const layer = textLayers.find(l => l.id === draggingLayerId);
      const page = pages.find(p => p.id === layer?.pageId);

      if (layer && page) {
        const contentDx = dx / viewport.scale;
        const contentDy = dy / viewport.scale;

        setTextLayers(prev => prev.map(l => {
          if (l.id === draggingLayerId) {
            const dPx = (contentDx / page.width) * 100;
            const dPy = (contentDy / page.height) * 100;
            return { ...l, x: l.x + dPx, y: l.y + dPy };
          }
          return l;
        }));
      }
      return;
    }

    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setViewport(v => clampViewport({ ...v, x: v.x + dx, y: v.y + dy }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    activePointers.current.delete(e.pointerId);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    if (activePointers.current.size < 2) {
      initialPinchDist.current = null;
    }

    if (activePointers.current.size === 0) {
      isDragging.current = false;
      setIsActivelyPanning(false);
    }
    setDraggingLayerId(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    setIsScrollingWheel(true);
    if (wheelTimeout.current) clearTimeout(wheelTimeout.current);
    wheelTimeout.current = setTimeout(() => setIsScrollingWheel(false), 200);

    if (e.ctrlKey) {
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const zoomSensitivity = 0.002; // Slightly increased for responsiveness
      const d = -e.deltaY * zoomSensitivity;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setViewport(v => {
        setIsAutoFit(false);
        const newScale = Math.max(0.1, Math.min(5, v.scale + d));
        const sRatio = newScale / v.scale;

        const newX = mouseX - (mouseX - v.x) * sRatio;
        const newY = mouseY - (mouseY - v.y) * sRatio;

        return clampViewport({ x: newX, y: newY, scale: newScale }, newScale);
      });
    } else {
      setViewport(v => clampViewport({ ...v, y: v.y - e.deltaY }));
    }
  };

  const handleDoubleClick = () => {
    // Handled by PdfPageRenderer internally now for better coordinate accuracy
  };





  const scrollToPage = (pageIdx: number) => {
    if (pages.length === 0) return;
    const safeIdx = Math.max(0, Math.min(pages.length - 1, pageIdx));

    // Calculate offset: Sum of heights of all previous pages + gaps
    const yOffset = pages.slice(0, safeIdx).reduce((acc, p) => acc + p.height, 0) + (safeIdx * 32);
    const scaledY = yOffset * viewport.scale;

    setViewport(v => clampViewport({ ...v, y: 20 - scaledY }));
    setCurrentPage(safeIdx + 1);
  };

  // Update current page based on scroll position
  useEffect(() => {
    if (pages.length === 0) return;

    // Using simple calculation: viewport.y mapping back to document space
    const docY = (20 - viewport.y) / viewport.scale;

    let accumulatedHeight = 0;
    let foundPage = 0;

    for (let i = 0; i < pages.length; i++) {
      const pageHeight = pages[i].height + 32; // basic page height + gap
      if (docY < accumulatedHeight + (pageHeight * 0.7)) { // 70% threshold
        foundPage = i;
        break;
      }
      accumulatedHeight += pageHeight;
      foundPage = i;
    }

    if (foundPage + 1 !== currentPage) {
      setCurrentPage(foundPage + 1);
      setPageInput((foundPage + 1).toString());
    }
  }, [viewport.y, viewport.scale, pages, currentPage]);

  const handleTextAction = (action: string, id: string | null, extra?: any) => {
    if (action === 'startDragLayer' && id && extra) {
      setDraggingLayerId(id);
      lastPos.current = { x: extra.x, y: extra.y };
    }
    else if (action === 'editNative' && id) {
      setTool('edit');
      setEditingId(id);
      setEditingType('native');
    }
    else if (action === 'editLayer' && id) {
      setTool('edit');
      setEditingId(id);
      setEditingType('layer');
    }
  };

  const handleSave = async () => {
    if (!file) return;
    if (setIsProcessing) setIsProcessing(true);
    try {
      const currentNativeEdits = nativeEditsRef.current;
      const currentTextLayers = textLayersRef.current;

      const arrayBuffer = await file.arrayBuffer();
      // Prepare map for services
      const layersMap: Record<string, TextLayer[]> = {};
      currentTextLayers.forEach(l => {
        if (!l.pageId) return;
        if (!layersMap[l.pageId]) layersMap[l.pageId] = [];
        layersMap[l.pageId].push(l);
      });

      const pageIds = pages.map(p => p.id);

      const addedTexts: AddedText[] = [];
      const fabricImages: Record<string, string> = {};

      fabricCanvases.current.forEach((fc, pageId) => {
        const textObjects = fc.getObjects('textbox');
        const pdfPage = pages.find(p => p.id === pageId);

        if (pdfPage && textObjects.length > 0) {
          // Calculate conversion ratio from Fabric Logical Space to PDF Point Space
          // fc.width here is the logical canvas width (page.width * scale)
          const canvasWidth = fc.width || 1;
          const ratio = pdfPage.width / canvasWidth;

          textObjects.forEach((obj: any) => {
            // Calculate final font size including user resizing (scaleY)
            const effectiveFontSize = obj.fontSize * obj.scaleY;

            addedTexts.push({
              id: Math.random().toString(36),
              pageId,
              pageIndex: parseInt(pageId.replace('p', '')),
              text: obj.text || '',
              // Map Logic: (Object Coord) * (PDF Width / Canvas Width)
              // This works regardless of what 'scale' was during editing
              x: (obj.left || 0) * ratio,
              y: (obj.top || 0) * ratio,
              fontSize: effectiveFontSize * ratio,
              fontFamily: obj.fontFamily || 'Inter',
              fontWeight: obj.fontWeight || 'normal',
              fontStyle: obj.fontStyle || 'normal',
              color: obj.fill as string || '#000000',
              width: (obj.width || 0) * obj.scaleX * ratio,
              lineHeight: obj.lineHeight
            });
          });
        }

        // Keep raster capture for non-text objects (drawings) if we add them later
        // or just as fallback. Currently Add Text is vector, so we don't need raster for text.
        // We can skip raster export for text pages to avoid duplication if we wanted,
        // but currently applyNativeEdits uses an empty object for fabricImages argument anyway
        // in the implementation plan we updated.
        // Actually, let's keep it safe:
        if (fc.getObjects().length > textObjects.length) {
          // There are non-text objects (drawings?), capture them?
          // For now, let's just leave it empty if we are purely doing vector text
          // to avoid double-rendering or ghost images.
          // If user only added text, length == textObjects.length.
        }
      });

      const blob = await applyNativeEdits(
        arrayBuffer,
        currentNativeEdits,
        detectedText,
        layersMap,
        pageIds,
        pages,
        [], // No drawing paths for now
        {}, // No raster images for text
        addedTexts // New Vector Data
      );

      // Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edited_${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Failed to save PDF. See console.");
    }
    if (setIsProcessing) setIsProcessing(false);
  };

  // Custom save handler for inline editor
  const handleInlineSave = (val: string, color?: string, bg?: string, size?: number, family?: string, weight?: string, fontStyle?: string) => {
    if (!editingId) return;

    if (editingType === 'native') {
      let foundItem: NativeTextItem | undefined;
      for (const items of Object.values(detectedText)) {
        const match = items.find(i => i.id === editingId);
        if (match) { foundItem = match; break; }
      }

      const updatedEdits = {
        ...nativeEditsRef.current,
        [editingId]: {
          originalId: editingId,
          pageIndex: foundItem?.pageIndex ?? nativeEditsRef.current[editingId]?.pageIndex ?? 0,
          text: val,
          color: color || nativeEditsRef.current[editingId]?.color || '#000000',
          backgroundColor: bg || nativeEditsRef.current[editingId]?.backgroundColor,
          fontSize: size || nativeEditsRef.current[editingId]?.fontSize || foundItem?.h,
          fontFamily: family || nativeEditsRef.current[editingId]?.fontFamily,
          fontWeight: weight || nativeEditsRef.current[editingId]?.fontWeight || 'normal',
          fontStyle: fontStyle || nativeEditsRef.current[editingId]?.fontStyle || 'normal'
        }
      };
      setNativeEdits(updatedEdits);
      nativeEditsRef.current = updatedEdits;

    } else if (editingType === 'layer') {
      const updatedLayers = textLayersRef.current.map(l => l.id === editingId ? {
        ...l,
        text: val,
        color: color || l.color,
        fontSize: size || l.fontSize,
        fontFamily: family || l.fontFamily,
        fontWeight: weight || l.fontWeight,
        fontStyle: (fontStyle as any) || l.fontStyle
      } : l);
      setTextLayers(updatedLayers);
      textLayersRef.current = updatedLayers;
    }
    setEditingId(null);
  };



  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-[#1a1a1a] overflow-hidden text-white">
      {/* Mobile Header */}
      <div className="md:hidden h-14 bg-[#0d0d12] border-b border-white/10 flex items-center justify-between px-4 z-[100] shrink-0 pointer-events-auto">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar max-w-[75%]">
          <button
            onClick={onBack}
            className="p-1.5"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="flex items-center gap-1">
            <button onClick={() => setTool('hand')} className={`p-1.5 rounded-lg shrink-0 ${tool === 'hand' ? 'bg-purple-600' : 'text-white/50'}`}>
              <Hand size={16} />
            </button>
            <button onClick={() => setTool('edit')} className={`p-1.5 rounded-lg shrink-0 ${tool === 'edit' ? 'bg-purple-600' : 'text-white/50'}`}>
              <FileEdit size={16} />
            </button>
            <div className="flex items-center gap-4 ml-1">
              <button
                onClick={() => {
                  setIsAutoFit(true);
                  fitToScreen(false);
                }}
                className="p-1.5 text-white/50 hover:text-white"
                title="Reset Zoom"
              >
                <RefreshCcw size={14} />
              </button>
              <button
                onClick={() => {
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  const center = { x: rect.width / 2, y: rect.height / 2 };
                  const d = 0.15;
                  setViewport(v => {
                    setIsAutoFit(false);
                    const newScale = Math.min(5, v.scale + d);
                    const sRatio = newScale / v.scale;
                    const newX = center.x - (center.x - v.x) * sRatio;
                    const newY = center.y - (center.y - v.y) * sRatio;
                    return clampViewport({ x: newX, y: newY, scale: newScale }, newScale);
                  });
                }}
                className="p-1.5 text-white/50 hover:text-white"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-1 shrink-0">
          <button onClick={handleSave} className="px-3 py-1.5 bg-purple-600 text-[10px] font-black uppercase rounded-lg">Save</button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#0d0d12] border-r border-white/10 flex-col z-[100] overflow-hidden pointer-events-auto">
        <div className="p-4 flex-1 flex flex-col min-h-0">
          <div className="flex items-center gap-3 mb-6 shrink-0">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.3)]">
              <FileEdit className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-tight">PDF Editor</h3>
              <p className="text-[10px] text-orange-500/80 font-bold uppercase tracking-widest">Stack Architect</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4">
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => {
                  setIsAutoFit(true);
                  fitToScreen(false);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 transition-all border border-purple-500/20"
              >
                <RefreshCcw size={14} /> <span className="text-[10px] font-bold uppercase tracking-widest">Reset Zoom</span>
              </button>
              <button
                onClick={() => {
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  const center = { x: rect.width / 2, y: rect.height / 2 };
                  const d = 0.2;
                  setViewport(v => {
                    setIsAutoFit(false);
                    const newScale = Math.min(5, v.scale + d);
                    const sRatio = newScale / v.scale;
                    const newX = center.x - (center.x - v.x) * sRatio;
                    const newY = center.y - (center.y - v.y) * sRatio;
                    return clampViewport({ x: newX, y: newY, scale: newScale }, newScale);
                  });
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all border border-white/5"
              >
                <Plus size={14} /> <span className="text-[10px] font-bold uppercase tracking-widest">Zoom In</span>
              </button>
            </div>


            <div className="flex gap-2 mb-2">
              <button
                onClick={onBack}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all border border-white/5 group"
              >
                <ArrowLeft size={10} className="group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-[8px] font-black uppercase tracking-widest">Back</span>
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all border border-white/5 group"
              >
                <Home size={10} />
                <span className="text-[8px] font-black uppercase tracking-widest">Home</span>
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setTool('hand')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${tool === 'hand' ? 'bg-purple-600' : 'hover:bg-white/5'}`}
              >
                <Hand size={18} /> <span className="text-sm font-medium">Pan Tool</span>
              </button>
              <button
                onClick={() => setTool('edit')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${tool === 'edit' ? 'bg-purple-600' : 'hover:bg-white/5'}`}
              >
                <FileEdit size={18} /> <span className="text-sm font-medium">Edit Text</span>
              </button>


              <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <p className="text-xs text-blue-200 leading-relaxed">
                  <strong>Tip:</strong> Select 'Edit Text' to modify existing content.
                </p>
              </div>

              {/* Page Navigator */}
              <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">Navigation</h4>
                  <span className="text-[10px] font-bold text-purple-400">{pages.length} Pages</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => scrollToPage(currentPage - 2)}
                    disabled={currentPage <= 1}
                    className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent rounded-lg flex items-center justify-center transition-colors"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <div className="flex-1 flex items-center justify-center bg-white/5 rounded-lg border border-white/10 h-9 px-3 gap-2">
                    <input
                      type="text"
                      value={pageInput}
                      onChange={(e) => setPageInput(e.target.value.replace(/\D/g, ''))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const p = parseInt(pageInput);
                          if (!isNaN(p)) scrollToPage(p - 1);
                        }
                      }}
                      onBlur={() => {
                        const p = parseInt(pageInput);
                        if (!isNaN(p)) scrollToPage(p - 1);
                        else setPageInput(currentPage.toString());
                      }}
                      className="w-10 bg-transparent text-center text-sm font-black text-white outline-none"
                    />
                    <span className="text-[10px] text-white/40 border-l border-white/10 pl-2 font-medium">of {pages.length}</span>
                  </div>
                  <button
                    onClick={() => scrollToPage(currentPage)}
                    disabled={currentPage >= pages.length}
                    className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent rounded-lg flex items-center justify-center transition-colors"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
              </div>
            </div>

          </div>

          <div className="pt-4 mt-auto border-t border-white/5 pointer-events-auto">
            <button onClick={handleSave} className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-white/90 flex items-center justify-center gap-2">
              <Download size={18} /> Export PDF
            </button>
            <button onClick={onBack} className="w-full py-3 mt-2 text-white/50 hover:text-white text-xs font-medium">Exit Editor</button>
          </div>
        </div>
      </aside>

      {/* Canvas */}
      <main
        ref={containerRef}
        className={`flex-1 relative overflow-hidden bg-[#252525] touch-none ${tool === 'hand' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} overscroll-none select-none`}
        onDoubleClick={(e) => e.preventDefault()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
      >
        <div
          className={`absolute origin-top-left ${isActivelyPanning || isScrollingWheel ? '' : 'transition-transform duration-150 ease-out'}`}
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
            width: Math.max(...pages.map(p => p.width)),
            height: pages.reduce((acc, p) => acc + p.height, 0) + (pages.length - 1) * 32
          }}
        >
          <div className="flex flex-col items-start pb-20">
            {pages.map(page => (
              <PdfPageRenderer
                key={page.id}
                page={page}
                pdfDoc={pdfDoc}
                scale={1}
                textLayers={textLayers}
                nativeTextItems={detectedText[page.id] || []}
                nativeEdits={nativeEdits}
                onTextAction={handleTextAction}
                editingId={editingId}
                onSaveEdit={handleInlineSave}
                onCancelEdit={() => setEditingId(null)}
                tool={tool}
                onFabricInit={(id, fc) => {
                  fabricCanvases.current.set(id, fc);
                }}
              />
            ))}
          </div>
        </div>

        {/* Floating Scale Controls */}
        <div className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur border border-white/10 rounded-full px-4 py-2 gap-4 items-center">
          <button
            onClick={() => {
              setIsAutoFit(true);
              fitToScreen(false);
            }}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
            title="Reset Zoom"
          >
            <RefreshCcw size={16} className="text-purple-400" />
          </button>
          <span className="text-xs font-mono w-12 text-center">{Math.round(viewport.scale * 100)}%</span>
          <button onClick={() => { setIsAutoFit(false); setViewport(v => clampViewport(v, v.scale * 1.1)); }}><Plus size={16} /></button>
        </div>

        {/* Mobile Page Indicator/Controls handled in header now */}
      </main>



    </div>
  );
}
// test comment

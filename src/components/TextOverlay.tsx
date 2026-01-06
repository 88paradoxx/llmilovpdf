import React, { useRef, useState, useCallback, useEffect } from 'react';
import { TextLayer } from '../types';

interface Props {
  layers: TextLayer[];
  setLayers: (l: TextLayer[]) => void;
  readOnly?: boolean;
  editingId?: string | null;
  setEditingId?: (id: string | null) => void;
  zoom?: number;
}

export default function TextOverlay({ layers, setLayers, readOnly = false, editingId, setEditingId, zoom = 1 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragInfo, setDragInfo] = useState<{ 
    id: string, 
    startX: number, 
    startY: number, 
    initialLayerX: number, 
    initialLayerY: number,
    initialBoxWidth: number,
    initialBoxHeight: number,
    action: 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
  } | null>(null);

  const handleStartAction = (e: React.MouseEvent | React.TouchEvent, layer: TextLayer, action: typeof dragInfo['action']) => {
    if (readOnly || layer.isNativeReplacement || editingId === layer.id) return;
    e.stopPropagation();
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;

    setDragInfo({
      id: layer.id,
      startX: clientX,
      startY: clientY,
      initialLayerX: layer.x,
      initialLayerY: layer.y,
      initialBoxWidth: layer.boxWidth,
      initialBoxHeight: layer.boxHeight,
      action
    });
  };

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (readOnly || !dragInfo || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((clientX - dragInfo.startX) / rect.width) * 100;
    const dy = ((clientY - dragInfo.startY) / rect.height) * 100;

    const layer = layers.find(l => l.id === dragInfo.id);
    if (!layer || layer.isNativeReplacement) return;

    if (dragInfo.action === 'move') {
      const nextX = dragInfo.initialLayerX + dx;
      const nextY = dragInfo.initialLayerY + dy;
      setLayers(layers.map(l => l.id === dragInfo.id ? { ...l, x: nextX, y: nextY } : l));
    } else {
      let nextW = dragInfo.initialBoxWidth;
      let nextH = dragInfo.initialBoxHeight;
      let nextX = dragInfo.initialLayerX;
      let nextY = dragInfo.initialLayerY;

      // Vertical resizing
      if (dragInfo.action.includes('s')) nextH = Math.max(1, dragInfo.initialBoxHeight + dy * 2);
      if (dragInfo.action.includes('n')) nextH = Math.max(1, dragInfo.initialBoxHeight - dy * 2);

      // Horizontal resizing based on Alignment Pivot
      if (layer.textAlign === 'left') {
        if (dragInfo.action.includes('e')) nextW = Math.max(1, dragInfo.initialBoxWidth + dx);
        if (dragInfo.action.includes('w')) {
          const moveX = Math.min(dx, dragInfo.initialBoxWidth - 1);
          nextW = dragInfo.initialBoxWidth - moveX;
          nextX = dragInfo.initialLayerX + moveX;
        }
      } else if (layer.textAlign === 'right') {
        if (dragInfo.action.includes('w')) nextW = Math.max(1, dragInfo.initialBoxWidth - dx);
        if (dragInfo.action.includes('e')) {
          const moveX = Math.max(dx, -(dragInfo.initialBoxWidth - 1));
          nextW = dragInfo.initialBoxWidth + moveX;
          nextX = dragInfo.initialLayerX + moveX;
        }
      } else {
        // Center alignment resizing (Symmetrical)
        if (dragInfo.action.includes('e')) nextW = Math.max(1, dragInfo.initialBoxWidth + dx * 2);
        if (dragInfo.action.includes('w')) nextW = Math.max(1, dragInfo.initialBoxWidth - dx * 2);
      }

      setLayers(layers.map(l => l.id === dragInfo.id ? { 
        ...l, 
        boxWidth: nextW, 
        boxHeight: nextH,
        x: nextX,
        y: nextY
      } : l));
    }
  }, [dragInfo, layers, setLayers, readOnly]);

  const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
  const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY);
  const onEnd = () => setDragInfo(null);

  useEffect(() => {
    if (dragInfo) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onEnd);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [dragInfo, onMouseMove]);

  const handleTextChange = (id: string, text: string) => {
    setLayers(layers.map(l => l.id === id ? { ...l, text } : l));
  };

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 pointer-events-none select-none overflow-hidden"
      style={{ containerType: 'inline-size' }}
    >
      {layers.filter(l => !l.hidden).map(l => {
        const shadowStyle = l.shadow 
          ? `${(l.shadowOffsetX || 0) * 0.1}em ${(l.shadowOffsetY || 0) * 0.1}em ${(l.shadowBlur || 0) * 0.1}em ${l.shadowColor || 'rgba(0,0,0,0.5)'}`
          : 'none';

        const strokeStyle = l.strokeWidth > 0 
          ? `${l.strokeWidth * 0.05}em ${l.strokeColor || '#000000'}`
          : 'none';

        const isReplacement = !!l.isNativeReplacement;
        const isEditing = editingId === l.id;

        // Dynamic horizontal translation based on alignment
        const translateX = l.textAlign === 'center' ? '-50%' : l.textAlign === 'right' ? '-100%' : '0%';
        const translateY = '-50%'; // Keep Y centered for vertical stability

        return (
          <div
            key={l.id}
            className={`absolute group transition-all flex ${
              l.verticalAlign === 'top' ? 'items-start' : l.verticalAlign === 'bottom' ? 'items-end' : 'items-center'
            } ${
              isReplacement ? 'pointer-events-none' : 'cursor-move pointer-events-auto border-2 border-dashed'
            } ${
              l.isHighlighted || isEditing ? 'ring-2 ring-purple-500 bg-purple-500/10 z-[100]' : dragInfo?.id === l.id ? 'border-purple-500' : 'border-transparent hover:border-purple-400/50'
            }`}
            style={{
              left: `${l.x}%`,
              top: `${l.y}%`,
              width: `${l.boxWidth}%`,
              height: `${l.boxHeight}%`,
              transform: `translate(${translateX}, ${translateY})`,
              color: l.color,
              fontFamily: l.fontFamily,
              fontSize: `${l.fontSize}cqi`,
              fontWeight: l.fontWeight,
              fontStyle: l.fontStyle,
              lineHeight: 1.0,
              opacity: l.opacity,
              textAlign: l.textAlign,
              textShadow: shadowStyle,
              WebkitTextStroke: strokeStyle,
              paintOrder: 'stroke fill',
              whiteSpace: 'normal',
              zIndex: l.isHighlighted || isEditing ? 100 : (dragInfo?.id === l.id ? 90 : 10),
            }}
            onClick={(e) => {
               e.stopPropagation();
               if (!readOnly && !isReplacement && setEditingId && !isEditing) {
                  setEditingId(l.id);
               }
            }}
            onMouseDown={(e) => handleStartAction(e, l, 'move')}
            onTouchStart={(e) => handleStartAction(e, l, 'move')}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (!isReplacement && setEditingId) {
                setEditingId(l.id);
              }
            }}
          >
            {isEditing ? (
              <textarea
                autoFocus
                className="w-full h-full bg-transparent border-0 outline-none p-0 resize-none text-inherit font-inherit leading-inherit"
                value={l.text}
                onChange={(e) => handleTextChange(l.id, e.target.value)}
                style={{ textAlign: l.textAlign }}
              />
            ) : (
              <div className={`w-full pointer-events-none p-0 ${isReplacement ? 'overflow-hidden' : ''} whitespace-pre-wrap`}>
                {l.text}
              </div>
            )}
            
            {!readOnly && !isReplacement && !isEditing && (
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                <Handle pos="nw" onStart={(e) => handleStartAction(e, l, 'nw')} />
                <Handle pos="ne" onStart={(e) => handleStartAction(e, l, 'ne')} />
                <Handle pos="sw" onStart={(e) => handleStartAction(e, l, 'sw')} />
                <Handle pos="se" onStart={(e) => handleStartAction(e, l, 'se')} />
                <Handle pos="n" onStart={(e) => handleStartAction(e, l, 'n')} />
                <Handle pos="s" onStart={(e) => handleStartAction(e, l, 's')} />
                <Handle pos="e" onStart={(e) => handleStartAction(e, l, 'e')} />
                <Handle pos="w" onStart={(e) => handleStartAction(e, l, 'w')} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Handle({ pos, onStart }: { pos: string, onStart: (e: React.MouseEvent | React.TouchEvent) => void }) {
  const classes = {
    nw: "-top-1.5 -left-1.5 cursor-nwse-resize",
    ne: "-top-1.5 -right-1.5 cursor-nesw-resize",
    sw: "-bottom-1.5 -left-1.5 cursor-nesw-resize",
    se: "-bottom-1.5 -right-1.5 cursor-nwse-resize",
    n: "-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize",
    s: "-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize",
    e: "top-1/2 -translate-y-1/2 -right-1.5 cursor-ew-resize",
    w: "top-1/2 -translate-y-1/2 -left-1.5 cursor-ew-resize",
  };

  return (
    <div 
      className={`absolute w-2.5 h-2.5 bg-white border border-purple-600 rounded-sm shadow-md pointer-events-auto ${classes[pos as keyof typeof classes]} hover:scale-125 transition-transform`}
      onMouseDown={onStart}
      onTouchStart={onStart}
    />
  );
}


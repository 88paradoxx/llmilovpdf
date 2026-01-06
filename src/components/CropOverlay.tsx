
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface Props {
  crop: { x: number, y: number, w: number, h: number };
  setCrop: (c: { x: number, y: number, w: number, h: number }) => void;
}

export default function CropOverlay({ crop, setCrop }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const startPos = useRef({ x: 0, y: 0, cropX: 0, cropY: 0, cropW: 0, cropH: 0 });

  const getContainerSize = () => {
    if (!containerRef.current) return { width: 0, height: 0 };
    return {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight
    };
  };

  const startAction = (clientX: number, clientY: number, action: string) => {
    setIsDragging(action === 'move');
    setIsResizing(action !== 'move' ? action : null);
    startPos.current = {
      x: clientX,
      y: clientY,
      cropX: crop.x,
      cropY: crop.y,
      cropW: crop.w,
      cropH: crop.h
    };
  };

  const handleMouseDown = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    startAction(e.clientX, e.clientY, action);
  };

  const handleTouchStart = (e: React.TouchEvent, action: string) => {
    e.stopPropagation();
    const touch = e.touches[0];
    startAction(touch.clientX, touch.clientY, action);
  };

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging && !isResizing) return;
    const { width, height } = getContainerSize();
    if (width === 0 || height === 0) return;

    const dx = ((clientX - startPos.current.x) / width) * 100;
    const dy = ((clientY - startPos.current.y) / height) * 100;

    let nextX = startPos.current.cropX;
    let nextY = startPos.current.cropY;
    let nextW = startPos.current.cropW;
    let nextH = startPos.current.cropH;

    if (isDragging) {
      nextX = Math.max(0, Math.min(100 - nextW, startPos.current.cropX + dx));
      nextY = Math.max(0, Math.min(100 - nextH, startPos.current.cropY + dy));
    } else if (isResizing) {
      // Logic for 8-way resize
      if (isResizing.includes('e')) {
        nextW = Math.max(5, Math.min(100 - nextX, startPos.current.cropW + dx));
      }
      if (isResizing.includes('w')) {
        const potentialX = Math.max(0, Math.min(startPos.current.cropX + startPos.current.cropW - 5, startPos.current.cropX + dx));
        nextW = startPos.current.cropW + (startPos.current.cropX - potentialX);
        nextX = potentialX;
      }
      if (isResizing.includes('s')) {
        nextH = Math.max(5, Math.min(100 - nextY, startPos.current.cropH + dy));
      }
      if (isResizing.includes('n')) {
        const potentialY = Math.max(0, Math.min(startPos.current.cropY + startPos.current.cropH - 5, startPos.current.cropY + dy));
        nextH = startPos.current.cropH + (startPos.current.cropY - potentialY);
        nextY = potentialY;
      }
    }

    setCrop({ x: nextX, y: nextY, w: nextW, h: nextH });
  }, [isDragging, isResizing, setCrop]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  }, [handleMove]);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  }, [handleMove]);

  const onEnd = useCallback(() => {
    setIsDragging(false);
    setIsResizing(null);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [onMouseMove, onTouchMove, onEnd]);

  // Styling based on 0-100 percentages
  const style = {
    left: `${crop.x}%`,
    top: `${crop.y}%`,
    width: `${crop.w}%`,
    height: `${crop.h}%`
  };

  const handles = [
    { name: 'nw', class: '-top-1.5 -left-1.5 cursor-nw-resize' },
    { name: 'ne', class: '-top-1.5 -right-1.5 cursor-ne-resize' },
    { name: 'sw', class: '-bottom-1.5 -left-1.5 cursor-sw-resize' },
    { name: 'se', class: '-bottom-1.5 -right-1.5 cursor-se-resize' },
    { name: 'n', class: '-top-1.5 left-1/2 -translate-x-1/2 cursor-n-resize' },
    { name: 's', class: '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-s-resize' },
    { name: 'e', class: 'top-1/2 -translate-y-1/2 -right-1.5 cursor-e-resize' },
    { name: 'w', class: 'top-1/2 -translate-y-1/2 -left-1.5 cursor-w-resize' },
  ];

  const isActive = isDragging || !!isResizing;

  return (
    <div ref={containerRef} className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
      <div 
        className="absolute border-2 border-dashed border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-auto cursor-move"
        style={style}
        onMouseDown={(e) => handleMouseDown(e, 'move')}
        onTouchStart={(e) => handleTouchStart(e, 'move')}
      >
        {/* Real-time Dimensions Badge */}
        {isActive && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-3 py-1 rounded-full text-[10px] font-black shadow-xl flex items-center gap-1.5 whitespace-nowrap animate-in fade-in slide-in-from-bottom-2">
            <span>{Math.round(crop.w)}%</span>
            <span className="opacity-50">×</span>
            <span>{Math.round(crop.h)}%</span>
          </div>
        )}

        {/* Rule of Thirds Grid */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20 pointer-events-none">
          <div className="border-r border-b border-white"></div>
          <div className="border-r border-b border-white"></div>
          <div className="border-b border-white"></div>
          <div className="border-r border-b border-white"></div>
          <div className="border-r border-b border-white"></div>
          <div className="border-b border-white"></div>
          <div className="border-r border-white"></div>
          <div className="border-r border-white"></div>
          <div></div>
        </div>

        {handles.map((h) => (
          <div
            key={h.name}
            onMouseDown={(e) => handleMouseDown(e, h.name)}
            onTouchStart={(e) => handleTouchStart(e, h.name)}
            className={`absolute w-4 h-4 bg-purple-600 border-2 border-white rounded-full shadow-lg ${h.class} hover:scale-125 transition-transform`}
          />
        ))}
      </div>
    </div>
  );
}


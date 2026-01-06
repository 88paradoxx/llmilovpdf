import React, { useRef, useEffect, useState } from 'react';
import { DrawingPath, DrawingSettings } from '../types';

interface Props {
  paths: DrawingPath[];
  setPaths: (p: DrawingPath[] | ((prev: DrawingPath[]) => DrawingPath[])) => void;
  settings: DrawingSettings;
  readOnly?: boolean;
  zoom?: number;
}

export default function DrawingOverlay({ paths, setPaths, settings, readOnly = false, zoom = 1 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<DrawingPath | null>(null);

  // Initialize and Resize
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current || !canvasRef.current || !previewCanvasRef.current) return;
      const { offsetWidth, offsetHeight } = containerRef.current;

      // Update logic size to match display size for 1:1 pixel mapping
      if (canvasRef.current.width !== offsetWidth || canvasRef.current.height !== offsetHeight) {
        canvasRef.current.width = offsetWidth;
        canvasRef.current.height = offsetHeight;
        previewCanvasRef.current.width = offsetWidth;
        previewCanvasRef.current.height = offsetHeight;
        // Redraw persistent paths after resize
        redrawPersistent();
      }
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    if (containerRef.current) ro.observe(containerRef.current);

    return () => ro.disconnect();
  }, []);

  // Redraw persistent paths whenever paths array changes
  useEffect(() => {
    redrawPersistent();
  }, [paths, zoom]);

  const redrawPersistent = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    paths.forEach(p => drawPath(ctx, p));
  };

  const getPoint = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100
    };
  };

  const drawPath = (ctx: CanvasRenderingContext2D, path: DrawingPath) => {
    if (path.hidden || path.points.length === 0) return;
    const { width, height } = ctx.canvas;

    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Scale brush size
    const lineWidth = Math.max(1, (path.width / 800) * width);
    ctx.lineWidth = lineWidth;

    ctx.globalAlpha = path.opacity;
    ctx.strokeStyle = path.color;

    if (path.type === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }

    if (path.style === 'dashed') ctx.setLineDash([lineWidth * 2, lineWidth * 2]);
    if (path.style === 'dotted') ctx.setLineDash([lineWidth, lineWidth]);
    if (path.style === 'neon') {
      ctx.shadowBlur = lineWidth * 2;
      ctx.shadowColor = path.color;
    }

    ctx.beginPath();

    const toPx = (p: { x: number, y: number }) => ({
      x: (p.x / 100) * width,
      y: (p.y / 100) * height
    });

    const start = toPx(path.points[0]);
    ctx.moveTo(start.x, start.y);

    path.points.forEach(p => {
      const pt = toPx(p);
      ctx.lineTo(pt.x, pt.y);
    });

    ctx.stroke();
    ctx.restore();
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (readOnly) return;
    const point = getPoint(e);
    setIsDrawing(true);

    const newPath: DrawingPath = {
      id: Date.now().toString(),
      points: [point],
      color: settings.color,
      width: settings.brushSize, // Assumes setting is roughly 1-50
      opacity: settings.opacity,
      style: settings.style,
      type: settings.mode
    };
    setCurrentPath(newPath);

    const ctx = previewCanvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      drawPath(ctx, newPath);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentPath || readOnly) return;

    const point = getPoint(e);
    const updatedPath = {
      ...currentPath,
      points: [...currentPath.points, point]
    };
    setCurrentPath(updatedPath);

    const ctx = previewCanvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      drawPath(ctx, updatedPath);
    }
  };

  const stopDrawing = () => {
    if (!isDrawing || !currentPath) return;
    setIsDrawing(false);
    setPaths(prev => [...prev, currentPath]);
    setCurrentPath(null);

    const ctx = previewCanvasRef.current?.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  };

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 touch-none ${readOnly ? 'pointer-events-none' : 'cursor-crosshair'}`}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={stopDrawing}
    >
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      <canvas ref={previewCanvasRef} className="absolute inset-0 pointer-events-none" />
    </div>
  );
}


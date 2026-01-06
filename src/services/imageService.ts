
export const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!url.startsWith('blob:') && !url.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = (err) => {
      console.error("Image load failed:", url, err);
      reject(err);
    };
    img.src = url;
  });
};

let sharedTargetCanvas: HTMLCanvasElement | null = null;

/**
 * ULTRA-PRECISION LINEARIZED COMPRESSOR
 * Targeted for exactly fitting within a specific KB budget.
 */
export const resizeByTargetKB = async (
  sourceCanvas: HTMLCanvasElement, 
  targetKB: number, 
  format: string = 'image/jpeg'
): Promise<{ blob: Blob; width: number; height: number } | null> => {
  if (targetKB <= 0 || !sourceCanvas.width || !sourceCanvas.height) return null;
  
  if (!sharedTargetCanvas) {
    sharedTargetCanvas = document.createElement('canvas');
  }

  const isLossy = format === 'image/jpeg' || format === 'image/webp';
  let bestBlob: Blob | null = null;
  let bestWidth = sourceCanvas.width;
  let bestHeight = sourceCanvas.height;

  // STAGE 1: Quality Search at Original Resolution
  // This is the fastest way to get close without losing sharpness.
  if (isLossy) {
    let lowQ = 0.05;
    let highQ = 0.98;
    
    // 10 iterations = 2^10 (1024) steps of precision (~0.1% accuracy)
    for (let i = 0; i < 10; i++) {
      const midQ = (lowQ + highQ) / 2;
      const b: Blob | null = await new Promise((res) => sourceCanvas.toBlob(res, format, midQ));
      const sizeKB = (b?.size || 0) / 1024;

      if (b && sizeKB <= targetKB) {
        bestBlob = b;
        lowQ = midQ;
        // Convergence threshold: 99.5%
        if (sizeKB > targetKB * 0.995) break;
      } else {
        highQ = midQ;
      }
    }
  }

  // STAGE 2: Dimensional Scaling
  // Only if original resolution at lowest quality is still too large.
  const currentSizeKB = (bestBlob?.size || Infinity) / 1024;
  if (currentSizeKB > targetKB) {
    let lowScale = 0.05;
    let highScale = 0.99;
    let currentScale = Math.sqrt(targetKB / currentSizeKB); // Heuristic start

    for (let i = 0; i < 8; i++) {
      const tw = Math.max(1, Math.round(sourceCanvas.width * currentScale));
      const th = Math.max(1, Math.round(sourceCanvas.height * currentScale));
      
      sharedTargetCanvas.width = tw;
      sharedTargetCanvas.height = th;
      const ctx = sharedTargetCanvas.getContext('2d', { alpha: false });
      if (!ctx) break;

      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, tw, th);
      ctx.drawImage(sourceCanvas, 0, 0, tw, th);

      // Use a fixed optimized quality (0.75) for resolution search to maintain speed
      const b: Blob | null = await new Promise((res) => sharedTargetCanvas!.toBlob(res, format, 0.75));
      const sizeKB = (b?.size || 0) / 1024;

      if (b && sizeKB <= targetKB) {
        bestBlob = b;
        bestWidth = tw;
        bestHeight = th;
        lowScale = currentScale;
        if (sizeKB > targetKB * 0.99) break;
      } else {
        highScale = currentScale;
      }
      currentScale = (lowScale + highScale) / 2;
    }
  }

  // Final Cleanup
  if (sharedTargetCanvas) { sharedTargetCanvas.width = 1; sharedTargetCanvas.height = 1; }

  return bestBlob ? { blob: bestBlob, width: bestWidth, height: bestHeight } : null;
};

export const bakeDrawingToImage = async (
  imageUrl: string,
  paths: any[],
  textLayers: any[]
): Promise<string> => {
  const img = await loadImage(imageUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return imageUrl;

  // Draw original image
  ctx.drawImage(img, 0, 0);

  const toX = (px: number) => (px / 100) * canvas.width;
  const toY = (py: number) => (py / 100) * canvas.height;

  // Draw paths
  paths.filter(p => !p.hidden).forEach(path => {
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const lineWidth = (path.width / 100) * canvas.width;
    ctx.lineWidth = lineWidth;
    ctx.globalAlpha = path.opacity;

    if (path.style === 'dashed') ctx.setLineDash([lineWidth * 3, lineWidth * 2]);
    else if (path.style === 'dotted') ctx.setLineDash([lineWidth, lineWidth]);
    else if (path.style === 'neon') {
      ctx.shadowBlur = lineWidth * 2;
      ctx.shadowColor = path.color;
    }

    if (path.type === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = path.color;
    }

    if (path.type === 'brush' || path.type === 'eraser') {
      if (path.points.length < 1) { ctx.restore(); return; }
      ctx.beginPath();
      ctx.moveTo(toX(path.points[0].x), toY(path.points[0].y));
      path.points.forEach(p => ctx.lineTo(toX(p.x), toY(p.y)));
      ctx.stroke();
    } else if (path.type === 'rect') {
      if (path.points.length < 2) { ctx.restore(); return; }
      const p1 = path.points[0];
      const p2 = path.points[path.points.length - 1];
      ctx.strokeRect(toX(p1.x), toY(p1.y), toX(p2.x - p1.x), toY(p2.y - p1.y));
    } else if (path.type === 'circle') {
      if (path.points.length < 2) { ctx.restore(); return; }
      const p1 = path.points[0];
      const p2 = path.points[path.points.length - 1];
      const cx = toX(p1.x);
      const cy = toY(p1.y);
      const dx = toX(p2.x - p1.x);
      const dy = toY(p2.y - p1.y);
      const radius = Math.sqrt(dx * dx + dy * dy);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  });

  // Draw text layers
  textLayers.filter(l => !l.hidden).forEach(l => {
    ctx.save();
    ctx.globalAlpha = l.opacity;
    ctx.fillStyle = l.color;
    const fontSize = (l.fontSize / 100) * canvas.width;
    ctx.font = `${l.fontStyle} ${l.fontWeight} ${fontSize}px ${l.fontFamily}`;
    ctx.textAlign = l.textAlign;
    ctx.textBaseline = l.verticalAlign === 'top' ? 'top' : l.verticalAlign === 'bottom' ? 'bottom' : 'middle';

    if (l.shadow) {
      ctx.shadowColor = l.shadowColor;
      ctx.shadowBlur = l.shadowBlur;
      ctx.shadowOffsetX = (l.shadowOffsetX / 100) * canvas.width;
      ctx.shadowOffsetY = (l.shadowOffsetY / 100) * canvas.height;
    }

    if (l.strokeWidth > 0) {
      ctx.strokeStyle = l.strokeColor;
      ctx.lineWidth = (l.strokeWidth / 100) * canvas.width;
      ctx.strokeText(l.text, toX(l.x), toY(l.y));
    }

    ctx.fillText(l.text, toX(l.x), toY(l.y));
    ctx.restore();
  });

  return canvas.toDataURL('image/png');
};

export const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};


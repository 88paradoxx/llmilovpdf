import { NativeTextEdit, NativeTextItem, TextLayer, DrawingPath, PdfPage, AddedText } from '../types';

/**
 * High-Precision Structural PDF Engine
 * Converts browser-space percentages to native PDF coordinates (Bottom-Left origin).
 */
export const applyNativeEdits = async (
  originalBuffer: ArrayBuffer,
  nativeEdits: Record<string, NativeTextEdit>,
  detectedText: Record<string, NativeTextItem[]>,
  layersMap: Record<string, TextLayer[]>,
  pageIds: string[],
  pagesMetadata: PdfPage[],
  drawingPaths: DrawingPath[],
  fabricImages: Record<string, string> = {},
  addedTexts: AddedText[] = []
): Promise<Blob> => {
  const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');

  if (!PDFDocument || !rgb || !StandardFonts) {
    throw new Error("PDF library core components not found.");
  }

  const pdfDoc = await PDFDocument.load(originalBuffer);
  const pages = pdfDoc.getPages();

  const fontCache: Record<string, any> = {};

  const loadCustomFont = async (url: string) => {
    if (fontCache[url]) return fontCache[url];
    try {
      const resp = await fetch(url);
      const arrayBuffer = await resp.arrayBuffer();
      const font = await pdfDoc.embedFont(arrayBuffer);
      fontCache[url] = font;
      return font;
    } catch (e) {
      console.warn(`Failed to load font from ${url}, falling back to standard.`, e);
      return null;
    }
  };

  const resolvePdfFont = async (pdfjsFontName: string = '', overrideWeight?: string, overrideStyle?: string, overrideFamily?: string) => {
    const name = (overrideFamily || pdfjsFontName || '').toLowerCase();

    const isBold = overrideWeight === '700' || overrideWeight === 'bold' || name.includes('bold') || name.includes('heavy') || name.includes('black') || name.includes('700') || name.includes('800') || typeof overrideWeight === 'number' && overrideWeight >= 700;
    const isItalic = overrideStyle === 'italic' || name.includes('italic') || name.includes('oblique');

    // --- Custom High-Fidelity Font Mapping ---
    if (name.includes('inter')) {
      const font = await loadCustomFont(`https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGkyMZhrib2Bg-4.ttf`);
      if (font) return font;
    }
    if (name.includes('roboto')) {
      const font = await loadCustomFont(`https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.ttf`);
      if (font) return font;
    }
    if (name.includes('montserrat')) {
      const font = await loadCustomFont(`https://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4V32VJOt5-q5pqnc09OA.ttf`);
      if (font) return font;
    }
    if (name.includes('playfair')) {
      const font = await loadCustomFont(`https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvL-7mveZDIs7J1C1SJH0SSatBLVz_pqcSZA.ttf`);
      if (font) return font;
    }
    if (name.includes('dancing') || name.includes('cursive')) {
      const font = await loadCustomFont(`https://fonts.gstatic.com/s/dancingscript/v24/If2cXEE97Iq6-mS6mdf7K-6--U20ZXTm.ttf`);
      if (font) return font;
    }
    if (name.includes('oswald')) {
      const font = await loadCustomFont(`https://fonts.gstatic.com/s/oswald/v49/TK3iWkUHHAIjg752GT8G.ttf`);
      if (font) return font;
    }
    if (name.includes('open sans')) {
      const font = await loadCustomFont(`https://fonts.gstatic.com/s/opensans/v34/memvYaGs126MiZpBA-UvWbX2vVnXBbObj2OVTS-muw.ttf`);
      if (font) return font;
    }

    // --- Fallback Standard Logic ---
    let fontKey = StandardFonts.Helvetica;
    const isSerif = name.includes('serif') || name.includes('times') || name.includes('georgia') || name.includes('roman') || name.includes('playfair');
    const isMono = name.includes('mono') || name.includes('courier') || name.includes('console') || name.includes('fixed') || name.includes('fira');

    if (isSerif) {
      if (isBold && isItalic) fontKey = StandardFonts.TimesRomanBoldItalic;
      else if (isBold) fontKey = StandardFonts.TimesRomanBold;
      else if (isItalic) fontKey = StandardFonts.TimesRomanItalic;
      else fontKey = StandardFonts.TimesRoman;
    } else if (isMono) {
      if (isBold && isItalic) fontKey = StandardFonts.CourierBoldOblique;
      else if (isBold) fontKey = StandardFonts.CourierBold;
      else if (isItalic) fontKey = StandardFonts.CourierOblique;
      else fontKey = StandardFonts.Courier;
    } else {
      if (isBold && isItalic) fontKey = StandardFonts.HelveticaBoldOblique;
      else if (isBold) fontKey = StandardFonts.HelveticaBold;
      else if (isItalic) fontKey = StandardFonts.HelveticaOblique;
      else fontKey = StandardFonts.Helvetica;
    }

    if (!fontCache[fontKey]) {
      fontCache[fontKey] = await pdfDoc.embedFont(fontKey);
    }
    return fontCache[fontKey];
  };

  const hexToRgb = (hex: string) => {
    const h = hex.replace('#', '').trim() || '000000';
    const r = parseInt(h.substring(0, 2), 16) / 255;
    const g = parseInt(h.substring(2, 4), 16) / 255;
    const b_final = parseInt(h.substring(4, 6), 16) / 255;
    return rgb(isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b_final) ? 0 : b_final);
  };

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const pageId = pageIds[i];
    if (!pageId) continue;

    const { width, height } = page.getSize();
    const pageNativeEdits = Object.values(nativeEdits).filter(e => e.pageIndex === i);
    const pageTextItems = detectedText[pageId] || [];

    for (const edit of pageNativeEdits) {
      const item = pageTextItems.find(it => it.id === edit.originalId);
      if (!item) continue;

      const pX = item.x;
      const pY = item.y;
      const pH = item.h;
      const pW = item.w;

      let maskColor = edit.backgroundColor && edit.backgroundColor !== 'transparent' ? hexToRgb(edit.backgroundColor) : rgb(1, 1, 1);
      page.drawRectangle({ x: pX - 2, y: pY - 2, width: pW + 4, height: pH + 4, color: maskColor });

      const matchedFont = await resolvePdfFont(item.fontName, edit.fontWeight, edit.fontStyle, edit.fontFamily);
      page.drawText(edit.text, { x: pX, y: pY, size: edit.fontSize || pH, font: matchedFont, color: edit.color ? hexToRgb(edit.color) : rgb(0, 0, 0) });
    }

    const pageOverlays = layersMap[pageId] || [];
    for (const l of pageOverlays) {
      const pX_perc = (l.x / 100) * width;
      const pY_perc = height - ((l.y / 100) * height);
      const overlayFont = await resolvePdfFont(l.fontFamily, l.fontWeight, l.fontStyle);
      page.drawText(l.text, { x: pX_perc, y: pY_perc, size: l.fontSize || 12, font: overlayFont, color: hexToRgb(l.color) });
    }

    // Vector Added Texts
    const pageAddedTexts = addedTexts.filter(t => t.pageIndex === i); // Or use pageId logic if reliable
    for (const t of pageAddedTexts) {
      // PDF Coordinates: Bottom-Left
      // Fabric Y (t.y) is Top-Left. 
      // Approximate Baseline for generic sans-serif is top-left Y + Ascent (~0.8 * size) ? 
      // pdf-lib drawText places text such that baseline is at y.
      // So if t.y is top of box, we need y = height - (t.y + t.fontSize * 0.8) approx.
      // Let's use standard assumption: Top-Left Y -> Bottom-Left Y conversion.
      // y = height - t.y - textHeight. 
      // Using t.fontSize as simplistic textHeight.
      // Correction: width/height of textbox needs consideration? 
      // For single line, simplified:
      const pdfY = height - t.y - (t.fontSize * 0.75); // 0.75 factor to push baseline down from top

      const vFont = await resolvePdfFont(t.fontFamily, t.fontWeight as string, t.fontStyle);
      page.drawText(t.text, {
        x: t.x,
        y: pdfY,
        size: t.fontSize,
        font: vFont,
        color: hexToRgb(t.color),
        lineHeight: t.lineHeight ? t.fontSize * t.lineHeight : undefined,
        maxWidth: t.width // Handle wrapping if supported or needed
      });
    }

    if (fabricImages[pageId]) {
      // Keep legacy support or specific non-text checks
      // Since we extract text, fabricImages might be empty for text-only pages
      // But we still pass it for drawings if needed?
      // Current implementation in tool passes empty object if we switched fully.
    }

    const pagePaths = drawingPaths.filter(p => p.pageId === pageId);
    for (const path of pagePaths) {
      if (path.points.length < 2) continue;
      const color = hexToRgb(path.color);
      for (let j = 0; j < path.points.length - 1; j++) {
        const p1 = path.points[j];
        const p2 = path.points[j + 1];
        page.drawLine({
          start: { x: p1.x, y: height - p1.y },
          end: { x: p2.x, y: height - p2.y },
          thickness: path.width,
          color,
        });
      }
    }
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as any], { type: 'application/pdf' });
};

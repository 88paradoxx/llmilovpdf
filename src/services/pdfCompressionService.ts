
import { PDFDocument, PDFName } from 'pdf-lib';

export interface CompressedPdf {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  ratio: number;
}

/**
 * HIGH-SPEED NATIVE PDF COMPRESSION
 * 
 * Strategy: Structural Optimization
 * 1. Prune catalog bloat (XMP Metadata, Private Edit Data, Accessibility Trees).
 * 2. Wipe document metadata (Producer info, etc.).
 * 3. Page Cleanup (Remove embedded thumbnails).
 * 4. Object Stream Packing (Bundle hundreds of objects into a few compressed streams).
 */
export async function compressPdfNative(pdfBytes: ArrayBuffer): Promise<CompressedPdf> {
  const originalSize = pdfBytes.byteLength;
  
  // Fast load: disable metadata updates to save CPU cycles
  const pdfDoc = await PDFDocument.load(pdfBytes, { 
    updateMetadata: false,
    capNumbers: true 
  });

  const catalog = pdfDoc.catalog;

  // 1. SURGICAL DICTIONARY PRUNING
  // These keys often carry multi-megabyte payloads that don't affect visual rendering
  const junkKeys = [
    'Metadata',       // XMP Meta (Often includes full file history)
    'PieceInfo',      // App-specific data (Adobe Illustrator edit history)
    'StructTreeRoot', // Accessibility/Tagging (Can be massive in long docs)
    'OCProperties',   // Optional Content (Unused layers)
    'MarkInfo',       // Structural markers
    'ViewerPreferences'
  ];
  
  junkKeys.forEach(key => {
    try {
      catalog.delete(PDFName.of(key));
    } catch (e) {
      // Key doesn't exist, proceed
    }
  });

  // 2. METADATA ANONYMIZATION
  pdfDoc.setTitle('');
  pdfDoc.setAuthor('');
  pdfDoc.setSubject('');
  pdfDoc.setCreator('');
  pdfDoc.setProducer('');
  pdfDoc.setKeywords([]);

  // 3. PAGE-LEVEL RESOURCE CLEANUP
  const pages = pdfDoc.getPages();
  pages.forEach(page => {
    try {
      const node = page.node;
      node.delete(PDFName.of('Metadata'));
      node.delete(PDFName.of('PieceInfo'));
      node.delete(PDFName.of('Thumb')); // Remove embedded thumbnails (huge bloat)
    } catch (e) {}
  });

  // 4. STREAM COMPACTION & LINEARIZATION-STYLE SAVING
  // objectsPerSubset: bundles small objects together for higher Flate compression ratios.
  const compressedBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    updateFieldAppearances: false
  });

  const compressedSize = compressedBytes.byteLength;
  const ratio = 1 - (compressedSize / originalSize);

  return {
    blob: new Blob([compressedBytes as any], { type: 'application/pdf' }),
    originalSize,
    compressedSize,
    ratio: Math.max(0, ratio)
  };
}


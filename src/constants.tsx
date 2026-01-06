
import React from 'react';
import {
  Maximize,
  Edit3,
  Minimize2,
  Palette,
  RefreshCw,
  ShieldCheck,
  Type,
  PenTool,
  Share2,
  Layers,
  FileText,
  Scaling,
  Combine,
  Presentation,
  FileType,
  MonitorPlay,
  Lock,
  Sparkles,
  FileEdit,
  Scissors,
  Files,
  File,
  FileSpreadsheet
} from 'lucide-react';
import { ToolMetadata, SocialPreset } from './types';

export const TOOLS: ToolMetadata[] = [
  // --- PDF TOOLS GROUP ---
  { id: 'pdf_editor', name: 'PDF Editor', description: 'Edit native PDF text and objects directly', icon: <FileEdit />, color: 'bg-[#5551FF]' },
  { id: 'pdf_to_word', name: 'PDF to Word', description: 'Convert PDF documents to editable DOCX files', icon: <Files />, color: 'bg-[#3b82f6]' },
  { id: 'pdf_splitter', name: 'Split PDF', description: 'Extract ranges or split pages into separate files', icon: <Scissors />, color: 'bg-[#ea580c]' },
  { id: 'pdf_watermark', name: 'PDF Watermark', description: 'Add bulk watermarks to all pages of PDF files', icon: <Lock />, color: 'bg-[#b91c1c]' },
  { id: 'pdf', name: 'Image to PDF', description: 'Convert images to high-quality PDF documents', icon: <File />, color: 'bg-[#ef4444]' },
  { id: 'pdf_resizer', name: 'Compress PDF', description: 'Shrink PDF to exact KB/MB target sizes', icon: <Scaling />, color: 'bg-[#f97316]' },
  { id: 'pdf_merge', name: 'Merge PDF', description: 'Combine up to 10 PDF files into one document', icon: <Combine />, color: 'bg-[#6366f1]' },
  { id: 'text_to_pdf', name: 'Text to PDF', description: 'Create documents from text with custom styling', icon: <FileType />, color: 'bg-[#10b981]' },
  { id: 'text_to_ppt', name: 'Text to PPT', description: 'Generate presentation slides from text outline', icon: <MonitorPlay />, color: 'bg-[#4f46e5]' },
  { id: 'pdf_to_ppt', name: 'PDF to PPT', description: 'Convert PDF documents to high-quality PPTX slides', icon: <Presentation />, color: 'bg-[#c2410c]' },
  { id: 'pdf_to_excel', name: 'PDF to Excel', description: 'Convert PDF tables to editable Excel spreadsheets', icon: <FileSpreadsheet />, color: 'bg-[#16a34a]' },

  // --- IMAGE TOOLS GROUP ---
  { id: 'resize', name: 'Resize Image', description: 'Resize by dimensions or target file size (KB)', icon: <Maximize />, color: 'bg-[#3b82f6]' },
  { id: 'edit', name: 'Edit Image', description: 'Crop, rotate, and fine-tune adjustments', icon: <Edit3 />, color: 'bg-[#6366f1]' },
  { id: 'bg_remover', name: 'BG Remover', description: 'AI-powered client-side background removal', icon: <Sparkles />, color: 'bg-[#d946ef]' },
  { id: 'compress', name: 'Compress', description: 'Smart size reduction with zero quality loss', icon: <Minimize2 />, color: 'bg-[#10b981]' },
  { id: 'filters', name: 'Filters', description: 'Stackable presets for artistic looks', icon: <Palette />, color: 'bg-[#ec4899]' },
  { id: 'converter', name: 'Format Converter', description: 'Convert between JPG, PNG, and WebP', icon: <RefreshCw />, color: 'bg-[#f59e0b]' },
  { id: 'watermark', name: 'Watermark', description: 'Protect your work with custom marks', icon: <ShieldCheck />, color: 'bg-[#06b6d4]' },
  { id: 'text', name: 'Add Text', description: 'Overlay rich text for posters and banners', icon: <Type />, color: 'bg-[#8b5cf6]' },
  { id: 'drawing', name: 'Drawing Tool', description: 'Annotate and markup with freehand tools', icon: <PenTool />, color: 'bg-[#f97316]' },
  { id: 'social', name: 'Social Media', description: 'One-click presets for IG, YT, and more', icon: <Share2 />, color: 'bg-[#f472b6]' },
  { id: 'bulk', name: 'Bulk Process', description: 'Mass process up to 100 images at once', icon: <Layers />, color: 'bg-[#475569]' },
];

export const SOCIAL_PRESETS: SocialPreset[] = [
  { id: 'ig-post', platform: 'Instagram', name: 'Post', width: 1080, height: 1080 },
  { id: 'ig-story', platform: 'Instagram', name: 'Story', width: 1080, height: 1920 },
  { id: 'yt-thumb', platform: 'YouTube', name: 'Thumbnail', width: 1280, height: 720 },
  { id: 'fb-cover', platform: 'Facebook', name: 'Cover', width: 820, height: 312 },
  { id: 'li-banner', platform: 'LinkedIn', name: 'Banner', width: 1584, height: 396 },
  { id: 'x-header', platform: 'Twitter (X)', name: 'Header', width: 1500, height: 500 },
];

export const FILTERS = [
  { id: 'none', name: 'Normal', filter: '' },
  { id: 'bw', name: 'B&W', filter: 'grayscale(100%)' },
  { id: 'vintage', name: 'Vintage', filter: 'sepia(50%) contrast(110%)' },
  { id: 'warm', name: 'Warm', filter: 'sepia(20%) saturate(140%)' },
  { id: 'cool', name: 'Cool', filter: 'hue-rotate(30deg) saturate(110%)' },
  { id: 'cinematic', name: 'Cinematic', filter: 'contrast(120%) saturate(80%) brightness(90%)' },
  { id: 'matte', name: 'Matte', filter: 'contrast(80%) brightness(110%) saturate(70%)' },
];


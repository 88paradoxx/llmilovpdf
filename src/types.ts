
import React from 'react';

export type ToolId =
  | 'home' | 'about' | 'privacy' | 'terms' | 'contact'
  | 'resize' | 'edit' | 'compress' | 'filters' | 'converter'
  | 'watermark' | 'text' | 'drawing' | 'social' | 'bulk'
  | 'pdf' | 'pdf_resizer' | 'pdf_merge' | 'pdf_to_word'
  | 'text_to_pdf' | 'text_to_ppt' | 'pdf_watermark'
  | 'bg_remover' | 'pdf_editor' | 'pdf_splitter' | 'pdf_to_ppt' | 'pdf_to_excel';

export interface ImageState {
  originalUrl: string;
  currentUrl: string;
  width: number;
  height: number;
  format: string;
  size: number;
  name: string;
}

export type PenStyle = 'solid' | 'dashed' | 'dotted' | 'neon';

export interface DrawingPath {
  id: string;
  points: { x: number, y: number }[];
  color: string;
  width: number;
  opacity: number;
  style: PenStyle;
  type: 'brush' | 'eraser' | 'rect' | 'circle';
  hidden?: boolean;
  pageId?: string;
}

export interface DrawingSettings {
  mode: 'brush' | 'eraser' | 'rect' | 'circle';
  color: string;
  brushSize: number;
  opacity: number;
  style: PenStyle;
}

export interface TextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: string;
  fontStyle: 'normal' | 'italic';
  opacity: number;
  textAlign: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
  shadow: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  strokeWidth: number;
  strokeColor: string;
  boxWidth: number;
  boxHeight: number;
  hidden?: boolean;
  pageId?: string;
  isNativeReplacement?: boolean;
  isHighlighted?: boolean;
}

export interface ToolMetadata {
  id: ToolId;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export interface SocialPreset {
  id: string;
  platform: string;
  name: string;
  width: number;
  height: number;
}

export interface NativeTextItem {
  id: string;
  str: string;
  dir: string;
  width: number;
  height: number;
  transform: number[];
  fontName: string;
  x: number;
  y: number;
  pageIndex: number;
  w: number;
  h: number;
  bgColor?: { r: number, g: number, b: number };
}

export interface NativeTextEdit {
  originalId: string;
  text: string;
  pageIndex: number;
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  fontFamily?: string;
}

export interface TextBox {
  id?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number;
  str?: string;
  transform?: number[];
}

export interface PdfPage {
  id: string;
  index: number;
  width: number;
  height: number;
}

export interface EditorElement {
  id: string;
  pageIndex: number;
  type: 'mask' | 'text' | 'draw' | 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  content?: string;
  fontSize?: number;
  fontName?: string;
  points?: { x: number; y: number }[];
  opacity?: number;
}

export interface AddedText {
  id: string;
  pageId: string;
  pageIndex: number;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string | number;
  fontStyle: string;
  color: string;
  width?: number;
  lineHeight?: number;
}


import { ToolId } from '../types';

export const getToolPath = (toolId: ToolId | string): string => {
  const map: Partial<Record<ToolId | string, string>> = {
    pdf_editor: '/pdf-editor.html',
    pdf_to_word: '/pdf-to-word.html',
    pdf_splitter: '/pdf-split.html',
    pdf_watermark: '/pdf-watermark.html',
    pdf: '/image-to-pdf.html',
    pdf_resizer: '/pdf-compress.html',
    pdf_merge: '/pdf-merge.html',
    text_to_pdf: '/text-to-pdf.html',
    text_to_ppt: '/text-to-ppt.html',
    pdf_to_ppt: '/pdf-to-ppt.html',
    pdf_to_excel: '/pdf-to-excel.html',
    resize: '/image-resize.html',
    edit: '/image-editor.html',
    bg_remover: '/background-remover.html',
    compress: '/image-compress.html',
    filters: '/filters.html',
    converter: '/image-convert.html',
    watermark: '/watermark.html',
    text: '/text.html',
    drawing: '/drawing.html',
    social: '/social.html',
    bulk: '/bulk.html',
    home: '/',
    about: '/about.html',
    privacy: '/privacy.html',
    terms: '/terms.html',
    contact: '/contact.html',
  };
  return map[toolId] ?? '#';
};

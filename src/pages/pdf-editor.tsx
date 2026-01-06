import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import PdfEditorTool from '../components/tools/PdfEditorTool';
import { DrawingPath, DrawingSettings, ImageState, TextLayer } from '../types';
import { retrieveFile, clearFile } from '../services/fileHandoff';

const PdfEditorPage = () => {
  const [image, setImage] = useState<ImageState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [drawingPaths, setDrawingPaths] = useState<DrawingPath[]>([]);
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [pdfSubTool, setPdfSubTool] = useState<'draw' | 'text' | 'layers' | 'sync' | 'shapes' | 'eraser' | 'hand'>('sync');
  const [zoom, setZoom] = useState(1.0);
  const [file, setFile] = useState<File | null>(null);
  const drawingSettings = useMemo<DrawingSettings>(() => ({ mode: 'brush', color: '#000000', brushSize: 2, opacity: 1, style: 'solid' }), []);
  const [currentDrawingSettings, setCurrentDrawingSettings] = useState<DrawingSettings>(drawingSettings);

  useEffect(() => {
    const initFile = async () => {
      try {
        const storedFile = await retrieveFile();
        if (storedFile) {
          const initialState: ImageState = {
            originalUrl: '',
            currentUrl: '',
            width: 0,
            height: 0,
            format: 'application/pdf',
            size: storedFile.size,
            name: storedFile.name,
          };
          setImage(initialState);
          setFile(storedFile);

          const uploadSection = document.getElementById('static-upload-section');
          if (uploadSection) {
            uploadSection.style.display = 'none';
          }
          await clearFile();
        }
      } catch (e) {
        console.error("Failed to retrieve handoff file", e);
      }
    };
    initFile();
  }, []);

  useEffect(() => {
    const fileInput = document.getElementById('static-pdf-upload') as HTMLInputElement;
    const uploadSection = document.getElementById('static-upload-section');

    const handleFile = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const selectedFile = target.files[0];
        if (selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf')) {
          if (selectedFile.size > 100 * 1024 * 1024) {
            alert('The PDF file is too large. Max 100MB.');
            return;
          }
          const initialState: ImageState = {
            originalUrl: '',
            currentUrl: '',
            width: 0,
            height: 0,
            format: 'application/pdf',
            size: selectedFile.size,
            name: selectedFile.name,
          };
          setImage(initialState);
          setFile(selectedFile);
          if (uploadSection) {
            uploadSection.style.display = 'none';
          }
        } else {
          alert('Please select a valid PDF file.');
        }
      }
    };

    if (fileInput) {
      fileInput.addEventListener('change', handleFile);
    }

    const dropZone = fileInput?.parentElement;
    if (dropZone) {
      const handleDragOver = (e: Event) => {
        e.preventDefault();
        dropZone.classList.add('border-purple-500');
      };
      const handleDragLeave = (e: Event) => {
        e.preventDefault();
        dropZone.classList.remove('border-purple-500');
      };
      const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        dropZone.classList.remove('border-purple-500');
        if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
          const droppedFile = e.dataTransfer.files[0];
          if (droppedFile.type === 'application/pdf' || droppedFile.name.toLowerCase().endsWith('.pdf')) {
            if (droppedFile.size > 100 * 1024 * 1024) {
              alert('The PDF file is too large. Max 100MB.');
              return;
            }
            setFile(droppedFile);
            if (uploadSection) {
              uploadSection.style.display = 'none';
            }
          }
        }
      };

      dropZone.addEventListener('dragover', handleDragOver);
      dropZone.addEventListener('dragleave', handleDragLeave);
      dropZone.addEventListener('drop', handleDrop as EventListener);

      return () => {
        if (fileInput) fileInput.removeEventListener('change', handleFile);
        dropZone.removeEventListener('dragover', handleDragOver);
        dropZone.removeEventListener('dragleave', handleDragLeave);
        dropZone.removeEventListener('drop', handleDrop as EventListener);
      };
    }
  }, []);

  const updateImage = (newUrl: string, updates: Partial<ImageState> = {}) => {
    setImage((prev) => {
      const base: ImageState =
        prev ??
        ({
          originalUrl: '',
          currentUrl: '',
          width: 0,
          height: 0,
          format: 'application/pdf',
          size: 0,
          name: 'Untitled.pdf',
        } as ImageState);
      return { ...base, currentUrl: newUrl, ...updates };
    });
  };

  const handleDownload = async () => {
    if (!image?.currentUrl) {
      alert('No exported PDF is available yet. Use Bake/Export after making edits.');
      return;
    }
    const link = document.createElement('a');
    link.href = image.currentUrl;
    const fileName = image.name && image.name.toLowerCase().endsWith('.pdf') ? image.name : `ilovpdf-${Date.now()}.pdf`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBack = () => {
    const uploadSection = document.getElementById('static-upload-section');
    if (uploadSection) uploadSection.style.display = 'block';
    setFile(null);
    setImage(null);
    setDrawingPaths([]);
    setTextLayers([]);
    setPdfSubTool('sync');
    setZoom(1.0);
  };

  if (!file) return null;

  return (
    <div className="w-full h-screen bg-[#0d0d12] flex flex-col">
      <div className="flex-1 relative overflow-hidden">
        <PdfEditorTool
          image={image!}
          updateImage={updateImage}
          setIsProcessing={setIsProcessing}
          isProcessing={isProcessing}
          drawingPaths={drawingPaths}
          setPaths={setDrawingPaths}
          drawingSettings={currentDrawingSettings}
          setDrawingSettings={setCurrentDrawingSettings}
          pdfSubTool={pdfSubTool}
          setPdfSubTool={setPdfSubTool}
          zoom={zoom}
          setZoom={setZoom}
          onDownload={handleDownload}
          textLayers={textLayers}
          setTextLayers={setTextLayers}
          file={file}
          onBack={handleBack}
        />
      </div>
    </div>
  );
};

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <PdfEditorPage />
    </React.StrictMode>
  );
}



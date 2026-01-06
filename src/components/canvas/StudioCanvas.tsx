
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DrawingPath, DrawingSettings, TextLayer } from '../../types';
import DrawingOverlay from '../DrawingOverlay';
import TextOverlay from '../TextOverlay';

interface Props {
  imageUrl: string;
  drawingPaths: DrawingPath[];
  setDrawingPaths: (paths: DrawingPath[] | ((prev: DrawingPath[]) => DrawingPath[])) => void;
  drawingSettings: DrawingSettings;
  textLayers: TextLayer[];
  setTextLayers: (layers: TextLayer[]) => void;
  isDrawingActive: boolean;
  isTextActive: boolean;
  zoom: number;
  editingTextId: string | null;
  setEditingTextId: (id: string | null) => void;
}

export default function StudioCanvas({
  imageUrl,
  drawingPaths,
  setDrawingPaths,
  drawingSettings,
  textLayers,
  setTextLayers,
  isDrawingActive,
  isTextActive,
  zoom,
  editingTextId,
  setEditingTextId
}: Props) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      className="relative group transition-all duration-500"
      style={{
        width: 'fit-content',
        margin: '0 auto',
      }}
    >
      {/* Canvas Container with Glassmorphism Border */}
      <div className="relative border-4 border-white/10 dark:border-slate-800/50 rounded-2xl md:rounded-[32px] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] bg-slate-200 dark:bg-slate-950 transition-transform duration-500 group-hover:scale-[1.005]">

        {/* Base Image Layer */}
        <img
          src={imageUrl}
          className="max-h-[60dvh] md:max-h-[65vh] max-w-full object-contain w-auto select-none block transition-opacity duration-700"
          style={{ opacity: isLoaded ? 1 : 0 }}
          alt="Studio Canvas"
          onLoad={() => setIsLoaded(true)}
          onDragStart={(e) => e.preventDefault()}
        />

        {/* Interaction Overlays */}
        {isLoaded && (
          <div className="absolute inset-0 z-10">
            {/* Drawing Layer */}
            <div className={`absolute inset-0 ${isDrawingActive ? 'z-50' : 'z-30'}`}>
              <DrawingOverlay
                paths={drawingPaths}
                setPaths={setDrawingPaths}
                settings={drawingSettings}
                readOnly={!isDrawingActive || !!editingTextId}
                zoom={zoom}
              />
            </div>

            {/* Text Layer */}
            <div className={`absolute inset-0 ${isTextActive || editingTextId ? 'z-50' : 'z-30'}`}>
              <TextOverlay
                layers={textLayers}
                setLayers={setTextLayers}
                readOnly={!isTextActive && !editingTextId}
                zoom={zoom}
                editingId={editingTextId}
                setEditingId={setEditingTextId}
              />
            </div>
          </div>
        )}

        {/* Loading State */}
        {!isLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-100 dark:bg-slate-900">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-500 animate-pulse">Initializing Canvas...</span>
          </div>
        )}
      </div>

      {/* Canvas Status Badge */}
      <div className="absolute -top-3 -right-3 z-30 px-3 py-1 bg-purple-600 text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        Studio Canvas v2
      </div>
    </div>
  );
}

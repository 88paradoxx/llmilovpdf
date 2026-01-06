
import React, { useState } from 'react';
import { DrawingPath, DrawingSettings, PenStyle, TextLayer } from '../../types';
import {
  Pen, Eraser, Square, Circle, Undo2, CheckCircle, Trash2,
  Download, Minus, MoreHorizontal, Sparkles, ArrowLeft,
  Home, Maximize2, Wind, Type, Layers, Palette, Settings2,
  Eye, EyeOff, Trash, Plus, Type as TypeIcon
} from 'lucide-react';

interface Props {
  paths: DrawingPath[];
  setPaths: (p: DrawingPath[] | ((prev: DrawingPath[]) => DrawingPath[])) => void;
  settings: DrawingSettings;
  setSettings: (s: DrawingSettings) => void;
  textLayers: TextLayer[];
  setTextLayers: (l: TextLayer[] | ((prev: TextLayer[]) => TextLayer[])) => void;
  activeTool: 'draw' | 'text';
  setActiveTool: (t: 'draw' | 'text') => void;
  onCommit?: () => Promise<any> | void;
  onDownload?: () => void;
  hideFooter?: boolean;
  onBack?: () => void;
}

export default function DrawingTool({
  paths, setPaths, settings, setSettings,
  textLayers, setTextLayers,
  activeTool, setActiveTool,
  onCommit, onDownload, hideFooter = false, onBack
}: Props) {
  const [activeTab, setActiveTab] = useState<'tools' | 'layers'>('tools');

  const drawTools = [
    { id: 'brush', icon: Pen, label: 'Brush' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'rect', icon: Square, label: 'Rect' },
    { id: 'circle', icon: Circle, label: 'Circle' }
  ];

  const styles: { id: PenStyle; icon: any }[] = [
    { id: 'solid', icon: Minus },
    {
      id: 'dashed', icon: ({ size }: { size: number }) => (
        <div className="flex gap-0.5">
          <Minus size={size / 2} />
          <Minus size={size / 2} />
        </div>
      )
    },
    { id: 'dotted', icon: MoreHorizontal },
    { id: 'neon', icon: Sparkles }
  ];

  const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#ffffff', '#000000'];

  const addTextLayer = () => {
    const newLayer: TextLayer = {
      id: Date.now().toString(),
      text: 'Double click to edit',
      x: 50,
      y: 50,
      fontSize: 5,
      fontFamily: 'Inter, sans-serif',
      color: settings.color,
      fontWeight: 'bold',
      fontStyle: 'normal',
      opacity: 1,
      textAlign: 'center',
      verticalAlign: 'middle',
      shadow: false,
      shadowColor: 'rgba(0,0,0,0.5)',
      shadowBlur: 5,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      strokeWidth: 0,
      strokeColor: '#000000',
      boxWidth: 40,
      boxHeight: 10
    };
    setTextLayers(prev => [...prev, newLayer]);
    setActiveTool('text');
  };

  const toggleVisibility = (id: string, type: 'path' | 'text') => {
    if (type === 'path') {
      setPaths(prev => prev.map(p => p.id === id ? { ...p, hidden: !p.hidden } : p));
    } else {
      setTextLayers(prev => prev.map(l => l.id === id ? { ...l, hidden: !l.hidden } : l));
    }
  };

  const deleteLayer = (id: string, type: 'path' | 'text') => {
    if (type === 'path') {
      setPaths(prev => prev.filter(p => p.id !== id));
    } else {
      setTextLayers(prev => prev.filter(l => l.id !== id));
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d12] text-white overflow-hidden p-4 md:p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center border border-white/10 shadow-lg shadow-orange-500/20">
              <Pen size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-tight text-[13px] leading-none text-white">Drawing Studio</h3>
              <p className="text-[9px] font-bold uppercase opacity-60 mt-1.5 tracking-widest text-orange-400">Creative Suite Pro</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between w-full">
          <button
            onClick={onBack}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all border border-white/5 group mr-2"
          >
            <ArrowLeft size={10} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-[8px] font-black uppercase tracking-widest">Back</span>
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all border border-white/5 group ml-2"
          >
            <Home size={10} />
            <span className="text-[8px] font-black uppercase tracking-widest">Home</span>
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
        <button
          onClick={() => setActiveTab('tools')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'tools' ? 'bg-orange-500 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
        >
          <Settings2 size={12} /> Tools
        </button>
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'layers' ? 'bg-orange-500 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
        >
          <Layers size={12} /> Layers ({paths.length + textLayers.length})
        </button>
      </div>

      {activeTab === 'tools' ? (
        <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 space-y-4 scrollbar-hide">
          {/* TOOL TYPE SELECTOR */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveTool('draw')}
              className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all ${activeTool === 'draw' ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'}`}
            >
              <Pen size={18} />
              <span className="text-[9px] font-black uppercase">Draw</span>
            </button>
            <button
              onClick={addTextLayer}
              className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all ${activeTool === 'text' ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'}`}
            >
              <TypeIcon size={18} />
              <span className="text-[9px] font-black uppercase">Text</span>
            </button>
          </div>

          {activeTool === 'draw' ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* DRAW TOOLS */}
              <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                {drawTools.map(t => {
                  const Icon = t.icon;
                  const isActive = settings.mode === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSettings({ ...settings, mode: t.id as any })}
                      className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all relative group ${isActive ? 'text-orange-500' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      {isActive && <div className="absolute inset-0 bg-orange-500/10 rounded-xl" />}
                      <Icon size={14} className="relative z-10" />
                      <span className="relative z-10 text-[8px] font-bold uppercase">{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* STROKE SETTINGS */}
              <div className="glass-surface-soft p-4 rounded-2xl border border-white/5 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Stroke Size</span>
                    <span className="text-[10px] font-black text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">{settings.brushSize}px</span>
                  </div>
                  <input
                    type="range" min="1" max="100" value={settings.brushSize}
                    onChange={(e) => setSettings({ ...settings, brushSize: Number(e.target.value) })}
                    className="w-full h-1.5 rounded-full appearance-none accent-orange-500 bg-white/5 cursor-pointer"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Opacity</span>
                    <span className="text-[10px] font-black text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">{Math.round(settings.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range" min="0.1" max="1" step="0.05" value={settings.opacity}
                    onChange={(e) => setSettings({ ...settings, opacity: Number(e.target.value) })}
                    className="w-full h-1.5 rounded-full appearance-none accent-orange-500 bg-white/5 cursor-pointer"
                  />
                </div>

                <div className="space-y-3">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Style</span>
                  <div className="flex gap-2 p-1 bg-black/20 rounded-xl border border-white/5">
                    {styles.map(s => {
                      const Icon = s.icon;
                      const isActive = settings.style === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => setSettings({ ...settings, style: s.id })}
                          className={`flex-1 h-9 flex items-center justify-center rounded-lg transition-all ${isActive ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          <Icon size={14} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* COLORS */}
              <div className="glass-surface-soft p-4 rounded-2xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Color Studio</span>
                  <input
                    type="color" value={settings.color}
                    onChange={(e) => setSettings({ ...settings, color: e.target.value })}
                    className="w-6 h-6 rounded-full overflow-hidden border-2 border-white/20 p-0 cursor-pointer bg-transparent"
                  />
                </div>
                <div className="flex gap-2 justify-between">
                  {colors.map(c => (
                    <button
                      key={c}
                      onClick={() => setSettings({ ...settings, color: c })}
                      className={`w-7 h-7 rounded-full transition-all relative ${settings.color === c ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#0d0d12]' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="glass-surface-soft p-8 rounded-2xl border border-white/5 text-center space-y-4">
                <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto">
                  <Type size={24} className="text-orange-500" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-[11px] font-black uppercase">Text Tool Active</h4>
                  <p className="text-[9px] text-white/40 leading-relaxed">Click "Add Text" to create a new layer. Double-click any text on the canvas to edit its content.</p>
                </div>
                <button
                  onClick={addTextLayer}
                  className="w-full py-3 bg-orange-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={14} /> Add New Text
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 space-y-2 scrollbar-hide">
          {paths.length === 0 && textLayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-white/20 space-y-2">
              <Layers size={32} />
              <span className="text-[10px] font-black uppercase tracking-widest">No Layers Yet</span>
            </div>
          ) : (
            <div className="space-y-2">
              {textLayers.map(l => (
                <div key={l.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 group">
                  <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-500">
                    <Type size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-white truncate">{l.text || 'Empty Text'}</p>
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Text Layer</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => toggleVisibility(l.id, 'text')}
                      className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white"
                    >
                      {l.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                    <button
                      onClick={() => deleteLayer(l.id, 'text')}
                      className="p-1.5 hover:bg-red-500/10 rounded-lg text-white/40 hover:text-red-500"
                    >
                      <Trash size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {[...paths].reverse().map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 group">
                  <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500">
                    {p.type === 'brush' ? <Pen size={14} /> : p.type === 'eraser' ? <Eraser size={14} /> : p.type === 'rect' ? <Square size={14} /> : <Circle size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-white truncate">{p.type.charAt(0).toUpperCase() + p.type.slice(1)} Path</p>
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">{p.points.length} Points</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => toggleVisibility(p.id, 'path')}
                      className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white"
                    >
                      {p.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                    <button
                      onClick={() => deleteLayer(p.id, 'path')}
                      className="p-1.5 hover:bg-red-500/10 rounded-lg text-white/40 hover:text-red-500"
                    >
                      <Trash size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FOOTER ACTIONS */}
      <div className="space-y-3 pt-4 border-t border-white/5 shrink-0">
        <div className="flex gap-2">
          <button
            onClick={() => setPaths(p => p.slice(0, -1))}
            disabled={paths.length === 0}
            className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
          >
            <Undo2 size={12} /> Undo
          </button>
          <button
            onClick={() => { setPaths([]); setTextLayers([]); }}
            disabled={paths.length === 0 && textLayers.length === 0}
            className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-30 rounded-xl text-[9px] font-black uppercase tracking-widest text-red-500 flex items-center justify-center gap-2 transition-all"
          >
            <Trash2 size={12} /> Clear
          </button>
        </div>

        {!hideFooter && onCommit && onDownload && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onCommit()}
              className="py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <CheckCircle size={14} /> Bake
            </button>
            <button
              onClick={onDownload}
              className="py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Download size={14} /> Export
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


import React, { useState } from 'react';
import { ImageState, TextLayer } from '../../types';
import {
  Plus,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Download,
  Type,
  ArrowLeft,
  Home
} from 'lucide-react';

interface Props {
  image: ImageState;
  layers: TextLayer[];
  setLayers: (l: TextLayer[]) => void;
  onCommit?: () => void | Promise<any>;
  onDownload?: () => void;
  hideFooter?: boolean;
  onBack?: () => void;
  editingId?: string | null;
  setEditingId?: (id: string | null) => void;
}

const FONTS = [
  { name: 'Inter (Sans)', val: 'Inter, sans-serif' },
  { name: 'Times (Serif)', val: "'Times New Roman', serif" },
  { name: 'Courier (Mono)', val: 'monospace' },
  { name: 'Cursive', val: 'cursive' },
  { name: 'Impact', val: 'Impact, sans-serif' },
];

const PRESET_COLORS = [
  '#ffffff', '#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'
];

export default function TextTool({ layers, setLayers, onCommit, onDownload, hideFooter = false, onBack, editingId, setEditingId }: Props) {
  const expandedId = editingId;
  const setExpandedId = setEditingId || (() => { });
  const [tab, setTab] = useState<'txt' | 'style'>('txt');

  const addLayer = () => {
    const nl: TextLayer = {
      id: Date.now().toString(),
      text: 'Double-click to edit',
      x: 50, y: 50,
      fontSize: 10,
      fontFamily: 'Inter, sans-serif',
      color: '#000000',
      fontWeight: '700',
      fontStyle: 'normal',
      opacity: 1,
      textAlign: 'center',
      verticalAlign: 'middle',
      shadow: true,
      shadowColor: '#000000',
      shadowBlur: 4,
      shadowOffsetX: 1,
      shadowOffsetY: 1,
      strokeWidth: 0,
      strokeColor: '#000000',
      boxWidth: 50,
      boxHeight: 10
    };
    setLayers([...layers, nl]);
    setExpandedId(nl.id);
  };

  const update = (id: string, u: Partial<TextLayer>) => setLayers(layers.map(l => l.id === id ? { ...l, ...u } : l));

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto scrollbar-hide space-y-6 md:space-y-8 bg-[#111114]">
      {/* HEADER */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center border border-white/10 shadow-lg shadow-purple-500/20">
              <Type size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-tight text-[13px] leading-none text-white">Text Tool</h3>
              <p className="text-[9px] font-bold uppercase opacity-60 mt-1.5 tracking-widest text-purple-400">Typography</p>
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
        <button
          onClick={addLayer}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all border border-white/5 group"
        >
          <Plus size={14} className="group-hover:scale-110 transition-transform" />
          <span className="text-[8px] font-black uppercase tracking-widest">Add Text Layer</span>
        </button>
      </div>

      <div className="flex flex-col flex-1 space-y-2.5 md:space-y-4 animate-in fade-in duration-300">
        <div className="flex-1 space-y-2 md:space-y-3">
          {layers.map((l, idx) => (
            <div key={l.id} className={`p-1.5 md:p-2.5 rounded-2xl md:rounded-3xl transition-all duration-500 overflow-hidden ${expandedId === l.id ? 'bg-slate-900/60 border border-purple-500/40 shadow-[0_20px_50px_rgba(139,92,246,0.15)] ring-1 ring-white/10' : 'bg-white/5 border border-white/5 hover:bg-white/10'}`}>
              <div className="flex items-center justify-between cursor-pointer group px-1" onClick={() => setExpandedId(expandedId === l.id ? null : l.id)}>
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className={`w-5 h-5 md:w-6 md:h-6 rounded-lg flex items-center justify-center text-[9px] md:text-[11px] font-black transition-all duration-500 ${expandedId === l.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'bg-white/10 text-slate-400 group-hover:bg-purple-500/20 group-hover:text-purple-300'}`}>{idx + 1}</div>
                  <span className={`text-[9px] md:text-[11px] font-black truncate tracking-tight transition-colors duration-500 ${expandedId === l.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{l.text || '...'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); setLayers(layers.filter(item => item.id !== l.id)); }} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all active:scale-90">
                    <Trash2 size={12} className="md:size-3.5" />
                  </button>
                </div>
              </div>

              {expandedId === l.id && (
                <div className="mt-2.5 space-y-3 md:space-y-4 pt-2.5 border-t border-white/5 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex gap-1 bg-slate-950/40 p-1 rounded-xl border border-white/5">
                    <button onClick={() => setTab('txt')} className={`flex-1 py-1.5 text-[8px] md:text-[9px] font-black uppercase rounded-lg transition-all ${tab === 'txt' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Content</button>
                    <button onClick={() => setTab('style')} className={`flex-1 py-1.5 text-[8px] md:text-[9px] font-black uppercase rounded-lg transition-all ${tab === 'style' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Style</button>
                  </div>

                  {tab === 'txt' ? (
                    <div className="space-y-3 md:space-y-4 px-1">
                      <div className="relative group/text">
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl blur opacity-0 group-focus-within/text:opacity-100 transition duration-500"></div>
                        <textarea
                          value={l.text}
                          onChange={(e) => update(l.id, { text: e.target.value })}
                          className="relative glass-input w-full rounded-xl outline-none resize-none p-3 text-[10px] md:text-[12px] font-medium leading-relaxed bg-slate-950/40 border-white/5 focus:border-purple-500/30 transition-all"
                          rows={2}
                          placeholder="Type your message..."
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <label className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Color & Align</label>
                        </div>
                        <div className="flex gap-2.5 items-center">
                          <div className="relative group/color shrink-0">
                            <input
                              type="color"
                              value={l.color}
                              onChange={(e) => update(l.id, { color: e.target.value })}
                              className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden p-0 border-2 border-white/10 cursor-pointer shadow-xl transition-transform hover:scale-110 active:scale-95 bg-transparent"
                              title="Custom Color"
                            />
                          </div>

                          <div className="flex flex-wrap gap-1.5 flex-1">
                            {PRESET_COLORS.map(c => (
                              <button
                                key={c}
                                onClick={() => update(l.id, { color: c })}
                                className={`w-4 h-4 md:w-5 md:h-5 rounded-full border border-white/10 transition-all hover:scale-125 active:scale-90 shadow-sm ${l.color === c ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-slate-900 scale-110' : 'opacity-80 hover:opacity-100'}`}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>

                          <div className="flex glass-surface-soft p-1 rounded-xl gap-1 border border-white/5 shadow-inner shrink-0">
                            {['left', 'center', 'right'].map(a => (
                              <button
                                key={a}
                                onClick={() => update(l.id, { textAlign: a as any })}
                                className={`w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg transition-all ${l.textAlign === a ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                              >
                                {a === 'left' ? <AlignLeft size={14} className="md:size-4" /> : a === 'center' ? <AlignCenter size={14} className="md:size-4" /> : <AlignRight size={14} className="md:size-4" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 px-1 pb-1">
                      <div className="space-y-1.5">
                        <label className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Typography</label>
                        <div className="relative group/select">
                          <select
                            value={l.fontFamily}
                            onChange={(e) => update(l.id, { fontFamily: e.target.value })}
                            className="relative glass-input w-full rounded-xl outline-none py-2 px-3 text-[10px] md:text-[12px] font-bold bg-slate-950/40 border-white/5 focus:border-purple-500/30 appearance-none transition-all cursor-pointer"
                          >
                            {FONTS.map(f => <option key={f.val} value={f.val} className="bg-slate-900 text-white">{f.name}</option>)}
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-purple-400 transition-colors">
                            <Type size={12} />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Scale</span>
                          <div className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20">
                            <span className="text-[9px] font-black text-purple-400">{Math.round(l.fontSize)}px</span>
                          </div>
                        </div>
                        <div className="relative flex items-center group/slider">
                          <div className="absolute left-0 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-600 to-pink-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" style={{ width: `${(l.fontSize / 40) * 100}%` }} />
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="40"
                            step="0.5"
                            value={l.fontSize}
                            onChange={(e) => update(l.id, { fontSize: Number(e.target.value) })}
                            className="relative w-full h-6 appearance-none bg-transparent cursor-pointer accent-purple-500 z-10"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Emphasis</label>
                          <div className="flex gap-1.5 bg-slate-950/40 p-1 rounded-xl border border-white/5">
                            <button onClick={() => update(l.id, { fontWeight: l.fontWeight === '700' ? '400' : '700' })} className={`flex-1 py-2 rounded-lg border transition-all duration-300 ${l.fontWeight === '700' ? 'bg-purple-600 border-purple-400 text-white shadow-lg' : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'}`}><Bold size={13} className="mx-auto" /></button>
                            <button onClick={() => update(l.id, { fontStyle: l.fontStyle === 'italic' ? 'normal' : 'italic' })} className={`flex-1 py-2 rounded-lg border transition-all duration-300 ${l.fontStyle === 'italic' ? 'bg-purple-600 border-purple-400 text-white shadow-lg' : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'}`}><Italic size={13} className="mx-auto" /></button>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Vertical</label>
                          <div className="flex bg-slate-950/40 p-1 rounded-xl gap-1 border border-white/5">
                            {[
                              { val: 'top', icon: <AlignStartVertical size={13} /> },
                              { val: 'middle', icon: <AlignCenterVertical size={13} /> },
                              { val: 'bottom', icon: <AlignEndVertical size={13} /> }
                            ].map(v => (
                              <button
                                key={v.val}
                                onClick={() => update(l.id, { verticalAlign: v.val as any })}
                                className={`flex-1 flex justify-center py-2 rounded-lg transition-all duration-300 ${l.verticalAlign === v.val ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20 border border-purple-400' : 'text-slate-500 hover:text-slate-300 border border-transparent'}`}
                              >
                                {v.icon}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="shrink-0 space-y-3">
        {!hideFooter && onCommit && onDownload && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button onClick={() => onCommit()} className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/20">
              <Plus size={14} /> Bake
            </button>
            <button onClick={onDownload} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5">
              <Download size={14} /> Export
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


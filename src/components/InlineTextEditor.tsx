import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Bold, Italic, Minus, Plus, X, Check } from 'lucide-react';

interface InlineTextEditorProps {
    initialValue: string;
    onSave: (text: string, color?: string, bg?: string, size?: number, family?: string, weight?: string, fontStyle?: string) => void;
    onCancel: () => void;
    style: React.CSSProperties;
    initialColor?: string;
    initialBackgroundColor?: string;
    initialFontSize?: number;
    initialFontFamily?: string;
    initialFontWeight?: string;
    initialFontStyle?: string;
    allowedTabs?: ('text' | 'bg' | 'font')[];
}

export default function InlineTextEditor({
    initialValue,
    onSave,
    onCancel,
    style,
    initialColor,
    initialBackgroundColor,
    initialFontSize,
    initialFontFamily,
    initialFontWeight,
    initialFontStyle,
    allowedTabs = ['text', 'bg', 'font']
}: InlineTextEditorProps) {
    const [text, setText] = useState(initialValue);
    const [color, setColor] = useState(initialColor || '#000000');
    const [bgColor, setBgColor] = useState(initialBackgroundColor || 'transparent');
    const [fontSize, setFontSize] = useState(initialFontSize || 16);
    const [fontFamily, setFontFamily] = useState(initialFontFamily || 'sans-serif');
    const [fontWeight, setFontWeight] = useState(initialFontWeight || 'normal');
    const [fontStyle, setFontStyle] = useState(initialFontStyle || 'normal');
    const [mode, setMode] = useState<'text' | 'bg' | 'font'>(allowedTabs[0] || 'text');

    const divRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!allowedTabs.includes(mode)) {
            setMode(allowedTabs[0] || 'text');
        }
        // Focus and select contents
        if (divRef.current) {
            divRef.current.focus();
            const range = document.createRange();
            range.selectNodeContents(divRef.current);
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
        }
    }, [allowedTabs]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Shift+Enter for new line, Enter to save (if desired, or just let click outside handle it)
        // For single line inputs usually Enter saves, but specialized text might want multiline.
        // Let's allow multiline:
        if (e.key === 'Escape') {
            onCancel();
        }
    };

    const colors = [
        '#000000', '#ffffff', '#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', 'transparent'
    ];

    const fonts = [
        { name: 'Sans', val: 'sans-serif' },
        { name: 'Serif', val: 'serif' },
        { name: 'Mono', val: 'monospace' },
        { name: 'Cursive', val: 'cursive' }
    ];

    // Determine position of toolbar
    const [toolbarPos, setToolbarPos] = useState<'top' | 'bottom'>('top');

    useLayoutEffect(() => {
        const updatePos = () => {
            if (divRef.current) {
                const rect = divRef.current.getBoundingClientRect();
                // If closer than 150px to top edge, flip to bottom
                // We check relative to viewport top (0)
                setToolbarPos(rect.top < 150 ? 'bottom' : 'top');
            }
        };
        // Update on mount, scroll, and resize
        updatePos();
        window.addEventListener('scroll', updatePos);
        window.addEventListener('resize', updatePos);
        return () => {
            window.removeEventListener('scroll', updatePos);
            window.removeEventListener('resize', updatePos);
        };
    }, []);

    // Click outside to save
    useEffect(() => {
        const handleOutside = (e: PointerEvent) => {
            // If clicking outside the wrapper (which includes toolbar and content)
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                // Save current state
                onSave(
                    divRef.current?.innerText || text,
                    color,
                    bgColor === 'transparent' ? undefined : bgColor,
                    fontSize,
                    fontFamily,
                    fontWeight,
                    fontStyle
                );
            }
        };
        document.addEventListener('pointerdown', handleOutside);
        return () => document.removeEventListener('pointerdown', handleOutside);
    }, [color, bgColor, fontSize, fontFamily, fontWeight, fontStyle, text, onSave]);

    // Extract transform from style to apply to the wrapper instead of the inner div
    const { transform, left, top, ...contentStyle } = style;

    return (
        <div ref={wrapperRef} className="absolute z-50 text-xs pointer-events-auto" style={{ left, top, transform }}>
            {/* Toolbar */}
            <div
                className={`absolute left-0 p-2 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl w-48 text-white flex flex-col gap-2 ${toolbarPos === 'top' ? 'bottom-full mb-8' : 'top-full mt-12'}`}
                onMouseDown={e => e.preventDefault()}
            >
                <div className="flex gap-1 border-b border-white/10 pb-2">
                    {allowedTabs.includes('text') && <div role="button" onMouseDown={(e) => { e.preventDefault(); setMode('text'); }} className={`flex-1 py-1 rounded cursor-pointer text-center ${mode === 'text' ? 'bg-purple-600' : 'hover:bg-white/10'}`}>Color</div>}
                    {allowedTabs.includes('bg') && <div role="button" onMouseDown={(e) => { e.preventDefault(); setMode('bg'); }} className={`flex-1 py-1 rounded cursor-pointer text-center ${mode === 'bg' ? 'bg-purple-600' : 'hover:bg-white/10'}`}>Bg</div>}
                    {allowedTabs.includes('font') && <div role="button" onMouseDown={(e) => { e.preventDefault(); setMode('font'); }} className={`flex-1 py-1 rounded cursor-pointer text-center ${mode === 'font' ? 'bg-purple-600' : 'hover:bg-white/10'}`}>Font</div>}
                </div>

                <div className="py-1">
                    {mode === 'text' && allowedTabs.includes('text') && (
                        <div className="flex gap-1 flex-wrap">
                            {colors.map(c => (
                                <div key={c} role="button" onMouseDown={(e) => { e.preventDefault(); setColor(c); }} className={`w-5 h-5 rounded-full border border-white/20 cursor-pointer ${color === c ? 'ring-2 ring-white' : ''}`} style={{ backgroundColor: c === 'transparent' ? 'transparent' : c }} />
                            ))}
                        </div>
                    )}
                    {mode === 'bg' && allowedTabs.includes('bg') && (
                        <div className="flex gap-1 flex-wrap">
                            {colors.map(c => (
                                <div key={c} role="button" onMouseDown={(e) => { e.preventDefault(); setBgColor(c); }} className={`w-5 h-5 rounded-full border border-white/20 cursor-pointer ${bgColor === c ? 'ring-2 ring-white' : ''}`} style={{ backgroundColor: c === 'transparent' ? 'transparent' : c }} />
                            ))}
                        </div>
                    )}
                    {mode === 'font' && allowedTabs.includes('font') && (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <div role="button" onMouseDown={(e) => { e.preventDefault(); setFontSize(s => Math.max(8, s - 2)); }} className="p-1 hover:bg-white/10 rounded cursor-pointer"><Minus size={12} /></div>
                                <span className="font-mono">{fontSize}px</span>
                                <div role="button" onMouseDown={(e) => { e.preventDefault(); setFontSize(s => Math.min(72, s + 2)); }} className="p-1 hover:bg-white/10 rounded cursor-pointer"><Plus size={12} /></div>
                            </div>
                            <div className="flex gap-1">
                                <div
                                    role="button"
                                    onMouseDown={(e) => { e.preventDefault(); setFontWeight(prev => prev === 'bold' ? 'normal' : 'bold'); }}
                                    className={`flex-1 py-1 rounded flex items-center justify-center border border-white/10 cursor-pointer ${fontWeight === 'bold' ? 'bg-purple-600' : 'hover:bg-white/10'}`}
                                >
                                    <Bold size={14} />
                                </div>
                                <div
                                    role="button"
                                    onMouseDown={(e) => { e.preventDefault(); setFontStyle(prev => prev === 'italic' ? 'normal' : 'italic'); }}
                                    className={`flex-1 py-1 rounded flex items-center justify-center border border-white/10 cursor-pointer ${fontStyle === 'italic' ? 'bg-purple-600' : 'hover:bg-white/10'}`}
                                >
                                    <Italic size={14} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                                {fonts.map(f => (
                                    <div key={f.val} role="button" onMouseDown={(e) => { e.preventDefault(); setFontFamily(f.val); }} className={`px-2 py-1 rounded text-left cursor-pointer ${fontFamily === f.val ? 'bg-white/20' : 'hover:bg-white/10'}`}>
                                        {f.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-between pt-2 border-t border-white/10 mt-1">
                    <div role="button" onMouseDown={(e) => { e.preventDefault(); onCancel(); }} className="text-white/50 hover:text-white cursor-pointer"><X size={14} /></div>
                    <div role="button" onMouseDown={(e) => {
                        e.preventDefault();
                        // Correct order: text, color, bg, size, family, weight, style
                        onSave(divRef.current?.innerText || text, color, bgColor === 'transparent' ? undefined : bgColor, fontSize, fontFamily, fontWeight, fontStyle);
                    }} className="text-green-400 hover:text-green-300 cursor-pointer"><Check size={14} /></div>
                </div>
            </div>

            <div
                ref={divRef}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => setText(e.currentTarget.innerText)}
                onKeyDown={handleKeyDown}
                className="outline-none overflow-hidden selection:bg-purple-500/30 whitespace-pre-wrap word-break-all"
                style={{
                    ...contentStyle,
                    left: 0, top: 0,
                    background: bgColor,
                    boxShadow: '0 0 0 1px #8b5cf6',
                    borderRadius: '2px',
                    color: color,
                    fontSize: `${fontSize}px`,
                    fontFamily: fontFamily,
                    fontWeight: fontWeight,
                    fontStyle: fontStyle,
                    minWidth: contentStyle.minWidth || contentStyle.width || '100px',
                    width: 'auto',
                    height: 'auto',
                    minHeight: contentStyle.minHeight || '1.2em',
                    lineHeight: '1.2',
                    display: 'inline-block'
                }}
            >
                {initialValue}
            </div>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { ImageState } from '../../types';
import { removeBackground } from '@imgly/background-removal';
import {
    Download,
    CheckCircle,
    Maximize2,
    ArrowLeft,
    Home,
    Plus,
    Sparkles,
    Layers,
    Palette,
    Image as ImageIcon
} from 'lucide-react';

interface Props {
    image: ImageState;
    updateImage: (url: string, updates?: Partial<ImageState>) => void;
    setIsProcessing: (v: boolean) => void;
    onDownload: () => void;
    onBack: () => void;
}

const SOLID_COLORS = [
    'transparent', '#ffffff', '#000000', '#f87171', '#fb923c', '#fbbf24',
    '#a3e635', '#4ade80', '#34d399', '#22d3ee', '#60a5fa', '#818cf8',
    '#a78bfa', '#c084fc', '#f472b6', '#fb7185', '#94a3b8', '#475569'
];

const BACKGROUND_IMAGES = [
    // Professional / Office
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1024&q=80',
    'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1024&q=80',
    'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1024&q=80',
    'https://images.unsplash.com/photo-1513128034602-7814ccbfd4ca?auto=format&fit=crop&w=1024&q=80',
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1024&q=80',

    // Nature / Outdoor
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1024&q=80',
    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1024&q=80',
    'https://images.unsplash.com/photo-1501854140884-074cf2b2c75d?auto=format&fit=crop&w=1024&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1024&q=80',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1024&q=80',

    // Urban / City
    'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1024&q=80',
    'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1024&q=80',
    'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1024&q=80',
    'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1024&q=80',
    'https://images.unsplash.com/photo-1496568816309-51d7c20e3b21?auto=format&fit=crop&w=1024&q=80',

    // Abstract / Texture
    'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1024&q=80',
    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1024&q=80',
    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1024&q=80',
    'https://images.unsplash.com/photo-1614850523060-8da1d56ae167?auto=format&fit=crop&w=1024&q=80',
    'https://images.unsplash.com/photo-1554147090-e1221a04a025?auto=format&fit=crop&w=1024&q=80',

    // Interior / Room
    'https://images.unsplash.com/photo-1484154218962-a1c002085d2f?auto=format&fit=crop&w=1024&q=80',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1024&q=80',
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1024&q=80',
    'https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=1024&q=80',
    'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=1024&q=80',

    // Studio / Clean
    'https://images.unsplash.com/photo-1463168864508-aa410b0d3810?auto=format&fit=crop&w=1024&q=80',
    'https://images.unsplash.com/photo-1514339891040-42845c088a28?auto=format&fit=crop&w=1024&q=80',
    'https://images.unsplash.com/photo-1509187313077-767f3945a0b7?auto=format&fit=crop&w=1024&q=80',
    'https://images.unsplash.com/photo-1586776978086-44445582c0f6?auto=format&fit=crop&w=1024&q=80',
    'https://images.unsplash.com/photo-1621538965620-8356c9a33842?auto=format&fit=crop&w=1024&q=80'
];

export default function BackgroundRemoverTool({ image, updateImage, setIsProcessing, onDownload, onBack }: Props) {
    const [removed, setRemoved] = useState(false);
    const [foregroundUrl, setForegroundUrl] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'colors' | 'prompts'>('colors');
    const [selectedBg, setSelectedBg] = useState<string>('transparent');
    const [progress, setProgress] = useState<number | null>(null);

    // Reset state when new image (originalUrl) is loaded
    useEffect(() => {
        setRemoved(false);
        setForegroundUrl(null);
        setSelectedBg('transparent');
        setProgress(null);
        setActiveTab('colors');
    }, [image.originalUrl]);

    // Load the foreground image for composition
    const compositeImage = async (bg: string) => {
        if (!foregroundUrl) return;
        setIsProcessing(true);

        try {
            // Prepare images
            const fgImg = new Image();
            await new Promise((resolve) => {
                fgImg.onload = resolve;
                fgImg.src = foregroundUrl;
            });

            let bgImg: HTMLImageElement | null = null;
            let bgIsColor = false;

            if (bg.startsWith('#') || bg === 'transparent') {
                bgIsColor = true;
            } else {
                bgImg = new Image();
                bgImg.crossOrigin = 'anonymous';
                await new Promise((resolve, reject) => {
                    if (bgImg) {
                        bgImg.onload = resolve;
                        bgImg.onerror = reject;
                        bgImg.src = bg;
                    }
                });
            }

            // Determine canvas size
            // User feedback: "Background images are cropped".
            // Fix: If a background image is selected, the canvas MUST match that background's dimensions exactly.
            // This ensures 0% cropping of the background. The foreground (subject) will be scaled/placed into it.

            let canvasWidth = fgImg.width;
            let canvasHeight = fgImg.height;

            if (bgImg) {
                canvasWidth = bgImg.width;
                canvasHeight = bgImg.height;
            }

            const canvas = document.createElement('canvas');
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // 1. Draw Background
            if (bgIsColor && bg !== 'transparent') {
                ctx.fillStyle = bg;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            } else if (bgImg) {
                // Draw background exactly 1:1 since canvas matches its size
                ctx.drawImage(bgImg, 0, 0, canvasWidth, canvasHeight);
            }

            // 2. Draw Foreground (Centered and Scaled to fit if needed)
            // We want to ensure the subject sits nicely in the scene.
            // If the subject is larger than the background, scale it down ('contain').
            // If the subject is smaller, we can keep it 1:1 (don't upscale).
            const scale = Math.min(
                canvas.width / fgImg.width,
                canvas.height / fgImg.height,
                1 // Don't upscale
            );

            const fgDrawW = fgImg.width * scale;
            const fgDrawH = fgImg.height * scale;

            const fgX = (canvas.width - fgDrawW) / 2;
            const fgY = (canvas.height - fgDrawH) / 2;

            ctx.drawImage(fgImg, fgX, fgY, fgDrawW, fgDrawH);

            // 3. Export
            canvas.toBlob((blob) => {
                if (blob) {
                    const newUrl = URL.createObjectURL(blob);
                    updateImage(newUrl, {
                        currentUrl: newUrl,
                        size: blob.size,
                        // If transparent, png. If solid/image, jpeg is usually smaller but lets stick to png for quality/consistency
                        format: 'image/png'
                    });
                }
                setIsProcessing(false);
            }, 'image/png');

        } catch (e) {
            console.error(e);
            setIsProcessing(false);
        }
    };

    const handleRemoveBackground = async () => {
        setIsProcessing(true);
        setRemoved(false);
        // Start simulated progress
        setProgress(10);

        let localProgress = 10;
        let shouldStop = false;

        // Deterministic smooth progress loop
        const simulateProgress = () => {
            if (shouldStop) return;

            // Logarithmic-like decay so it never stalls completely but slows down
            if (localProgress < 30) {
                localProgress += 2; // Fast start
            } else if (localProgress < 70) {
                localProgress += 0.5; // Medium middle
            } else if (localProgress < 95) {
                localProgress += 0.2; // Slow end
            }

            // Hard cap at 95% until actually done
            if (localProgress > 95) localProgress = 95;

            setProgress(localProgress);

            // 50ms = 20fps smooth updates
            if (!shouldStop) setTimeout(simulateProgress, 50);
        };

        // Start animation loop
        setTimeout(simulateProgress, 50);

        const resizeImage = async (url: string, maxDim: number): Promise<string> => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => {
                    let w = img.width;
                    let h = img.height;

                    if (w <= maxDim && h <= maxDim) {
                        resolve(url); // No resize needed
                        return;
                    }

                    if (w > h) {
                        h = Math.round(h * (maxDim / w));
                        w = maxDim;
                    } else {
                        w = Math.round(w * (maxDim / h));
                        h = maxDim;
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        resolve(url);
                        return;
                    }
                    ctx.drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', 0.9));
                };
                img.onerror = reject;
                img.src = url;
            });
        };

        try {
            // Yield to render initial state
            await new Promise(r => setTimeout(r, 50));

            // Resize for speed (User requested 1024px)
            const processedUrl = await resizeImage(image.currentUrl, 1024);

            const blob = await removeBackground(processedUrl, {
                progress: (key, current, total) => {
                    // Ignore real progress to prevent 100->0 jumps
                }
            });
            const url = URL.createObjectURL(blob);

            // Done!
            shouldStop = true;
            setProgress(100);

            // Show 100% for a moment
            await new Promise(r => setTimeout(r, 600));

            // Store the transparent version
            setForegroundUrl(url);
            setRemoved(true);
            setSelectedBg('transparent');

            // Update main view
            updateImage(url, {
                currentUrl: url,
                size: blob.size,
                format: 'image/png'
            });
        } catch (err) {
            console.error(err);
            alert("Failed to remove background. Please try again.");
            shouldStop = true;
        } finally {
            setIsProcessing(false);
            setProgress(null);
        }
    };

    const handleBgSelect = (bg: string) => {
        setSelectedBg(bg);
        compositeImage(bg);
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0a0c] text-white overflow-hidden p-3 md:p-4 space-y-4">
            {/* HEADER */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-xl flex items-center justify-center border border-white/20 shadow-xl shadow-fuchsia-500/20">
                            <Sparkles size={16} className="text-white drop-shadow-md" />
                        </div>
                        <div>
                            <h3 className="font-black uppercase tracking-tighter text-[13px] leading-none text-white">BG Remover</h3>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 animate-pulse" />
                                <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-fuchsia-400/80">AI Powered</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={onBack}
                        className="flex flex-col items-center justify-center gap-1.5 p-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-white/40 hover:text-white transition-all border border-white/5 group"
                    >
                        <ArrowLeft size={10} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[7px] font-black uppercase tracking-widest">Back</span>
                    </button>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="flex flex-col items-center justify-center gap-1.5 p-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-white/40 hover:text-white transition-all border border-white/5 group"
                    >
                        <Home size={10} />
                        <span className="text-[7px] font-black uppercase tracking-widest">Home</span>
                    </button>
                    <button
                        onClick={() => (document.getElementById('static-image-upload') as HTMLInputElement)?.click()}
                        className="col-span-2 flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl bg-fuchsia-600/10 hover:bg-fuchsia-600/20 text-fuchsia-400 hover:text-fuchsia-300 transition-all border border-fuchsia-500/20 group"
                    >
                        <Plus size={12} className="group-hover:rotate-90 transition-transform duration-300" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Upload New Image</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col space-y-3 overflow-y-auto pr-1 scrollbar-hide">
                {progress !== null ? (
                    <div className="bg-[#13131a] border border-white/10 p-5 rounded-3xl space-y-4 shadow-xl shadow-black/40">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-500 animate-pulse">Processing...</span>
                            <span className="text-3xl font-black text-fuchsia-500">{Math.round(progress)}%</span>
                        </div>

                        <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-fuchsia-600 to-purple-600 transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-2 opacity-50">
                            <ImageIcon size={10} className="text-white" />
                            <p className="text-[9px] font-bold uppercase tracking-wider text-white truncate max-w-[180px]">
                                {image.name}
                            </p>
                        </div>
                    </div>
                ) : !removed ? (
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-4">
                        <div className="text-center space-y-2">
                            <Layers className="w-8 h-8 text-fuchsia-500 mx-auto opacity-80" />
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Click 'Remove Background' to separate the subject from the background using client-side AI.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                        <div className="flex p-0.5 bg-black/20 rounded-lg shrink-0">
                            <button
                                onClick={() => setActiveTab('colors')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 text-[9px] font-black uppercase rounded-md transition-all ${activeTab === 'colors' ? 'bg-white/10 text-fuchsia-400' : 'text-slate-500 hover:text-slate-400'}`}
                            >
                                <Palette size={12} /> Colors
                            </button>
                            <button
                                onClick={() => setActiveTab('prompts')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 text-[9px] font-black uppercase rounded-md transition-all ${activeTab === 'prompts' ? 'bg-white/10 text-fuchsia-400' : 'text-slate-500 hover:text-slate-400'}`}
                            >
                                <ImageIcon size={12} /> Patterns
                            </button>
                        </div>

                        {activeTab === 'colors' ? (
                            <div className="grid grid-cols-4 gap-2">
                                {SOLID_COLORS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => handleBgSelect(c)}
                                        className={`aspect-square rounded-xl border relative transition-all duration-300 ${selectedBg === c ? 'border-fuchsia-500 scale-90 shadow-lg shadow-fuchsia-500/20' : 'border-white/10 hover:scale-95'}`}
                                        style={{
                                            backgroundColor: c === 'transparent' ? undefined : c,
                                            backgroundImage: c === 'transparent' ? 'linear-gradient(45deg, #1a1a1a 25%, transparent 25%), linear-gradient(-45deg, #1a1a1a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1a1a1a 75%), linear-gradient(-45deg, transparent 75%, #1a1a1a 75%)' : undefined,
                                            backgroundSize: c === 'transparent' ? '10px 10px' : undefined
                                        }}
                                    >
                                        {c === 'transparent' && <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-slate-500 uppercase tracking-wider">None</span>}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => (document.getElementById('bg-upload') as HTMLInputElement)?.click()}
                                        className="col-span-1 py-3 rounded-xl border border-dashed border-white/20 hover:border-fuchsia-500/50 bg-white/5 hover:bg-fuchsia-500/10 transition-all flex flex-col items-center justify-center gap-2 group"
                                    >
                                        <Plus size={16} className="text-white/40 group-hover:text-fuchsia-400 group-hover:scale-110 transition-all" />
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-white/40 group-hover:text-white">Upload BG</span>
                                    </button>
                                    <button
                                        onClick={() => handleBgSelect('transparent')}
                                        className="col-span-1 py-3 rounded-xl border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-2 group"
                                    >
                                        <Layers size={16} className="text-white/40 group-hover:text-white transition-all" />
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-white/40 group-hover:text-white">Reset</span>
                                    </button>
                                    <input
                                        type="file"
                                        id="bg-upload"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const url = URL.createObjectURL(file);
                                                handleBgSelect(url);
                                            }
                                        }}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {BACKGROUND_IMAGES.map((imgUrl, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleBgSelect(imgUrl)}
                                            className={`aspect-video rounded-xl border relative overflow-hidden group transition-all duration-300 ${selectedBg === imgUrl ? 'border-fuchsia-500 scale-95 shadow-lg shadow-fuchsia-500/20' : 'border-white/10 hover:border-white/20'}`}
                                        >
                                            <img
                                                src={imgUrl}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                alt="bg"
                                                onError={(e) => {
                                                    const img = e.target as HTMLImageElement;
                                                    const btn = img.closest('button');
                                                    if (btn) btn.style.display = 'none';
                                                }}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5 shrink-0">
                <button
                    onClick={handleRemoveBackground}
                    disabled={removed || progress !== null}
                    className={`group relative overflow-hidden text-white py-2 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg ${removed ? 'bg-green-600 shadow-green-600/20 cursor-default' : progress !== null ? 'bg-fuchsia-600/50 cursor-wait' : 'bg-fuchsia-600 shadow-fuchsia-600/20 hover:bg-fuchsia-500'}`}
                >
                    {removed ? (
                        <>
                            <CheckCircle size={12} className="text-white/80" /> Done
                        </>
                    ) : (
                        <>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <Sparkles size={12} className="text-white/80" /> {progress !== null ? 'Processing...' : 'Remove BG'}
                        </>
                    )}
                </button>
                <button
                    onClick={onDownload}
                    disabled={!removed}
                    className={`py-2 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] border transition-all active:scale-95 flex items-center justify-center gap-2 ${removed ? 'bg-white/[0.03] hover:bg-white/[0.08] text-white border-white/10' : 'bg-transparent text-white/20 border-white/5 cursor-not-allowed'}`}
                >
                    <Download size={12} className={removed ? "text-white/40" : "text-white/10"} /> Export
                </button>
            </div>
        </div>
    );
}

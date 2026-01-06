/**
 * LLMS Context Configuration for iLovPDF
 * 
 * This file provides structured metadata about the iLovPDF project to assist LLMs
 * in understanding the architecture, tools, and interaction patterns of this codebase.
 */

export const LLMS_CONTEXT = {
    project: {
        name: "iLovPDF",
        tagline: "Free Online PDF & Image Editor | Privacy-First & Client-Side Tools",
        description: "A comprehensive suite of document and image processing tools that run 100% client-side for maximum privacy. No files are ever uploaded to a server.",
        url: "https://ilovpdf.in",
        repository: "https://github.com/88paradoxx/llmilovpdf.git"
    },

    architecture: {
        stack: ["Vite", "React", "TypeScript", "Tailwind CSS"],
        pattern: "Multi-page Application (MPA) entry points mapped to shared React components.",
        entryPoints: {
            root: "./index.html",
            pdfEditor: "./pdf-editor.html",
            imageEditor: "./image-editor.html",
            backgroundRemover: "./background-remover.html",
            textToPdf: "./text-to-pdf.html"
        }
    },

    coreComponents: {
        PdfEditorTool: {
            path: "src/components/tools/PdfEditorTool.tsx",
            features: [
                "Interactive PDF rendering via PDF.js",
                "Fabric.js text layer overlay",
                "Persistent Zoom (Fit-to-Width priority)",
                "Zero-shift orientation and edit mode handling",
                "Fluid mouse-wheel and touch navigation",
                "Native text extraction and editing"
            ]
        },
        BackgroundRemoverTool: {
            path: "src/components/tools/BackgroundRemoverTool.tsx",
            features: [
                "AI-powered background removal",
                "Canvas-based compositing",
                "Simulated deterministic progress tracking"
            ]
        }
    },

    interactions: {
        viewport: {
            state: "Viewport { x, y, scale }",
            panning: "Custom pointer event handlers for smooth 1:1 movement.",
            zooming: "Zoom-to-point logic for wheel and pinch gestures."
        }
    },

    dependencies: {
        rendering: ["pdfjs-dist", "fabric"],
        ui: ["lucide-react", "framer-motion"],
        styling: ["tailwindcss", "vanilla-css-variables"]
    },

    seo: {
        philosophy: "Semantic HTML5, JSON-LD structured data, and comprehensive meta tags for every tool entry point."
    }
};

export default function LLMSContextPage() {
    return (
        <div style={{ fontFamily: 'monospace', padding: '2rem', whiteSpace: 'pre' }}>
            <h1>iLovPDF LLM Context</h1>
            {JSON.stringify(LLMS_CONTEXT, null, 2)}
        </div>
    );
}

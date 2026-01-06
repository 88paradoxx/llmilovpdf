import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';

// Fix for __dirname in ESM environments
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  return {
    publicDir: 'public',
    server: {
      port: 3001,
      host: '0.0.0.0',
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
    plugins: [react(), viteCompression()],
    build: {
      target: 'esnext',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, 'index.html'),
          'pdf-editor': path.resolve(__dirname, 'pdf-editor.html'),
          'pdf-merge': path.resolve(__dirname, 'pdf-merge.html'),
          'pdf-split': path.resolve(__dirname, 'pdf-split.html'),
          'pdf-compress': path.resolve(__dirname, 'pdf-compress.html'),
          'pdf-to-word': path.resolve(__dirname, 'pdf-to-word.html'),
          'pdf-to-ppt': path.resolve(__dirname, 'pdf-to-ppt.html'),
          'pdf-to-excel': path.resolve(__dirname, 'pdf-to-excel.html'),
          'pdf-watermark': path.resolve(__dirname, 'pdf-watermark.html'),
          'image-editor': path.resolve(__dirname, 'image-editor.html'),
          'image-resize': path.resolve(__dirname, 'image-resize.html'),
          'image-compress': path.resolve(__dirname, 'image-compress.html'),
          'image-convert': path.resolve(__dirname, 'image-convert.html'),
          'image-to-pdf': path.resolve(__dirname, 'image-to-pdf.html'),
          'background-remover': path.resolve(__dirname, 'background-remover.html'),
          filters: path.resolve(__dirname, 'filters.html'),
          watermark: path.resolve(__dirname, 'watermark.html'),
          text: path.resolve(__dirname, 'text.html'),
          drawing: path.resolve(__dirname, 'drawing.html'),
          social: path.resolve(__dirname, 'social.html'),
          bulk: path.resolve(__dirname, 'bulk.html'),
          'text-to-pdf': path.resolve(__dirname, 'text-to-pdf.html'),
          'text-to-ppt': path.resolve(__dirname, 'text-to-ppt.html'),
          about: path.resolve(__dirname, 'about.html'),
          privacy: path.resolve(__dirname, 'privacy.html'),
          terms: path.resolve(__dirname, 'terms.html'),
          contact: path.resolve(__dirname, 'contact.html'),
          '404': path.resolve(__dirname, '404.html'),
        },
        output: {
          entryFileNames: 'js/[name]-[hash].js',
          chunkFileNames: 'js/chunk-[hash].js',
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-ui': ['lucide-react'], // Split UI icons
            'vendor-pdf': ['pdfjs-dist', 'pdf-lib', 'jspdf'],
            'vendor-image': ['@imgly/background-removal', 'fabric', 'onnxruntime-web'],
            'vendor-office': ['docx', 'xlsx', 'pptxgenjs']
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      }
    }
  };
});

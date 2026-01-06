import React from 'react';
import { TOOLS } from '../constants';
import { ToolId } from '../types';
import { Mail, Github, Twitter, Linkedin, Dribbble } from 'lucide-react';

interface FooterProps {
  getToolPath: (toolId: ToolId) => string;
}

const Footer: React.FC<FooterProps> = ({ getToolPath }) => {
  const pdfTools = TOOLS.filter(t => ['pdf_editor', 'pdf_to_word', 'pdf_splitter', 'pdf_watermark', 'pdf', 'pdf_resizer', 'pdf_merge', 'text_to_pdf', 'text_to_ppt', 'pdf_to_ppt', 'pdf_to_excel'].includes(t.id));
  const imageTools = TOOLS.filter(t => ['resize', 'edit', 'bg_remover', 'compress', 'filters', 'converter', 'watermark', 'text', 'drawing', 'social', 'bulk'].includes(t.id));

  const getCompanyPath = (item: string) => {
    const itemLower = item.toLowerCase().trim();
    const map: Record<string, string> = {
      'about ilovpdf': '/about.html',
      'privacy policy': '/privacy.html',
      'terms of use': '/terms.html',
      'contact': '/contact.html',
      'faq': '/#faq'
    };
    return map[itemLower] || '#';
  };

  return (
    <footer className="relative z-10 pt-32 pb-12 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute bottom-0 left-0 w-full h-[500px] bg-gradient-to-t from-black via-[#020617] to-transparent z-[-1]"></div>
      <div className="absolute bottom-[-100px] left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 relative">
        <div className="col-span-2 lg:col-span-2 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-[0_0_20px_rgba(147,51,234,0.5)]">i</div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter text-white uppercase leading-none">ilovpdf</span>
              <span className="text-[9px] font-bold text-purple-400 uppercase tracking-[0.3em] mt-1">Free Online Studio</span>
            </div>
          </div>
          <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-sm">
            The first 100% client-side, privacy-first document and image studio.
            Process your sensitive files securely without ever uploading them to any server.
          </p>
          <div className="flex items-center gap-3">
            {[
              { Icon: Twitter, label: 'Twitter', href: 'https://x.com/99mirbilal' },
              { Icon: Github, label: 'GitHub', href: 'https://github.com/88paradoxx' },
              { Icon: Linkedin, label: 'LinkedIn', href: '#' },
              { Icon: Dribbble, label: 'Dribbble', href: '#' }
            ].map(({ Icon, label, href }, i) => (
              <a key={i} href={href} aria-label={label} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white hover:scale-110 transition-all border border-white/5 hover:border-purple-500/30 group">
                <Icon size={18} className="group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                <span className="sr-only">{label}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            PDF Tools
          </h4>
          <ul className="space-y-3">
            {pdfTools.map(tool => (
              <li key={tool.id}>
                <a
                  href={getToolPath(tool.id as ToolId)}
                  className="text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2 group"
                >
                  <span className="w-0 group-hover:w-2 h-[1px] bg-purple-500 transition-all duration-300"></span>
                  {tool.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500"></span>
            Image Tools
          </h4>
          <ul className="space-y-3">
            {imageTools.map(tool => (
              <li key={tool.id}>
                <a
                  href={getToolPath(tool.id as ToolId)}
                  className="text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2 group"
                >
                  <span className="w-0 group-hover:w-2 h-[1px] bg-fuchsia-500 transition-all duration-300"></span>
                  {tool.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Company
          </h4>
          <ul className="space-y-3">
            {['About ilovpdf', 'Privacy Policy', 'Terms of Use', 'Contact', 'FAQ'].map(item => (
              <li key={item}>
                <a
                  href={getCompanyPath(item)}
                  className="text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2 group"
                >
                  <span className="w-0 group-hover:w-2 h-[1px] bg-blue-500 transition-all duration-300"></span>
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-20 px-6 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
          © {new Date().getFullYear()} ILOVPDF STUDIO • BROWSER-POWERED
        </p>
        <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
          <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Systems Operational</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

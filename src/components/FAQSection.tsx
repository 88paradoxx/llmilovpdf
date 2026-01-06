import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const FAQS = [
    {
        question: "Is iLovPDF free to use?",
        answer: "iLovPDF is completely free to use for editing, resizing, compressing, and converting images and PDFs directly in your browser."
    },
    {
        question: "Are my images and PDFs uploaded to a server?",
        answer: "No. All image and PDF processing happens 100% client-side. Your files never leave your device."
    },
    {
        question: "Can I resize images to an exact size in KB?",
        answer: "Yes. You can resize and compress images to precise KB sizes while maintaining visual quality."
    },
    {
        question: "What PDF tools are available on iLovPDF?",
        answer: "iLovPDF supports PDF editing, merge PDF, split PDF, compress PDF, PDF to Word, PDF to PPT, image to PDF, and PDF page management tools."
    },
    {
        question: "Can I convert PDF files without installing software?",
        answer: "Yes. All PDF conversions work directly in your browser with no software installation required."
    },
    {
        question: "Is iLovPDF safe for private or sensitive documents?",
        answer: "Yes. Since files are processed locally and never uploaded, iLovPDF is safe for sensitive and confidential documents."
    },
    {
        question: "Do I need to create an account to use the tools?",
        answer: "No sign-up or account is required. All tools are instantly available."
    },
    {
        question: "Does iLovPDF work on mobile devices?",
        answer: "Yes. iLovPDF works on mobile, tablet, and desktop browsers."
    }
];

export default function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggle = (idx: number) => {
        setOpenIndex(prev => prev === idx ? null : idx);
    };

    return (
        <section className="px-6 pt-20 pb-72 max-w-4xl mx-auto space-y-12" id="faq">
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                    <HelpCircle size={14} />
                    <span>Common Questions</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight bg-gradient-to-br from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">
                    Frequently Asked Questions
                </h2>
                <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                    Everything you need to know about our privacy-first, client-side tools.
                </p>
            </div>

            <div className="space-y-4">
                {FAQS.map((faq, idx) => {
                    const isOpen = openIndex === idx;
                    return (
                        <div
                            key={idx}
                            onClick={() => toggle(idx)}
                            className={`group cursor-pointer relative overflow-hidden rounded-2xl border transition-all duration-300 ${isOpen ? 'bg-white/10 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.15)]' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'}`}
                        >
                            <div className="p-4 md:p-6 flex items-center justify-between gap-6">
                                <h3 className={`font-bold text-base md:text-lg transition-colors ${isOpen ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                                    {faq.question}
                                </h3>
                                <div className={`p-2 rounded-full transition-all duration-300 shrink-0 ${isOpen ? 'bg-purple-500 text-white rotate-180' : 'bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-white'}`}>
                                    <ChevronDown size={20} />
                                </div>
                            </div>

                            <div className={`px-4 md:px-6 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-48 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                                <p className="text-slate-400 leading-relaxed text-sm md:text-base border-t border-white/5 pt-4">
                                    {faq.answer}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

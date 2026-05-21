import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Sparkles } from 'lucide-react';

const Footer = () => {
  return (
    <motion.footer 
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full mt-20 no-print pb-8"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-[#fafafa] dark:bg-[#0a0a0a] rounded-3xl border border-white/10 overflow-hidden relative shadow-2xl">
          {/* Subtle tiled grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
          {/* Ambient radial gradient glow */}
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>

          <div className="relative z-10 p-6 md:p-10">
            <div className="mb-10 md:mb-12">
              {/* Spotlight Hover Heading */}
              <h2 className="group flex flex-col text-2xl md:text-3xl lg:text-4xl font-sans font-black uppercase tracking-tighter leading-[0.9] sm:leading-[0.9] md:leading-[0.9]">
                <span className="text-[#333333] transition-colors duration-300 hover:text-gray-900 dark:text-white cursor-pointer w-fit">TRANSFORM ANY DOCUMENT</span>
                <span className="text-[#333333] transition-colors duration-300 hover:text-gray-900 dark:text-white cursor-pointer w-fit">INTO INTERACTIVE STUDY MATERIAL,</span>
                <span className="text-[#333333] transition-colors duration-300 hover:text-gray-900 dark:text-white cursor-pointer w-fit">GENERATE INSTANT QUIZZES,</span>
                <span className="text-[#333333] transition-colors duration-300 hover:text-gray-900 dark:text-white cursor-pointer w-fit">AND CONQUER YOUR EXAMS.</span>
              </h2>
            </div>

            {/* Bottom Center & Very Bottom Layers */}
            <div className="flex flex-col items-center pt-8 border-t border-white/10">
              {/* Bottom Center (Logo) */}
              <div className="flex items-center justify-center mb-8 transform group-hover:scale-105 transition-all duration-300">
                <img src="/logo-light.png" alt="EduNest Logo" className="h-20 md:h-24 w-auto block dark:hidden object-contain rounded-2xl shadow-sm" />
                <img src="/logo-dark.png" alt="EduNest Logo" className="h-20 md:h-24 w-auto hidden dark:block object-contain rounded-2xl shadow-sm" />
              </div>

              {/* Very Bottom Layer (Legal) */}
              <div className="w-full flex items-center justify-between text-xs font-sans">
                <div className="text-gray-500">
                  © 2026 EduNest. All rights reserved.
                </div>
                <a
                  href="https://github.com/Keshariiii/edunest"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                  <span>GitHub</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;

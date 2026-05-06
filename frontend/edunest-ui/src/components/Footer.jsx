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
              <div className="flex items-center justify-center gap-3 group cursor-pointer mb-8">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.2)] group-hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all border border-white/20">
                  <GraduationCap className="text-gray-900 dark:text-white" size={24} />
                </div>
                <div className="relative flex items-center">
                  <span className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight font-sans">EduNest</span>
                  <Sparkles size={16} className="absolute -top-2 -right-4 text-indigo-400 opacity-90 animate-pulse" />
                </div>
              </div>

              {/* Very Bottom Layer (Legal) */}
              <div className="w-full flex items-center text-xs font-sans">
                <div className="text-gray-500">
                  © 2026 EduNest. All rights reserved.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;

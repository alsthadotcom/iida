
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { ArrowUpTrayIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

interface InputAreaProps {
  onGenerate: (prompt: string, file?: File) => void;
  isGenerating?: boolean;
  disabled?: boolean;
  onNavigate?: () => void;
}

const CyclingText = () => {
  const words = [
    "a disruptive SaaS",
    "a coffee franchise",
    "a crypto protocol",
    "a sustainable brand",
    "an AI startup",
    "a delivery drone fleet"
  ];
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false); // fade out
      setTimeout(() => {
        setIndex(prev => (prev + 1) % words.length);
        setFade(true); // fade in
      }, 500); // Wait for fade out
    }, 3000); // Slower cycle to read longer text
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <span className={`inline-block whitespace-nowrap transition-all duration-500 transform ${fade ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-sm'} text-green-400 font-medium pb-1 border-b-2 border-green-500/50`}>
      {words[index]}
    </span>
  );
};

export const InputArea: React.FC<InputAreaProps> = ({ isGenerating = false, onNavigate, disabled = false }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto perspective-1000">
      <div className="relative group transition-all duration-300">
        <div
          className="
            relative flex flex-col items-center justify-center
            h-56 sm:h-64 md:h-[22rem]
            bg-zinc-900/30 
            backdrop-blur-sm
            rounded-xl border border-dashed border-zinc-700
            overflow-hidden
            transition-all duration-300
          "
        >
          {/* Technical Grid Background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
          </div>

          {/* Corner Brackets for technical feel */}
          <div className="absolute top-4 left-4 w-4 h-4 border-l-2 border-t-2 border-zinc-600"></div>
          <div className="absolute top-4 right-4 w-4 h-4 border-r-2 border-t-2 border-zinc-600"></div>
          <div className="absolute bottom-4 left-4 w-4 h-4 border-l-2 border-b-2 border-zinc-600"></div>
          <div className="absolute bottom-4 right-4 w-4 h-4 border-r-2 border-b-2 border-zinc-600"></div>

          <div className="relative z-10 flex flex-col items-center text-center space-y-6 md:space-y-8 p-6 md:p-8 w-full">
            <button
              onClick={handleClick}
              className={`relative w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center transition-transform duration-500 bg-transparent border-0 p-0 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 cursor-pointer'} group/icon`}
            >
              <div className={`absolute inset-0 rounded-2xl bg-zinc-800 border border-zinc-700 shadow-xl flex items-center justify-center transition-all pointer-events-none ${isGenerating ? 'animate-pulse' : 'group-hover/icon:border-green-500 group-hover/icon:bg-zinc-700'}`}>
                {isGenerating ? (
                  <CurrencyDollarIcon className="w-8 h-8 md:w-10 md:h-10 text-green-400 animate-spin-slow pointer-events-none" />
                ) : (
                  <ArrowUpTrayIcon
                    className="w-8 h-8 md:w-10 md:h-10 text-zinc-300 group-hover/icon:text-green-400 transition-colors pointer-events-none"
                  />
                )}
              </div>
            </button>

            <div className="space-y-2 md:space-y-4 w-full max-w-3xl">
              <h3 className="flex flex-col items-center justify-center text-xl sm:text-2xl md:text-4xl text-zinc-100 leading-none font-bold tracking-tighter gap-3">
                <div className="flex flex-col items-center justify-center gap-3">
                  <span>
                    Valuate
                  </span>
                  {/* Fixed height container to prevent layout shifts */}
                  <div className="h-8 sm:h-10 md:h-14 flex items-center justify-center w-full">
                    <CyclingText />
                  </div>
                </div>
              </h3>
              <p className="text-zinc-500 text-xs sm:text-base md:text-lg font-light tracking-wide">
                Valuate your valuable ideas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

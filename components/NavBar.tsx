import React, { useState, useRef, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { UserCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface NavBarProps {
  currentPage?: string;
  user: User | null;
  onLogout?: () => void;
  onNavigate: (page: any) => void;
  isFocused?: boolean; // Add isFocused to props
}

export const NavBar: React.FC<NavBarProps> = ({ currentPage, user, onLogout, onNavigate }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <nav
      className={`
        fixed top-0 left-0 right-0 z-30 
        flex items-center justify-between 
        px-6 py-4 md:px-12
        bg-zinc-950/60 backdrop-blur-md border-b border-white/5
        transition-all duration-700
      `}
    >
      {/* Left: Handwritten Logo */}
      <button onClick={() => onNavigate('home')} className="flex items-center select-none w-32 focus:outline-none">
        <span className="text-4xl text-white font-handwritten font-bold tracking-tight pb-1 hover:text-green-400 transition-colors cursor-pointer">
          ida.
        </span>
      </button>

      {/* Center: Main Navigation Links */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center space-x-10">
        <>
          <button
            onClick={() => onNavigate('marketplace')}
            className={`relative tracking-wide transition-all duration-300 ${currentPage === 'marketplace' ? 'text-green-400 font-medium text-base' : 'text-zinc-500 hover:text-zinc-300 font-normal text-sm'}`}
          >
            Marketplace
            {currentPage === 'marketplace' && (
              <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
            )}
          </button>
          <button
            onClick={() => onNavigate('solutions')}
            className={`relative tracking-wide transition-all duration-300 ${currentPage === 'solutions' ? 'text-green-400 font-medium text-base' : 'text-zinc-500 hover:text-zinc-300 font-normal text-sm'}`}
          >
            Digital Solutions
            {currentPage === 'solutions' && (
              <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
            )}
          </button>
        </>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center justify-end space-x-6 w-auto md:w-auto">

        {!user ? (
          <>
            <button
              onClick={() => onNavigate('sell-idea')}
              className="group relative text-xs font-medium text-zinc-500 hover:text-green-400 transition-colors duration-300 uppercase tracking-wider hidden sm:block"
            >
              Start Selling
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-400 transition-all duration-300 ease-out group-hover:w-full"></span>
            </button>

            <button
              onClick={() => onNavigate('login')}
              className="px-5 py-2 text-sm font-semibold text-black bg-white rounded-full hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5 whitespace-nowrap"
            >
              Log in
            </button>
          </>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-zinc-800/50 border border-white/10 hover:bg-zinc-800 transition-colors"
            >
              <UserCircleIcon className="w-6 h-6 text-zinc-300" />
              <ChevronDownIcon className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-sm font-medium text-white truncate">{user.email}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Signed in</p>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={() => {
                      onNavigate('profile');
                      setIsDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </button>

                  <button
                    onClick={() => {
                      // Dashboard logic here if separate
                      onNavigate('profile');
                      setIsDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Dashboard
                  </button>

                  <div className="border-t border-white/5 my-2"></div>

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      if (onLogout) onLogout();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-zinc-800 hover:text-red-300 transition-colors flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
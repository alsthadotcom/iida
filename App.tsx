/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { Hero } from './components/Hero';
import { InputArea } from './components/InputArea';
// import { LivePreview } from './components/LivePreview'; // TODO: Recreate this component
import { CreationHistory, Creation } from './components/CreationHistory';
import { TrendingGrid } from './components/TrendingGrid';
import type { MarketplaceView } from './types/database';
import { NavBar } from './components/NavBar';
import { Marketplace } from './components/Marketplace';
import { DigitalSolutions } from './components/DigitalSolutions';
import { Login } from './components/Login';
import { SignUp } from './components/SignUp';
import { ItemDetails } from './components/ItemDetails';
import { SellIdea } from './components/SellIdea';
import { Profile } from './components/Profile';
import { bringToLife } from './services/gemini';
import { supabase } from './services/supabase';
import { ArrowRightIcon } from '@heroicons/react/24/solid';
import { User } from '@supabase/supabase-js';

type Page = 'home' | 'marketplace' | 'solutions' | 'login' | 'signup' | 'item-details' | 'sell-idea' | 'profile';

const App: React.FC = () => {
  const [activeCreation, setActiveCreation] = useState<Creation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<Creation[]>([]);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedItem, setSelectedItem] = useState<MarketplaceView | null>(null);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        // Ensure user_info exists in public schema
        import('./services/database').then(({ ensureUserInfoExists }) => {
          ensureUserInfoExists(session.user);
        });
      } else {
        setUser(null);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // Ensure user_info exists whenever a user is authenticated
        const { ensureUserInfoExists } = await import('./services/database');
        await ensureUserInfoExists(currentUser);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentPage('home');
  };

  // Load history from local storage or fetch examples on mount
  useEffect(() => {
    const initHistory = async () => {
      const saved = localStorage.getItem('gemini_app_history');
      let loadedHistory: Creation[] = [];

      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          loadedHistory = parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          }));
        } catch (e) {
          console.error("Failed to load history", e);
        }
      }

      if (loadedHistory.length > 0) {
        setHistory(loadedHistory);
      }
    };

    initHistory();
  }, []);

  // Save history when it changes
  useEffect(() => {
    if (history.length > 0) {
      try {
        localStorage.setItem('gemini_app_history', JSON.stringify(history));
      } catch (e) {
        console.warn("Local storage full or error saving history", e);
      }
    }
  }, [history]);

  // Helper to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleGenerate = async (promptText: string, file?: File) => {
    setIsGenerating(true);
    // Clear active creation to show loading state
    setActiveCreation(null);

    try {
      let imageBase64: string | undefined;
      let mimeType: string | undefined;

      if (file) {
        imageBase64 = await fileToBase64(file);
        mimeType = file.type.toLowerCase();
      }

      const html = await bringToLife(promptText, imageBase64, mimeType);

      if (html) {
        const newCreation: Creation = {
          id: crypto.randomUUID(),
          name: file ? file.name : 'New Asset',
          html: html,
          // Store the full data URL for easy display
          originalImage: imageBase64 && mimeType ? `data:${mimeType};base64,${imageBase64}` : undefined,
          timestamp: new Date(),
        };
        setActiveCreation(newCreation);
        setHistory(prev => [newCreation, ...prev]);
      }

    } catch (error) {
      console.error("Failed to generate:", error);
      alert("Something went wrong while valuating your asset. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setActiveCreation(null);
    setIsGenerating(false);
  };

  const handleSelectCreation = (creation: Creation) => {
    setActiveCreation(creation);
  };

  const handleNavigate = (page: string, ideaId?: string) => {
    if (page === 'item-details' && ideaId) {
      setSelectedIdeaId(ideaId);
      setCurrentPage('item-details');
    } else {
      setCurrentPage(page as Page);
    }
  };

  const handleMarketplaceItemClick = (item: MarketplaceView) => {
    setSelectedItem(item);
    setSelectedIdeaId(item.idea_id);
    setCurrentPage('item-details');
  };

  const isFocused = !!activeCreation || isGenerating;

  return (
    <div className={`h-[100dvh] bg-zinc-950 bg-dot-grid text-zinc-50 selection:bg-green-500/30 overflow-y-auto overflow-x-hidden relative flex flex-col scrollbar-hide`}>

      {/* Navigation Bar */}
      <NavBar
        isFocused={isFocused}
        currentPage={currentPage === 'item-details' || currentPage === 'sell-idea' || currentPage === 'profile' ? 'marketplace' : currentPage}
        onNavigate={setCurrentPage}
        user={user}
        onLogout={handleLogout}
      />

      {/* Centered Content Container */}
      <div
        className={`
          min-h-full flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 relative z-10 
          transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1)
          ${isFocused
            ? 'opacity-0 scale-95 blur-sm pointer-events-none h-[100dvh] overflow-hidden'
            : 'opacity-100 scale-100 blur-0'
          }
        `}
      >
        {/* Main Vertical Centering Wrapper - Adjusted top padding for Navbar */}
        <div className="flex-1 flex flex-col items-center w-full pt-20 md:pt-24 pb-12 md:pb-20">

          {currentPage === 'home' && (
            <div className="w-full flex flex-col items-center animate-in fade-in duration-500">
              {/* 1. Hero Section */}
              <div className="w-full mb-8 md:mb-16 mt-8">
                <Hero />
              </div>

              {/* 2. Input Section */}
              <div className="w-full flex justify-center mb-12">
                <InputArea
                  onGenerate={handleGenerate}
                  isGenerating={isGenerating}
                  disabled={isFocused}
                  onNavigate={() => setCurrentPage('login')}
                />
              </div>

              {/* 3. Trending Grid - Preview */}
              <div className="w-full relative">
                <TrendingGrid limit={4} />
                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => setCurrentPage('marketplace')}
                    className="group flex items-center space-x-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium border border-zinc-800 hover:border-zinc-600 rounded-full px-6 py-2"
                  >
                    <span>Explore Marketplace</span>
                    <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentPage === 'marketplace' && (
            <Marketplace
              onItemClick={handleMarketplaceItemClick}
              onSellClick={() => setCurrentPage('sell-idea')}
            />
          )}

          {currentPage === 'item-details' && selectedIdeaId && (
            <ItemDetails ideaId={selectedIdeaId} onBack={() => setCurrentPage('marketplace')} />
          )}

          {currentPage === 'sell-idea' && (
            <SellIdea onBack={() => setCurrentPage('marketplace')} />
          )}

          {currentPage === 'profile' && (
            <Profile onNavigate={handleNavigate} />
          )}

          {currentPage === 'solutions' && (
            <DigitalSolutions />
          )}

          {currentPage === 'login' && (
            <Login
              onBack={() => setCurrentPage('home')}
              onRegister={() => setCurrentPage('signup')}
            />
          )}

          {currentPage === 'signup' && (
            <SignUp
              onLogin={() => setCurrentPage('login')}
              onBack={() => setCurrentPage('home')}
            />
          )}

        </div>

        {/* 4. History Section & Footer - Stays at bottom on Home only, or always? Let's keep it generally accessible */}
        {currentPage === 'home' && (
          <div className="flex-shrink-0 pb-6 w-full mt-auto flex flex-col items-center gap-6 pt-12">
            <div className="w-full px-2 md:px-0">
              <CreationHistory history={history} onSelect={handleSelectCreation} />
            </div>

            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-600 hover:text-zinc-400 text-xs font-mono transition-colors pb-2"
            >
              IdeaExchange Corp © 2024
            </a>
          </div>
        )}
      </div>

      {/* Live Preview - Always mounted for smooth transition */}
      {/* <LivePreview
        creation={activeCreation}
        isLoading={isGenerating}
        isFocused={isFocused}
        onReset={handleReset}
      /> */}
    </div>
  );
};

export default App;
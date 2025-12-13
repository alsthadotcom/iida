import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Hero } from '../../components/Hero';
import { NavBar } from '../../components/NavBar';
import { Footer } from '../../components/Footer';
import { InputArea } from '../../components/InputArea';
import { TrendingGrid } from '../../components/TrendingGrid';
import { useAuthUser } from '../hooks/useAuthUser';
import { handleNavigation } from '../utils/navigation';
import '../../index.css';

const Home = () => {
    const { user, handleLogout } = useAuthUser();

    // Redirect logged-in users to marketplace
    useEffect(() => {
        if (user) {
            window.location.href = '/pages/marketplace.html';
        }
    }, [user]);

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-50 bg-dot-grid selection:bg-green-500/30 flex flex-col">
            <NavBar user={user} onLogout={handleLogout} onNavigate={handleNavigation} />
            <div className="max-w-7xl mx-auto px-4 pt-32 pb-12 flex flex-col items-center animate-in fade-in duration-700">
                <Hero />
                <div className="w-full flex justify-center mb-12">
                    <InputArea
                        onGenerate={() => { }}
                        onNavigate={() => window.location.href = '/pages/signup.html'}
                    />
                </div>
                <TrendingGrid limit={4} onItemClick={(item) => window.location.href = `/pages/details.html?id=${item.idea_id}`} />
                <div className="flex justify-center mt-8">
                    <a href="/pages/marketplace.html" className="text-zinc-400 hover:text-white border border-zinc-800 rounded-full px-6 py-2 text-sm transition-colors flex items-center gap-2">
                        Explore Marketplace
                    </a>
                </div>
            </div>
            <Footer onNavigate={handleNavigation} />

        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Home />
    </React.StrictMode>
);

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, AdjustmentsHorizontalIcon, PlusIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { getMarketplaceItems, searchMarketplaceItems } from '../services/database';
import type { MarketplaceView } from '../types/database';

// MiniRadial Component
const MiniRadial: React.FC<{ value: number }> = ({ value }) => {
    const radius = 16;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    let colorClass = 'text-green-500';
    if (value < 40) colorClass = 'text-red-500';
    else if (value < 70) colorClass = 'text-yellow-500';

    const strokeClass = colorClass.replace('text-', 'stroke-');

    return (
        <div className="relative w-16 h-16 flex items-center justify-center">
            {/* Background */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 40 40">
                <circle
                    cx="20"
                    cy="20"
                    r={radius}
                    className="stroke-zinc-800"
                    strokeWidth="3"
                    fill="transparent"
                />
                <circle
                    cx="20"
                    cy="20"
                    r={radius}
                    className={strokeClass}
                    strokeWidth="3"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                />
            </svg>
            <span className={`absolute text-sm font-bold ${colorClass}`}>{value}</span>
        </div>
    );
};

interface MarketplaceProps {
    user?: any;
}

export const Marketplace: React.FC<MarketplaceProps> = ({ user }) => {
    const [items, setItems] = useState<MarketplaceView[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Fetch marketplace items on mount
    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await getMarketplaceItems(100);
            if (fetchError) throw fetchError;
            setItems(data || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load marketplace items');
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            fetchItems();
            return;
        }

        setIsSearching(true);
        setError(null);
        try {
            const { data, error: searchError } = await searchMarketplaceItems(searchTerm, 100);
            if (searchError) throw searchError;
            setItems(data || []);
        } catch (err: any) {
            setError(err.message || 'Search failed');
            console.error('Search error:', err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleItemClick = (item: MarketplaceView) => {
        if (!user) {
            window.location.href = '/pages/login.html';
        } else {
            window.location.href = `/pages/details.html?id=${item.idea_id}`;
        }
    };

    const handleAddListing = () => {
        if (!user) {
            window.location.href = '/pages/login.html';
        } else {
            window.location.href = '/pages/sell.html';
        }
    };

    const getCategoryColor = (index: number) => {
        const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500'];
        return colors[index % colors.length];
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 pt-24 pb-12 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                <div>
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">Marketplace</h1>
                    <p className="text-zinc-400 max-w-2xl text-lg">
                        Discover verified business concepts, IP, and franchise opportunities ready for acquisition.
                    </p>
                </div>

                <button
                    onClick={handleAddListing}
                    className="flex items-center gap-2 bg-green-500 text-black px-6 py-3 rounded-full font-bold hover:bg-green-400 transition-colors shadow-[0_0_20px_rgba(34,197,94,0.3)] shrink-0"
                >
                    <PlusIcon className="w-5 h-5" />
                    Add new listing
                </button>
            </div>

            {/* Toolbar */}
            <div className="sticky top-20 z-20 flex flex-col md:flex-row gap-4 mb-8 bg-zinc-950/80 backdrop-blur-xl p-4 -mx-4 md:mx-0 rounded-xl border border-white/5 shadow-2xl">
                <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search assets, industries, or keywords..."
                        className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg py-2.5 pl-10 pr-4 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-green-500/50 transition-colors"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="px-4 py-2 bg-green-500 text-black rounded-lg hover:bg-green-400 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                        {isSearching ? 'Searching...' : 'Search'}
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors text-sm font-medium">
                        <FunnelIcon className="w-4 h-4" />
                        Filter
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors text-sm font-medium">
                        <AdjustmentsHorizontalIcon className="w-4 h-4" />
                        Sort
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                    <p className="text-red-500 text-sm">{error}</p>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-zinc-400">Loading marketplace...</p>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20">
                    <p className="text-zinc-400 text-lg mb-4">No ideas found</p>
                    <button
                        onClick={handleAddListing}
                        className="text-green-400 hover:text-green-300 font-medium"
                    >
                        Be the first to list an idea →
                    </button>
                </div>
            )}

            {/* Grid */}
            {!loading && items.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {items.map((item, index) => (
                        <div
                            key={item.idea_id}
                            onClick={() => handleItemClick(item)}
                            className="group relative bg-zinc-900/40 border border-zinc-800 hover:border-zinc-600 p-5 rounded-lg transition-all hover:-translate-y-1 cursor-pointer overflow-hidden active:scale-95"
                        >
                            <div className={`absolute top-0 left-0 w-full h-0.5 ${getCategoryColor(index)} opacity-50`}></div>

                            {/* Header: Username & Rating */}
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-[10px] text-zinc-300 border-zinc-700 border px-2 py-1 rounded font-mono">
                                    @{item.username.replace(/^@/, '').toLowerCase()}
                                </span>
                                <div className="flex items-center space-x-1 text-zinc-400">
                                    <StarIcon className="w-3 h-3" />
                                    <span className="text-xs">{item.overall_score.toFixed(1)}</span>
                                </div>
                            </div>

                            {/* Title & Description */}
                            <h4 className="text-white font-bold text-lg leading-tight mb-2 group-hover:text-green-400 transition-colors truncate">
                                {item.title}
                            </h4>
                            <p className="text-zinc-400 text-sm line-clamp-2 mb-4 h-10">
                                {item.description}
                            </p>

                            {/* 3 Circular Indicators */}
                            <div className="flex flex-nowrap gap-4 justify-center mb-6">
                                <MiniRadial value={Math.round(item.uniqueness || 0)} />
                                <MiniRadial value={Math.round(item.viability || 0)} />
                                <MiniRadial value={Math.round(item.overall_score * 10)} />
                            </div>

                            {/* Footer: Price */}
                            <div className="flex items-end justify-between border-t border-zinc-800 pt-4 mt-auto">
                                <div>
                                    <div className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">Asking price</div>
                                    <div className="text-2xl font-bold text-white">
                                        ${item.price.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && items.length > 0 && (
                <div className="mt-12 text-center">
                    <button className="text-zinc-500 hover:text-zinc-300 text-sm font-mono border-b border-zinc-800 pb-1">
                        Showing {items.length} ideas
                    </button>
                </div>
            )}
        </div>
    );
};
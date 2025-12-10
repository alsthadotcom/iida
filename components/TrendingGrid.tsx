/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { ArrowTrendingUpIcon, StarIcon } from '@heroicons/react/24/solid';
import { getTopRatedMarketplaceItems } from '../services/database';
import type { MarketplaceView } from '../types/database';

const MiniRadial: React.FC<{ value: number }> = ({ value }) => {
    const radius = 16; // Internal SVG radius
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    // Color logic based on value
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

interface TrendingGridProps {
    limit?: number;
    showHeader?: boolean;
    onItemClick?: (item: MarketplaceView) => void;
}

export const TrendingGrid: React.FC<TrendingGridProps> = ({ limit = 4, showHeader = true, onItemClick }) => {
    const [items, setItems] = useState<MarketplaceView[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTopRated();
    }, [limit]);

    const fetchTopRated = async () => {
        setLoading(true);
        try {
            const { data } = await getTopRatedMarketplaceItems(limit);
            setItems(data || []);
        } catch (error) {
            console.error('Failed to fetch trending items:', error);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryColor = (index: number) => {
        const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500'];
        return colors[index % colors.length];
    };

    if (loading) {
        return (
            <div className="w-full max-w-6xl mx-auto px-4 mt-8 md:mt-16">
                {showHeader && (
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-zinc-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                            <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
                            Trending Assets
                        </h3>
                    </div>
                )}
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="w-full max-w-6xl mx-auto px-4 mt-8 md:mt-16">
                {showHeader && (
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-zinc-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                            <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
                            Trending Assets
                        </h3>
                    </div>
                )}
                <div className="text-center py-12 text-zinc-500">
                    No trending ideas yet. Be the first to list one!
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto px-4 mt-8 md:mt-16">
            {showHeader && (
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-zinc-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                        <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
                        Trending Assets
                    </h3>
                    <span className="text-zinc-600 text-xs font-mono">LIVE FEED ●</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {items.map((item, index) => (
                    <div
                        key={item.idea_id}
                        onClick={() => onItemClick && onItemClick(item)}
                        className={`group relative bg-zinc-900/40 border border-zinc-800 hover:border-zinc-600 p-5 rounded-lg transition-all hover:-translate-y-1 cursor-pointer overflow-hidden ${onItemClick ? 'active:scale-95' : ''}`}
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
                            {/* Map data to the 3 radials: Uniqueness, Viability, Scalability/Overall */}
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
        </div>
    );
};

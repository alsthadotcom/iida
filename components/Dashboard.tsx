/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from 'react';
import { PencilSquareIcon, TrashIcon, DocumentIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { getUserListings, deleteListing } from '../services/database';
import type { MarketplaceView } from '../types/database';

interface DashboardProps {
    user?: any;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
    const [listings, setListings] = useState<MarketplaceView[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            fetchListings();
        }
    }, [user]);

    const fetchListings = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await getUserListings(user.id);
            if (error) throw error;
            setListings(data || []);
        } catch (err: any) {
            console.error('Error fetching listings:', err);
            setError(err.message || 'Failed to fetch your listings');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
            return;
        }

        setDeletingId(id);
        try {
            const { error } = await deleteListing(id);
            if (error) throw error;
            // Remove from state
            setListings(prev => prev.filter(item => item.idea_id !== id));
        } catch (err: any) {
            alert('Failed to delete listing: ' + err.message);
        } finally {
            setDeletingId(null);
        }
    };

    const handleEdit = (id: string) => {
        // Navigate to edit page (To be implemented fully, essentially Sell page with pre-fill)
        window.location.href = `/pages/sell.html?edit=${id}`;
    };

    if (!user) {
        return (
            <div className="w-full max-w-7xl mx-auto pt-32 px-4 text-center">
                <p className="text-zinc-400">Please log in to view your dashboard.</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto pt-24 px-4 sm:px-6 animate-in fade-in duration-500">
            <div className="flex items-end justify-between mb-8 border-b border-zinc-800 pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">My Listings</h1>
                    <p className="text-zinc-400">Manage your ideas, update details, or remove listings.</p>
                </div>
                <div className="text-right">
                    <span className="text-4xl font-mono font-bold text-green-500">{listings.length}</span>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Active Listings</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex items-center gap-3">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                    <p className="text-red-500 text-sm">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : listings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
                    <DocumentIcon className="w-16 h-16 text-zinc-600 mb-4" />
                    <h3 className="text-xl font-medium text-zinc-300">No listings yet</h3>
                    <p className="text-zinc-500 mt-2 mb-6 max-w-sm text-center">Start your journey by listing your first idea on the marketplace.</p>
                    <a href="/pages/sell.html" className="bg-green-500 text-black px-6 py-2 rounded-full font-bold hover:bg-green-400 transition-colors">
                        Sell an Idea
                    </a>
                </div>
            ) : (
                <div className="space-y-4">
                    {listings.map((item) => (
                        <div
                            key={item.idea_id}
                            className="group bg-zinc-900/50 border border-zinc-800 hover:border-zinc-600 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-all hover:bg-zinc-900"
                        >
                            {/* Icon / Thumbnail */}
                            <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center shrink-0 border border-zinc-700">
                                {item.mvp ? (
                                    <span className="text-xl">🚀</span>
                                ) : (
                                    <DocumentIcon className="w-6 h-6 text-zinc-500" />
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-white truncate group-hover:text-green-400 transition-colors">
                                    {item.title}
                                </h3>
                                <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono mt-1">
                                    <span>${item.price.toLocaleString()}</span>
                                    <span>•</span>
                                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span className={item.category ? 'text-zinc-400' : 'italic'}>{item.category || 'Uncategorized'}</span>
                                </div>
                            </div>

                            {/* Score (Optional, small) */}
                            <div className="hidden sm:block text-right mr-4">
                                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">AI Score</div>
                                <div className={`font-mono font-bold ${item.overall_score >= 8 ? 'text-green-400' : item.overall_score >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                                    {item.overall_score}/10
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-zinc-800 pt-3 sm:pt-0 sm:pl-4 mt-2 sm:mt-0 justify-end sm:justify-start">
                                <button
                                    onClick={() => handleEdit(item.idea_id)}
                                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                                    title="Edit Listing"
                                >
                                    <PencilSquareIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(item.idea_id)}
                                    disabled={deletingId === item.idea_id}
                                    className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
                                    title="Delete Listing"
                                >
                                    {deletingId === item.idea_id ? (
                                        <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <TrashIcon className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { getUserLikedListings, getUserSavedListings } from '../services/database';
import type { MarketplaceView } from '../types/database';
import { User } from '@supabase/supabase-js';
import { HeartIcon, BookmarkIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

interface ProfileProps {
    onNavigate: (page: string, ideaId?: string) => void;
}

export const Profile: React.FC<ProfileProps> = ({ onNavigate }) => {
    const [user, setUser] = useState<User | null>(null);
    const [likedIdeas, setLikedIdeas] = useState<MarketplaceView[]>([]);
    const [savedIdeas, setSavedIdeas] = useState<MarketplaceView[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                const { data: likes } = await getUserLikedListings(user.id);
                const { data: saves } = await getUserSavedListings(user.id);
                setLikedIdeas(likes || []);
                setSavedIdeas(saves || []);
            }
            setLoading(false);
        };
        loadProfile();
    }, []);

    if (loading) {
        return (
            <div className="w-full max-w-7xl mx-auto px-4 pt-24 pb-12 flex justify-center">
                <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="w-full max-w-7xl mx-auto px-4 pt-24 pb-12 text-center text-white">
                <p>Please log in to view your profile.</p>
                <button
                    onClick={() => onNavigate('login')}
                    className="mt-4 px-6 py-2 bg-green-500 text-black rounded-lg font-bold"
                >
                    Login
                </button>
            </div>
        );
    }

    const ListingTable = ({ title, icon: Icon, items, emptyMessage }: { title: string, icon: any, items: MarketplaceView[], emptyMessage: string }) => (
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-lg mb-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Icon className="w-5 h-5 text-green-500" />
                {title} ({items.length})
            </h2>

            {items.length === 0 ? (
                <p className="text-zinc-500 text-sm italic">{emptyMessage}</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/10 text-zinc-400 text-sm">
                                <th className="pb-3 pl-2">Title</th>
                                <th className="pb-3">Category</th>
                                <th className="pb-3">Price</th>
                                <th className="pb-3">Analysis</th>
                                <th className="pb-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {items.map(item => (
                                <tr key={item.idea_id} className="group hover:bg-white/5 transition-colors">
                                    <td className="py-4 pl-2 font-medium text-white">{item.title}</td>
                                    <td className="py-4 text-zinc-400 text-sm">{item.category || 'N/A'}</td>
                                    <td className="py-4 text-green-400 font-mono">${item.price.toLocaleString()}</td>
                                    <td className="py-4">
                                        <div className="flex items-center gap-1">
                                            <span className={`font-bold ${item.overall_score >= 75 ? 'text-green-500' : item.overall_score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                                                {item.overall_score.toFixed(1)}
                                            </span>
                                            <span className="text-xs text-zinc-600">/100</span>
                                        </div>
                                    </td>
                                    <td className="py-4 text-right pr-2">
                                        <button
                                            onClick={() => onNavigate('item-details', item.idea_id)}
                                            className="text-zinc-500 hover:text-white transition-colors"
                                        >
                                            <ArrowRightIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    return (
        <div className="w-full max-w-7xl mx-auto px-4 pt-24 pb-12 animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
            <p className="text-zinc-400 mb-8">{user.email}</p>

            <ListingTable
                title="Liked Ideas"
                icon={HeartIcon}
                items={likedIdeas}
                emptyMessage="You haven't liked any ideas yet."
            />

            <ListingTable
                title="Saved Ideas"
                icon={BookmarkIcon}
                items={savedIdeas}
                emptyMessage="You haven't saved any ideas yet."
            />
        </div>
    );
};

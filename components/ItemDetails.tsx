/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import {
    ArrowLeftIcon, ShieldCheckIcon, LinkIcon, DocumentCheckIcon,
    HeartIcon, BookmarkIcon, ShareIcon, ClipboardDocumentIcon, XMarkIcon, CheckIcon,
    LockClosedIcon
} from '@heroicons/react/24/outline';
import { StarIcon, HeartIcon as HeartIconSolid, BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/24/solid';
import { getIdeaDetailById, getLikeStatus, toggleLike, getSaveStatus, toggleSave, getShareCount, trackShare } from '../services/database';
import { supabase } from '../services/supabase';
import type { IdeaDetailView } from '../types/database';
import { User } from '@supabase/supabase-js';

interface ItemDetailsProps {
    ideaId: string;
    onBack: () => void;
}

export const ItemDetails: React.FC<ItemDetailsProps> = ({ ideaId, onBack }) => {
    const [item, setItem] = useState<IdeaDetailView | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [isSaved, setIsSaved] = useState(false);

    // Share Modal State
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [shareCount, setShareCount] = useState(0);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch Item
                const { data, error: fetchError } = await getIdeaDetailById(ideaId);
                if (fetchError) throw fetchError;
                if (!data) throw new Error('Idea not found');
                setItem(data);

                // Fetch Share Count
                const count = await getShareCount(ideaId);
                setShareCount(count);

                // Auth & Social State
                const { data: { user } } = await supabase.auth.getUser();
                setCurrentUser(user);

                if (user) {
                    const likeStatus = await getLikeStatus(ideaId, user.id);
                    setIsLiked(likeStatus.liked);

                    const saveStatus = await getSaveStatus(ideaId, user.id);
                    setIsSaved(saveStatus.saved);
                }
                const likeStatus = await getLikeStatus(ideaId);
                setLikeCount(likeStatus.count);

            } catch (err: any) {
                setError(err.message || 'Failed to load idea details');
                console.error('Fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [ideaId]);

    const handleCopyLink = async () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);

        // Track share
        await trackShare(ideaId, currentUser?.id);
        setShareCount(prev => prev + 1);
    };

    const handleLike = async () => {
        if (!currentUser) return alert('Please log in to like ideas.');
        // Optimistic UI interaction
        const newLiked = !isLiked;
        setIsLiked(newLiked);
        setLikeCount(prev => newLiked ? prev + 1 : prev - 1);

        const { error, count } = await toggleLike(ideaId, currentUser.id);
        if (error) {
            // Revert
            setIsLiked(!newLiked);
            setLikeCount(prev => newLiked ? prev - 1 : prev + 1);
        } else {
            setLikeCount(count);
        }
    };

    const handleSave = async () => {
        if (!currentUser) return alert('Please log in to save items');
        const { saved } = await toggleSave(ideaId, currentUser.id);
        setIsSaved(saved);
    };

    if (loading) {
        return (
            <div className="w-full max-w-5xl mx-auto px-4 pt-24 pb-12">
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-zinc-400">Loading idea details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !item) {
        return (
            <div className="w-full max-w-5xl mx-auto px-4 pt-24 pb-12">
                <button
                    onClick={onBack}
                    className="group flex items-center space-x-2 text-zinc-500 hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to Marketplace</span>
                </button>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-8 text-center">
                    <p className="text-red-500 text-lg mb-4">{error || 'Idea not found'}</p>
                    <button
                        onClick={onBack}
                        className="text-green-400 hover:text-green-300 font-medium"
                    >
                        Return to Marketplace →
                    </button>
                </div>
            </div>
        );
    }

    const handleContactSeller = () => {
        if (!currentUser) return alert('Please log in to message the seller.');
        if (!item) return;

        console.log('Contact Seller clicked', { currentUserId: currentUser.id, sellerId: item.user_id });

        if (!item.user_id) {
            alert("System Error: Could not identify the seller. Please try again later or contact support.");
            console.error("Critical: item.user_id is missing even after patch strategies.");
            return;
        }

        if (currentUser.id === item.user_id) return alert('You cannot message yourself.');

        window.dispatchEvent(new CustomEvent('ida:open-chat', {
            detail: {
                userId: item.user_id,
                userName: item.username
            }
        }));
        console.log('Dispatching open-chat event');
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-4 pt-24 pb-12 animate-in fade-in duration-500">
            <button
                onClick={onBack}
                className="group flex items-center space-x-2 text-zinc-500 hover:text-white mb-8 transition-colors"
            >
                <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Back to Marketplace</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* Left Column - Detailed Content */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Title & Header Card */}
                    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                {item.category || 'Business'}
                            </span>
                            {item.secondary_category && (
                                <span className="bg-zinc-800 text-zinc-400 border border-zinc-700 px-3 py-1 rounded-full text-xs font-medium">
                                    {item.secondary_category}
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{item.title}</h1>
                        <p className="text-xl text-zinc-400 leading-relaxed max-w-2xl">{item.one_line_description}</p>
                    </div>

                    {/* AI Scoring Metrics */}
                    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-lg">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                <StarIcon className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">AI Analysis Metrics</h2>
                                <p className="text-sm text-zinc-400">Powered by IDA AI Engine</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                            {[
                                { label: 'Uniqueness', value: item.uniqueness },
                                { label: 'Customer Pain', value: item.customer_pain },
                                { label: 'Scalability', value: item.scalability },
                                { label: 'Product-Market Fit', value: item.product_market_fit },
                                { label: 'Technical Complexity', value: item.technical_complexity },
                                { label: 'Capital Intensity', value: item.capital_intensity },
                                { label: 'Market Saturation', value: item.market_saturation },
                                { label: 'Business Model', value: item.business_model_robustness },
                                { label: 'Market Growth', value: item.market_growth_rate },
                                { label: 'Social Value', value: item.social_value }
                            ].map((metric, idx) => {
                                const getStrokeColor = (value: number) => {
                                    if (value >= 75) return '#22c55e'; // green
                                    if (value >= 50) return '#eab308'; // yellow
                                    return '#f97316'; // orange
                                };

                                const radius = 40;
                                const circumference = 2 * Math.PI * radius;
                                const strokeDashoffset = circumference - (metric.value / 100) * circumference;

                                return (
                                    <div key={idx} className="flex flex-col items-center gap-3">
                                        <div className="relative">
                                            <svg className="transform -rotate-90" width="100" height="100">
                                                {/* Background circle */}
                                                <circle
                                                    cx="50"
                                                    cy="50"
                                                    r={radius}
                                                    stroke="#27272a"
                                                    strokeWidth="8"
                                                    fill="none"
                                                />
                                                {/* Progress circle */}
                                                <circle
                                                    cx="50"
                                                    cy="50"
                                                    r={radius}
                                                    stroke={getStrokeColor(metric.value)}
                                                    strokeWidth="8"
                                                    fill="none"
                                                    strokeDasharray={circumference}
                                                    strokeDashoffset={strokeDashoffset}
                                                    strokeLinecap="round"
                                                    className="transition-all duration-1000 ease-out"
                                                />
                                            </svg>
                                            {/* Center text */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-xl font-bold text-white">{metric.value}</span>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-medium text-zinc-300">{metric.label}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Locked Content Area */}
                    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden group">

                        {/* Background Pattern */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/80 to-zinc-950 pointer-events-none"></div>

                        <div className="relative z-10 bg-zinc-800/50 p-4 rounded-full border border-zinc-700 mb-2 group-hover:bg-zinc-800 transition-colors">
                            <LockClosedIcon className="w-8 h-8 text-zinc-400" />
                        </div>

                        <div className="relative z-10 max-w-md">
                            <h3 className="text-xl font-bold text-white mb-2">Detailed Analysis Locked</h3>
                            <p className="text-zinc-400">
                                Full customer pain points, execution steps, revenue models, and impact analysis are available to the buyer.
                            </p>
                        </div>

                        <div className="relative z-10 flex gap-4 text-sm text-zinc-500 font-mono">
                            <span className="flex items-center gap-1"><CheckIcon className="w-4 h-4 text-green-500" /> Problem & Solution</span>
                            <span className="flex items-center gap-1"><CheckIcon className="w-4 h-4 text-green-500" /> Execution Plan</span>
                            <span className="flex items-center gap-1"><CheckIcon className="w-4 h-4 text-green-500" /> Financials</span>
                        </div>
                    </div>

                </div>

                {/* Right Column - Sticky Price Card */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">

                        {/* Price Display */}
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="text-sm text-zinc-400 font-medium mb-1">Asking Price</div>
                                <div key="price" className="text-4xl font-bold text-white tracking-tight">
                                    ${item.price.toLocaleString()}
                                </div>
                            </div>
                            <div className="text-xs text-zinc-500 font-mono lowercase bg-white/5 border border-white/5 px-2 py-1 rounded h-fit">
                                @{(item.username || 'User').replace(/^@/, '').toLowerCase()}
                            </div>
                        </div>

                        {/* Rating Row (Optional Display) */}
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2">
                                <div className="bg-yellow-500/10 p-1.5 rounded-lg">
                                    <StarIcon className="w-4 h-4 text-yellow-500" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-white leading-none">{item.overall_score.toFixed(1)}</span>
                                    <span className="text-xs text-zinc-500 uppercase">AI Score</span>
                                </div>
                            </div>
                            <div className="h-8 w-px bg-white/10 mx-2"></div>
                            <div className="flex flex-col items-end px-2">
                                <span className="text-xs text-zinc-400">Validated by</span>
                                <span className="text-xs text-zinc-500 uppercase font-mono tracking-wider">IDA AI</span>
                            </div>
                        </div>

                        {/* Main CTAs */}
                        <div className="space-y-3 mb-6">
                            <button className="w-full bg-white text-black hover:bg-zinc-200 font-bold text-lg py-3.5 rounded-xl transition-all shadow-lg">
                                Buy Now
                            </button>
                            <button
                                onClick={handleContactSeller}
                                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-lg py-3.5 rounded-xl border border-white/10 transition-all shadow-lg"
                            >
                                Message Seller
                            </button>
                            <a
                                href={`/pages/profile.html?id=${item.user_id}`}
                                className="block w-full text-center text-zinc-400 hover:text-white hover:bg-white/5 font-medium text-sm transition-all py-3 rounded-xl"
                            >
                                View Seller Profile →
                            </a>
                        </div>

                        {/* Secondary Actions */}
                        <div className="flex gap-3 mb-8">
                            <button
                                onClick={handleLike}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border transition-colors ${isLiked
                                    ? 'bg-pink-500/10 border-pink-500/50 text-pink-500 hover:bg-pink-500/20'
                                    : 'border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 hover:bg-zinc-800'
                                    } `}
                            >
                                {isLiked ? (
                                    <HeartIconSolid className="w-5 h-5" />
                                ) : (
                                    <HeartIcon className="w-5 h-5" />
                                )}
                                <span className="text-sm font-medium">Like {likeCount > 0 && `(${likeCount})`}</span>
                            </button>

                            <button
                                onClick={handleSave}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border transition-colors ${isSaved
                                    ? 'bg-blue-500/10 border-blue-500/50 text-blue-500 hover:bg-blue-500/20'
                                    : 'border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 hover:bg-zinc-800'
                                    } `}
                            >
                                {isSaved ? (
                                    <BookmarkIconSolid className="w-5 h-5" />
                                ) : (
                                    <BookmarkIcon className="w-5 h-5" />
                                )}
                                <span className="text-sm font-medium">{isSaved ? 'Saved' : 'Save'}</span>
                            </button>

                            <button
                                onClick={() => setIsShareOpen(true)}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 hover:bg-zinc-800 transition-colors"
                            >
                                <ShareIcon className="w-5 h-5" />
                                <span className="text-sm font-medium">Share {shareCount > 0 && `(${shareCount})`}</span>
                            </button>
                        </div>

                        {/* Trust Badges */}
                        <div className="space-y-4 pt-6 border-t border-zinc-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/10 rounded-full">
                                    <ShieldCheckIcon className="w-5 h-5 text-green-400" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-white">Verified Listing</span>
                                    <span className="text-xs text-zinc-500 leading-tight">Audited by Ida's AI & verified ownership.</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-full">
                                    <DocumentCheckIcon className="w-5 h-5 text-blue-400" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-white">Smart Contract</span>
                                    <span className="text-xs text-zinc-500 leading-tight">Ownership transfer via secure escrow.</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>

            {/* Share Modal */}
            {isShareOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setIsShareOpen(false)}
                            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>

                        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                            <ShareIcon className="w-5 h-5 text-green-500" />
                            Share this Idea
                        </h3>
                        <p className="text-zinc-400 text-sm mb-6">Copy the link below to share with others.</p>

                        <div className="space-y-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <LinkIcon className="h-5 w-5 text-zinc-500" />
                                </div>
                                <input
                                    type="text"
                                    readOnly
                                    value={window.location.href}
                                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-sm rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-green-500/50"
                                />
                            </div>

                            <button
                                onClick={handleCopyLink}
                                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold transition-all ${copied
                                    ? 'bg-green-500 text-black'
                                    : 'bg-white text-black hover:bg-zinc-200'
                                    } `}
                            >
                                {copied ? (
                                    <>
                                        <CheckIcon className="w-5 h-5" />
                                        Copied to Clipboard!
                                    </>
                                ) : (
                                    <>
                                        <ClipboardDocumentIcon className="w-5 h-5" />
                                        Copy Link
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

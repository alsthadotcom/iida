/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, CheckBadgeIcon, ChartBarIcon, DocumentTextIcon, ShieldCheckIcon, LinkIcon, DocumentCheckIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { getIdeaDetailById } from '../services/database';
import type { IdeaDetailView } from '../types/database';

interface ItemDetailsProps {
    ideaId: string;
    onBack: () => void;
}

export const ItemDetails: React.FC<ItemDetailsProps> = ({ ideaId, onBack }) => {
    const [item, setItem] = useState<IdeaDetailView | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchIdeaDetails();
    }, [ideaId]);

    const fetchIdeaDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await getIdeaDetailById(ideaId);
            if (fetchError) throw fetchError;
            if (!data) throw new Error('Idea not found');
            setItem(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load idea details');
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
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

    const getScoreColor = (score: number) => {
        if (score >= 75) return 'text-green-500';
        if (score >= 50) return 'text-yellow-500';
        if (score >= 25) return 'text-orange-500';
        return 'text-red-500';
    };

    const getDemandColor = (demand: string) => {
        if (demand === 'High') return 'text-green-500';
        if (demand === 'Mid-High') return 'text-green-400';
        if (demand === 'Mid') return 'text-yellow-500';
        if (demand === 'Low-Mid') return 'text-orange-500';
        return 'text-red-500';
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

                        <h1 className="text-3xl md:text-4xl font-bold text-white">{item.title}</h1>
                    </div>

                    {/* Description Card */}
                    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-lg">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <DocumentTextIcon className="w-5 h-5 text-green-500" />
                            Description
                        </h2>
                        <p className="text-zinc-300 leading-relaxed whitespace-pre-line">{item.description}</p>
                    </div>

                    {/* AI Scoring Card */}
                    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-lg">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <ChartBarIcon className="w-5 h-5 text-green-500" />
                            AI Analysis & Scoring
                        </h2>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-4">
                                <div className="text-xs text-zinc-500 uppercase mb-2">Uniqueness</div>
                                <div className={`text-2xl md:text-3xl font-bold ${getScoreColor(item.uniqueness)}`}>
                                    {item.uniqueness}
                                </div>
                                <div className="text-xs text-zinc-600 mt-1">out of 100</div>
                            </div>
                            <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4">
                                <div className="text-xs text-zinc-500 uppercase mb-2">Demand</div>
                                <div className={`text-xl md:text-2xl font-bold ${getDemandColor(item.demand)}`}>
                                    {item.demand}
                                </div>
                                <div className="text-xs text-zinc-600 mt-1">Market</div>
                            </div>
                            <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-4">
                                <div className="text-xs text-zinc-500 uppercase mb-2">Impact</div>
                                <div className={`text-2xl md:text-3xl font-bold ${getScoreColor(item.problem_impact)}`}>
                                    {item.problem_impact}
                                </div>
                                <div className="text-xs text-zinc-600 mt-1">out of 100</div>
                            </div>
                            <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-4">
                                <div className="text-xs text-zinc-500 uppercase mb-2">Viability</div>
                                <div className={`text-2xl md:text-3xl font-bold ${getScoreColor(item.viability)}`}>
                                    {item.viability}
                                </div>
                                <div className="text-xs text-zinc-600 mt-1">out of 100</div>
                            </div>
                            <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-4">
                                <div className="text-xs text-zinc-500 uppercase mb-2">Scalability</div>
                                <div className={`text-2xl md:text-3xl font-bold ${getScoreColor(item.scalability)}`}>
                                    {item.scalability}
                                </div>
                                <div className="text-xs text-zinc-600 mt-1">out of 100</div>
                            </div>
                            <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-4 col-span-2 lg:col-span-1">
                                <div className="text-xs text-zinc-500 uppercase mb-2">Overall</div>
                                <div className={`text-2xl md:text-3xl font-bold ${getScoreColor(item.overall_score)}`}>
                                    {item.overall_score.toFixed(1)}
                                </div>
                                <div className="text-xs text-zinc-600 mt-1">Average</div>
                            </div>
                        </div>
                        {/* Profitability */}
                        <div className="mt-6 bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                            <div className="text-xs text-green-400 uppercase mb-2">Profitability Estimate</div>
                            <div className="text-zinc-300 text-sm md:text-base">{item.profitability}</div>
                        </div>
                    </div>

                    {/* MVP Information */}
                    {item.mvp && (
                        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-lg">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <ShieldCheckIcon className="w-5 h-5 text-green-500" />
                                Minimum Viable Product
                            </h2>
                            <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <CheckBadgeIcon className="w-6 h-6 text-green-500" />
                                    <span className="text-lg font-semibold text-white">
                                        {item.mvp_type} MVP Available
                                    </span>
                                </div>

                                {item.mvp_type === 'Digital/Saas' && item.digital_mvp && (
                                    <div>
                                        <div className="text-sm text-zinc-500 mb-2">Demo URL:</div>
                                        <div className="flex items-center gap-2 text-zinc-500 bg-white/5 p-3 rounded-lg border border-zinc-800">
                                            <LockClosedIcon className="w-4 h-4" />
                                            <span className="text-sm font-medium">Link available after purchase</span>
                                        </div>
                                    </div>
                                )}

                                {item.mvp_type === 'Physical' && (item.physical_mvp_image || item.physical_mvp_video) && (
                                    <div className="space-y-4">
                                        {item.physical_mvp_image && (
                                            <div>
                                                <div className="text-sm text-zinc-500 mb-2">Product Image:</div>
                                                <img
                                                    src={item.physical_mvp_image}
                                                    alt="MVP"
                                                    className="rounded-lg border border-zinc-700 max-w-full"
                                                />
                                            </div>
                                        )}
                                        {item.physical_mvp_video && (
                                            <div>
                                                <div className="text-sm text-zinc-500 mb-2">Demo Video:</div>
                                                <video
                                                    src={item.physical_mvp_video}
                                                    controls
                                                    className="rounded-lg border border-zinc-700 max-w-full"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Documents */}
                    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-lg">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <DocumentTextIcon className="w-5 h-5 text-green-500" />
                            Supporting Documents
                        </h2>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 bg-zinc-950/50 border border-zinc-800 rounded-lg p-4 opacity-75">
                                <DocumentTextIcon className="w-5 h-5 text-zinc-500" />
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-white">Main Document</div>
                                    <div className="text-xs text-zinc-500 flex items-center gap-1">
                                        <LockClosedIcon className="w-3 h-3" />
                                        Unlock to view
                                    </div>
                                </div>
                                <LockClosedIcon className="w-4 h-4 text-zinc-600" />
                            </div>

                            {[item.additional_doc_1, item.additional_doc_2, item.additional_doc_3].map((doc, idx) => (
                                doc && (
                                    <div key={idx} className="flex items-center gap-3 bg-zinc-950/50 border border-zinc-800 rounded-lg p-4 opacity-75">
                                        <DocumentTextIcon className="w-5 h-5 text-zinc-500" />
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-white">Additional Document {idx + 1}</div>
                                            <div className="text-xs text-zinc-500 flex items-center gap-1">
                                                <LockClosedIcon className="w-3 h-3" />
                                                Unlock to view
                                            </div>
                                        </div>
                                        <LockClosedIcon className="w-4 h-4 text-zinc-600" />
                                    </div>
                                )
                            ))}
                        </div>
                    </div>

                </div>

                {/* Right Column - Sticky Price Card */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">

                        {/* Title (Mobile only, or generic?) -> Maybe 'Purchase' */}

                        {/* Price Display */}
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <div className="text-sm text-zinc-400 font-medium mb-1">Asking Price</div>
                                <div key="price" className="text-4xl font-bold text-white tracking-tight">
                                    ${item.price.toLocaleString()}
                                </div>
                            </div>
                            <div className="text-xs text-zinc-500 font-mono lowercase bg-white/5 border border-white/5 px-2 py-1 rounded">
                                @{item.username.replace(/^@/, '').toLowerCase()}
                            </div>
                        </div>

                        {item.mvp && (
                            <div className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg">
                                <CheckBadgeIcon className="w-4 h-4" />
                                <span>MVP Available</span>
                            </div>
                        )}

                        {/* Rating Row */}
                        <div className="flex items-center justify-between mb-8 p-3 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2">
                                <div className="bg-yellow-500/10 p-1.5 rounded-lg">
                                    <StarIcon className="w-4 h-4 text-yellow-500" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-white leading-none">{item.overall_score.toFixed(1)}</span>
                                    <span className="text-[10px] text-zinc-500 uppercase">AI Score</span>
                                </div>
                            </div>
                            <div className="h-8 w-px bg-white/10 mx-2"></div>
                            <div className="flex flex-col items-end px-2">
                                <span className="text-xs text-zinc-400">Validated by</span>
                                <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">IDA AI</span>
                            </div>
                        </div>

                        {/* CTA */}
                        <button className="w-full bg-green-500 hover:bg-green-400 text-black font-bold text-lg py-4 rounded-xl transition-all shadow-[0_4px_20px_rgba(34,197,94,0.3)] hover:shadow-[0_6px_30px_rgba(34,197,94,0.4)] hover:-translate-y-0.5 mb-8">
                            Contact Seller
                        </button>

                        {/* Trust Badges */}
                        <div className="space-y-4 pt-6 border-t border-white/10">
                            <div className="flex items-center gap-3 group cursor-help">
                                <div className="p-2 bg-blue-500/10 rounded-full group-hover:bg-blue-500/20 transition-colors">
                                    <CheckBadgeIcon className="w-5 h-5 text-blue-400" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">Verified Seller</span>
                                    <span className="text-xs text-zinc-500">Identity confirmed via Stripe</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 group cursor-help">
                                <div className="p-2 bg-purple-500/10 rounded-full group-hover:bg-purple-500/20 transition-colors">
                                    <DocumentCheckIcon className="w-5 h-5 text-purple-400" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">Documents Signed</span>
                                    <span className="text-xs text-zinc-500">IP assignment ready</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

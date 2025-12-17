import React, { useState } from 'react';
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    ShieldCheckIcon,
    CpuChipIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';

interface ValidationReportProps {
    result: any; // Full ValidationResult object
}

export const ValidationReport: React.FC<ValidationReportProps> = ({ result }) => {
    const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

    const toggleMetric = (key: string) => {
        if (expandedMetric === key) {
            setExpandedMetric(null);
        } else {
            setExpandedMetric(key);
        }
    };

    if (!result) return null;

    const { final_score, metrics, key_risks, validation_readiness, summary } = result;

    // Color helpers
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-[#22C55E]';
        if (score >= 60) return 'text-yellow-400';
        return 'text-red-500';
    };

    const getBgScoreColor = (score: number) => {
        if (score >= 80) return 'bg-[#22C55E]';
        if (score >= 60) return 'bg-yellow-400';
        return 'bg-red-500';
    };

    return (
        <div className="w-full space-y-8 animate-in fade-in duration-700">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row gap-8 items-center justify-between bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl backdrop-blur-sm">

                {/* Score Circle */}
                <div className="relative group">
                    <div className={`w-40 h-40 rounded-full border-4 flex items-center justify-center relative z-10 bg-zinc-950 ${getScoreColor(final_score).replace('text', 'border')}`}>
                        <div className="text-center">
                            <div className={`text-5xl font-black ${getScoreColor(final_score)}`}>
                                {final_score}
                            </div>
                            <div className="text-xs text-zinc-500 uppercase tracking-widest mt-1">out of 100</div>
                        </div>
                    </div>
                    {/* Glow Effect */}
                    <div className={`absolute inset-0 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full ${getBgScoreColor(final_score)}`}></div>
                </div>

                {/* Summary & Readiness */}
                <div className="flex-1 space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                            <ShieldCheckIcon className="w-8 h-8 text-[#22C55E]" />
                            Validation Complete
                        </h2>
                        <p className="text-zinc-400 leading-relaxed">
                            {summary}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <div className="px-4 py-2 rounded-full bg-zinc-800 border border-zinc-700 flex items-center gap-2">
                            <span className="text-zinc-400 text-xs uppercase tracking-wider">Readiness Level</span>
                            <span className={`font-bold ${validation_readiness?.level >= 3 ? 'text-[#22C55E]' : 'text-yellow-400'}`}>
                                Level {validation_readiness?.level || 1}: {validation_readiness?.label || 'Unknown'}
                            </span>
                        </div>
                        {validation_readiness?.blocking_gaps?.length > 0 && (
                            <div className="px-4 py-2 rounded-full bg-red-900/20 border border-red-500/30 flex items-center gap-2 text-red-400">
                                <ExclamationTriangleIcon className="w-4 h-4" />
                                <span className="text-xs font-bold">{validation_readiness.blocking_gaps.length} Blocking Gaps</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Coverage Gap Map (New) */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <ChartBarIcon className="w-5 h-5 text-zinc-400" />
                    Evidence Coverage Map
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {Object.entries(metrics).map(([key, data]: [string, any]) => {
                        // Check if this metric is blocked
                        const isBlocked = validation_readiness?.blocking_gaps?.some((gap: string) => gap.includes(key));
                        const isHighConf = data.score_confidence === 'high';
                        const isMedConf = data.score_confidence === 'medium';

                        let statusColor = 'bg-zinc-800'; // Low/Missing
                        let statusText = 'Low Data';
                        let textColor = 'text-zinc-500';

                        if (isBlocked) {
                            statusColor = 'bg-red-500/20 border-red-500/50 border';
                            statusText = 'MISSING';
                            textColor = 'text-red-400';
                        } else if (isHighConf) {
                            statusColor = 'bg-[#22C55E]/20 border-[#22C55E]/50 border';
                            statusText = 'VERIFIED';
                            textColor = 'text-[#22C55E]';
                        } else if (isMedConf) {
                            statusColor = 'bg-yellow-500/20 border-yellow-500/50 border';
                            statusText = 'PARTIAL';
                            textColor = 'text-yellow-500';
                        }

                        return (
                            <div key={key} className={`rounded-lg p-3 flex flex-col gap-2 ${statusColor} transition-all`}>
                                <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 truncate" title={key.replace(/_/g, ' ')}>
                                    {key.replace(/_/g, ' ')}
                                </div>
                                <div className={`text-xs font-black ${textColor}`}>
                                    {statusText}
                                </div>
                                {/* Progress Bar Mini */}
                                <div className="w-full h-1 bg-zinc-900/50 rounded-full overflow-hidden mt-1">
                                    <div
                                        className={`h-full ${textColor.replace('text', 'bg')}`}
                                        style={{ width: isHighConf ? '100%' : (isMedConf ? '50%' : '10%') }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>


            {/* Key Risks Alert */}
            {key_risks && key_risks.length > 0 && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                    <h3 className="text-red-400 font-bold mb-4 flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-5 h-5" />
                        Critical Risks Detected
                    </h3>
                    <ul className="space-y-2">
                        {key_risks.map((risk: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-3 text-red-300/80 text-sm">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                                {risk}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Metrics Grid */}
            <div>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <ChartBarIcon className="w-6 h-6 text-[#22C55E]" />
                    Detailed Metrics Analysis
                </h3>
                <div className="grid grid-cols-1 gap-4">
                    {Object.entries(metrics).map(([key, data]: [string, any]) => (
                        <div
                            key={key}
                            className={`
                                bg-zinc-900/30 border rounded-xl overflow-hidden transition-all duration-300
                                ${expandedMetric === key ? 'border-[#22C55E]/50 bg-zinc-900/80' : 'border-zinc-800 hover:border-zinc-700'}
                            `}
                        >
                            {/* Summary Card */}
                            <div
                                onClick={() => toggleMetric(key)}
                                className="p-5 flex items-center justify-between cursor-pointer group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`
                                        w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg
                                        ${data.score >= 80 ? 'bg-[#22C55E]/10 text-[#22C55E]' : data.score >= 50 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'}
                                    `}>
                                        {data.score}
                                    </div>
                                    <div>
                                        <h4 className="text-white font-semibold text-lg capitalize group-hover:text-[#22C55E] transition-colors">
                                            {key.replace(/_/g, ' ')}
                                        </h4>
                                        <div className="text-xs text-zinc-500 flex items-center gap-2">
                                            Confidence:
                                            <span className={`
                                                uppercase font-bold 
                                                ${data.score_confidence === 'high' ? 'text-[#22C55E]' : 'text-zinc-400'}
                                            `}>
                                                {data.score_confidence}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-zinc-600 group-hover:text-white transition-colors">
                                    {expandedMetric === key ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedMetric === key && (
                                <div className="px-5 pb-5 pt-0 animate-in slide-in-from-top-2">
                                    <div className="h-px w-full bg-zinc-800 mb-4"></div>

                                    {/* Reasoning */}
                                    <div className="mb-6">
                                        <h5 className="text-xs uppercase tracking-wider text-zinc-500 mb-2 font-bold">Analysis</h5>
                                        <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                                            {data.reasoning}
                                        </p>
                                    </div>

                                    {/* Sub Metrics */}
                                    {data.sub_metrics && Object.keys(data.sub_metrics).length > 0 && (
                                        <div className="grid md:grid-cols-2 gap-3">
                                            {Object.entries(data.sub_metrics).map(([subKey, subData]: [string, any]) => {
                                                const subScore = typeof subData === 'object' ? subData.score : subData;
                                                const isInferred = typeof subData === 'object' && subData.inference;

                                                return (
                                                    <div key={subKey} className="bg-zinc-950/50 rounded-lg p-3 border border-zinc-800 flex items-center justify-between">
                                                        <span className="text-zinc-400 text-sm capitalize">{subKey.replace(/_/g, ' ')}</span>
                                                        <div className="flex items-center gap-3">
                                                            {isInferred && (
                                                                <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/20" title="Inferred data (-25 pts)">
                                                                    INFERRED
                                                                </span>
                                                            )}
                                                            <span className={`font-mono font-bold ${getScoreColor(subScore)}`}>
                                                                {subScore}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* AI Disclaimer */}
            <div className="text-center pt-8 border-t border-zinc-900">
                <p className="text-zinc-600 text-xs flex items-center justify-center gap-2">
                    <CpuChipIcon className="w-4 h-4" />
                    Powered by IDA Epistemic Engine V4.5 (GPT-5.1 + Perplexity)
                </p>
            </div>
        </div>
    );
};

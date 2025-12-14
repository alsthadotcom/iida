/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ArrowLeftIcon, DocumentPlusIcon, PhotoIcon, VideoCameraIcon, XMarkIcon, SparklesIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { analyzeAssetScores } from '../services/gemini';
import { createIdeaListing, createAIScoring, uploadDocument, getIdeaDetails, updateIdeaListing, updateAIScoring } from '../services/database';
import { supabase } from '../services/supabase';
import type { DemandLevel, IdeaDetailView } from '../types/database';
// import { CATEGORIES } from '../constants/categories'; 
// import { suggestCategory } from '../services/analyzeBusinessModel';
// import { CategoryDropdown } from './CategoryDropdown';

const INDUSTRIES = ["Technology", "Finance", "Health", "Education", "Ecommerce", "Media & Content", "Real Estate", "Logistics", "Agriculture", "Energy", "Other"];
const CUSTOMER_TYPES = ["Consumers (B2C)", "Businesses (B2B)", "Enterprises", "Governments / NGOs", "Creators / Freelancers", "Mixed"];
const STAGES = ["Idea / Concept", "Validated (research/interviews)", "MVP built", "Revenue generating"];
const URGENCY_LEVELS = ["Low", "Medium", "High"];
const PRIMARY_ADVANTAGES = ["Lower cost", "Faster", "Better user experience", "New capability", "Better access / availability", "Other"];
const MARKET_SIZES = ["Small (niche)", "Medium", "Large"];
const MARKET_GROWTH_TRENDS = ["Declining", "Stable", "Growing"];
const GEOGRAPHIC_SCOPES = ["Local", "National", "Global"];
const REVENUE_MODELS = ["Subscription", "One-time purchase", "Commission / Marketplace fee", "Advertising", "Licensing", "Usage-based"];
const PRICE_PER_CUSTOMER = ["Under $10", "50", "200", "1,000", "$1,000+"];
const COST_INTENSITIES = ["Low", "Medium", "High"];
const BUILD_DIFFICULTIES = ["Easy", "Medium", "Hard"];
const TIMES_TO_VERSION = ["Under 1 month", "1–3 months", "3–6 months", "6+ months"];
const REGULATORY_DEPENDENCIES = ["None", "Moderate", "High"];
const VALIDATION_LEVELS = ["None", "Customer interviews", "Survey data", "Waitlist / signups", "Paying customers"];
const WHATS_INCLUDED = ["Idea only", "Idea + framework", "Full execution plan"];
const BUYER_RIGHTS = ["Yes (allowed)", "No"];
const EXCLUSIVITIES = ["Exclusive sale", "Non-exclusive sale"];
const PAIN_LEVELS = [1, 2, 3, 4, 5];
const DIFF_STRENGTHS = [1, 2, 3, 4, 5];

interface SellIdeaProps {
    onBack: () => void;
}

interface AIScores {
    uniqueness: number;
    demand: DemandLevel;
    problem_impact: number;
    profitability: {
        estimatedRevenue: number;
        estimatedProfit: number;
        marginPercentage: number;
    };
    viability: number;
    scalability: number;
}

export const SellIdea: React.FC<SellIdeaProps> = ({ onBack }) => {
    // --- State ---
    const [editId, setEditId] = useState<string | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Idea Snapshot
    const [title, setTitle] = useState('');
    const [oneLineDescription, setOneLineDescription] = useState('');
    const [industry, setIndustry] = useState(INDUSTRIES[0]);
    const [targetCustomer, setTargetCustomer] = useState(CUSTOMER_TYPES[0]);
    const [stage, setStage] = useState(STAGES[0]);

    // Problem & Urgency
    const [problemDescription, setProblemDescription] = useState('');
    const [whoFacesProblem, setWhoFacesProblem] = useState('');
    const [painLevel, setPainLevel] = useState(1);
    const [urgencyLevel, setUrgencyLevel] = useState(URGENCY_LEVELS[0]);
    const [currentAlternatives, setCurrentAlternatives] = useState('');

    // Solution & Advantage
    const [solutionSummary, setSolutionSummary] = useState('');
    const [primaryAdvantage, setPrimaryAdvantage] = useState(PRIMARY_ADVANTAGES[0]);
    const [differentiationStrength, setDifferentiationStrength] = useState(1);

    // Market Potential
    const [marketSize, setMarketSize] = useState(MARKET_SIZES[0]);
    const [marketGrowthTrend, setMarketGrowthTrend] = useState(MARKET_GROWTH_TRENDS[1]); // Stable default
    const [geographicScope, setGeographicScope] = useState(GEOGRAPHIC_SCOPES[1]); // National default

    // Revenue Model
    const [revenueModelType, setRevenueModelType] = useState(REVENUE_MODELS[0]);
    const [expectedPricePerCustomer, setExpectedPricePerCustomer] = useState(PRICE_PER_CUSTOMER[1]);
    const [costIntensity, setCostIntensity] = useState(COST_INTENSITIES[1]);

    // Execution Difficulty
    const [buildDifficulty, setBuildDifficulty] = useState(BUILD_DIFFICULTIES[1]);
    const [timeToFirstVersion, setTimeToFirstVersion] = useState(TIMES_TO_VERSION[1]);
    const [regulatoryDependency, setRegulatoryDependency] = useState(REGULATORY_DEPENDENCIES[0]);

    // Validation
    const [validationLevel, setValidationLevel] = useState(VALIDATION_LEVELS[0]);
    const [validationNotes, setValidationNotes] = useState('');

    // Sale & Rights
    const [whatIsIncluded, setWhatIsIncluded] = useState(WHATS_INCLUDED[0]);
    const [buyerResaleRights, setBuyerResaleRights] = useState(BUYER_RIGHTS[0]);
    const [exclusivity, setExclusivity] = useState(EXCLUSIVITIES[0]);

    // Metadata
    const [price, setPrice] = useState(''); // Asking Price
    // Removed old category state since we use 'industry' now

    // Document State
    const [mainDocument, setMainDocument] = useState<File | null>(null);
    const [existingMainDocUrl, setExistingMainDocUrl] = useState<string | null>(null);
    const [additionalDocuments, setAdditionalDocuments] = useState<File[]>([]);
    const [existingAdditionalDocs, setExistingAdditionalDocs] = useState<string[]>([]);
    const [showAdditionalDocs, setShowAdditionalDocs] = useState(false);

    // AI & Other
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [scores, setScores] = useState<AIScores | null>(null);

    // Legacy MVP fields (kept for compatibility or internal logic if needed, but UI removed)
    const [hasMVP, setHasMVP] = useState<boolean | null>(false);
    const [mvpMediaFiles, setMvpMediaFiles] = useState<File[]>([]);
    const [existingMvpMedia, setExistingMvpMedia] = useState<{ url: string, type: 'image' | 'video' }[]>([]);

    // Submission state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [touched, setTouched] = useState(false);

    // Refs
    const mainFileInputRef = useRef<HTMLInputElement>(null);
    const additionalFileInputRef = useRef<HTMLInputElement>(null);
    const mvpMediaInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // --- Effects ---

    // Check for Edit Mode
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('edit');
        if (id) {
            setEditId(id);
            loadListingData(id);
        }
    }, []);

    // Auto-resize textarea (Simple generic approach or removed if using fixed rows)
    // We have multiple textareas now, so one ref won't work for all unless we manage multiple or use a library.
    // For now, removing the auto-resize for the single 'description' field.

    const loadListingData = async (id: string) => {
        setIsLoadingData(true);
        try {
            const { data, error } = await getIdeaDetails(id);
            if (error || !data) throw error || new Error('Listing not found');

            // Populate State
            setTitle(data.title);
            setOneLineDescription(data.one_line_description || '');
            setIndustry(data.category || INDUSTRIES[0]);
            setTargetCustomer(data.target_customer_type || CUSTOMER_TYPES[0]);
            setStage(data.stage || STAGES[0]);

            setProblemDescription(data.problem_description || '');
            setWhoFacesProblem(data.who_faces_problem || '');
            setPainLevel(data.pain_level || 1);
            setUrgencyLevel(data.urgency_level || URGENCY_LEVELS[0]);
            setCurrentAlternatives(data.current_alternatives || '');

            setSolutionSummary(data.solution_summary || '');
            setPrimaryAdvantage(data.primary_advantage || PRIMARY_ADVANTAGES[0]);
            setDifferentiationStrength(data.differentiation_strength || 1);

            setMarketSize(data.market_size || MARKET_SIZES[0]);
            setMarketGrowthTrend(data.market_growth_trend || MARKET_GROWTH_TRENDS[1]);
            setGeographicScope(data.geographic_scope || GEOGRAPHIC_SCOPES[1]);

            setRevenueModelType(data.revenue_model_type || REVENUE_MODELS[0]);
            setExpectedPricePerCustomer(data.expected_price_per_customer || PRICE_PER_CUSTOMER[1]);
            setCostIntensity(data.cost_intensity || COST_INTENSITIES[1]);

            setBuildDifficulty(data.build_difficulty || BUILD_DIFFICULTIES[1]);
            setTimeToFirstVersion(data.time_to_first_version || TIMES_TO_VERSION[1]);
            setRegulatoryDependency(data.regulatory_dependency || REGULATORY_DEPENDENCIES[0]);

            setValidationLevel(data.validation_level || VALIDATION_LEVELS[0]);
            setValidationNotes(data.validation_notes || '');

            setWhatIsIncluded(data.what_is_included || WHATS_INCLUDED[0]);
            setBuyerResaleRights(data.buyer_resale_rights || BUYER_RIGHTS[0]);
            setExclusivity(data.exclusivity || EXCLUSIVITIES[0]);

            setPrice(data.price.toString());
            setExistingMainDocUrl(data.document_url);

            const extraDocs = [data.additional_doc_1, data.additional_doc_2, data.additional_doc_3].filter(Boolean) as string[];
            setExistingAdditionalDocs(extraDocs);
            if (extraDocs.length > 0) setShowAdditionalDocs(true);

            // Legacy MVP handling if needed (though UI is removed, we might keep state consistent)
            setHasMVP(data.mvp);

            // Populate Scores
            // We use dummy profitability since it's not visualized in the CircularScore components currently
            if (data.uniqueness !== undefined) {
                setScores({
                    uniqueness: data.uniqueness || 0,
                    demand: data.demand || 'Mid',
                    problem_impact: data.problem_impact || 0,
                    profitability: { estimatedRevenue: 0, estimatedProfit: 0, marginPercentage: 0 },
                    viability: data.viability || 0,
                    scalability: data.scalability || 0
                });
            }

        } catch (err) {
            console.error('Failed to load listing', err);
            alert('Failed to load listing for editing.');
        } finally {
            setIsLoadingData(false);
        }
    };

    // --- Handlers ---

    // Helper to compress images
    const compressImage = async (file: File): Promise<File> => {
        if (!file.type.startsWith('image/')) return file;

        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(url);
                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 1200;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(file);
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const newFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now(),
                        });
                        resolve(newFile);
                    } else {
                        resolve(file);
                    }
                }, file.type, 0.8);
            };
            img.onerror = (err) => reject(err);
            img.src = url;
        });
    };

    const handleMainDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            // Allow PDF and Images
            if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
                alert("Please upload a PDF document or an Image (JPEG, PNG).");
                return;
            }
            // Basic size check (e.g. 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert("File size too large. Please upload a file smaller than 10MB.");
                return;
            }

            // Compress if image
            const processedFile = await compressImage(file);

            setMainDocument(processedFile);
            setExistingMainDocUrl(null); // Replace existing

            // Always run analysis for new file
            await runAnalysis(processedFile);
        }
    };

    const handleAdditionalDocsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles: File[] = Array.from(e.target.files);
            const validFiles = newFiles.filter(f => f.type === 'application/pdf');

            const currentCount = additionalDocuments.length + existingAdditionalDocs.length;

            if (currentCount + validFiles.length > 3) {
                alert("You can only have up to 3 additional documents.");
                // Add as many as fit
                const remaining = 3 - currentCount;
                if (remaining > 0) {
                    setAdditionalDocuments([...additionalDocuments, ...validFiles.slice(0, remaining)]);
                }
            } else {
                setAdditionalDocuments([...additionalDocuments, ...validFiles]);
            }
        }
    };

    const runAnalysis = async (file: File) => {
        setIsAnalyzing(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = (reader.result as string).split(',')[1];
                const newScores = await analyzeAssetScores(base64, file.type);
                setScores(newScores);
                setIsAnalyzing(false);
            };
        } catch (error) {
            console.error("Analysis failed", error);
            setIsAnalyzing(false);
        }
    };

    const removeMainDocument = () => {
        setMainDocument(null);
        setExistingMainDocUrl(null);
        setScores(null);
    };

    const removeAdditionalDocument = (index: number) => {
        setAdditionalDocuments(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingAdditionalDocument = (index: number) => {
        setExistingAdditionalDocs(prev => prev.filter((_, i) => i !== index));
    };

    const handleMvpMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const rawFiles = Array.from(e.target.files);
            const processedFiles = await Promise.all(rawFiles.map((f: File) => compressImage(f)));
            setMvpMediaFiles([...mvpMediaFiles, ...processedFiles]);
        }
    };

    const removeMvpMedia = (index: number) => {
        setMvpMediaFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingMvpMedia = (index: number) => {
        setExistingMvpMedia(prev => prev.filter((_, i) => i !== index));
    };

    // Removed handleCategoryModeChange


    // --- Validation & Limits ---

    const maxPriceLimit = useMemo(() => {
        let limit = 500;

        // Use scores if present (new analysis), otherwise check if editing (we might loosen limits or need stored scores)
        // For edit mode without new score, we might want to respect existing price or assume validation passed.
        // Assuming if editing, user already passed validation.
        if (editId && !scores) return 100000; // Allow existing prices in edit mode without re-scoring

        if (scores) {
            const { uniqueness, viability, scalability } = scores;
            const avgScore = (uniqueness + viability + scalability) / 3;
            const isHighTier = avgScore > 75;

            if (hasMVP) {
                limit = isHighTier ? 5000 : 1000;
            } else {
                limit = isHighTier ? 1000 : 500;
            }
        }
        return limit;
    }, [scores, hasMVP, editId]);

    const isPriceValid = useMemo(() => {
        const p = parseFloat(price);
        return !isNaN(p) && p > 0 && p <= maxPriceLimit;
    }, [price, maxPriceLimit]);

    const formValid = useMemo(() => {
        // In edit mode, document is valid if we have existing URL OR new file
        const hasMainDoc = mainDocument !== null || existingMainDocUrl !== null;

        return title.trim().length > 0 &&
            oneLineDescription.trim().length > 0 &&
            problemDescription.trim().length > 0 &&
            solutionSummary.trim().length > 0 &&
            hasMainDoc &&
            isPriceValid;
    }, [title, oneLineDescription, problemDescription, solutionSummary, mainDocument, existingMainDocUrl, isPriceValid]);

    // --- Submit ---

    const handleSubmit = async () => {
        setTouched(true);
        if (!formValid) return;

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('You must be logged in');

            // 1. Upload new files if any
            let mainDocUrl = existingMainDocUrl || '';
            if (mainDocument) {
                const { data, error } = await uploadDocument(mainDocument, user.id, 'documents');
                if (error) throw error;
                mainDocUrl = data!.url;
            }

            const additionalDocUrls: string[] = [...existingAdditionalDocs];
            for (const doc of additionalDocuments) {
                const { data, error } = await uploadDocument(doc, user.id, 'documents');
                if (error) throw error;
                additionalDocUrls.push(data!.url);
            }

            // 2. Prepare Data
            // 2. Prepare Data
            const listingData = {
                title,
                one_line_description: oneLineDescription,
                category: industry,
                target_customer_type: targetCustomer,
                stage: stage,

                problem_description: problemDescription,
                who_faces_problem: whoFacesProblem,
                pain_level: painLevel,
                urgency_level: urgencyLevel,
                current_alternatives: currentAlternatives,

                solution_summary: solutionSummary,
                primary_advantage: primaryAdvantage,
                differentiation_strength: differentiationStrength,

                market_size: marketSize,
                market_growth_trend: marketGrowthTrend,
                geographic_scope: geographicScope,

                revenue_model_type: revenueModelType,
                expected_price_per_customer: expectedPricePerCustomer,
                cost_intensity: costIntensity,

                build_difficulty: buildDifficulty,
                time_to_first_version: timeToFirstVersion,
                regulatory_dependency: regulatoryDependency,

                validation_level: validationLevel,
                validation_notes: validationNotes,

                what_is_included: whatIsIncluded,
                buyer_resale_rights: buyerResaleRights,
                exclusivity: exclusivity,

                document_url: mainDocUrl,
                additional_doc_1: additionalDocUrls[0] || null,
                additional_doc_2: additionalDocUrls[1] || null,
                additional_doc_3: additionalDocUrls[2] || null,

                price: parseFloat(price)
            };

            // 3. Update or Create
            if (editId) {
                const { error } = await updateIdeaListing(editId, listingData);
                if (error) throw error;

                // Update Scores if new analysis
                if (scores) {
                    const profitabilityText = `Revenue: $${scores.profitability.estimatedRevenue.toLocaleString()}/yr, Profit: $${scores.profitability.estimatedProfit.toLocaleString()}/yr (${scores.profitability.marginPercentage}% Margin)`;
                    await updateAIScoring(editId, {
                        uniqueness: scores.uniqueness,
                        demand: scores.demand,
                        problem_impact: scores.problem_impact,
                        profitability: profitabilityText,
                        viability: scores.viability,
                        scalability: scores.scalability
                    });
                }
                alert('Listing updated successfully!');
            } else {
                // Create
                const { data: ideaData, error: ideaError } = await createIdeaListing({
                    ...listingData,
                    user_id: user.id
                });
                if (ideaError || !ideaData) throw ideaError || new Error('Failed to create');

                // Create Score
                const finalScores = scores || {
                    uniqueness: 70,
                    demand: 'Mid',
                    problem_impact: 70,
                    profitability: { estimatedRevenue: 10000, estimatedProfit: 1000, marginPercentage: 10 },
                    viability: 70,
                    scalability: 70
                };

                const profitabilityText = typeof finalScores.profitability === 'string'
                    ? finalScores.profitability
                    : `Revenue: $${finalScores.profitability.estimatedRevenue.toLocaleString()}/yr, Profit: $${finalScores.profitability.estimatedProfit.toLocaleString()}/yr (${finalScores.profitability.marginPercentage}% Margin)`;

                await createAIScoring({
                    idea_id: ideaData.idea_id,
                    uniqueness: finalScores.uniqueness,
                    demand: finalScores.demand as any,
                    problem_impact: finalScores.problem_impact,
                    profitability: profitabilityText,
                    viability: finalScores.viability,
                    scalability: finalScores.scalability
                });

                alert('Idea listed successfully!');
            }

            // Redirect
            // Redirect
            onBack();

        } catch (error: any) {
            console.error('Submit error:', error);
            setSubmitError(error.message || 'Failed to submit.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Helper Components ---
    const CircularScore = ({ label, value }: { label: string, value: number }) => {
        // ... existing implementation
        // To save characters, I'll inline simplified SVGs or copy from previous if space permits.
        // Rewriting it simplified.
        const radius = 30;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (value / 100) * circumference;
        const getColor = (val: number) => val < 25 ? 'text-red-500' : val < 50 ? 'text-orange-500' : val < 75 ? 'text-yellow-500' : 'text-green-500';
        const colorClass = getColor(value);
        return (
            <div className="flex flex-col items-center gap-2">
                <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
                        <circle cx="48" cy="48" r={radius} className="stroke-zinc-800" strokeWidth="6" fill="transparent" />
                        <circle cx="48" cy="48" r={radius} className={`${colorClass.replace('text-', 'stroke-')} transition-all`} strokeWidth="6" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
                    </svg>
                    <div className={`absolute inset-0 flex items-center justify-center font-bold text-2xl ${colorClass}`}>{value}</div>
                </div>
                <span className="text-xs font-mono uppercase text-zinc-400 text-center">{label}</span>
            </div>
        );
    };

    if (isLoadingData) {
        return <div className="min-h-screen flex items-center justify-center text-white">Loading data...</div>;
    }

    return (
        <div className="w-full max-w-4xl mx-auto px-4 pt-24 pb-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <button onClick={onBack} className="group flex items-center space-x-2 text-zinc-500 hover:text-white mb-8 transition-colors">
                <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1" />
                <span className="text-sm font-medium">Cancel</span>
            </button>

            <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 md:p-10 shadow-2xl">
                <h1 className="text-3xl font-bold text-white mb-2">{editId ? 'Edit Listing' : 'Sell Your Idea'}</h1>
                <p className="text-zinc-400 mb-8">{editId ? 'Update your listing details.' : 'List your business concept, IP, or validated startup for sale.'}</p>

                {submitError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 text-red-500 text-sm">{submitError}</div>
                )}

                <div className="space-y-8">
                    <div className="space-y-12">

                        {/* 1. Idea Snapshot */}
                        <div className="space-y-6 border-b border-zinc-800 pb-8">
                            <h2 className="text-xl font-bold text-white">Idea Snapshot</h2>

                            <div className="grid md:grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Idea Title <span className="text-red-500">*</span></label>
                                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors" placeholder="e.g. AI-Powered Freelance Marketplace" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">One-line Description <span className="text-red-500">*</span> <span className="text-xs text-zinc-500">(Max 200 chars)</span></label>
                                    <input type="text" maxLength={200} value={oneLineDescription} onChange={(e) => setOneLineDescription(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors" placeholder="A brief, catchy elevator pitch." />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Industry / Category</label>
                                    <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none">
                                        {INDUSTRIES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Target Customer Type</label>
                                    <select value={targetCustomer} onChange={(e) => setTargetCustomer(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none">
                                        {CUSTOMER_TYPES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Stage</label>
                                    <select value={stage} onChange={(e) => setStage(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none">
                                        {STAGES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 2. Problem & Urgency */}
                        <div className="space-y-6 border-b border-zinc-800 pb-8">
                            <h2 className="text-xl font-bold text-white">Problem & Urgency</h2>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Problem Description <span className="text-red-500">*</span></label>
                                <textarea value={problemDescription} onChange={(e) => setProblemDescription(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none min-h-[100px]" placeholder="What is the core problem?"></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Who Faces This Problem?</label>
                                <input type="text" value={whoFacesProblem} onChange={(e) => setWhoFacesProblem(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none" />
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Pain Level (1-5)</label>
                                    <div className="flex gap-4 items-center">
                                        <input type="range" min="1" max="5" value={painLevel} onChange={(e) => setPainLevel(parseInt(e.target.value))} className="w-full accent-green-500" />
                                        <span className="text-white font-bold w-4">{painLevel}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-zinc-500 mt-1"><span>Minor</span><span>Critical</span></div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Urgency Level</label>
                                    <select value={urgencyLevel} onChange={(e) => setUrgencyLevel(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none">
                                        {URGENCY_LEVELS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Current Alternatives</label>
                                <input type="text" value={currentAlternatives} onChange={(e) => setCurrentAlternatives(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none" placeholder="How do people solve this now?" />
                            </div>
                        </div>

                        {/* 3. Solution & Advantage */}
                        <div className="space-y-6 border-b border-zinc-800 pb-8">
                            <h2 className="text-xl font-bold text-white">Solution & Advantage</h2>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Solution Summary <span className="text-red-500">*</span></label>
                                <textarea value={solutionSummary} onChange={(e) => setSolutionSummary(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none min-h-[100px]" placeholder="How does your idea solve the problem?"></textarea>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Primary Advantage</label>
                                    <select value={primaryAdvantage} onChange={(e) => setPrimaryAdvantage(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none">
                                        {PRIMARY_ADVANTAGES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Differentiation Strength (1-5)</label>
                                    <div className="flex gap-4 items-center">
                                        <input type="range" min="1" max="5" value={differentiationStrength} onChange={(e) => setDifferentiationStrength(parseInt(e.target.value))} className="w-full accent-green-500" />
                                        <span className="text-white font-bold w-4">{differentiationStrength}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-zinc-500 mt-1"><span>Weak</span><span>Strong</span></div>
                                </div>
                            </div>
                        </div>

                        {/* 4. Market Potential */}
                        <div className="space-y-6 border-b border-zinc-800 pb-8">
                            <h2 className="text-xl font-bold text-white">Market Potential (Rough)</h2>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Market Size</label>
                                    <select value={marketSize} onChange={(e) => setMarketSize(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none">
                                        {MARKET_SIZES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Growth Trend</label>
                                    <select value={marketGrowthTrend} onChange={(e) => setMarketGrowthTrend(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none">
                                        {MARKET_GROWTH_TRENDS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Geographic Scope</label>
                                    <select value={geographicScope} onChange={(e) => setGeographicScope(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none">
                                        {GEOGRAPHIC_SCOPES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 5. Revenue Model */}
                        <div className="space-y-6 border-b border-zinc-800 pb-8">
                            <h2 className="text-xl font-bold text-white">Revenue Model</h2>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Revenue Type</label>
                                    <select value={revenueModelType} onChange={(e) => setRevenueModelType(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none">
                                        {REVENUE_MODELS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Expected Price / Customer</label>
                                    <select value={expectedPricePerCustomer} onChange={(e) => setExpectedPricePerCustomer(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none">
                                        {PRICE_PER_CUSTOMER.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Cost Intensity</label>
                                    <select value={costIntensity} onChange={(e) => setCostIntensity(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none">
                                        {COST_INTENSITIES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 6. Execution Difficulty */}
                        <div className="space-y-6 border-b border-zinc-800 pb-8">
                            <h2 className="text-xl font-bold text-white">Execution Difficulty</h2>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Build Difficulty</label>
                                    <select value={buildDifficulty} onChange={(e) => setBuildDifficulty(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none">
                                        {BUILD_DIFFICULTIES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Time to v1</label>
                                    <select value={timeToFirstVersion} onChange={(e) => setTimeToFirstVersion(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none">
                                        {TIMES_TO_VERSION.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Regulatory / Legal</label>
                                    <select value={regulatoryDependency} onChange={(e) => setRegulatoryDependency(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none">
                                        {REGULATORY_DEPENDENCIES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 7. Validation */}
                        <div className="space-y-6 border-b border-zinc-800 pb-8">
                            <h2 className="text-xl font-bold text-white">Validation (Optional but Weighted)</h2>
                            <div className="grid md:grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Validation Level</label>
                                    <select value={validationLevel} onChange={(e) => setValidationLevel(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none">
                                        {VALIDATION_LEVELS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Validation Notes</label>
                                    <textarea value={validationNotes} onChange={(e) => setValidationNotes(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none h-24" placeholder="Share any specific traction/validation details (optional)."></textarea>
                                </div>
                            </div>
                        </div>

                        {/* 8. Sale & Rights */}
                        <div className="space-y-6 border-b border-zinc-800 pb-8">
                            <h2 className="text-xl font-bold text-white">Sale & Rights</h2>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">What Is Included</label>
                                    <select value={whatIsIncluded} onChange={(e) => setWhatIsIncluded(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none">
                                        {WHATS_INCLUDED.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Resale Rights</label>
                                    <select value={buyerResaleRights} onChange={(e) => setBuyerResaleRights(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none">
                                        {BUYER_RIGHTS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Exclusivity</label>
                                    <select value={exclusivity} onChange={(e) => setExclusivity(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none">
                                        {EXCLUSIVITIES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Asking Price ($)</label>
                                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className={`w-full bg-zinc-950/50 border rounded-lg px-4 py-3 text-white text-lg font-mono ${!isPriceValid ? 'border-red-500' : 'border-zinc-700'}`} placeholder="5000" />
                                <p className="text-xs text-zinc-500 mt-1">Limit: ${maxPriceLimit}</p>
                            </div>
                        </div>

                        {/* 9. Supporting Documents */}
                        <div className="border-b border-zinc-800 pb-8">
                            <h2 className="text-xl font-bold text-white mb-6">Supporting Documents</h2>
                            <div className={`border rounded-xl p-6 bg-zinc-950/30 ${touched && !mainDocument && !existingMainDocUrl ? 'border-red-500/50' : 'border-zinc-800'}`}>
                                <h3 className="text-lg font-medium text-white mb-4">Primary Document <span className="text-red-500">*</span></h3>

                                {(mainDocument || existingMainDocUrl) ? (
                                    <div className="flex items-center justify-between bg-zinc-800/50 px-4 py-3 rounded-lg border border-zinc-700">
                                        <span className="text-sm text-zinc-200 truncate max-w-xs">{mainDocument ? mainDocument.name : 'Existing Document'}</span>
                                        <button onClick={removeMainDocument} className="text-zinc-500 hover:text-red-400"><XMarkIcon className="w-5 h-5" /></button>
                                    </div>
                                ) : (
                                    <div onClick={() => mainFileInputRef.current?.click()} className="border border-dashed border-zinc-700 rounded-lg p-6 text-center cursor-pointer hover:border-zinc-500 transition-colors">
                                        <DocumentPlusIcon className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                                        <span className="text-sm text-zinc-400">Click to upload Prospectus</span>
                                        <span className="block text-xs text-zinc-500 mt-1">(PDF, JPEG, PNG - Max 10MB)</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    ref={mainFileInputRef}
                                    className="hidden"
                                    accept="application/pdf,image/png,image/jpeg,image/webp"
                                    onChange={handleMainDocUpload}
                                />

                                {/* Additional Docs */}
                                <div className="mt-6">
                                    <div className="flex justify-between mb-2"><span className="text-sm text-zinc-300">Additional Docs</span></div>
                                    {/* Existing */}
                                    {existingAdditionalDocs.map((url, i) => (
                                        <div key={`ex-${i}`} className="flex justify-between bg-zinc-800 px-3 py-2 rounded mb-2">
                                            <span className="text-xs text-zinc-400">Existing Doc {i + 1}</span>
                                            <button onClick={() => removeExistingAdditionalDocument(i)} className="text-red-400"><XMarkIcon className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                    {/* New */}
                                    {additionalDocuments.map((doc, i) => (
                                        <div key={`new-${i}`} className="flex justify-between bg-zinc-800 px-3 py-2 rounded mb-2">
                                            <span className="text-xs text-zinc-300">{doc.name}</span>
                                            <button onClick={() => removeAdditionalDocument(i)} className="text-red-400"><XMarkIcon className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                    {existingAdditionalDocs.length + additionalDocuments.length < 3 && (
                                        <button onClick={() => additionalFileInputRef.current?.click()} className="text-xs text-green-400 flex items-center gap-1">+ Add More</button>
                                    )}
                                    <input type="file" ref={additionalFileInputRef} className="hidden" accept="application/pdf" multiple onChange={handleAdditionalDocsUpload} />
                                </div>
                            </div>
                        </div>

                        {/* 10. AI-metrics */}
                        {scores && (
                            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
                                <h2 className="text-xl font-bold text-white mb-4">AI Metrics</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <CircularScore label="Uniqueness" value={scores.uniqueness} />
                                    <CircularScore label="Viability" value={scores.viability} />
                                    <CircularScore label="Scalability" value={scores.scalability} />
                                    <CircularScore label="Impact" value={scores.problem_impact} />
                                </div>
                            </div>
                        )}

                        <button onClick={handleSubmit} disabled={isSubmitting || !formValid} className={`w-full py-4 rounded-xl font-bold flex justify-center items-center gap-2 ${formValid && !isSubmitting ? 'bg-green-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                            {isSubmitting ? 'Processing...' : (editId ? 'Update Listing' : 'Publish Listing')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

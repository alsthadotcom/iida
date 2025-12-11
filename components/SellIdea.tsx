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
// import { CATEGORIES } from '../constants/categories'; // Unused if using Manual/AI only? CategoryDropdown used
import { suggestCategory } from '../services/analyzeBusinessModel';
import { CategoryDropdown } from './CategoryDropdown';

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

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    // Document State
    const [mainDocument, setMainDocument] = useState<File | null>(null);
    const [existingMainDocUrl, setExistingMainDocUrl] = useState<string | null>(null);

    const [additionalDocuments, setAdditionalDocuments] = useState<File[]>([]);
    const [existingAdditionalDocs, setExistingAdditionalDocs] = useState<string[]>([]);
    const [showAdditionalDocs, setShowAdditionalDocs] = useState(false);

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [scores, setScores] = useState<AIScores | null>(null);
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState<string>('');
    const [categoryMode, setCategoryMode] = useState<'Manual' | 'AI'>('Manual');
    const [isSuggestingCategory, setIsSuggestingCategory] = useState(false);

    // MVP State
    const [hasMVP, setHasMVP] = useState<boolean | null>(null);
    const [mvpType, setMvpType] = useState<'Physical' | 'Digital/Saas' | null>(null);
    const [mvpUrl, setMvpUrl] = useState(''); // For Digital URL
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

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [description]);

    const loadListingData = async (id: string) => {
        setIsLoadingData(true);
        try {
            const { data, error } = await getIdeaDetails(id);
            if (error || !data) throw error || new Error('Listing not found');

            // Populate State
            setTitle(data.title);
            setDescription(data.description);
            setCategory(data.category || '');
            setPrice(data.price.toString());

            setExistingMainDocUrl(data.document_url);

            const extraDocs = [data.additional_doc_1, data.additional_doc_2, data.additional_doc_3].filter(Boolean) as string[];
            setExistingAdditionalDocs(extraDocs);
            if (extraDocs.length > 0) setShowAdditionalDocs(true);

            setHasMVP(data.mvp);
            if (data.mvp) {
                setMvpType(data.mvp_type || null);
                if (data.mvp_type === 'Digital/Saas') {
                    setMvpUrl(data.digital_mvp || '');
                } else if (data.mvp_type === 'Physical') {
                    const media = [];
                    if (data.physical_mvp_image) media.push({ url: data.physical_mvp_image, type: 'image' as const });
                    if (data.physical_mvp_video) media.push({ url: data.physical_mvp_video, type: 'video' as const });
                    setExistingMvpMedia(media);
                }
            }

            // Parse Scores from DB View (which comes from ai_scoring table)
            // Note: DB doesn't store full breakdown like 'profitability' object, only text.
            // We might need to reconstruct or just use what we have.
            // Actually `IdeaDetailView` has individual score fields from `ai_scoring`.
            // But `profitability` in DB is a STRING (Step 752 Logic: "Revenue: $X...").
            // We can't easily parse it back to object for the circular chart unless we parse the string.
            // However, we have `uniqueness`, `viability`, `scalability`, `demand`, `problem_impact`.
            // We can reconstruct a partial `scores` object or just ignore re-displaying AI detail in edit mode unless re-analyzed.
            // Better: Display existing scores if no new file.
            // I'll create a dummy `scores` object if possible, or just skip rendering charts until re-analysis.
            // Let's rely on re-analysis if they upload a new doc. If not, we keep existing scores in DB (no update).

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
            const processedFiles = await Promise.all(rawFiles.map(f => compressImage(f)));
            setMvpMediaFiles([...mvpMediaFiles, ...processedFiles]);
        }
    };

    const removeMvpMedia = (index: number) => {
        setMvpMediaFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingMvpMedia = (index: number) => {
        setExistingMvpMedia(prev => prev.filter((_, i) => i !== index));
    };

    const handleCategoryModeChange = async (mode: 'Manual' | 'AI') => {
        setCategoryMode(mode);
        if (mode === 'AI') {
            if (!title || !description) {
                alert('Please enter title and description first.');
                setCategoryMode('Manual');
                return;
            }
            setIsSuggestingCategory(true);
            try {
                const cat = await suggestCategory(title, description);
                setCategory(cat);
            } catch (e) {
                console.error(e);
            } finally {
                setIsSuggestingCategory(false);
            }
        }
    };

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
            description.trim().length > 0 &&
            category.length > 0 &&
            hasMainDoc &&
            isPriceValid;
    }, [title, description, mainDocument, existingMainDocUrl, category, isPriceValid]);

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

            let physicalMvpImage = existingMvpMedia.find(m => m.type === 'image')?.url || null;
            let physicalMvpVideo = existingMvpMedia.find(m => m.type === 'video')?.url || null;

            for (const file of mvpMediaFiles) {
                const folder = file.type.startsWith('image/') ? 'mvp-images' : 'mvp-videos';
                const { data, error } = await uploadDocument(file, user.id, folder);
                if (error) throw error;
                if (file.type.startsWith('image/')) physicalMvpImage = data!.url;
                else if (file.type.startsWith('video/')) physicalMvpVideo = data!.url;
            }

            // 2. Prepare Data
            const listingData = {
                title,
                description,
                document_url: mainDocUrl,
                additional_doc_1: additionalDocUrls[0] || null,
                additional_doc_2: additionalDocUrls[1] || null,
                additional_doc_3: additionalDocUrls[2] || null,
                mvp: hasMVP || false,
                mvp_type: mvpType,
                digital_mvp: mvpType === 'Digital/Saas' ? mvpUrl : null,
                physical_mvp_image: physicalMvpImage,
                physical_mvp_video: physicalMvpVideo,
                category: category,
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
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">Listing Title <span className="text-red-500">*</span></label>
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={`w-full bg-zinc-950/50 border rounded-lg px-4 py-3 text-white focus:outline-none ${touched && !title ? 'border-red-500' : 'border-zinc-700'}`} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">Description <span className="text-red-500">*</span></label>
                            <textarea ref={textareaRef} value={description} onChange={(e) => setDescription(e.target.value)} className={`w-full bg-zinc-950/50 border rounded-lg px-4 py-3 text-white focus:outline-none min-h-[100px] ${touched && !description ? 'border-red-500' : 'border-zinc-700'}`} />
                        </div>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Category <span className="text-red-500">*</span></label>
                        <div className="flex bg-zinc-950/50 border border-zinc-700 rounded-lg p-1 gap-1 mb-3 max-w-sm">
                            <button onClick={() => setCategoryMode('Manual')} className={`flex-1 py-1.5 text-sm rounded ${categoryMode === 'Manual' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400'}`}>Manual</button>
                            <button onClick={() => handleCategoryModeChange('AI')} className={`flex-1 py-1.5 text-sm rounded flex items-center justify-center gap-2 ${categoryMode === 'AI' ? 'bg-green-500/10 text-green-400' : 'text-zinc-400'}`}><SparklesIcon className="w-4 h-4" /> AI Suggested</button>
                        </div>
                        {categoryMode === 'Manual' ? (
                            <CategoryDropdown value={category} onChange={setCategory} placeholder="Select a category" />
                        ) : (
                            <div className="relative">
                                <input type="text" value={category || (isSuggestingCategory ? '' : 'Click AI Suggested')} readOnly className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-4 py-3 font-medium text-green-400" />
                                {isSuggestingCategory && <span className="absolute right-3 top-3 text-xs text-green-500">Analyzing...</span>}
                            </div>
                        )}
                    </div>

                    {/* Documents */}
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

                    {/* AI Scores (Only shows if explicitly analyzed for now) */}
                    {scores && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
                            <h4 className="text-sm font-bold text-zinc-400 mb-4">New AI Analysis Results</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <CircularScore label="Uniqueness" value={scores.uniqueness} />
                                <CircularScore label="Viability" value={scores.viability} />
                                <CircularScore label="Scalability" value={scores.scalability} />
                                <CircularScore label="Impact" value={scores.problem_impact} />
                            </div>
                        </div>
                    )}

                    {/* Price */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300">Asking Price</label>
                        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className={`w-full bg-zinc-950/50 border rounded-lg px-4 py-3 text-white text-lg font-mono ${!isPriceValid ? 'border-red-500' : 'border-zinc-700'}`} placeholder="500" />
                        <p className="text-xs text-zinc-500 mt-1">Limit: ${maxPriceLimit}</p>
                    </div>

                    <button onClick={handleSubmit} disabled={isSubmitting || !formValid} className={`w-full py-4 rounded-xl font-bold flex justify-center items-center gap-2 ${formValid && !isSubmitting ? 'bg-green-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                        {isSubmitting ? 'Processing...' : (editId ? 'Update Listing' : 'Publish Listing')}
                    </button>
                </div>
            </div>
        </div>
    );
};

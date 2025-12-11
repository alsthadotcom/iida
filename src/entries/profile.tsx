import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { NavBar } from '../../components/NavBar';
import { Footer } from '../../components/Footer';
import { useAuthUser } from '../hooks/useAuthUser';
import { supabase } from '../../services/supabase';
import { getUserInfoById, updateUserUsername, updateUserProfilePicture, uploadDocument, getUserLikedListings, getUserSavedListings, getUserListings } from '../../services/database';
import type { UserInfo, MarketplaceView } from '../../types/database';
import { EnvelopeIcon, CameraIcon, HeartIcon, BookmarkIcon, ArrowRightIcon, ShoppingBagIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { handleNavigation } from '../utils/navigation';
import '../../index.css';

const ProfilePage = () => {
    const { user, handleLogout } = useAuthUser();
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [editUsername, setEditUsername] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploadingPicture, setIsUploadingPicture] = useState(false);
    const profilePictureInputRef = React.useRef<HTMLInputElement>(null);

    // Password Reset State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Likes, Saves & My Listings
    const [likedIdeas, setLikedIdeas] = useState<MarketplaceView[]>([]);
    const [savedIdeas, setSavedIdeas] = useState<MarketplaceView[]>([]);
    const [sellingIdeas, setSellingIdeas] = useState<MarketplaceView[]>([]);

    // View Mode
    const [isPublicView, setIsPublicView] = useState(false);

    // Fetch user info from database
    // Fetch user info from database
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const viewId = params.get('id');

        // Check if viewing another user's profile
        if (viewId && (user ? viewId !== user.id : true)) {
            setIsPublicView(true);
            fetchPublicProfile(viewId);
        } else {
            // Viewing own profile
            setIsPublicView(false);
            if (user === null) {
                const timer = setTimeout(() => {
                    if (!user) {
                        window.location.href = '/pages/login.html';
                    }
                }, 1000);
                return () => clearTimeout(timer);
            } else {
                fetchUserInfo();
            }
        }
    }, [user]);

    const fetchPublicProfile = async (targetId: string) => {
        setIsLoading(true);
        try {
            const { data } = await getUserInfoById(targetId);
            if (data) {
                setUserInfo(data);
                params_username_hack(data.username);
            } else {
                setMessage({ type: 'error', text: 'User not found' });
            }

            // Public View: Show Listings (Selling)
            const { data: listings } = await getUserListings(targetId);
            setSellingIdeas(listings || []);

            // Don't show likes/saves for privacy in public view

        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const params_username_hack = (name: string) => setEditUsername(name); // Helper to avoid lint if I used setEditUsername direct

    const fetchUserInfo = async () => {
        if (!user) return;

        setIsLoading(true);
        const { data, error } = await getUserInfoById(user.id);

        if (error) {
            console.error('Error fetching user info:', error);
            setMessage({ type: 'error', text: 'Failed to load profile data' });
        } else if (data) {
            setUserInfo(data);
            setEditUsername(data.username);
        }

        // Load liked and saved ideas
        const { data: likes } = await getUserLikedListings(user.id);
        const { data: saves } = await getUserSavedListings(user.id);
        const { data: selling } = await getUserListings(user.id); // Also load my own listings

        setLikedIdeas(likes || []);
        setSavedIdeas(saves || []);
        setSellingIdeas(selling || []);

        setIsLoading(false);
    };

    const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !user) return;

        const file = e.target.files[0];

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setMessage({ type: 'error', text: 'Please upload an image file' });
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Image size must be less than 5MB' });
            return;
        }

        setIsUploadingPicture(true);
        setMessage(null);

        try {
            // Upload to Supabase storage
            const { data: uploadData, error: uploadError } = await uploadDocument(file, user.id, 'profile-pictures');

            if (uploadError) throw uploadError;
            if (!uploadData) throw new Error('Upload failed');

            // Update database with new profile picture URL
            const { data, error } = await updateUserProfilePicture(user.id, uploadData.url);

            if (error) throw error;

            if (data) {
                setUserInfo(data);
                setMessage({ type: 'success', text: 'Profile picture updated successfully' });
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to upload profile picture' });
        } finally {
            setIsUploadingPicture(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (!user || !user.email) return;

        setPasswordMessage(null);
        setIsUpdatingPassword(true);

        try {
            // 1. Validation
            if (newPassword !== confirmPassword) {
                throw new Error("New passwords do not match");
            }

            const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).{8,15}$/;
            if (!passwordRegex.test(newPassword)) {
                throw new Error("Password must be 8-15 characters and contain letters, numbers, and symbols.");
            }

            // 2. Verify Current Password by re-authenticating
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword,
            });

            if (signInError) {
                throw new Error("Current password is incorrect");
            }

            // 3. Update Password
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) throw updateError;

            // 4. Update Password in user_info table (as requested)
            const { error: userInfoError } = await supabase
                .from('user_info')
                .update({ password: newPassword })
                .eq('user_id', user.id);

            if (userInfoError) console.error("Failed to update user_info password", userInfoError);

            // Success
            setPasswordMessage({ type: 'success', text: 'Password updated successfully' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

        } catch (err: any) {
            setPasswordMessage({ type: 'error', text: err.message || 'Failed to update password' });
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const handleSave = async () => {
        if (!user || !userInfo) return;
        setIsSaving(true);
        setMessage(null);

        try {
            const { data, error } = await updateUserUsername(user.id, editUsername);

            if (error) throw error;

            if (data) {
                setUserInfo(data);
                setMessage({ type: 'success', text: 'Profile updated successfully' });
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
        } finally {
            setIsSaving(false);
        }
    };

    // Show loading while checking auth or fetching data
    if (!user || isLoading) {
        return (
            <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center flex flex-col">
                <div className="text-zinc-400">Loading...</div>
            </div>
        );
    }

    if (!userInfo) {
        return (
            <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center flex flex-col">
                <div className="text-zinc-400">Profile data not found</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-green-500/30 font-sans flex flex-col">
            <NavBar user={user} onLogout={handleLogout} onNavigate={handleNavigation} currentPage="profile" />

            <div className="w-full max-w-2xl mx-auto pt-32 px-4 animate-in fade-in duration-500">

                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
                    <p className="text-zinc-500">Manage your account settings and preferences.</p>
                </div>

                {/* Profile Card */}
                <div className="bg-[#09090b] border border-zinc-800 rounded-xl p-8">

                    {/* User Identity Section */}
                    <div className="flex items-center gap-5 mb-10">
                        <div className="relative group">
                            <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-zinc-800 overflow-hidden">
                                {userInfo.profile_picture ? (
                                    <img
                                        src={userInfo.profile_picture}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <svg className="w-10 h-10 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                )}
                            </div>

                            {/* Upload Button Overlay */}
                            <button
                                onClick={() => profilePictureInputRef.current?.click()}
                                disabled={isUploadingPicture}
                                className={`absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed ${isPublicView ? 'hidden' : ''}`}
                            >
                                {isUploadingPicture ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <CameraIcon className="w-6 h-6 text-white" />
                                )}
                            </button>

                            <input
                                type="file"
                                ref={profilePictureInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleProfilePictureUpload}
                            />

                            {/* Green Check Badge */}
                            <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1 border-2 border-[#09090b]">
                                <svg className="w-3 h-3 text-black font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-white leading-tight">{userInfo.name}</h2>
                            <p className="text-green-500 font-medium text-sm mt-0.5">@{editUsername.replace(/^@/, '').toLowerCase()}</p>
                            <div className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-900/30 text-green-400 mt-2 border border-green-900/50">
                                Pro Member
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-px bg-zinc-800/50 mb-8"></div>

                    {/* Form Fields */}
                    <div className="space-y-6">

                        {/* Name (Full Name) - Read Only */}
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 mb-2">Name</label>
                            <input
                                type="text"
                                value={userInfo.name}
                                readOnly
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-400 focus:outline-none focus:border-zinc-700 transition-colors cursor-not-allowed"
                            />
                        </div>

                        {/* Email - Read Only */}
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 mb-2">Email Address</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                    <EnvelopeIcon className="w-4 h-4 text-zinc-600" />
                                </div>
                                <input
                                    type="email"
                                    value={isPublicView ? 'Hidden (Private)' : userInfo.email}
                                    readOnly
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-zinc-400 focus:outline-none focus:border-zinc-700 transition-colors cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* Username - Editable */}
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 mb-2">Username</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={editUsername}
                                    readOnly={isPublicView}
                                    onChange={(e) => !isPublicView && setEditUsername(e.target.value.toLowerCase())}
                                    className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all placeholder:text-zinc-700"
                                    placeholder="Enter username"
                                />
                            </div>
                            <p className="text-xs text-zinc-600 mt-1">Username must be unique and contain only lowercase letters and numbers</p>
                        </div>

                    </div>

                    {message && (
                        <div className={`mt-6 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                            {message.text}
                        </div>
                    )}

                    {/* Footer Navigation */}
                    <div className="mt-10 pt-4 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={isSaving || editUsername === userInfo.username}
                            className={`bg-white text-black text-sm font-semibold px-5 py-2 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isPublicView ? 'hidden' : ''}`}
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>

                </div>

                {/* Security / Password Card - Private Only */}
                {!isPublicView && (
                    <div className="bg-[#09090b] border border-zinc-800 rounded-xl p-8 mt-8">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <LockClosedIcon className="w-5 h-5 text-zinc-400" />
                            Security
                        </h2>

                        <div className="space-y-4 max-w-md">
                            <div>
                                <label className="block text-xs font-semibold text-zinc-500 mb-2">Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-zinc-700 transition-colors"
                                    placeholder="Enter current password"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-500 mb-2">New Password <span className="text-zinc-600 font-normal">(8-15 chars, letters, numbers, symbols)</span></label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-zinc-700 transition-colors"
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-500 mb-2">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-zinc-700 transition-colors"
                                    placeholder="Retype new password"
                                />
                            </div>

                            {passwordMessage && (
                                <div className={`p-3 rounded-lg text-sm ${passwordMessage.type === 'success' ? 'text-green-400 bg-green-500/10 border border-green-500/20' : 'text-red-400 bg-red-500/10 border border-red-500/20'}`}>
                                    {passwordMessage.text}
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    onClick={handleUpdatePassword}
                                    disabled={isUpdatingPassword || !currentPassword || !newPassword}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Selling Ideas Section */}
                <div className="bg-[#09090b] border border-zinc-800 rounded-xl p-8 mt-8">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <ShoppingBagIcon className="w-5 h-5 text-green-500" />
                        Selling Listings ({sellingIdeas.length})
                    </h2>

                    {sellingIdeas.length === 0 ? (
                        <p className="text-zinc-500 text-sm italic">No listings found.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/10 text-zinc-400 text-sm">
                                        <th className="pb-3 pl-2">Title</th>
                                        <th className="pb-3">Price</th>
                                        <th className="pb-3 text-right pr-2">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-white/5">
                                    {sellingIdeas.map(item => (
                                        <tr key={item.idea_id} className="group hover:bg-white/5 transition-colors">
                                            <td className="py-4 pl-2 font-medium text-white">{item.title}</td>
                                            <td className="py-4 text-green-400 font-mono">${item.price.toLocaleString()}</td>
                                            <td className="py-4 text-right pr-2">
                                                <a href={`/pages/details.html?id=${item.idea_id}`} className="text-zinc-500 hover:text-white transition-colors inline-block">
                                                    <ArrowRightIcon className="w-5 h-5" />
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {!isPublicView && (
                    <>
                        {/* Liked Ideas Section */}
                        <div className="bg-[#09090b] border border-zinc-800 rounded-xl p-8 mt-8">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <HeartIcon className="w-5 h-5 text-pink-500" />
                                Liked Ideas ({likedIdeas.length})
                            </h2>

                            {likedIdeas.length === 0 ? (
                                <p className="text-zinc-500 text-sm italic">You haven't liked any ideas yet.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-white/10 text-zinc-400 text-sm">
                                                <th className="pb-3 pl-2">Title</th>
                                                <th className="pb-3">Category</th>
                                                <th className="pb-3">Price</th>
                                                <th className="pb-3">AI Score</th>
                                                <th className="pb-3"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {likedIdeas.map(item => (
                                                <tr key={item.idea_id} className="group hover:bg-white/5 transition-colors">
                                                    <td className="py-4 pl-2 font-medium text-white">{item.title}</td>
                                                    <td className="py-4 text-zinc-400 text-sm">{item.category || 'N/A'}</td>
                                                    <td className="py-4 text-green-400 font-mono">${item.price.toLocaleString()}</td>
                                                    <td className="py-4">
                                                        <div className="flex items-center gap-1">
                                                            <span className={`font-bold ${item.overall_score >= 7.5 ? 'text-green-500' : item.overall_score >= 5 ? 'text-yellow-500' : 'text-red-500'}`}>
                                                                {item.overall_score.toFixed(1)}
                                                            </span>
                                                            <span className="text-xs text-zinc-600">/10</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 text-right pr-2">
                                                        <a
                                                            href={`/pages/details.html?id=${item.idea_id}`}
                                                            className="text-zinc-500 hover:text-white transition-colors inline-block"
                                                        >
                                                            <ArrowRightIcon className="w-5 h-5" />
                                                        </a>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Saved Ideas Section */}
                        <div className="bg-[#09090b] border border-zinc-800 rounded-xl p-8 mt-8 mb-12">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <BookmarkIcon className="w-5 h-5 text-blue-500" />
                                Saved Ideas ({savedIdeas.length})
                            </h2>

                            {savedIdeas.length === 0 ? (
                                <p className="text-zinc-500 text-sm italic">You haven't saved any ideas yet.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-white/10 text-zinc-400 text-sm">
                                                <th className="pb-3 pl-2">Title</th>
                                                <th className="pb-3">Category</th>
                                                <th className="pb-3">Price</th>
                                                <th className="pb-3">AI Score</th>
                                                <th className="pb-3"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {savedIdeas.map(item => (
                                                <tr key={item.idea_id} className="group hover:bg-white/5 transition-colors">
                                                    <td className="py-4 pl-2 font-medium text-white">{item.title}</td>
                                                    <td className="py-4 text-zinc-400 text-sm">{item.category || 'N/A'}</td>
                                                    <td className="py-4 text-green-400 font-mono">${item.price.toLocaleString()}</td>
                                                    <td className="py-4">
                                                        <div className="flex items-center gap-1">
                                                            <span className={`font-bold ${item.overall_score >= 7.5 ? 'text-green-500' : item.overall_score >= 5 ? 'text-yellow-500' : 'text-red-500'}`}>
                                                                {item.overall_score.toFixed(1)}
                                                            </span>
                                                            <span className="text-xs text-zinc-600">/10</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 text-right pr-2">
                                                        <a
                                                            href={`/pages/details.html?id=${item.idea_id}`}
                                                            className="text-zinc-500 hover:text-white transition-colors inline-block"
                                                        >
                                                            <ArrowRightIcon className="w-5 h-5" />
                                                        </a>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
            <Footer onNavigate={handleNavigation} />

        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ProfilePage />
    </React.StrictMode>
);

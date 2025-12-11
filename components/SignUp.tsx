
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { supabase } from '../services/supabase';

interface SignUpProps {
    onLogin: () => void;
    onBack?: () => void;
}

export const SignUp: React.FC<SignUpProps> = ({ onLogin, onBack }) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Google Completion State
    const [isGoogleCompletion, setIsGoogleCompletion] = useState(false);
    const [googleUserId, setGoogleUserId] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check for existing Google session on mount
    useEffect(() => {
        const checkSession = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // User is authenticated. Check if they need to complete profile.
                const { data: info } = await supabase.from('user_info').select('password').eq('user_id', user.id).single();

                // If user_info exists and has a password (and username?), they are done.
                if (info && info.password) {
                    // Already complete. Redirect to dashboard or home.
                    window.location.href = '/pages/dashboard.html';
                    return;
                }

                // If not complete, pre-fill form
                setIsGoogleCompletion(true);
                setGoogleUserId(user.id);
                setEmail(user.email || '');

                // Try to extract names
                const meta = user.user_metadata;
                if (meta) {
                    if (meta.full_name) {
                        const parts = meta.full_name.split(' ');
                        if (parts.length > 0) setFirstName(parts[0]);
                        if (parts.length > 1) setLastName(parts.slice(1).join(' '));
                    } else {
                        if (meta.first_name) setFirstName(meta.first_name);
                        if (meta.last_name) setLastName(meta.last_name);
                    }
                    if (meta.name) { // Fallback
                        const parts = meta.name.split(' ');
                        if (!firstName && parts.length > 0) setFirstName(parts[0]);
                    }
                }
            }
        };
        checkSession();
    }, []);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Format username
            let formattedUsername = username.toLowerCase().trim();
            if (!formattedUsername.startsWith('@')) {
                formattedUsername = '@' + formattedUsername;
            }

            // Validate username format
            if (!/^@[a-z0-9]+$/.test(formattedUsername)) {
                throw new Error('Username must contain only lowercase letters and numbers');
            }

            let userId = googleUserId;

            if (isGoogleCompletion && userId) {
                // Update existing Google user password
                const { error: updateError } = await supabase.auth.updateUser({ password });
                if (updateError) throw updateError;
            } else {
                // Standard Sign Up
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            first_name: firstName,
                            last_name: lastName,
                            username: formattedUsername,
                        },
                    },
                });

                if (authError) {
                    if (authError.message.toLowerCase().includes('already registered') ||
                        authError.message.toLowerCase().includes('already exists')) {
                        throw new Error('DUPLICATE_EMAIL');
                    }
                    throw authError;
                }
                if (authData.user) userId = authData.user.id;
            }

            // Create/Update user_info record
            if (userId) {
                // Save password to user_info as requested (Not Recommended for Production)
                const userInfoData = {
                    user_id: userId,
                    name: `${firstName} ${lastName}`,
                    email: email,
                    username: formattedUsername,
                    password: password
                };

                const { error: dbError } = await supabase
                    .from('user_info')
                    .upsert([userInfoData]); // upsert to handle if row exists but empty

                if (dbError) {
                    if (dbError.message.includes('unique') || dbError.message.includes('duplicate')) {
                        if (!isGoogleCompletion) await supabase.auth.admin.deleteUser(userId); // Cleanup only if new
                        throw new Error('Username already taken. Please choose another one.');
                    }
                    throw dbError;
                }
            }

            // Success
            if (isGoogleCompletion) {
                window.location.href = '/pages/dashboard.html';
            } else {
                alert('Sign up successful! Please check your email for verification if required.');
                onLogin();
            }

        } catch (err: any) {
            if (err.message === 'DUPLICATE_EMAIL') {
                setError('This email is already registered. Please log in instead.');
            } else {
                setError(err.message || 'Failed to sign up');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    // Redirect back to this page to complete profile
                    redirectTo: window.location.href
                }
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || 'Failed to sign in with Google');
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
            <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-2xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-500">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="absolute top-4 left-4 sm:top-6 sm:left-6 text-zinc-500 hover:text-white transition-colors"
                        title="Go back"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                )}

                <div className="flex flex-col items-center mb-6 sm:mb-8 mt-2">
                    <span className="text-3xl sm:text-4xl text-white font-handwritten font-bold mb-2">ida.</span>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">{isGoogleCompletion ? 'Complete your account' : 'Create your account'}</h2>
                    <p className="text-zinc-500 text-sm">Join the marketplace for ideas</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg mb-4 p-4">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="text-red-500 text-sm font-medium">
                                    {error}
                                </p>
                                {error.includes('already registered') && (
                                    <button
                                        onClick={onLogin}
                                        className="mt-2 text-xs text-red-400 hover:text-red-300 underline font-medium"
                                    >
                                        Click here to log in →
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Google Sign In */}
                {!isGoogleCompletion && (
                    <button
                        onClick={handleGoogleSignIn}
                        className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold py-3 rounded-lg hover:bg-zinc-200 transition-colors mb-6"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Sign up with Google
                    </button>
                )}

                {/* Separator */}
                {!isGoogleCompletion && (
                    <div className="relative flex items-center justify-center mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-zinc-800"></div>
                        </div>
                        <span className="relative bg-[#101012] px-2 text-xs text-zinc-500 uppercase font-mono">or</span>
                    </div>
                )}

                {/* Manual Form */}
                <form className="space-y-4" onSubmit={handleSignUp}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-mono text-zinc-400 mb-2 uppercase">First Name</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors placeholder:text-zinc-700"
                                placeholder="Jane"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-mono text-zinc-400 mb-2 uppercase">Last Name</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors placeholder:text-zinc-700"
                                placeholder="Doe"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-mono text-zinc-400 mb-2 uppercase">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase())}
                            className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors placeholder:text-zinc-700"
                            placeholder="@founder"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-mono text-zinc-400 mb-2 uppercase">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isGoogleCompletion}
                            className={`w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors placeholder:text-zinc-700 ${isGoogleCompletion ? 'opacity-50 cursor-not-allowed' : ''}`}
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-mono text-zinc-400 mb-2 uppercase">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors placeholder:text-zinc-700"
                            placeholder="Create a password"
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-500 text-black font-bold py-3 rounded-lg hover:bg-green-400 transition-colors mt-4 shadow-[0_0_20px_rgba(34,197,94,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (isGoogleCompletion ? 'Saving...' : 'Creating Account...') : (isGoogleCompletion ? 'Complete Profile' : 'Sign Up')}
                    </button>
                </form>

                <p className="mt-6 sm:mt-8 text-center text-sm text-zinc-500">
                    Already have an account? <button onClick={onLogin} className="text-white hover:text-green-400 hover:underline font-medium transition-colors">Log in</button>
                </p>
            </div>
        </div>
    );
};

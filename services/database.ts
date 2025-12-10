/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from './supabase';
import type {
    UserInfo,
    NewUserInfo,
    IdeaListing,
    NewIdeaListing,
    AIScoring,
    NewAIScoring,
    MarketplaceView,
    IdeaDetailView
} from '../types/database';

// ============================================
// USER INFO OPERATIONS
// ============================================

export async function createUserInfo(userData: NewUserInfo): Promise<{ data: UserInfo | null; error: any }> {
    try {
        // Ensure username starts with @ and is lowercase
        let username = userData.username.toLowerCase();
        if (!username.startsWith('@')) {
            username = '@' + username;
        }

        // Validate username format (only lowercase letters and numbers after @)
        if (!/^@[a-z0-9]+$/.test(username)) {
            return {
                data: null,
                error: new Error('Username must contain only lowercase letters and numbers')
            };
        }

        const { data, error } = await supabase
            .from('user_info')
            .insert([{ ...userData, username }])
            .select()
            .single();

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

export async function getUserInfoByEmail(email: string): Promise<{ data: UserInfo | null; error: any }> {
    const { data, error } = await supabase
        .from('user_info')
        .select('*')
        .eq('email', email)
        .single();

    return { data, error };
}

export async function getUserInfoByUsername(username: string): Promise<{ data: UserInfo | null; error: any }> {
    const { data, error } = await supabase
        .from('user_info')
        .select('*')
        .eq('username', username)
        .single();

    return { data, error };
}

export async function getUserInfoById(userId: string): Promise<{ data: UserInfo | null; error: any }> {
    const { data, error } = await supabase
        .from('user_info')
        .select('*')
        .eq('user_id', userId)
        .single();

    return { data, error };
}

export async function ensureUserInfoExists(user: any): Promise<void> {
    try {
        // 1. Check if user already exists
        const { data } = await supabase
            .from('user_info')
            .select('user_id')
            .eq('user_id', user.id)
            .single();

        if (data) return; // User exists, we're good

        // 2. Prepare new user data
        const email = user.email || '';
        const metadata = user.user_metadata || {};

        // Get name from metadata (Google provides full_name or name)
        const name = metadata.full_name || metadata.name || email.split('@')[0];

        // Generate base username from email (sanitize to a-z0-9)
        const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        let username = `@${baseUsername}`;

        // 3. Try to insert (with simple retry for username collision)
        let created = false;
        let attempts = 0;

        while (!created && attempts < 3) {
            const { error } = await supabase
                .from('user_info')
                .insert([{
                    user_id: user.id,
                    email: email,
                    name: name,
                    username: username
                }]);

            if (!error) {
                created = true;
            } else if (error.code === '23505') { // Unique violation
                // Append random number if username taken
                username = `@${baseUsername}${Math.floor(Math.random() * 10000)}`;
                attempts++;
            } else {
                console.error('Failed to create user_info:', error);
                break;
            }
        }
    } catch (error) {
        console.error('Error syncing user info:', error);
    }
}

export async function updateUserUsername(userId: string, newUsername: string): Promise<{ data: UserInfo | null; error: any }> {
    try {
        // Ensure username starts with @ and is lowercase
        let username = newUsername.toLowerCase();
        if (!username.startsWith('@')) {
            username = '@' + username;
        }

        // Validate username format (only lowercase letters and numbers after @)
        if (!/^@[a-z0-9]+$/.test(username)) {
            return {
                data: null,
                error: new Error('Username must contain only lowercase letters and numbers')
            };
        }

        // Check if username is already taken by another user
        const { data: existingUser } = await supabase
            .from('user_info')
            .select('user_id')
            .eq('username', username)
            .single();

        if (existingUser && existingUser.user_id !== userId) {
            return {
                data: null,
                error: new Error('Username is already taken')
            };
        }

        // Update the username
        const { data, error } = await supabase
            .from('user_info')
            .update({ username, updated_at: new Date().toISOString() })
            .eq('user_id', userId)
            .select()
            .single();

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

export async function updateUserProfilePicture(userId: string, profilePictureUrl: string): Promise<{ data: UserInfo | null; error: any }> {
    try {
        const { data, error } = await supabase
            .from('user_info')
            .update({ profile_picture: profilePictureUrl, updated_at: new Date().toISOString() })
            .eq('user_id', userId)
            .select()
            .single();

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}


// ============================================
// IDEA LISTING OPERATIONS
// ============================================

export async function createIdeaListing(ideaData: NewIdeaListing): Promise<{ data: IdeaListing | null; error: any }> {
    const { data, error } = await supabase
        .from('idea_listing')
        .insert([ideaData])
        .select()
        .single();

    return { data, error };
}

export async function getIdeaListingById(ideaId: string): Promise<{ data: IdeaListing | null; error: any }> {
    const { data, error } = await supabase
        .from('idea_listing')
        .select('*')
        .eq('idea_id', ideaId)
        .single();

    return { data, error };
}

export async function getIdeaListingsByUser(userId: string): Promise<{ data: IdeaListing[] | null; error: any }> {
    const { data, error } = await supabase
        .from('idea_listing')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    return { data, error };
}

export async function updateIdeaListing(
    ideaId: string,
    updates: Partial<NewIdeaListing>
): Promise<{ data: IdeaListing | null; error: any }> {
    const { data, error } = await supabase
        .from('idea_listing')
        .update(updates)
        .eq('idea_id', ideaId)
        .select()
        .single();

    return { data, error };
}

export async function deleteIdeaListing(ideaId: string): Promise<{ error: any }> {
    const { error } = await supabase
        .from('idea_listing')
        .delete()
        .eq('idea_id', ideaId);

    return { error };
}

// ============================================
// AI SCORING OPERATIONS
// ============================================

export async function createAIScoring(scoringData: NewAIScoring): Promise<{ data: AIScoring | null; error: any }> {
    const { data, error } = await supabase
        .from('ai_scoring')
        .insert([scoringData])
        .select()
        .single();

    return { data, error };
}

export async function getAIScoringByIdeaId(ideaId: string): Promise<{ data: AIScoring | null; error: any }> {
    const { data, error } = await supabase
        .from('ai_scoring')
        .select('*')
        .eq('idea_id', ideaId)
        .single();

    return { data, error };
}

export async function updateAIScoring(
    ideaId: string,
    updates: Partial<NewAIScoring>
): Promise<{ data: AIScoring | null; error: any }> {
    const { data, error } = await supabase
        .from('ai_scoring')
        .update(updates)
        .eq('idea_id', ideaId)
        .select()
        .single();

    return { data, error };
}

// ============================================
// MARKETPLACE VIEW OPERATIONS
// ============================================

export interface MarketplaceFilters {
    limit?: number;
    offset?: number;
    searchTerm?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    hasMvp?: boolean;
    hasDocs?: boolean;
    minScore?: number;
    sort?: {
        field: 'price' | 'overall_score' | 'created_at';
        direction: 'asc' | 'desc';
    };
}

export async function getMarketplaceItems(
    filters: MarketplaceFilters = {}
): Promise<{ data: MarketplaceView[] | null; error: any }> {
    let query = supabase
        .from('marketplace')
        .select('*');

    // Search (Keywords)
    if (filters.searchTerm) {
        const terms = filters.searchTerm.trim().split(/\s+/);
        terms.forEach(term => {
            if (term) {
                query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
            }
        });
    }

    // Category
    if (filters.category) {
        query = query.eq('category', filters.category);
    }

    // Price
    if (filters.minPrice !== undefined) query = query.gte('price', filters.minPrice);
    if (filters.maxPrice !== undefined) query = query.lte('price', filters.maxPrice);

    // AI Score
    if (filters.minScore !== undefined) {
        query = query.gte('overall_score', filters.minScore);
    }

    // MVP
    if (filters.hasMvp) {
        query = query.eq('mvp', true);
    }

    // Docs
    if (filters.hasDocs) {
        query = query.not('document_url', 'is', null);
    }

    // Sort
    if (filters.sort) {
        query = query.order(filters.sort.field, { ascending: filters.sort.direction === 'asc' });
    } else {
        // Default sort (if no search, or even with search if no specific sort)
        // With search, typically relevance, but we don't have relevance score easily.
        // Default to created_at descending.
        query = query.order('created_at', { ascending: false });
    }

    // Pagination
    if (filters.limit) query = query.limit(filters.limit);
    if (filters.offset) {
        const limit = filters.limit || 10;
        query = query.range(filters.offset, filters.offset + limit - 1);
    }

    const { data, error } = await query;
    return { data, error };
}

// Deprecated: logic merged into getMarketplaceItems
export async function searchMarketplaceItems(
    searchTerm: string,
    limit?: number
): Promise<{ data: MarketplaceView[] | null; error: any }> {
    return getMarketplaceItems({ searchTerm, limit });
}

export async function getTopRatedMarketplaceItems(
    limit: number = 10
): Promise<{ data: MarketplaceView[] | null; error: any }> {
    const { data, error } = await supabase
        .from('marketplace')
        .select('*')
        .order('overall_score', { ascending: false })
        .limit(limit);

    return { data, error };
}

// ============================================
// IDEA DETAIL PAGE VIEW OPERATIONS
// ============================================

export async function getIdeaDetailById(ideaId: string): Promise<{ data: IdeaDetailView | null; error: any }> {
    const { data, error } = await supabase
        .from('idea_detail_page')
        .select('*')
        .eq('idea_id', ideaId)
        .single();

    return { data, error };
}

// ============================================
// FILE UPLOAD OPERATIONS
// ============================================

export async function uploadDocument(
    file: File,
    userId: string,
    folder: 'documents' | 'mvp-images' | 'mvp-videos' | 'profile-pictures' = 'documents'
): Promise<{ data: { path: string; url: string } | null; error: any }> {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const { data, error } = await supabase.storage
            .from('idea-assets')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            return { data: null, error };
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('idea-assets')
            .getPublicUrl(filePath);

        return {
            data: {
                path: filePath,
                url: urlData.publicUrl
            },
            error: null
        };
    } catch (error) {
        return { data: null, error };
    }
}

export async function deleteDocument(filePath: string): Promise<{ error: any }> {
    const { error } = await supabase.storage
        .from('idea-assets')
        .remove([filePath]);

    return { error };
}

// ============================================
// DASHBOARD OPERATIONS
// ============================================

export async function getUserListings(userId: string): Promise<{ data: MarketplaceView[] | null; error: any }> {
    // 1. Get username
    const { data: userInfo, error: userError } = await getUserInfoById(userId);
    if (userError || !userInfo) {
        return { data: null, error: userError || new Error('User not found') };
    }

    // 2. Query marketplace view by username
    const { data, error } = await supabase
        .from('marketplace')
        .select('*')
        .eq('username', userInfo.username)
        .order('created_at', { ascending: false });

    return { data, error };
}

export async function deleteListing(ideaId: string): Promise<{ error: any }> {
    const { error } = await supabase
        .from('idea_listing')
        .delete()
        .eq('idea_id', ideaId);

    return { error };
}

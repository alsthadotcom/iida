/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Database Types matching the Supabase schema

export interface UserInfo {
    user_id: string;
    name: string;
    email: string;
    username: string; // Format: @username (lowercase alphanumeric only)
    password?: string; // Added as per requirement
    profile_picture?: string | null; // URL to profile picture
    created_at?: string;
    updated_at?: string;
}

export interface IdeaListing {
    idea_id: string;
    user_id: string;
    title: string;
    description: string;
    document_url: string; // Main PDF document
    additional_doc_1?: string | null;
    additional_doc_2?: string | null;
    additional_doc_3?: string | null;
    mvp: boolean;
    mvp_type?: 'Digital/Saas' | 'Physical' | null;
    digital_mvp?: string | null; // URL or zip file path
    physical_mvp_image?: string | null;
    physical_mvp_video?: string | null;
    category?: string | null; // Added category
    price: number;
    created_at?: string;
    updated_at?: string;
}

export type DemandLevel = 'Low' | 'Low-Mid' | 'Mid' | 'Mid-High' | 'High';

export interface AIScoring {
    ai_score_id: string;
    idea_id: string;
    uniqueness: number; // 0-100
    demand: DemandLevel;
    problem_impact: number; // 0-100
    profitability: string; // Estimated revenue/profits as text
    viability: number; // 0-100
    scalability: number; // 0-100
    overall_score?: number; // Auto-calculated average
    created_at?: string;
    updated_at?: string;
}

export interface MarketplaceView {
    marketplace_id: string;
    idea_id: string;
    ai_score_id: string;
    title: string;
    description: string;
    uniqueness: number;
    viability: number;
    profitability: string;
    category?: string | null; // Added category
    mvp: boolean;
    document_url: string;
    price: number;
    username: string;
    created_at: string;
    overall_score: number;
}

export interface IdeaDetailView {
    idea_detail_id: string;
    idea_id: string;
    user_id: string; // Ensure this is present
    ai_score_id: string;
    title: string;
    description: string;
    uniqueness: number;
    demand: DemandLevel;
    problem_impact: number;
    profitability: string;
    viability: number;
    scalability: number;
    overall_score: number;
    price: number;
    username: string;
    mvp: boolean;
    mvp_type?: 'Digital/Saas' | 'Physical' | null;
    digital_mvp?: string | null;
    physical_mvp_image?: string | null;
    physical_mvp_video?: string | null;
    document_url: string;
    additional_doc_1?: string | null;
    additional_doc_2?: string | null;
    additional_doc_3?: string | null;
    category?: string | null; // Added category
    created_at: string;
    updated_at: string;
}

// Helper type for creating new ideas (without auto-generated fields)
export type NewIdeaListing = Omit<IdeaListing, 'idea_id' | 'created_at' | 'updated_at'>;
export type NewAIScoring = Omit<AIScoring, 'ai_score_id' | 'created_at' | 'updated_at' | 'overall_score'>;
export type NewUserInfo = Omit<UserInfo, 'user_id' | 'created_at' | 'updated_at'>;

export interface Like {
    like_id: string;
    user_id: string;
    idea_id: string;
    created_at: string;
}

export interface Save {
    save_id: string;
    user_id: string;
    idea_id: string;
    created_at: string;
}

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
    // Idea Snapshot
    title: string;
    one_line_description: string;
    category: string; // Industry
    target_customer_type?: string;
    stage?: string;

    // Problem & Urgency
    problem_description?: string;
    who_faces_problem?: string;
    pain_level?: number;
    urgency_level?: string;
    current_alternatives?: string;

    // Solution & Advantage
    solution_summary?: string;
    primary_advantage?: string;
    differentiation_strength?: number;

    // Market Potential
    market_size?: string;
    market_growth_trend?: string;
    geographic_scope?: string;

    // Revenue Model
    revenue_model_type?: string;
    expected_price_per_customer?: string;
    cost_intensity?: string;

    // Execution Difficulty
    build_difficulty?: string;
    time_to_first_version?: string;
    regulatory_dependency?: string;

    // Validation
    validation_level?: string;
    validation_notes?: string;

    // Sale & Rights
    what_is_included?: string;
    buyer_resale_rights?: string;
    exclusivity?: string;

    price: number;
    document_url: string; // Main PDF document
    additional_doc_1?: string | null;
    additional_doc_2?: string | null;
    additional_doc_3?: string | null;

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
    description: string; // View aliases one_line_description to this
    uniqueness: number;
    viability: number;
    profitability: string;
    category?: string | null;

    // Derived or present
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
    user_id: string;
    ai_score_id: string;
    title: string;

    // Mapped fields
    description: string; // Mapped from one_line or solution
    mvp: boolean; // Mapped derived

    // Full Fields
    one_line_description?: string;
    category?: string;
    target_customer_type?: string;
    stage?: string;
    problem_description?: string;
    who_faces_problem?: string;
    pain_level?: number;
    urgency_level?: string;
    current_alternatives?: string;
    solution_summary?: string;
    primary_advantage?: string;
    differentiation_strength?: number;
    market_size?: string;
    market_growth_trend?: string;
    geographic_scope?: string;
    revenue_model_type?: string;
    expected_price_per_customer?: string;
    cost_intensity?: string;
    build_difficulty?: string;
    time_to_first_version?: string;
    regulatory_dependency?: string;
    validation_level?: string;
    validation_notes?: string;
    what_is_included?: string;
    buyer_resale_rights?: string;
    exclusivity?: string;

    uniqueness: number;
    demand: DemandLevel;
    problem_impact: number;
    profitability: string;
    viability: number;
    scalability: number;
    overall_score: number;
    price: number;
    username: string;

    document_url: string;
    additional_doc_1?: string | null;
    additional_doc_2?: string | null;
    additional_doc_3?: string | null;

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

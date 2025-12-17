/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Database Types matching the Supabase schema

export interface UserInfo {
    user_id: string;
    name: string;
    email: string; // From auth.users
    username: string; // Format: @username (lowercase alphanumeric only)
    full_name?: string;
    password?: string;
    profile_picture?: string | null;
    avatar_url?: string | null; // Alias
    created_at?: string;
    updated_at?: string;
}

export interface IdeaListing {
    idea_id: string;
    user_id: string;

    // Page 1: Idea Info
    title: string;
    one_line_description: string;
    category: string;
    secondary_category?: string;

    // Page 2: Customer Pain (V4 Granular)
    pain_who?: string;
    pain_problem?: string[]; // Array
    pain_frequency?: string;

    // Page 3: Current Solutions
    solution_current?: string[];
    solution_insufficient?: string[];
    solution_risks?: string;

    // Page 4: Execution Steps
    exec_steps?: string[];
    exec_skills?: string[];
    exec_risks?: string;

    // Page 5: Growth Plan
    growth_acquisition?: string[];
    growth_drivers?: string;
    growth_expansion?: string[];

    // Page 6: Solution Details
    sol_what?: string;
    sol_how?: string;
    sol_why_better?: string;

    // Page 7: Revenue Plan
    rev_who_pays?: string;
    rev_flow?: string;
    rev_retention?: string;

    // Page 8: Impact
    impact_who?: string;
    impact_improvement?: string;
    impact_scale?: string;

    price: number;
    document_url: string;
    additional_doc_1?: string | null;
    additional_doc_2?: string | null;
    additional_doc_3?: string | null;

    mvp_type?: string | null;      // 'digital' | 'physical'
    mvp_url?: string | null;       // For Digital
    mvp_image_url?: string | null; // For Physical
    mvp_video_url?: string | null; // For Physical

    created_at?: string;
    updated_at?: string;
}

export interface AIScoring {
    ai_score_id: string;
    idea_id: string;

    // The 10 Metrics
    uniqueness: number;
    customer_pain: number;
    scalability: number;
    product_market_fit: number;
    technical_complexity: number;
    capital_intensity: number;
    market_saturation: number;
    business_model_robustness: number;
    market_growth_rate: number;
    social_value: number; // Valuability to Society

    validation_details?: any; // Rich JSON data from AI

    overall_score?: number;
    created_at?: string;
    updated_at?: string;
}

export interface MarketplaceView {
    marketplace_id: string;
    idea_id: string;
    ai_score_id: string;
    title: string;
    description: string;

    // For card preview, simplistic view
    uniqueness: number;
    viability: number; // Mapped from PMF for legacy card support
    profitability: string; // Placeholder string
    market_saturation: number;
    capital_intensity: number;

    category?: string | null;
    secondary_category?: string | null;
    mvp: boolean;
    document_url: string;
    price: number;
    username: string;
    created_at: string;
    overall_score: number;
}

export interface IdeaDetailView {
    idea_detail_id?: string;
    idea_id: string;
    user_id: string;
    ai_score_id: string;
    title: string;

    // Mapped fields
    description: string;
    mvp: boolean;

    // Full Fields
    one_line_description?: string;
    category?: string;
    secondary_category?: string;

    // V4 Granular Fields
    pain_who?: string;
    pain_problem?: string[];
    pain_frequency?: string;

    solution_current?: string[];
    solution_insufficient?: string[];
    solution_risks?: string;

    exec_steps?: string[];
    exec_skills?: string[];
    exec_risks?: string;

    growth_acquisition?: string[];
    growth_drivers?: string;
    growth_expansion?: string[];

    sol_what?: string;
    sol_how?: string;
    sol_why_better?: string;

    rev_who_pays?: string;
    rev_flow?: string;
    rev_retention?: string;

    impact_who?: string;
    impact_improvement?: string;
    impact_scale?: string;

    // New 10 Metrics
    uniqueness: number;
    customer_pain: number;
    scalability: number;
    product_market_fit: number;
    technical_complexity: number;
    capital_intensity: number;
    market_saturation: number;
    business_model_robustness: number;
    market_growth_rate: number;
    social_value: number;

    validation_details?: any; // Rich JSON data from AI

    overall_score: number;
    price: number;
    username: string;
    profile_picture?: string;

    document_url: string;
    additional_doc_1?: string | null;
    additional_doc_2?: string | null;
    additional_doc_3?: string | null;

    // MVP Fields
    mvp_type?: string | null;
    mvp_url?: string | null;
    mvp_image_url?: string | null;
    mvp_video_url?: string | null;

    created_at: string;
    updated_at: string;
}

// Helpers
export type NewIdeaListing = Omit<IdeaListing, 'idea_id' | 'created_at' | 'updated_at'>;
export type NewAIScoring = Omit<AIScoring, 'ai_score_id' | 'created_at' | 'updated_at'>;
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

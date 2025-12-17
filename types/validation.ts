/**
 * validation.ts
 * Shared types and constants for V4.5 Validation Engine
 */

export type MetricSource = 'seller' | 'market' | 'seller+market';

export const METRIC_SCHEMA = {
    customer_pain: {
        sub_metrics: {
            frequency: { weight: 0.25, source: 'seller+market' },
            severity: { weight: 0.30, source: 'seller' },
            financial_impact: { weight: 0.25, source: 'market' },
            willingness_to_pay: { weight: 0.20, source: 'market' }
        }
    },
    market_size: {
        sub_metrics: {
            tam: { weight: 0.50, source: 'market' },
            sam: { weight: 0.30, source: 'market' },
            som: { weight: 0.20, source: 'seller+market' }
        }
    },
    market_growth_rate: {
        sub_metrics: {
            cagr: { weight: 0.70, source: 'market' },
            growth_drivers_strength: { weight: 0.30, source: 'market' }
        }
    },
    uniqueness: {
        sub_metrics: {
            technical_differentiation: { weight: 0.40, source: 'seller' },
            business_model_novelty: { weight: 0.30, source: 'seller' },
            replication_difficulty: { weight: 0.30, source: 'market' }
        }
    },
    technical_feasibility: {
        sub_metrics: {
            tech_maturity: { weight: 0.40, source: 'market' },
            integration_complexity: { weight: 0.30, source: 'seller' },
            execution_risk: { weight: 0.30, source: 'seller+market' }
        }
    },
    capital_intensity: {
        sub_metrics: {
            initial_capex: { weight: 0.40, source: 'market' },
            scaling_cost: { weight: 0.40, source: 'market' },
            cashflow_delay: { weight: 0.20, source: 'seller' }
        }
    },
    market_saturation: {
        sub_metrics: {
            competitor_count: { weight: 0.50, source: 'market' },
            incumbent_strength: { weight: 0.50, source: 'market' }
        }
    },
    business_model: {
        sub_metrics: {
            pricing_clarity: { weight: 0.30, source: 'seller' },
            revenue_repeatability: { weight: 0.40, source: 'seller' },
            margin_potential: { weight: 0.30, source: 'market' }
        }
    },
    scalability: {
        sub_metrics: {
            marginal_cost: { weight: 0.40, source: 'seller+market' },
            ops_scalability: { weight: 0.30, source: 'seller' },
            tech_scalability: { weight: 0.30, source: 'seller' }
        }
    },
    social_value: {
        sub_metrics: {
            societal_impact: { weight: 0.60, source: 'seller+market' },
            externalities: { weight: 0.40, source: 'market' }
        }
    }
};

export const FINAL_SCORE_WEIGHTS: Record<string, number> = {
    customer_pain: 0.15,
    market_size: 0.15,
    market_growth_rate: 0.10,
    uniqueness: 0.10,
    technical_feasibility: 0.10,
    capital_intensity: 0.10,
    scalability: 0.10,
    business_model: 0.10,
    market_saturation: 0.05,
    social_value: 0.05
};

export interface IdeaInput {
    title: string;
    description: string;
    category: string;
    secondary_category: string;
    pain_problem: string[];
    pain_who: string;
    solution_current: string[];
    solution_how: string;
    monetization: string;
    price: number;
    document_content?: string;
}

export interface ResearchPlanItem {
    metric: string;
    sub_metric: string;
    question: string;
    decision_dependency: string;
    data_required: string;
    research_type: 'quantitative' | 'qualitative' | 'landscape';
    epistemic_role: 'measurement' | 'validation' | 'context';
    priority: 'high' | 'medium' | 'low';
}

export interface ArchitectOutput {
    normalized_idea: {
        summary: string;
        target_customer: string;
        problem_statement: string;
        solution_overview: string;
        revenue_model: string;
    };
    claims: {
        physics: string[];
        market: string[];
        operational: string[];
    };
    research_plan: ResearchPlanItem[];
}

export interface ResearchFinding {
    metric: string;
    sub_metric: string;
    finding: string | null;
    source: string;
    confidence: 'low' | 'medium' | 'high';
    research_type: 'quantitative' | 'qualitative' | 'landscape';
    epistemic_role: 'measurement' | 'validation' | 'context';
}

export interface SensorOutput {
    research_results: ResearchFinding[];
}

export interface MetricScore {
    score: number;
    score_confidence: 'low' | 'medium' | 'high';
    sub_metrics: Record<string, { score: number; inference: boolean }>;
    reasoning: string;
}

export interface ResearchGap {
    metric: string;
    sub_metric: string;
    impact: 'High' | 'Medium' | 'Low';
    recommendation: string;
}

export interface ValidationReadiness {
    level: number; // 1-5
    label: string;
    blocking_gaps: string[];
}

export interface ValidationResult {
    final_score: number;
    score_details: {
        core: number;
        contextual: number;
        combined: number;
    };
    validation_readiness: ValidationReadiness;
    metrics: Record<string, MetricScore>;
    key_risks: string[];
    research_gaps: ResearchGap[];
    summary: string;
}

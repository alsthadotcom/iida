import { Schema } from "../lib/jsonValidator";

export const ArchitectSchema: Schema = {
    type: 'object',
    required: ['normalized_idea', 'claims', 'research_plan'],
    properties: {
        normalized_idea: {
            type: 'object',
            required: ['summary', 'target_customer', 'problem_statement', 'solution_overview', 'revenue_model'],
            properties: {
                summary: { type: 'string' },
                target_customer: { type: 'string' },
                problem_statement: { type: 'string' },
                solution_overview: { type: 'string' },
                revenue_model: { type: 'string' }
            }
        },
        claims: {
            type: 'object',
            required: ['physics', 'market', 'operational'],
            properties: {
                physics: { type: 'array', items: { type: 'string' } },
                market: { type: 'array', items: { type: 'string' } },
                operational: { type: 'array', items: { type: 'string' } }
            }
        },
        research_plan: {
            type: 'array',
            items: {
                type: 'object',
                required: ['metric', 'sub_metric', 'question', 'decision_dependency', 'data_required', 'research_type', 'epistemic_role', 'priority'],
                properties: {
                    metric: { type: 'string' },
                    sub_metric: { type: 'string' },
                    question: { type: 'string' },
                    decision_dependency: { type: 'string' },
                    data_required: { type: 'string' },
                    research_type: {
                        type: 'string',
                        enum: ['quantitative', 'qualitative', 'landscape']
                    },
                    epistemic_role: {
                        type: 'string',
                        enum: ['measurement', 'validation', 'context']
                    },
                    priority: {
                        type: 'string',
                        enum: ['high', 'medium', 'low']
                    }
                }
            }
        }
    }
};

import { Schema } from "../lib/jsonValidator";

export const SensorSchema: Schema = {
    type: 'object',
    required: ['research_results'],
    properties: {
        research_results: {
            type: 'array',
            items: {
                type: 'object',
                required: ['metric', 'sub_metric', 'source', 'confidence', 'research_type', 'epistemic_role'],
                properties: {
                    metric: { type: 'string' },
                    sub_metric: { type: 'string' },
                    finding: { type: 'string', nullable: true },
                    source: { type: 'string', nullable: true },
                    confidence: {
                        type: 'string',
                        enum: ['low', 'medium', 'high']
                    },
                    research_type: {
                        type: 'string',
                        enum: ['quantitative', 'qualitative', 'landscape']
                    },
                    epistemic_role: {
                        type: 'string',
                        enum: ['measurement', 'validation', 'context']
                    },
                    decision_dependency: { type: 'string', required: false }, // Optional
                    evidence_value: { type: 'number', required: false } // Optional
                }
            }
        }
    }
};

import { Schema } from "../lib/jsonValidator";

export const CalculatorSchema: Schema = {
    type: 'object',
    required: ['metric_explanations', 'summary', 'key_risks', 'research_gaps'],
    properties: {
        metric_explanations: {
            type: 'object',
            // We assume mapped properties here, validator won't check dynamic keys deeply unless we iterate properties.
            // But 'type: object' ensures it is an object.
        },
        summary: { type: 'string' },
        key_risks: { type: 'array', items: { type: 'string' } },
        research_gaps: {
            type: 'array',
            items: {
                type: 'object',
                required: ['metric', 'sub_metric', 'impact', 'recommendation'],
                properties: {
                    metric: { type: 'string' },
                    sub_metric: { type: 'string' },
                    impact: { type: 'string', enum: ['High', 'Medium', 'Low'] },
                    recommendation: { type: 'string' }
                }
            }
        }
    }
};

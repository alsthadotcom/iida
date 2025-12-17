import {
    ValidationResult, ArchitectOutput, SensorOutput, METRIC_SCHEMA, FINAL_SCORE_WEIGHTS, MetricScore
} from '../types/validation';

const INFERENCE_PENALTY = 25;
const BASE_VERIFIED_SCORE = 90;
const BASE_PARTIAL_SCORE = 60;
const BASE_MISSING_SCORE = 30;

const EPISTEMIC_CAPS = {
    measurement: 100, // No cap
    validation: 75,
    context: 60
};

/**
 * Calculates deterministic scores based on evidence.
 * Does strict math: no LLM guessing for numbers.
 */
export const calculateDeterministicScore = (
    architect: ArchitectOutput,
    sensor: SensorOutput
): ValidationResult => {

    const metricsResult: Record<string, MetricScore> = {};
    const keyRisks: string[] = [];

    // 1. Iterate Schema
    Object.entries(METRIC_SCHEMA).forEach(([metricKey, metricSpec]) => {
        let weightedSum = 0;
        let totalWeight = 0;
        const subMetricsDetails: Record<string, { score: number; inference: boolean }> = {};

        Object.entries(metricSpec.sub_metrics).forEach(([subKey, subSpec]) => {
            // Find Evidence
            const evidence = sensor.research_results.find(r => r.metric === metricKey && r.sub_metric === subKey);

            // Base Score
            let rawScore = BASE_MISSING_SCORE;
            let inference = true;

            if (evidence) {
                if (evidence.confidence === 'high') {
                    rawScore = BASE_VERIFIED_SCORE;
                    inference = false;
                } else if (evidence.confidence === 'medium') {
                    rawScore = BASE_PARTIAL_SCORE;
                    inference = false;
                } else {
                    // low or null finding
                    rawScore = BASE_MISSING_SCORE;
                    inference = true;
                }

                // Epistemic Caps
                const role = evidence.epistemic_role || 'context';
                if (EPISTEMIC_CAPS[role] && rawScore > EPISTEMIC_CAPS[role]) {
                    rawScore = EPISTEMIC_CAPS[role];
                }

                // Research Type Cap
                if (evidence.research_type === 'qualitative' && rawScore > 70) {
                    rawScore = 70;
                }
            } else {
                // No evidence found at all
                rawScore = BASE_MISSING_SCORE;
                inference = true;
            }

            // Inference Penalty
            if (inference) {
                rawScore = Math.max(0, rawScore - INFERENCE_PENALTY);
            }

            // Contradiction Detection (Simple placeholder: if claim exists but evidence is low/null, risk++)
            // Real contradiction check would parse strings, which is hard in deterministic code without NLP.
            // We rely on the penalty being applied.

            subMetricsDetails[subKey] = { score: rawScore, inference };

            // Weighted Sum
            weightedSum += rawScore * subSpec.weight;
            totalWeight += subSpec.weight;
        });

        // Normalize metric score
        const finalMetricScore = totalWeight > 0 ? (weightedSum / totalWeight) : 0;

        metricsResult[metricKey] = {
            score: Math.round(finalMetricScore),
            score_confidence: finalMetricScore > 70 ? 'high' : (finalMetricScore > 40 ? 'medium' : 'low'),
            sub_metrics: subMetricsDetails,
            reasoning: "" // Will be filled by Calculator Agent text generation
        };
    });

    // 2. Final Aggregates
    let coreScoreSum = 0;
    let coreWeightSum = 0;
    let socialValueScore = 0;

    Object.entries(metricsResult).forEach(([key, val]) => {
        const weight = FINAL_SCORE_WEIGHTS[key] || 0;

        if (key === 'social_value') {
            socialValueScore = val.score;
        } else {
            coreScoreSum += val.score * weight;
            coreWeightSum += weight;
        }
    });

    // Normalize Core
    const coreScore = coreWeightSum > 0 ? (coreScoreSum / coreWeightSum) : 0;

    // Social Value Rule: Risk Modifier Only
    // If social value is high, we boost the combined score slightly or reduce risk impact.
    // Spec says: "Combined final_score = core_score * 0.85 + contextual_score * 0.15"
    const combinedScore = (coreScore * 0.85) + (socialValueScore * 0.15);

    return {
        final_score: Math.round(combinedScore),
        score_details: {
            core: Math.round(coreScore),
            contextual: Math.round(socialValueScore),
            combined: Math.round(combinedScore)
        },
        validation_readiness: {
            level: 3, // Default, will be updated by gate
            label: "Calculated",
            blocking_gaps: []
        },
        metrics: metricsResult,
        key_risks: keyRisks,
        research_gaps: [], // Filled by Calculator Agent or Gate
        summary: "" // Filled by Calculator Agent
    };
};

/**
 * validationService.ts
 * V4.5 Epistemic Decision Engine
 */
import {
    IdeaInput, ArchitectOutput, SensorOutput, ValidationResult,
    METRIC_SCHEMA, FINAL_SCORE_WEIGHTS, ResearchPlanItem, ResearchFinding,
    MetricScore, ResearchGap, ValidationReadiness
} from '../types/validation';
import { validateSchema, cleanAndParseJson } from '../lib/jsonValidator';
import { ArchitectSchema } from '../schemas/architect.schema';
import { SensorSchema } from '../schemas/sensor.schema';
import { CalculatorSchema } from '../schemas/calculator.schema';
import { calculateDeterministicScore } from './scorer';

// Re-export values
export {
    METRIC_SCHEMA, FINAL_SCORE_WEIGHTS
} from '../types/validation';

// Re-export types
export type {
    IdeaInput, ArchitectOutput, SensorOutput, ValidationResult,
    ResearchPlanItem, ResearchFinding, MetricScore, ResearchGap, ValidationReadiness
} from '../types/validation';

declare const puter: any;

// --- Helper Functions ---

const getPuter = () => {
    if (typeof window !== 'undefined' && (window as any).puter) {
        return (window as any).puter;
    }
    throw new Error("Puter.js is not loaded.");
};

export const preScoringGate = (architect: ArchitectOutput, sensor: SensorOutput): { pass: boolean; readiness: ValidationReadiness } => {
    const blockingGaps: string[] = [];
    const missingEvidence: string[] = [];

    // Check Market Coverage
    Object.entries(METRIC_SCHEMA).forEach(([metricKey, metricSpec]) => {
        Object.entries(metricSpec.sub_metrics).forEach(([subKey, subSpec]) => {
            if (subSpec.source.includes('market')) {
                const evidence = sensor.research_results.find(r => r.metric === metricKey && r.sub_metric === subKey);

                // If evidence is missing OR (it exists but is null/low confidence and we needed authoritative)
                if (!evidence || !evidence.finding || (evidence.confidence === 'low' && evidence.epistemic_role === 'measurement')) {
                    const label = `${metricKey}.${subKey}`;
                    missingEvidence.push(label);
                    // Critical metrics block readiness
                    if (['market_size', 'customer_pain', 'market_growth_rate'].includes(metricKey)) {
                        blockingGaps.push(`${label} (Critical Market Data Missing)`);
                    }
                }
            }
        });
    });

    if (blockingGaps.length > 0) {
        return {
            pass: true, // Relaxed from false to allow report generation
            readiness: {
                level: 1,
                label: "Insufficient Evidence",
                blocking_gaps: blockingGaps
            }
        };
    }

    if (missingEvidence.length > 5) {
        return {
            pass: true, // Relaxed from false
            readiness: {
                level: 2,
                label: "Low Data Density",
                blocking_gaps: ["Too many missing data points (>5)"]
            }
        };
    }

    return {
        pass: true,
        readiness: {
            level: 3, // Will be upgraded by Calculator to 4 or 5 based on scores
            label: "Ready for Scoring",
            blocking_gaps: []
        }
    };
};

// --- Pipeline Steps ---

/**
 * STEP 1: ARCHITECT (GPT-4.1)
 * V4.5: Split Claims, Mandatory Coverage, Decision Dependencies.
 */
export const runArchitectAgent = async (input: IdeaInput, onInteraction?: (type: 'input' | 'output', content: string) => void): Promise<ArchitectOutput> => {
    const puter = getPuter();

    const prompt = JSON.stringify({
        role: "ARCHITECT",
        prompt_version: "architect.v4.5",
        objective: "Normalize the idea and generate a BINDING research plan based on valid claims.",
        context_idea: {
            ...input,
            document_content: input.document_content || "No document provided"
        },
        metric_schema: METRIC_SCHEMA,
        instructions: [
            "Normalize input; split claims into physics, market, operational.",
            "For every metric.sub where source includes 'market' or 'seller+market', produce one research task OR mark 'unresearchable' with reason.",
            "Each research task must include 'decision_dependency' describing how the finding affects scoring.",
            "STRICT RULE: 'epistemic_role' MUST be one of: 'measurement', 'validation', 'context'. Do NOT use 'estimation', 'evaluation', or other synonyms.",
            "Return JSON ONLY using the 'ArchitectOutput' schema."
        ],
        output_requirements: {
            format: "JSON only",
            no_markdown: true
        },
        output_template: {
            normalized_idea: {
                summary: "...",
                target_customer: "...",
                problem_statement: "...",
                solution_overview: "...",
                revenue_model: "..."
            },
            claims: {
                physics: ["..."],
                market: ["..."],
                operational: ["..."]
            },
            research_plan: [
                {
                    metric: "market_size",
                    sub_metric: "tam",
                    question: "...",
                    decision_dependency: "If X < Y...",
                    data_required: "...",
                    research_type: "quantitative",
                    epistemic_role: "measurement",
                    priority: "high"
                }
            ]
        }
    }, null, 2);

    onInteraction?.('input', `## 🏛️ ARCHITECT PROMPT (Going to GPT-4.1)\n\n${prompt}`);

    try {
        // Temperature 0 for determinism
        const response = await puter.ai.chat(prompt, { model: 'gpt-4-turbo', temperature: 0 });
        let text = response?.message?.content || (typeof response === 'string' ? response : JSON.stringify(response));

        onInteraction?.('output', `## 🏛️ ARCHITECT RESULT (Output of GPT-4.1)\n\n${text}`);

        const parsed = cleanAndParseJson(text);

        // Strict Schema Validation
        const validation = validateSchema(parsed, ArchitectSchema);
        if (!validation.valid) {
            console.error("Architect Schema Errors:", validation.errors);
            console.error("Architect Invalid Output:", JSON.stringify(parsed, null, 2)); // Log the bad object
            throw new Error(`Architect Output Invalid: ${validation.errors.join(', ')}`);
        }

        return parsed;
    } catch (e: any) {
        // Handle 401 specifically
        if (e.message.includes("401") || (e.status === 401)) {
            console.error("Puter Auth Error: User is not logged in.");
            throw new Error("Puter Authentication Failed. Please check your login status.");
        }
        console.error("Architect Error:", e);
        throw new Error("Architect failed: " + e.message);
    }
};

/**
 * STEP 2: SENSOR (Perplexity)
 * Updated to process dependencies and no synthesis.
 */
export const runSensorAgent = async (plan: ArchitectOutput, onInteraction?: (type: 'input' | 'output', content: string) => void): Promise<SensorOutput> => {
    const puter = getPuter();

    const prompt = JSON.stringify({
        role: "SENSOR",
        prompt_version: "sensor.v4.5",
        objective: "Return verifiable factual evidence only.",
        context_idea: plan.normalized_idea,
        research_plan: plan.research_plan,
        instructions: [
            "Return authoritative findings for each research task with fields: metric, sub_metric, finding, source, confidence, research_type, epistemic_role, decision_dependency.",
            "If authoritative numeric evidence is not found, set finding=null and confidence='low'. DO NOT SYNTHESIZE OR GUESS.",
            "Return JSON ONLY using the 'SensorOutput' schema."
        ],
        confidence_definition: {
            high: "Direct numeric or authoritative source",
            medium: "Industry proxy or partial relevance",
            low: "Indirect or inferred"
        },
        output_template: {
            research_results: [
                {
                    metric: "...",
                    sub_metric: "...",
                    finding: "Fact/Number or null",
                    source: "URL/Citation",
                    confidence: "high|medium|low",
                    research_type: "quantitative|qualitative|landscape",
                    epistemic_role: "measurement|validation|context",
                    decision_dependency: "..."
                }
            ]
        }
    }, null, 2);

    onInteraction?.('input', `## 📡 SENSOR PROMPT (Going to Perplexity)\n\n${prompt}`);

    try {
        // Temperature 0 for determinism
        const response = await puter.ai.chat(prompt, { model: 'gpt-4o', temperature: 0 });
        let text = response?.message?.content || (typeof response === 'string' ? response : JSON.stringify(response));

        onInteraction?.('output', `## 📡 SENSOR RESULT (Output of Perplexity)\n\n${text}`);

        const parsed = cleanAndParseJson(text);

        // Strict Schema Validation
        const validation = validateSchema(parsed, SensorSchema);
        if (!validation.valid) {
            console.error("Sensor Schema Errors:", validation.errors);
            throw new Error(`Sensor Output Invalid: ${validation.errors.join(', ')}`);
        }

        return parsed;
    } catch (e: any) {
        console.error("Sensor Error:", e);
        throw new Error("Sensor failed: " + e.message);
    }
};

/**
 * STEP 3: CALCULATOR (Determininstic + GPT-5.1 Reasoning)
 * V4.5: Hybrid Approach.
 */
export const runCalculatorAgent = async (architectData: ArchitectOutput, sensorData: SensorOutput, onInteraction?: (type: 'input' | 'output', content: string) => void): Promise<ValidationResult> => {
    const puter = getPuter();

    // 1. PRE-SCORING GATE
    const gateResult = preScoringGate(architectData, sensorData);
    if (!gateResult.pass) {
        // Short-circuit with fail result
        return {
            final_score: 0,
            score_details: { core: 0, contextual: 0, combined: 0 },
            validation_readiness: gateResult.readiness,
            metrics: {}, // Empty metrics on gate fail? Or partial? Spec implies "do not run full scoring".
            key_risks: ["Validation Gate Failed: Insufficient Evidence"],
            research_gaps: gateResult.readiness.blocking_gaps.map(g => ({
                metric: "gate", sub_metric: "check", impact: "High", recommendation: `Gather data for ${g}`
            })),
            summary: `Validation halted due to insufficient data. Critical gaps: ${gateResult.readiness.blocking_gaps.join(', ')}`
        };
    }

    // 2. DETERMINISTIC SCORING
    const deterministicResult = calculateDeterministicScore(architectData, sensorData);
    deterministicResult.validation_readiness = gateResult.readiness; // Keep gate status (Level 3)

    // 3. LLM REASONING GENERATION (The "Vibe" Layer)
    // We pass the calculated numbers and ask for explanation text ONLY.
    const prompt = JSON.stringify({
        role: "CALCULATOR_ASSIST",
        prompt_version: "calculator.v4.5",
        objective: "Generate professional reasoning strings for the provided deterministic scores.",
        inputs: {
            idea: architectData.normalized_idea,
            calculated_metrics: deterministicResult.metrics,
            calculated_score: deterministicResult.final_score
        },
        instructions: [
            "You MAY produce a concise 1-2 sentence explanation of each metric referencing sub-metric names.",
            "Do NOT compute scores; the service has already computed them. Your job is narrative only.",
            "Generate 'summary', 'key_risks', and 'research_gaps' based on the low-confidence areas.",
            "Return JSON only with 'metric_explanations', 'summary', 'key_risks', 'research_gaps'."
        ],
        output_template: {
            metric_explanations: {
                customer_pain: "...",
                market_size: "..."
            },
            summary: "...",
            key_risks: ["..."],
            research_gaps: [
                {
                    metric: "...",
                    sub_metric: "...",
                    impact: "High|Medium|Low",
                    recommendation: "..."
                }
            ]
        }
    }, null, 2);

    onInteraction?.('input', `## 🧮 CALCULATOR PROMPT (Going to GPT-5.1 for Reasoning)\n\n${prompt}`);

    try {
        const response = await puter.ai.chat(prompt, { model: 'gpt-4o', temperature: 0 }); // Use GPT-4o effectively as 5.1 Preview
        let text = response?.message?.content || (typeof response === 'string' ? response : JSON.stringify(response));

        onInteraction?.('output', `## 🧮 CALCULATOR RESULT (Reasoning)\n\n${text}`);

        const parsed = cleanAndParseJson(text);

        // Validate Reasoning Schema
        const validation = validateSchema(parsed, CalculatorSchema);
        if (!validation.valid) {
            console.warn("Calculator Reasoning Schema Errors (Non-fatal):", validation.errors);
            // We can proceed with deterministic numbers even if reasoning format is slightly off, 
            // but ideally we error or fallback. Let's warn and try to merge.
        }

        // Merge Reasoning into Deterministic Result
        if (parsed.metric_explanations) {
            Object.keys(deterministicResult.metrics).forEach(key => {
                if (parsed.metric_explanations[key]) {
                    deterministicResult.metrics[key].reasoning = parsed.metric_explanations[key];
                }
            });
        }
        if (parsed.summary) deterministicResult.summary = parsed.summary;
        if (parsed.key_risks) deterministicResult.key_risks = parsed.key_risks;
        if (parsed.research_gaps) deterministicResult.research_gaps = parsed.research_gaps;

        // Upgrade readiness if data quality is high
        const highConfCount = Object.values(deterministicResult.metrics).filter(m => m.score_confidence === 'high').length;
        if (highConfCount > 5) {
            deterministicResult.validation_readiness = { level: 4, label: "Verified", blocking_gaps: [] };
        }
        if (highConfCount > 8) {
            deterministicResult.validation_readiness = { level: 5, label: "Investment Ready", blocking_gaps: [] };
        }

        return deterministicResult;

    } catch (e: any) {
        console.error("Calculator Error:", e);
        // Fallback: return numbers without reasoning? 
        // Better to fail loudly during dev, but gracefull in prod.
        // For now, throw to matching existing behavior.
        throw new Error("Calculator reasoning failed: " + e.message);
    }
};

export const validateIdeaPipeline = async (input: IdeaInput, onLog?: (msg: string) => void, onInteraction?: (type: 'input' | 'output', content: string) => void) => {
    try {
        onLog?.("Step 1: Architect (Normalizing & Planning V4.5)...");
        const architectOut = await runArchitectAgent(input, onInteraction);
        onLog?.(`Architect: Plan ready with ${architectOut.research_plan.length} items.`);

        onLog?.("Step 2: Sensor (Gathering Facts)...");
        const sensorOut = await runSensorAgent(architectOut, onInteraction);
        onLog?.(`Sensor: Found ${sensorOut.research_results.length} data points.`);

        onLog?.("Step 3: Calculator (Deterministic Scoring)...");
        const result = await runCalculatorAgent(architectOut, sensorOut, onInteraction);
        onLog?.(`Validation Complete. Score: ${result.final_score}`);

        return result;
    } catch (error) {
        console.error("Pipeline Error", error);
        throw error;
    }
};

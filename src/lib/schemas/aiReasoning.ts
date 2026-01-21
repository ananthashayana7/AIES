// AI Reasoning Schema (SRS F5.5)
// Type-safe, schema-bounded AI outputs

export interface ConstraintViolation {
    constraintId: string;
    intentClause: string; // Link to Design Intent constraint
    actual: number | string;
    expected: number | string;
    severity: 'blocker' | 'warn' | 'info';
    suggestion?: string;
}

export interface ParameterSuggestion {
    id: string;
    parameterKey: string;
    currentValue: number | string;
    suggestedValue: number | string;
    delta: string; // e.g., "+0.5mm", "-10%"
    impact: {
        mass_delta_g?: number;
        stiffness_delta_pct?: number;
        cost_delta_usd?: number;
        safety_factor_delta?: number;
    };
    rationale: string;
    linkedIntentClause: string;
    rulesCited: string[];
    confidence: number; // 0-1
}

export interface TradeoffScenario {
    name: string;
    parameters: Record<string, any>;
    metrics: {
        mass_g: number;
        stiffness_score: number;
        cost_usd: number;
        safety_factor: number;
    };
    isParetoOptimal: boolean;
}

export interface TradeoffAnalysis {
    scenarios: TradeoffScenario[];
    recommendation: string; // Name of best scenario
    conflictingObjectives: string[]; // e.g., ["Minimize mass", "Max stiffness"]
}

export interface AIReasoning {
    constraintViolations: ConstraintViolation[];
    tradeoffs: TradeoffAnalysis;
    suggestions: ParameterSuggestion[];
    reasoning: ExplanationChain[];
}

export interface ExplanationChain {
    step: number;
    action: string;
    input: Record<string, any>;
    output: any;
    rationale: string;
}

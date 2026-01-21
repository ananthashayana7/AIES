// Rule Engine Schema (SRS F4)
// Type definitions for deterministic rule evaluation

export type RuleSeverity = 'blocker' | 'warn' | 'info';

export interface Rule {
    id: string;
    title: string;
    category: 'manufacturing' | 'material' | 'standard' | 'safety';
    severity: RuleSeverity;
    condition: {
        parameter?: string;
        operator?: 'lt' | 'lte' | 'gt' | 'gte' | 'eq' | 'neq';
        value?: number | string;
        expression?: string; // For complex conditions
    };
    rationale: string;
    citation?: string; // Standard reference (e.g., "ISO 2768-m")
}

export interface RuleViolation {
    ruleId: string;
    title: string;
    severity: RuleSeverity;
    actualValue: number | string;
    expectedValue?: number | string;
    rationale: string;
    citation?: string;
}

export interface RuleCheckResult {
    violations: RuleViolation[];
    warnings: RuleViolation[];
    info: RuleViolation[];
    allPassed: boolean;
}

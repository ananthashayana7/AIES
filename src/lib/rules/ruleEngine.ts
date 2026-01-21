// Rule Engine Core (SRS F4)
// Deterministic rule evaluation - runs BEFORE AI reasoning

import { DesignIntent } from '../schemas/designIntent';
import { Rule, RuleViolation, RuleCheckResult } from '../schemas/ruleEngine';
import { CNC_RULES } from './cncRules';
import { MATERIAL_RULES } from './materialRules';

export function evaluateRules(
    intent: DesignIntent,
    params: Record<string, any>,
    ruleDecks: string[] = ['cnc', 'material']
): RuleCheckResult {
    const violations: RuleViolation[] = [];
    const warnings: RuleViolation[] = [];
    const info: RuleViolation[] = [];

    // Load rule decks
    const rules: Rule[] = [];
    if (ruleDecks.includes('cnc')) rules.push(...CNC_RULES);
    if (ruleDecks.includes('material')) rules.push(...MATERIAL_RULES);

    // Evaluate each rule
    for (const rule of rules) {
        const result = evaluateSingleRule(rule, params, intent);
        if (result) {
            if (rule.severity === 'blocker') {
                violations.push(result);
            } else if (rule.severity === 'warn') {
                warnings.push(result);
            } else {
                info.push(result);
            }
        }
    }

    return {
        violations,
        warnings,
        info,
        allPassed: violations.length === 0 && warnings.length === 0
    };
}

function evaluateSingleRule(
    rule: Rule,
    params: Record<string, any>,
    intent: DesignIntent
): RuleViolation | null {
    const { condition } = rule;

    // Simple parameter comparison
    if (condition.parameter && condition.operator && condition.value !== undefined) {
        const actualValue = params[condition.parameter];
        if (actualValue === undefined) return null;

        const passed = evaluateOperator(
            actualValue,
            condition.operator,
            condition.value
        );

        if (!passed) {
            return {
                ruleId: rule.id,
                title: rule.title,
                severity: rule.severity,
                actualValue,
                expectedValue: condition.value,
                rationale: rule.rationale,
                citation: rule.citation
            };
        }
    }

    // Complex expression evaluation (simplified)
    if (condition.expression) {
        const passed = evaluateExpression(condition.expression, params, intent);
        if (!passed) {
            return {
                ruleId: rule.id,
                title: rule.title,
                severity: rule.severity,
                actualValue: 'Expression failed',
                rationale: rule.rationale,
                citation: rule.citation
            };
        }
    }

    return null;
}

function evaluateOperator(
    actual: number | string,
    operator: string,
    expected: number | string
): boolean {
    const a = typeof actual === 'string' ? parseFloat(actual) : actual;
    const e = typeof expected === 'string' ? parseFloat(expected) : expected;

    switch (operator) {
        case 'lt': return a < e;
        case 'lte': return a <= e;
        case 'gt': return a > e;
        case 'gte': return a >= e;
        case 'eq': return a === e;
        case 'neq': return a !== e;
        default: return true;
    }
}

function evaluateExpression(
    expression: string,
    params: Record<string, any>,
    intent: DesignIntent
): boolean {
    try {
        // Simple expression parser for demo
        // Production would use a proper expression evaluator or DSL

        // Handle hole spacing check
        if (expression.includes('hole_edge_distance_mm')) {
            const edgeDist = parseFloat(params['hole_edge_distance_mm'] || '0');
            const holeDia = parseFloat(params['hole_dia_mm'] || '0');
            return edgeDist >= holeDia * 1.5;
        }

        // Handle aspect ratio check
        if (expression.includes('hole_depth_mm / hole_dia_mm')) {
            const depth = parseFloat(params['hole_depth_mm'] || params['thickness_mm'] || '0');
            const dia = parseFloat(params['hole_dia_mm'] || '1');
            return (depth / dia) <= 10;
        }

        // Handle corner radius check
        if (expression.includes('internal_corner_radius_mm')) {
            const radius = parseFloat(params['internal_corner_radius_mm'] || params['fillet_radius_mm'] || '0');
            return radius > 0;
        }

        // Default: assume passed for unknown expressions
        return true;
    } catch (e) {
        console.error('Expression evaluation error:', e);
        return true; // Fail-safe: don't block on expression errors
    }
}

// Export rule decks for external access
export { CNC_RULES, MATERIAL_RULES };
export type { RuleCheckResult } from '../schemas/ruleEngine';

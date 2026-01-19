// AI Reasoning Layer - Probabilistic reasoning on structured data
// Operates on Design Intent + CAD Snapshot, NOT geometry

import { DesignIntent, VariantType } from '../schemas/designIntent';
import { CADSnapshot } from '../schemas/cadSnapshot';
import { RuleEngineResults } from '../rules/ruleEngine';

export interface ConstraintViolation {
    constraintName: string;
    intentValue: string;
    actualValue: string;
    impact: 'critical' | 'moderate' | 'minor';
    explanation: string;
}

export interface RiskScore {
    category: string;
    score: number; // 0-100 (0 = no risk, 100 = high risk)
    factors: string[];
}

export interface TradeOff {
    dimension1: string;
    dimension2: string;
    currentPosition: string; // e.g., "favors weight"
    alternatives: string[];
}

export interface ParameterSuggestion {
    parameter: string;
    currentValue: number;
    suggestedValue: number;
    delta: number;
    rationale: string;
    expectedImprovement: string;
}

export interface AIReasoningResult {
    variantType: VariantType;

    // Constraint reasoning
    constraintViolations: ConstraintViolation[];
    constraintComplianceScore: number;

    // Risk assessment
    riskScores: RiskScore[];
    overallRiskLevel: 'low' | 'medium' | 'high';

    // Trade-off analysis
    tradeOffs: TradeOff[];

    // Suggestive optimization
    suggestions: ParameterSuggestion[];

    // Natural language summary
    summary: string;
}

// Main AI reasoning function
export function performAIReasoning(
    intent: DesignIntent,
    snapshot: CADSnapshot,
    ruleResults: RuleEngineResults,
    variantType: VariantType
): AIReasoningResult {
    // 1. Constraint Reasoning
    const constraintViolations = analyzeConstraints(intent, snapshot);
    const constraintComplianceScore = Math.max(0, 100 - constraintViolations.length * 20);

    // 2. Risk Assessment
    const riskScores = assessRisks(intent, snapshot, variantType);
    const avgRisk = riskScores.reduce((sum, r) => sum + r.score, 0) / riskScores.length;
    const overallRiskLevel = avgRisk > 60 ? 'high' : avgRisk > 30 ? 'medium' : 'low';

    // 3. Trade-off Analysis
    const tradeOffs = analyzeTradeOffs(variantType, snapshot);

    // 4. Parameter Suggestions
    const suggestions = generateSuggestions(intent, snapshot, variantType, ruleResults);

    // 5. Generate Summary
    const summary = generateSummary(variantType, constraintViolations, riskScores, ruleResults);

    return {
        variantType,
        constraintViolations,
        constraintComplianceScore,
        riskScores,
        overallRiskLevel,
        tradeOffs,
        suggestions,
        summary,
    };
}

function analyzeConstraints(intent: DesignIntent, snapshot: CADSnapshot): ConstraintViolation[] {
    const violations: ConstraintViolation[] = [];

    // Mass constraint
    if (snapshot.massProperties.mass > intent.constraints.maxMassG) {
        const overBy = snapshot.massProperties.mass - intent.constraints.maxMassG;
        violations.push({
            constraintName: 'Maximum Mass',
            intentValue: `≤ ${intent.constraints.maxMassG}g`,
            actualValue: `${snapshot.massProperties.mass.toFixed(1)}g`,
            impact: overBy > 50 ? 'critical' : overBy > 20 ? 'moderate' : 'minor',
            explanation: `Design exceeds mass limit by ${overBy.toFixed(1)}g. This may affect mounting, handling, or system weight budgets.`,
        });
    }

    // Wall thickness
    if (snapshot.parameters.wallThickness < intent.constraints.minWall) {
        violations.push({
            constraintName: 'Minimum Wall Thickness',
            intentValue: `≥ ${intent.constraints.minWall}mm`,
            actualValue: `${snapshot.parameters.wallThickness}mm`,
            impact: 'critical',
            explanation: 'Wall thickness below minimum compromises structural integrity and manufacturability.',
        });
    }

    return violations;
}

function assessRisks(
    intent: DesignIntent,
    snapshot: CADSnapshot,
    variantType: VariantType
): RiskScore[] {
    const risks: RiskScore[] = [];

    // Structural failure risk
    const structuralRisk = calculateStructuralRisk(snapshot, variantType);
    risks.push({
        category: 'Structural Failure',
        score: structuralRisk,
        factors: getStructuralFactors(snapshot, variantType),
    });

    // Manufacturing risk
    const mfgRisk = calculateManufacturingRisk(intent, snapshot);
    risks.push({
        category: 'Manufacturing Issues',
        score: mfgRisk,
        factors: getManufacturingFactors(intent, snapshot),
    });

    // Tolerance stack-up risk
    if (intent.features.mountingHoles) {
        const toleranceRisk = snapshot.featureCount.holes > 4 ? 45 : 20;
        risks.push({
            category: 'Tolerance Stack-up',
            score: toleranceRisk,
            factors: [`${snapshot.featureCount.holes} holes require careful tolerance management`],
        });
    }

    return risks;
}

function calculateStructuralRisk(snapshot: CADSnapshot, variantType: VariantType): number {
    let risk = 20; // Base risk

    if (variantType === 'weight') {
        risk += 25; // Thinner walls = higher risk
    }

    if (snapshot.parameters.wallThickness < 2.5) {
        risk += 20;
    }

    if (snapshot.feaSummary) {
        if (snapshot.feaSummary.safetyFactor < 1.5) risk += 30;
        else if (snapshot.feaSummary.safetyFactor < 2.0) risk += 15;
    }

    return Math.min(100, risk);
}

function getStructuralFactors(snapshot: CADSnapshot, variantType: VariantType): string[] {
    const factors: string[] = [];

    if (variantType === 'weight') {
        factors.push('Weight-optimized design has reduced material');
    }
    if (snapshot.parameters.wallThickness < 2.5) {
        factors.push(`Wall thickness ${snapshot.parameters.wallThickness}mm is relatively thin`);
    }
    if (snapshot.featureCount.pockets > 0) {
        factors.push('Pockets reduce cross-sectional area');
    }

    return factors.length > 0 ? factors : ['Standard structural configuration'];
}

function calculateManufacturingRisk(intent: DesignIntent, snapshot: CADSnapshot): number {
    let risk = 15;

    if (intent.material.Ra && intent.material.Ra < 1.6) {
        risk += 20; // Fine finish required
    }

    if (snapshot.featureCount.fillets > 4) {
        risk += 10; // Multiple fillet operations
    }

    if (snapshot.parameters.filletRadius < 1.0) {
        risk += 15; // Small tool radius needed
    }

    return Math.min(100, risk);
}

function getManufacturingFactors(intent: DesignIntent, snapshot: CADSnapshot): string[] {
    const factors: string[] = [];

    if (intent.material.Ra && intent.material.Ra < 1.6) {
        factors.push('Fine surface finish requires additional operations');
    }
    if (snapshot.parameters.filletRadius < 1.0) {
        factors.push('Small fillet radius needs specialty tooling');
    }
    factors.push(`${intent.constraints.manufacturing.replace('_', ' ')} process selected`);

    return factors;
}

function analyzeTradeOffs(variantType: VariantType, snapshot: CADSnapshot): TradeOff[] {
    const tradeOffs: TradeOff[] = [];

    tradeOffs.push({
        dimension1: 'Weight',
        dimension2: 'Strength',
        currentPosition: variantType === 'weight'
            ? 'Optimized for minimum weight, reduced safety margins'
            : variantType === 'strength'
                ? 'Optimized for strength, heavier design'
                : 'Balanced between weight and strength',
        alternatives: [
            'Increase wall by 0.5mm for +15% strength at +20g',
            'Add ribs instead of solid walls for weight savings',
        ],
    });

    tradeOffs.push({
        dimension1: 'Cost',
        dimension2: 'Manufacturability',
        currentPosition: variantType === 'cost'
            ? 'Simplified features for faster machining'
            : 'Standard complexity, moderate machining time',
        alternatives: [
            'Use chamfers instead of fillets to reduce tool changes',
            'Reduce pocket count to simplify fixturing',
        ],
    });

    return tradeOffs;
}

function generateSuggestions(
    intent: DesignIntent,
    snapshot: CADSnapshot,
    variantType: VariantType,
    ruleResults: RuleEngineResults
): ParameterSuggestion[] {
    const suggestions: ParameterSuggestion[] = [];

    // Suggest based on mass constraints
    if (snapshot.massProperties.mass > intent.constraints.maxMassG * 0.9) {
        suggestions.push({
            parameter: 'wallThickness',
            currentValue: snapshot.parameters.wallThickness,
            suggestedValue: snapshot.parameters.wallThickness - 0.5,
            delta: -0.5,
            rationale: 'Approaching mass limit',
            expectedImprovement: 'Reduce mass by approximately 10-15g',
        });
    }

    // Suggest fillet optimization
    if (variantType === 'strength' && snapshot.parameters.filletRadius < 4) {
        suggestions.push({
            parameter: 'filletRadius',
            currentValue: snapshot.parameters.filletRadius,
            suggestedValue: 6,
            delta: 6 - snapshot.parameters.filletRadius,
            rationale: 'Larger fillets reduce stress concentration',
            expectedImprovement: 'Reduce peak stress by 10-20%',
        });
    }

    return suggestions;
}

function generateSummary(
    variantType: VariantType,
    violations: ConstraintViolation[],
    risks: RiskScore[],
    ruleResults: RuleEngineResults
): string {
    const variantDesc = {
        strength: 'Strength-Optimized',
        weight: 'Weight-Optimized',
        cost: 'Cost-Optimized',
    };

    let summary = `**${variantDesc[variantType]} Variant Analysis**\n\n`;

    if (violations.length === 0) {
        summary += '✓ All design intent constraints satisfied.\n';
    } else {
        summary += `⚠ ${violations.length} constraint violation(s) detected.\n`;
    }

    const avgRisk = risks.reduce((sum, r) => sum + r.score, 0) / risks.length;
    summary += `Risk Level: ${avgRisk > 60 ? 'High' : avgRisk > 30 ? 'Medium' : 'Low'} (${avgRisk.toFixed(0)}%)\n`;
    summary += `Rule Compliance: ${ruleResults.score}%\n`;

    return summary;
}

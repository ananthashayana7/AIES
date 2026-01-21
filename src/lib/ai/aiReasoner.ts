// AI Reasoner Core (SRS F5.1-F5.4)
// Local-only reasoning engine for constraint validation and optimization

import { DesignIntent } from '../schemas/designIntent';
import { AIReasoning, ConstraintViolation, ParameterSuggestion, TradeoffAnalysis, TradeoffScenario, ExplanationChain } from '../schemas/aiReasoning';
import { SimulationResult, runMaterialSimulation } from '../simulation/simulationEngine';

let suggestionCounter = 0;

export function analyzeDesign(intent: DesignIntent, currentParams: Record<string, any>, simulationResults: SimulationResult[]): AIReasoning {
    const reasoning: ExplanationChain[] = [];

    // F5.1: Constraint Validation
    const violations = validateConstraints(intent, currentParams, simulationResults, reasoning);

    // F5.2: Trade-off Analysis
    const tradeoffs = analyzeTradeoffs(intent, currentParams, simulationResults, reasoning);

    // F5.3: Parameter Optimization
    const suggestions = generateSuggestions(intent, currentParams, violations, simulationResults, reasoning);

    return {
        constraintViolations: violations,
        tradeoffs,
        suggestions,
        reasoning
    };
}

// F5.1: Validate constraints against Design Intent
function validateConstraints(
    intent: DesignIntent,
    params: Record<string, any>,
    simResults: SimulationResult[],
    reasoning: ExplanationChain[]
): ConstraintViolation[] {
    const violations: ConstraintViolation[] = [];

    // Get current metrics from simulation (use first material as baseline)
    const baseline = simResults[0];
    if (!baseline) return violations;

    // Check acceptance criteria: max_mass_g
    if (baseline.mass_g > intent.acceptance.max_mass_g) {
        violations.push({
            constraintId: 'acceptance.max_mass_g',
            intentClause: `Maximum mass limit: ${intent.acceptance.max_mass_g}g`,
            actual: baseline.mass_g,
            expected: intent.acceptance.max_mass_g,
            severity: 'blocker',
            suggestion: `Current mass (${baseline.mass_g}g) exceeds limit by ${(baseline.mass_g - intent.acceptance.max_mass_g).toFixed(1)}g`
        });

        reasoning.push({
            step: reasoning.length + 1,
            action: 'Mass Constraint Check',
            input: { mass_g: baseline.mass_g, limit: intent.acceptance.max_mass_g },
            output: 'VIOLATION',
            rationale: `Part mass exceeds Design Intent acceptance criteria by ${((baseline.mass_g / intent.acceptance.max_mass_g - 1) * 100).toFixed(1)}%`
        });
    }

    // Check acceptance criteria: safety_factor_min
    if (baseline.safetyFactor < intent.acceptance.safety_factor_min) {
        violations.push({
            constraintId: 'acceptance.safety_factor_min',
            intentClause: `Minimum safety factor: ${intent.acceptance.safety_factor_min}`,
            actual: baseline.safetyFactor,
            expected: intent.acceptance.safety_factor_min,
            severity: 'blocker',
            suggestion: `Safety factor (${baseline.safetyFactor.toFixed(2)}) below minimum threshold`
        });

        reasoning.push({
            step: reasoning.length + 1,
            action: 'Safety Factor Check',
            input: { sf: baseline.safetyFactor, min: intent.acceptance.safety_factor_min },
            output: 'VIOLATION',
            rationale: 'Part will fail under specified load conditions per material yield strength'
        });
    }

    // Check constraint expressions
    intent.constraints.forEach(c => {
        // Simple expression parsing (e.g., "max_deflection < 0.1mm")
        if (c.expression.includes('max_deflection') && baseline.deflection_mm) {
            const match = c.expression.match(/([\d.]+)/);
            if (match) {
                const limit = parseFloat(match[1]);
                if (baseline.deflection_mm > limit) {
                    violations.push({
                        constraintId: c.id,
                        intentClause: c.expression,
                        actual: baseline.deflection_mm,
                        expected: limit,
                        severity: c.severity,
                        suggestion: `Deflection (${baseline.deflection_mm}mm) exceeds ${limit}mm limit`
                    });
                }
            }
        }
    });

    return violations;
}

// F5.2: Analyze trade-offs between competing objectives
function analyzeTradeoffs(
    intent: DesignIntent,
    params: Record<string, any>,
    simResults: SimulationResult[],
    reasoning: ExplanationChain[]
): TradeoffAnalysis {
    const scenarios: TradeoffScenario[] = [];

    // Generate scenarios from simulation results (different materials)
    simResults.forEach((sim, i) => {
        const stiffnessScore = calculateStiffness(params, sim);
        const costEstimate = sim.cost_score * 100; // Convert score to USD estimate

        scenarios.push({
            name: sim.materialName,
            parameters: { ...params, material: sim.materialName },
            metrics: {
                mass_g: sim.mass_g,
                stiffness_score: stiffnessScore,
                cost_usd: costEstimate,
                safety_factor: sim.safetyFactor
            },
            isParetoOptimal: false // Calculate after all scenarios
        });
    });

    // Identify Pareto optimal solutions
    scenarios.forEach((scenario, i) => {
        let isDominated = false;
        for (const other of scenarios) {
            if (other === scenario) continue;
            // Check if 'other' dominates 'scenario' on all objectives
            const lighterOrEqual = other.metrics.mass_g <= scenario.metrics.mass_g;
            const stiffer = other.metrics.stiffness_score >= scenario.metrics.stiffness_score;
            const cheaper = other.metrics.cost_usd <= scenario.metrics.cost_usd;
            const safer = other.metrics.safety_factor >= scenario.metrics.safety_factor;

            if ((lighterOrEqual && stiffer && cheaper && safer) &&
                (other.metrics.mass_g < scenario.metrics.mass_g ||
                    other.metrics.stiffness_score > scenario.metrics.stiffness_score ||
                    other.metrics.cost_usd < scenario.metrics.cost_usd ||
                    other.metrics.safety_factor > scenario.metrics.safety_factor)) {
                isDominated = true;
                break;
            }
        }
        scenario.isParetoOptimal = !isDominated;
    });

    // Find recommendation (best compromise)
    const paretoSet = scenarios.filter(s => s.isParetoOptimal);
    const recommended = paretoSet.sort((a, b) => {
        // Multi-objective ranking: prioritize meeting constraints, then cost
        const aValid = a.metrics.mass_g <= intent.acceptance.max_mass_g && a.metrics.safety_factor >= intent.acceptance.safety_factor_min;
        const bValid = b.metrics.mass_g <= intent.acceptance.max_mass_g && b.metrics.safety_factor >= intent.acceptance.safety_factor_min;

        if (aValid && !bValid) return -1;
        if (!aValid && bValid) return 1;

        return a.metrics.cost_usd - b.metrics.cost_usd;
    })[0];

    reasoning.push({
        step: reasoning.length + 1,
        action: 'Pareto Optimization',
        input: { scenarios: scenarios.length },
        output: { paretoOptimal: paretoSet.length, recommended: recommended?.name },
        rationale: `Generated ${scenarios.length} design scenarios; ${paretoSet.length} are Pareto-optimal (not dominated on all objectives)`
    });

    // Detect conflicting objectives
    const objectives = intent.objectives || [];
    const conflicts: string[] = [];
    if (objectives.includes('Minimize Mass') && objectives.includes('Max Stiffness')) {
        conflicts.push('Minimize Mass vs. Max Stiffness');
    }

    return {
        scenarios,
        recommendation: recommended?.name || scenarios[0]?.name || 'Unknown',
        conflictingObjectives: conflicts
    };
}

// F5.3: Generate parameter optimization suggestions
function generateSuggestions(
    intent: DesignIntent,
    params: Record<string, any>,
    violations: ConstraintViolation[],
    simResults: SimulationResult[],
    reasoning: ExplanationChain[]
): ParameterSuggestion[] {
    const suggestions: ParameterSuggestion[] = [];
    const baseline = simResults[0];
    if (!baseline) return suggestions;

    // Suggest thickness reduction if mass violated
    const massViolation = violations.find(v => v.constraintId === 'acceptance.max_mass_g');
    if (massViolation) {
        const currentThickness = parseFloat(params['thickness_mm']?.toString() || params['dimensions.thickness']?.toString()?.replace(/[^\d.]/g, '') || '12');
        const excessMass = baseline.mass_g - intent.acceptance.max_mass_g;
        const requiredReduction = (excessMass / baseline.mass_g) * 100; // Percentage
        const suggestedThickness = currentThickness * (1 - requiredReduction / 100);

        suggestions.push({
            id: `sug-${Date.now()}-${++suggestionCounter}`,
            parameterKey: 'thickness_mm',
            currentValue: currentThickness,
            suggestedValue: parseFloat(suggestedThickness.toFixed(1)),
            delta: `${(suggestedThickness - currentThickness).toFixed(1)}mm (${-requiredReduction.toFixed(1)}%)`,
            impact: {
                mass_delta_g: -excessMass,
                stiffness_delta_pct: -requiredReduction * 0.8, // Heuristic: stiffness drops ~80% of thickness reduction
            },
            rationale: `Reducing thickness brings mass from ${baseline.mass_g.toFixed(0)}g to target ${intent.acceptance.max_mass_g}g`,
            linkedIntentClause: 'acceptance.max_mass_g',
            rulesCited: [],
            confidence: 0.85
        });

        reasoning.push({
            step: reasoning.length + 1,
            action: 'Thickness Optimization',
            input: { excess_mass_g: excessMass, current_thickness: currentThickness },
            output: { suggested_thickness: suggestedThickness },
            rationale: 'Linear mass-thickness relationship used for heuristic optimization'
        });
    }

    // Suggest material change if safety factor violated
    const sfViolation = violations.find(v => v.constraintId === 'acceptance.safety_factor_min');
    if (sfViolation && simResults.length > 1) {
        // Find material with higher safety factor
        const betterMaterial = simResults.find(s => s.safetyFactor >= intent.acceptance.safety_factor_min);
        if (betterMaterial && betterMaterial.materialName !== baseline.materialName) {
            suggestions.push({
                id: `sug-${Date.now()}-${++suggestionCounter}`,
                parameterKey: 'material',
                currentValue: baseline.materialName,
                suggestedValue: betterMaterial.materialName,
                delta: `Change material`,
                impact: {
                    safety_factor_delta: betterMaterial.safetyFactor - baseline.safetyFactor,
                    mass_delta_g: betterMaterial.mass_g - baseline.mass_g,
                    cost_delta_usd: (betterMaterial.cost_score - baseline.cost_score) * 100
                },
                rationale: `${betterMaterial.materialName} provides S.F. ${betterMaterial.safetyFactor.toFixed(2)} vs. current ${baseline.safetyFactor.toFixed(2)}`,
                linkedIntentClause: 'acceptance.safety_factor_min',
                rulesCited: [],
                confidence: 0.92
            });
        }
    }

    return suggestions;
}

// Helper: Calculate stiffness score
function calculateStiffness(params: Record<string, any>, sim: SimulationResult): number {
    // Stiffness score based on deflection (lower deflection = higher stiffness)
    if (sim.deflection_mm === 0) return 100;
    return Math.min(100, 100 / (1 + sim.deflection_mm * 10));
}

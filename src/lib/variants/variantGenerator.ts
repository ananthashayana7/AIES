// Variant Generator - Heuristic-based generation of design variants
// Generates Strength, Weight, and Cost biased variants from Design Intent

import { v4 as uuidv4 } from 'uuid';
import { DesignIntent, VariantType } from '../schemas/designIntent';
import { CADSnapshot, MassProperties, FeatureCount } from '../schemas/cadSnapshot';
import { runRuleEngine, estimateMass, RuleEngineResults } from '../rules/ruleEngine';
import { performAIReasoning, AIReasoningResult } from '../ai/aiReasoning';

export interface GeneratedVariant {
    id: string;
    variantType: VariantType;
    displayName: string;
    description: string;

    // Core parameters
    wallThickness: number;
    filletRadius: number;
    pocketDepth: number;
    edgeStyle: 'fillet' | 'chamfer' | 'sharp';
    finish: string;

    // Calculated properties
    estimatedMass: number;
    costHeuristic: number; // 1-10 scale
    rigidityScore: number; // 1-10 scale

    // Full analysis
    cadSnapshot: CADSnapshot;
    ruleResults: RuleEngineResults;
    aiReasoning: AIReasoningResult;
}

// Variant generation strategies
const variantStrategies: Record<VariantType, {
    wallMultiplier: number;
    filletPreference: 'max' | 'min' | 'mid';
    pocketMultiplier: number;
    edgePreference: 'fillet' | 'chamfer';
    finishPreference: string;
}> = {
    strength: {
        wallMultiplier: 1.5,
        filletPreference: 'max',
        pocketMultiplier: 0,
        edgePreference: 'fillet',
        finishPreference: 'bead-blasted + anodized',
    },
    weight: {
        wallMultiplier: 1.0,
        filletPreference: 'min',
        pocketMultiplier: 1.0,
        edgePreference: 'fillet',
        finishPreference: 'brushed',
    },
    cost: {
        wallMultiplier: 1.25,
        filletPreference: 'mid',
        pocketMultiplier: 0.5,
        edgePreference: 'chamfer',
        finishPreference: 'as-machined',
    },
};

const variantDescriptions: Record<VariantType, { name: string; desc: string }> = {
    strength: {
        name: 'Variant A – Strength-Biased',
        desc: 'Thicker walls, larger fillets, gussets near mounting. Optimized for structural performance.',
    },
    weight: {
        name: 'Variant B – Weight-Biased',
        desc: 'Minimum wall thickness, pocketing for mass reduction. Optimized for lightweight.',
    },
    cost: {
        name: 'Variant C – Cost-Biased',
        desc: 'Simplified features, chamfers over fillets. Optimized for manufacturing efficiency.',
    },
};

export function generateVariants(intent: DesignIntent): GeneratedVariant[] {
    const variants: GeneratedVariant[] = [];

    for (const variantType of intent.variants) {
        const variant = generateSingleVariant(intent, variantType);
        variants.push(variant);
    }

    return variants;
}

function generateSingleVariant(intent: DesignIntent, variantType: VariantType): GeneratedVariant {
    const strategy = variantStrategies[variantType];
    const info = variantDescriptions[variantType];

    // Calculate parameters based on strategy
    const baseWall = intent.constraints.minWall;
    const wallThickness = Math.min(baseWall * strategy.wallMultiplier, intent.envelope.H / 4);

    // Fillet radius from range
    let filletRadius = 3; // default
    if (intent.features.edgeStyle?.radius) {
        const radiusRange = intent.features.edgeStyle.radius;
        if (Array.isArray(radiusRange)) {
            filletRadius = strategy.filletPreference === 'max'
                ? radiusRange[1]
                : strategy.filletPreference === 'min'
                    ? radiusRange[0]
                    : (radiusRange[0] + radiusRange[1]) / 2;
        } else {
            filletRadius = radiusRange;
        }
    }

    // Pocket depth
    const maxPocket = intent.features.pockets?.maxDepth || 0;
    const pocketDepth = intent.features.pockets?.enabled
        ? maxPocket * strategy.pocketMultiplier
        : 0;

    // Estimate mass
    const estimatedMass = estimateMass(intent, wallThickness, pocketDepth);

    // Create CAD snapshot
    const cadSnapshot = createCADSnapshot(intent, variantType, {
        wallThickness,
        filletRadius,
        pocketDepth,
        holeCount: intent.features.mountingHoles?.count || 0,
    }, estimatedMass);

    // Run rule engine
    const ruleResults = runRuleEngine(intent, cadSnapshot);

    // Perform AI reasoning
    const aiReasoning = performAIReasoning(intent, cadSnapshot, ruleResults, variantType);

    // Calculate heuristic scores
    const costHeuristic = calculateCostHeuristic(variantType, cadSnapshot);
    const rigidityScore = calculateRigidityScore(variantType, wallThickness, filletRadius);

    return {
        id: uuidv4(),
        variantType,
        displayName: info.name,
        description: info.desc,
        wallThickness,
        filletRadius,
        pocketDepth,
        edgeStyle: strategy.edgePreference,
        finish: strategy.finishPreference,
        estimatedMass,
        costHeuristic,
        rigidityScore,
        cadSnapshot,
        ruleResults,
        aiReasoning,
    };
}

function createCADSnapshot(
    intent: DesignIntent,
    variantType: VariantType,
    params: {
        wallThickness: number;
        filletRadius: number;
        pocketDepth: number;
        holeCount: number;
    },
    mass: number
): CADSnapshot {
    const { L, W, H } = intent.envelope;
    const volume = L * W * H;
    const surfaceArea = 2 * (L * W + W * H + H * L);

    return {
        id: uuidv4(),
        designIntentId: intent.id,
        variantType,
        parameters: params,
        massProperties: {
            mass,
            volume,
            surfaceArea,
            centerOfMass: { x: L / 2, y: W / 2, z: H / 2 },
            momentsOfInertia: {
                Ixx: (mass * (W * W + H * H)) / 12,
                Iyy: (mass * (L * L + H * H)) / 12,
                Izz: (mass * (L * L + W * W)) / 12,
            },
        },
        featureCount: {
            holes: params.holeCount,
            fillets: params.filletRadius > 0 ? 8 : 0, // corner fillets
            chamfers: 0,
            pockets: params.pocketDepth > 0 ? 1 : 0,
            ribs: variantType === 'strength' ? 4 : 0,
        },
        passFailIndicators: {
            massCheck: mass <= intent.constraints.maxMassG,
            wallThicknessCheck: params.wallThickness >= intent.constraints.minWall,
            manufacturabilityCheck: true,
            toleranceCheck: true,
        },
    };
}

function calculateCostHeuristic(variantType: VariantType, snapshot: CADSnapshot): number {
    // 1 = cheapest, 10 = most expensive
    let cost = 5;

    if (variantType === 'cost') cost = 3; // optimized for cost
    if (variantType === 'strength') cost = 7; // more material, more machining

    cost += snapshot.featureCount.pockets * 0.5;
    cost += snapshot.featureCount.fillets > 4 ? 1 : 0;

    return Math.min(10, Math.max(1, Math.round(cost)));
}

function calculateRigidityScore(variantType: VariantType, wall: number, fillet: number): number {
    // 1 = least rigid, 10 = most rigid
    let score = 5;

    if (variantType === 'strength') score = 8;
    if (variantType === 'weight') score = 4;

    score += (wall - 2) * 2; // bonus for thicker walls
    score += fillet > 4 ? 1 : 0; // large fillets help

    return Math.min(10, Math.max(1, Math.round(score)));
}

// Variant Generator v1.0 (Phase 7: Generative Variants)
// Generates multiple intelligent design alternatives from a single prompt

import { v4 as uuidv4 } from 'uuid';
import { DesignIntent } from '../schemas/designIntent';

export interface GeneratedVariant {
    id: string;
    variantType: 'strength' | 'weight' | 'cost' | 'balanced' | 'compact';
    displayName: string;
    description: string;
    parameters: Record<string, number | string>;
    guidance: {
        step: number;
        title: string;
        description: string;
        rationale: string;
    }[];
    insights: {
        summary: string;
        riskLevel: 'low' | 'medium' | 'high';
        suggestedChanges: { parameter: string, delta: string, reason: string }[];
    };
    massG: number;
    costScore: number; // 1-10
    strengthScore: number; // 1-10
}

// Material density lookup (g/cm³)
const MATERIAL_DENSITY: Record<string, number> = {
    'aluminum': 2.7,
    'steel': 7.85,
    'titanium': 4.5,
    'plastic': 1.2,
    'abs': 1.05,
    'gold': 19.3,
    'copper': 8.96,
    'brass': 8.5,
    'default': 2.7
};

// Material cost multiplier
const MATERIAL_COST: Record<string, number> = {
    'aluminum': 1.0,
    'steel': 0.8,
    'titanium': 8.0,
    'plastic': 0.3,
    'abs': 0.4,
    'gold': 50.0,
    'copper': 2.5,
    'brass': 2.0,
    'default': 1.0
};

function getMaterialDensity(material: string): number {
    const m = material.toLowerCase();
    for (const [key, val] of Object.entries(MATERIAL_DENSITY)) {
        if (m.includes(key)) return val;
    }
    return MATERIAL_DENSITY['default'];
}

function getMaterialCostFactor(material: string): number {
    const m = material.toLowerCase();
    for (const [key, val] of Object.entries(MATERIAL_COST)) {
        if (m.includes(key)) return val;
    }
    return MATERIAL_COST['default'];
}

export function generateVariants(intent: DesignIntent): GeneratedVariant[] {
    const profile = (intent.parameters.profile || 'Baseplate').toString().toLowerCase();

    // Generate 5 intelligent variants
    const variants: GeneratedVariant[] = [
        generateVariant(intent, 'strength', profile),
        generateVariant(intent, 'weight', profile),
        generateVariant(intent, 'cost', profile),
        generateVariant(intent, 'balanced', profile),
        generateVariant(intent, 'compact', profile),
    ];

    return variants;
}

function generateVariant(
    intent: DesignIntent,
    type: 'strength' | 'weight' | 'cost' | 'balanced' | 'compact',
    profile: string
): GeneratedVariant {
    const params = { ...intent.parameters };
    const material = intent.materials[0] || 'Aluminum 6061-T6';
    const density = getMaterialDensity(material);
    const costFactor = getMaterialCostFactor(material);

    // Extract base dimensions
    const l = parseFloat(params['length_mm']?.toString() || '100');
    const w = parseFloat(params['width_mm']?.toString() || '100');
    const t = parseFloat(params['thickness_mm']?.toString() || '10');
    const h = parseFloat(params['height_mm']?.toString() || '100');
    const d = parseFloat(params['diameter_mm']?.toString() || '50');

    // Optimization Multipliers based on variant type
    const mods = getModifiers(type);

    // Apply modifications
    const modifiedParams = { ...params };

    // Adjust thickness/dimensions based on variant type AND geometry type
    modifiedParams['thickness_mm'] = Math.max(1, t * mods.thickness);

    // For cylindrical shapes (cylinder, bottle, vase, bowl, ring)
    const isCylindrical = ['cylinder', 'bottle', 'vase', 'bowl', 'cup', 'dish', 'tube', 'rod'].includes(profile.toLowerCase());

    if (isCylindrical) {
        // Modify height and diameter, NOT length/width
        if (params['height_mm']) {
            modifiedParams['height_mm'] = Math.max(10, h * mods.size);
        }
        if (params['diameter_mm']) {
            const newDiameter = Math.max(5, d * mods.size);
            modifiedParams['diameter_mm'] = newDiameter;
            modifiedParams['radius_mm'] = newDiameter / 2;
        }
    } else {
        // For box-like shapes, modify length/width/height
        if (params['length_mm']) {
            modifiedParams['length_mm'] = Math.max(10, l * mods.size);
        }
        if (params['width_mm']) {
            modifiedParams['width_mm'] = Math.max(10, w * mods.size);
        }
        if (params['height_mm']) {
            modifiedParams['height_mm'] = Math.max(10, h * mods.size);
        }
    }

    // Calculate metrics
    const volume = calculateVolume(profile, modifiedParams);
    const massG = volume * density;
    const costScore = Math.min(10, Math.max(1, Math.round((massG / 100) * costFactor * mods.costMod)));
    const strengthScore = Math.min(10, Math.max(1, Math.round(mods.strengthMod * 7)));

    // Generate guidance based on profile and variant
    const guidance = generateGuidance(profile, modifiedParams, type);

    // Generate insights
    const insights = generateInsights(intent, type, massG, strengthScore);

    return {
        id: uuidv4(),
        variantType: type,
        displayName: getDisplayName(type),
        description: getDescription(type, profile, massG),
        parameters: modifiedParams,
        guidance,
        insights,
        massG: Math.round(massG),
        costScore,
        strengthScore
    };
}

function getModifiers(type: 'strength' | 'weight' | 'cost' | 'balanced' | 'compact') {
    switch (type) {
        case 'strength':
            return { thickness: 1.5, size: 1.0, costMod: 1.3, strengthMod: 1.4 };
        case 'weight':
            return { thickness: 0.7, size: 0.9, costMod: 0.8, strengthMod: 0.7 };
        case 'cost':
            return { thickness: 0.8, size: 1.0, costMod: 0.6, strengthMod: 0.8 };
        case 'balanced':
            return { thickness: 1.0, size: 1.0, costMod: 1.0, strengthMod: 1.0 };
        case 'compact':
            return { thickness: 1.2, size: 0.8, costMod: 0.9, strengthMod: 1.1 };
    }
}

function getDisplayName(type: string): string {
    switch (type) {
        case 'strength': return 'STRENGTH OPTIMIZED';
        case 'weight': return 'LIGHTWEIGHT';
        case 'cost': return 'COST EFFICIENT';
        case 'balanced': return 'BALANCED';
        case 'compact': return 'COMPACT';
        default: return type.toUpperCase();
    }
}

function getDescription(type: string, profile: string, massG: number): string {
    const mass = Math.round(massG);
    switch (type) {
        case 'strength':
            return `Maximum structural integrity for ${profile}. Increased wall thickness. Est. ${mass}g.`;
        case 'weight':
            return `Minimized mass through reduced sections. Est. ${mass}g. Ideal for weight-critical applications.`;
        case 'cost':
            return `Optimized for manufacturing cost. Simplified geometry. Est. ${mass}g.`;
        case 'balanced':
            return `Standard configuration balancing strength, weight, and cost. Est. ${mass}g.`;
        case 'compact':
            return `Reduced footprint while maintaining strength. Est. ${mass}g.`;
        default:
            return `Variant for ${profile}. Est. ${mass}g.`;
    }
}

function calculateVolume(profile: string, params: any): number {
    const l = parseFloat(params['length_mm'] || 100);
    const w = parseFloat(params['width_mm'] || 100);
    const t = parseFloat(params['thickness_mm'] || 10);
    const h = parseFloat(params['height_mm'] || 100);
    const d = parseFloat(params['diameter_mm'] || 50);

    switch (profile) {
        case 'cylinder':
        case 'bottle':
            const radius = d / 2;
            return Math.PI * radius * radius * h / 1000; // cm³
        case 'ring':
            const ringR = parseFloat(params['ring_size'] || 20) / 2;
            const tubeR = t / 2;
            return 2 * Math.PI * Math.PI * ringR * tubeR * tubeR / 1000;
        case 'l-bend':
        case 'bracket':
            const legA = parseFloat(params['legA'] || l);
            const legB = parseFloat(params['legB'] || w);
            return (legA * t * w + legB * t * w - t * t * w) / 1000;
        case 'i-beam':
        case 't-profile':
        case 'c-channel':
            // Approximate
            return (l * w * t * 0.3) / 1000;
        case 'vase':
        case 'bowl':
            // Hollow revolution
            return Math.PI * (d / 2) * (d / 2) * h * 0.1 / 1000;
        default:
            // Baseplate
            return (l * w * t) / 1000;
    }
}

function generateGuidance(profile: string, params: any, type: string): any[] {
    const l = parseFloat(params['length_mm'] || 100);
    const w = parseFloat(params['width_mm'] || 100);
    const t = parseFloat(params['thickness_mm'] || 10);

    const guidance = [];

    // Universal first step
    guidance.push({
        step: 1,
        title: 'Create Base Sketch',
        description: `Sketch ${profile} profile on Top Plane with key dimensions.`,
        rationale: `Foundation for ${type} optimization.`
    });

    // Profile-specific steps
    if (profile.includes('cylinder') || profile.includes('bottle')) {
        guidance.push({
            step: 2,
            title: 'Revolve or Extrude',
            description: `Create cylindrical body. Height: ${params['height_mm']}mm, Diameter: ${params['diameter_mm']}mm.`,
            rationale: 'Symmetrical body for uniform stress distribution.'
        });
    } else if (profile.includes('ring')) {
        guidance.push({
            step: 2,
            title: 'Create Torus',
            description: `Ring size: ${params['ring_size']}mm, Band width: ${params['band_width']}mm.`,
            rationale: 'Circular band for jewelry application.'
        });
    } else {
        guidance.push({
            step: 2,
            title: 'Extrude Profile',
            description: `Extrude to ${t}mm thickness.`,
            rationale: `Thickness set for ${type} requirements.`
        });
    }

    // Optimization-specific step
    if (type === 'strength') {
        guidance.push({
            step: 3,
            title: 'Add Reinforcement',
            description: 'Add fillets (R2) to internal corners, ribs if needed.',
            rationale: 'Increases load-bearing capacity without excessive mass.'
        });
    } else if (type === 'weight') {
        guidance.push({
            step: 3,
            title: 'Add Weight Reduction',
            description: 'Add pocket cuts or lightening holes in non-critical areas.',
            rationale: 'Reduces mass while maintaining structural paths.'
        });
    } else if (type === 'cost') {
        guidance.push({
            step: 3,
            title: 'Simplify Geometry',
            description: 'Remove complex features. Use standard radii.',
            rationale: 'Reduces machining time and tooling changes.'
        });
    }

    // Final step
    guidance.push({
        step: guidance.length + 1,
        title: 'Verify & Export',
        description: 'Run mass check, verify dimensions, export for manufacturing.',
        rationale: 'Quality assurance before production.'
    });

    return guidance;
}

function generateInsights(intent: DesignIntent, type: string, massG: number, strengthScore: number): any {
    const safetyTarget = intent.acceptance?.safety_factor_min || 1.5;
    const massTarget = intent.acceptance?.max_mass_g || 5000;

    const exceeds = massG > massTarget;
    const weakRisk = strengthScore < 5;

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (exceeds && weakRisk) riskLevel = 'high';
    else if (exceeds || weakRisk) riskLevel = 'medium';

    const suggestedChanges: any[] = [];

    if (exceeds) {
        suggestedChanges.push({
            parameter: 'thickness_mm',
            delta: '-10%',
            reason: `Mass (${Math.round(massG)}g) exceeds target (${massTarget}g). Consider reducing thickness.`
        });
    }

    if (weakRisk && type !== 'weight') {
        suggestedChanges.push({
            parameter: 'thickness_mm',
            delta: '+20%',
            reason: 'Strength score below threshold. Increase thickness or add ribs.'
        });
    }

    return {
        summary: `${type.toUpperCase()} variant analysis complete. Mass: ${Math.round(massG)}g. Strength: ${strengthScore}/10.`,
        riskLevel,
        suggestedChanges
    };
}

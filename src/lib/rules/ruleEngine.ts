// Rule Engine - Deterministic engineering rules
// These run BEFORE AI reasoning for explainable, trusted checks

import { DesignIntent, VariantType } from '../schemas/designIntent';
import { CADSnapshot } from '../schemas/cadSnapshot';

export interface RuleResult {
    ruleId: string;
    ruleName: string;
    category: 'manufacturing' | 'material' | 'design_standard' | 'safety';
    passed: boolean;
    message: string;
    severity: 'error' | 'warning' | 'info';
    suggestion?: string;
}

export interface RuleEngineResults {
    overallPass: boolean;
    results: RuleResult[];
    score: number; // 0-100
}

// Manufacturing rules based on process
const manufacturingRules = {
    CNC_machining: {
        minWallThickness: 1.0, // mm
        minHoleDiameter: 1.5, // mm
        maxAspectRatio: 10, // depth/diameter for holes
        minFilletRadius: 0.5, // mm (tool radius constraint)
        minCornerRadius: 1.5, // mm (for internal corners)
    },
    additive: {
        minWallThickness: 0.8,
        minHoleDiameter: 0.5,
        maxOverhangAngle: 45, // degrees
        minSupportClearance: 0.3,
    },
    sheet_metal: {
        minBendRadius: 1.0, // × thickness
        minFlangeHeight: 3.0, // mm
        minHoleEdgeDistance: 2.0, // × thickness
    },
    casting: {
        minWallThickness: 2.5,
        maxWallVariation: 2.0, // ratio
        draftAngle: 1.5, // degrees
    },
};

// Material density for mass calculations (g/mm³)
const materialDensity: Record<string, number> = {
    'Aluminum 6061-T6': 0.0027,
    'Aluminum 7075-T6': 0.00281,
    'Steel 1018': 0.00785,
    'Stainless 304': 0.008,
    'Titanium Ti-6Al-4V': 0.00443,
    'ABS Plastic': 0.00105,
    'Nylon PA12': 0.001,
};

export function runRuleEngine(
    intent: DesignIntent,
    snapshot: CADSnapshot
): RuleEngineResults {
    const results: RuleResult[] = [];
    const mfgRules = manufacturingRules[intent.constraints.manufacturing];

    // Rule 1: Mass check
    const massCheck = snapshot.massProperties.mass <= intent.constraints.maxMassG;
    results.push({
        ruleId: 'MASS_001',
        ruleName: 'Maximum Mass Constraint',
        category: 'design_standard',
        passed: massCheck,
        message: massCheck
            ? `Mass ${snapshot.massProperties.mass.toFixed(1)}g within limit ${intent.constraints.maxMassG}g`
            : `Mass ${snapshot.massProperties.mass.toFixed(1)}g exceeds limit ${intent.constraints.maxMassG}g`,
        severity: massCheck ? 'info' : 'error',
        suggestion: massCheck ? undefined : 'Consider reducing wall thickness or adding pockets',
    });

    // Rule 2: Wall thickness check
    const wallCheck = snapshot.parameters.wallThickness >= intent.constraints.minWall;
    results.push({
        ruleId: 'WALL_001',
        ruleName: 'Minimum Wall Thickness',
        category: 'manufacturing',
        passed: wallCheck,
        message: wallCheck
            ? `Wall thickness ${snapshot.parameters.wallThickness}mm meets minimum ${intent.constraints.minWall}mm`
            : `Wall thickness ${snapshot.parameters.wallThickness}mm below minimum ${intent.constraints.minWall}mm`,
        severity: wallCheck ? 'info' : 'error',
        suggestion: wallCheck ? undefined : 'Increase wall thickness to meet manufacturing requirements',
    });

    // Rule 3: Fillet radius vs tool radius (CNC)
    if (intent.constraints.manufacturing === 'CNC_machining' && snapshot.parameters.filletRadius > 0) {
        const cncRules = manufacturingRules.CNC_machining;
        const filletCheck = snapshot.parameters.filletRadius >= cncRules.minFilletRadius;
        results.push({
            ruleId: 'FILLET_001',
            ruleName: 'Fillet Radius Manufacturability',
            category: 'manufacturing',
            passed: filletCheck,
            message: filletCheck
                ? `Fillet radius ${snapshot.parameters.filletRadius}mm compatible with standard tooling`
                : `Fillet radius ${snapshot.parameters.filletRadius}mm requires special tooling`,
            severity: filletCheck ? 'info' : 'warning',
            suggestion: filletCheck ? undefined : 'Consider increasing fillet radius to standard tool sizes',
        });
    }

    // Rule 4: Surface roughness achievability
    if (intent.material.Ra) {
        const raCheck = intent.material.Ra >= 0.8; // Very fine finishes need special processes
        results.push({
            ruleId: 'SURFACE_001',
            ruleName: 'Surface Roughness Achievability',
            category: 'manufacturing',
            passed: raCheck,
            message: raCheck
                ? `Ra ${intent.material.Ra}μm achievable with standard machining`
                : `Ra ${intent.material.Ra}μm requires grinding/polishing operations`,
            severity: raCheck ? 'info' : 'warning',
        });
    }

    // Rule 5: Hole pattern stress concentration
    if (intent.features.mountingHoles && snapshot.featureCount.holes > 0) {
        const holeSpacing = intent.features.mountingHoles.edgeOffset;
        const holeCheck = holeSpacing >= 2 * 3; // 2× hole diameter (assuming M4 = 4mm)
        results.push({
            ruleId: 'HOLE_001',
            ruleName: 'Hole Edge Distance',
            category: 'design_standard',
            passed: holeCheck,
            message: holeCheck
                ? `Hole edge offset ${holeSpacing}mm provides adequate material`
                : `Hole edge offset ${holeSpacing}mm may cause stress concentration`,
            severity: holeCheck ? 'info' : 'warning',
            suggestion: holeCheck ? undefined : 'Increase edge offset to at least 2× hole diameter',
        });
    }

    // Calculate overall score
    const passedCount = results.filter(r => r.passed).length;
    const score = Math.round((passedCount / results.length) * 100);
    const overallPass = results.every(r => r.severity !== 'error' || r.passed);

    return {
        overallPass,
        results,
        score,
    };
}

// Utility: estimate mass from geometry
export function estimateMass(
    intent: DesignIntent,
    wallThickness: number,
    pocketDepth: number
): number {
    const { L, W, H } = intent.envelope;
    const density = materialDensity[intent.material.name] || 0.0027;

    // Simple box with hollow interior
    const outerVolume = L * W * H;
    const innerL = L - 2 * wallThickness;
    const innerW = W - 2 * wallThickness;
    const innerH = H - wallThickness; // open top
    const innerVolume = Math.max(0, innerL * innerW * innerH);

    // Subtract pocket volume if enabled
    let pocketVolume = 0;
    if (intent.features.pockets?.enabled && pocketDepth > 0) {
        pocketVolume = innerL * innerW * pocketDepth * 0.5; // 50% pocket coverage
    }

    const materialVolume = outerVolume - innerVolume - pocketVolume;
    return materialVolume * density;
}

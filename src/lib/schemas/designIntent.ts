// Design Intent Schema - Machine-readable engineering semantics
// This is what AI reasons over, NOT geometry

export interface Envelope {
    L: number;
    W: number;
    H: number;
    units: 'mm' | 'in';
}

export interface Material {
    name: string;
    finish: string;
    Ra?: number; // Surface roughness in μm
}

export interface MountingHole {
    count: number;
    thread: string; // e.g., "M4", "M6", "1/4-20"
    pattern: 'rectangular' | 'circular' | 'linear';
    edgeOffset: number;
}

export interface EdgeStyle {
    type: 'fillet' | 'chamfer' | 'sharp';
    radius?: number | [number, number]; // range for variants
}

export interface Pocket {
    enabled: boolean;
    maxDepth: number;
}

export interface Features {
    mountingHoles?: MountingHole;
    edgeStyle?: EdgeStyle;
    pockets?: Pocket;
}

export interface Constraints {
    minWall: number;
    maxMassG: number;
    manufacturing: 'CNC_machining' | 'additive' | 'sheet_metal' | 'casting';
}

export type VariantType = 'strength' | 'weight' | 'cost';

export interface DesignIntent {
    id: string;
    partType: string;
    envelope: Envelope;
    material: Material;
    features: Features;
    constraints: Constraints;
    variants: VariantType[];

    // Acceptance criteria - what AI validates against
    acceptanceCriteria?: {
        maxStressMPa?: number;
        minSafetyFactor?: number;
        maxDeflectionMm?: number;
    };

    // Metadata
    customParams?: Record<string, { value: string; unit: string }>;
    aiDescription?: string;
}

// Example spec from requirements
export const exampleDesignIntent: DesignIntent = {
    id: 'example-bracket-001',
    partType: 'mounting_bracket',
    envelope: { L: 150, W: 80, H: 20, units: 'mm' },
    material: { name: 'Aluminum 6061-T6', finish: 'anodized matte black', Ra: 1.6 },
    features: {
        mountingHoles: { count: 4, thread: 'M4', pattern: 'rectangular', edgeOffset: 10 },
        edgeStyle: { type: 'fillet', radius: [3, 6] },
        pockets: { enabled: true, maxDepth: 3 },
    },
    constraints: {
        minWall: 2,
        maxMassG: 200,
        manufacturing: 'CNC_machining',
    },
    variants: ['strength', 'weight', 'cost'],
};

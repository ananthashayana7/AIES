// CAD Snapshot Schema - Extracted numerical signals from geometry
// This converts CAD into AI-processable data

export interface MassProperties {
    mass: number; // grams
    volume: number; // mm³
    surfaceArea: number; // mm²
    centerOfMass: { x: number; y: number; z: number };
    momentsOfInertia: { Ixx: number; Iyy: number; Izz: number };
}

export interface FeatureCount {
    holes: number;
    fillets: number;
    chamfers: number;
    pockets: number;
    ribs: number;
}

export interface FEASummary {
    maxVonMisesStress: number; // MPa
    maxDisplacement: number; // mm
    safetyFactor: number;
    criticalLocation?: string;
}

export interface CADSnapshot {
    id: string;
    designIntentId: string;
    variantType: string;

    // Extracted parameters
    parameters: {
        wallThickness: number;
        filletRadius: number;
        pocketDepth: number;
        holeCount: number;
    };

    // Computed properties
    massProperties: MassProperties;
    featureCount: FeatureCount;

    // Optional FEA results
    feaSummary?: FEASummary;

    // Rule engine results
    passFailIndicators: {
        massCheck: boolean;
        wallThicknessCheck: boolean;
        manufacturabilityCheck: boolean;
        toleranceCheck: boolean;
    };
}

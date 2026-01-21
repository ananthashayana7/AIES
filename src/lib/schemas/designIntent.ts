// Design Intent Schema v0.9 (Aligned with SRS 5.1)
// This is the source of truth for AI reasoning and design guidance.

export interface IntentConstraint {
    id: string;
    type: 'bound' | 'tolerance' | 'interface';
    expression: string;
    severity: 'blocker' | 'warn' | 'info';
}

export interface DesignIntent {
    part_id: string;
    revision: string;
    materials: string[];

    // Named global parameters (e.g., "length_mm": 150)
    parameters: Record<string, number | string>;

    // Formal constraints
    constraints: IntentConstraint[];

    // High-level objectives (e.g., "Minimize weight", "Maximize stiffness")
    objectives: string[];

    // Acceptance criteria - what must be met
    acceptance: {
        max_mass_g: number;
        safety_factor_min: number;
        // Allows for additional criteria
        [key: string]: any;
    };

    // Guidance history & progress (F6)
    guidance_steps?: {
        step: number;
        title: string;
        description: string;
        completed: boolean;
        notes?: string;
    }[];
}

// Example bracket instance following v0.9 SRS
export const exampleDesignIntent: DesignIntent = {
    part_id: 'BRKT-001',
    revision: 'A.0',
    materials: ['Aluminum 6061-T6'],
    parameters: {
        "length_mm": 150,
        "width_mm": 80,
        "height_mm": 20,
        "hole_dia_mm": 6.5,
        "material_stock": "20mm Plate"
    },
    constraints: [
        { id: 'c1', type: 'bound', expression: 'thickness_mm >= 3.0', severity: 'blocker' },
        { id: 'c2', type: 'interface', expression: 'mounting_holes align with Rail-99', severity: 'blocker' },
        { id: 'c3', type: 'tolerance', expression: 'hole_positions +/- 0.1mm', severity: 'warn' }
    ],
    objectives: [
        "Minimize total mass",
        "Maintain safety factor > 2.0"
    ],
    acceptance: {
        max_mass_g: 500,
        safety_factor_min: 2.0
    }
};

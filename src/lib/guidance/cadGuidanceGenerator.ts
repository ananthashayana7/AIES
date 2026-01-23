import { DesignIntent } from '../schemas/designIntent';
import { GeneratedVariant } from '../variants/variantGenerator';

export interface CADStep {
    stepNumber: number;
    action: string;
    description: string;
    parameters?: Record<string, string | number>;
    toolIcon?: string;
}

export function generateCADSteps(intent: DesignIntent, variant: GeneratedVariant): CADStep[] {
    const steps: CADStep[] = [];
    let stepCount = 1;

    // Extract dimensions from parameters
    const L = parseFloat(intent.parameters['length_mm']?.toString() || '100');
    const W = parseFloat(intent.parameters['width_mm']?.toString() || '100');
    const H = parseFloat(intent.parameters['height_mm']?.toString() || intent.parameters['thickness_mm']?.toString() || '20');

    // Extract variant parameters with fallbacks
    const wallThickness = parseFloat(variant.parameters['wall_thickness_mm']?.toString() || variant.parameters['thickness_mm']?.toString() || '10');
    const filletRadius = parseFloat(variant.parameters['fillet_radius']?.toString() || '2');
    const pocketDepth = parseFloat(variant.parameters['pocket_depth']?.toString() || '0');
    const holeCount = parseInt(intent.parameters['hole_count']?.toString() || '0');
    const holeThread = intent.parameters['thread']?.toString() || 'M4';

    // 1. Base Setup
    steps.push({
        stepNumber: stepCount++,
        action: 'Select Plane',
        description: 'Select the Top Plane for the base sketch.',
        toolIcon: '📐'
    });

    // 2. Base Extrusion
    steps.push({
        stepNumber: stepCount++,
        action: 'Create Base Sketch',
        description: `Sketch a center rectangle with dimensions ${L}mm x ${W}mm.`,
        parameters: { Length: L, Width: W },
        toolIcon: '✏️'
    });

    steps.push({
        stepNumber: stepCount++,
        action: 'Extrude Base',
        description: `Extrude the sketch to a height of ${H}mm.`,
        parameters: { Height: H },
        toolIcon: '⬆️'
    });

    // 3. Shell / Pocketing (if weight optimized or standard)
    if (pocketDepth > 0) {
        steps.push({
            stepNumber: stepCount++,
            action: 'Create Pocket',
            description: `Select top face. Offset entities inwards by ${wallThickness}mm. Cut-Extrude to depth of ${pocketDepth}mm.`,
            parameters: { 'Wall Thickness': wallThickness, 'Pocket Depth': pocketDepth },
            toolIcon: '🕳️'
        });
    }

    // 4. Mounting Holes
    if (holeCount > 0) {
        const offset = parseFloat(intent.parameters['hole_edge_offset']?.toString() || '10');
        steps.push({
            stepNumber: stepCount++,
            action: 'Hole Wizard',
            description: `Select Top Face. Place ${holeCount} points for ${holeThread} tapped holes. Dimension ${offset}mm from edges.`,
            parameters: { Count: holeCount, Type: holeThread, Offset: offset },
            toolIcon: '🔩'
        });
    }

    // 5. Fillets / Chamfers
    const surfaceFinish = intent.parameters['surface_finish']?.toString() || '';
    const chamferSize = parseFloat(intent.parameters['chamfer_size']?.toString() || '0');

    if (filletRadius > 0 && chamferSize === 0) {
        steps.push({
            stepNumber: stepCount++,
            action: 'Apply Fillets',
            description: `Select vertical edges. Apply fillet radius of ${filletRadius}mm.`,
            parameters: { Radius: filletRadius },
            toolIcon: '╭'
        });
    } else if (chamferSize > 0) {
        steps.push({
            stepNumber: stepCount++,
            action: 'Apply Chamfers',
            description: `Select vertical edges. Apply chamfer of ${chamferSize}mm x 45°.`,
            parameters: { Size: chamferSize },
            toolIcon: '◣'
        });
    }

    // 6. Material Assignment
    const materialName = intent.materials[0] || 'Aluminum 6061-T6';
    steps.push({
        stepNumber: stepCount++,
        action: 'Assign Material',
        description: `Right-click Material in FeatureManager. Select "${materialName}".`,
        parameters: { Material: materialName },
        toolIcon: '🧱'
    });

    // 7. Verification
    steps.push({
        stepNumber: stepCount++,
        action: 'Mass Properties',
        description: `Check Mass Properties. Verify mass is approx ${variant.massG}g.`,
        parameters: { 'Target Mass': `${Math.round(variant.massG)}g` },
        toolIcon: '⚖️'
    });

    return steps;
}

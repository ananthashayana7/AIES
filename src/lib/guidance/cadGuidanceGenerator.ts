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

    const { L, W, H } = intent.envelope;
    const { wallThickness, filletRadius, pocketDepth } = variant;
    const holeCount = intent.features.mountingHoles?.count || 0;
    const holeThread = intent.features.mountingHoles?.thread || 'M4';

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
        const offset = intent.features.mountingHoles?.edgeOffset || 10;
        steps.push({
            stepNumber: stepCount++,
            action: 'Hole Wizard',
            description: `Select Top Face. Place ${holeCount} points for ${holeThread} tapped holes. Dimension ${offset}mm from edges.`,
            parameters: { Count: holeCount, Type: holeThread, Offset: offset },
            toolIcon: '🔩'
        });
    }

    // 5. Fillets / Chamfers
    if (variant.edgeStyle === 'fillet' && filletRadius > 0) {
        steps.push({
            stepNumber: stepCount++,
            action: 'Apply Fillets',
            description: `Select vertical edges. Apply fillet radius of ${filletRadius}mm.`,
            parameters: { Radius: filletRadius },
            toolIcon: '╭'
        });
    } else if (variant.edgeStyle === 'chamfer') {
        steps.push({
            stepNumber: stepCount++,
            action: 'Apply Chamfers',
            description: `Select vertical edges. Apply chamfer of 1mm x 45°.`,
            toolIcon: '◣'
        });
    }

    // 6. Material Assignment
    steps.push({
        stepNumber: stepCount++,
        action: 'Assign Material',
        description: `Right-click Material in FeatureManager. Select "${intent.material.name}".`,
        parameters: { Material: intent.material.name },
        toolIcon: '🧱'
    });

    // 7. Verification
    steps.push({
        stepNumber: stepCount++,
        action: 'Mass Properties',
        description: `Check Mass Properties. Verify mass is approx ${variant.estimatedMass.toFixed(1)}g.`,
        parameters: { 'Target Mass': `${variant.estimatedMass.toFixed(1)}g` },
        toolIcon: '⚖️'
    });

    return steps;
}

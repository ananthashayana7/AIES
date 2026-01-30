
// Layer 6: The Interface (Conversational Agent)
// Translates natural language engineering requests into Design Intent mutations.

import { DesignIntent } from '../schemas/designIntent';
import { parseDesignDescription } from '../nlp/designParser';
import { MATERIAL_LIBRARY } from '../simulation/materialLibrary';
import { CostEngine } from '../simulation/costEngine';

export interface AgentMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export interface AgentResponse {
    text: string;
    intentUpdate?: Partial<DesignIntent>;
    action?: 'trigger_solver' | 'trigger_simulation' | 'show_heatmap' | 'trigger_export' | 'trigger_export_gltf';
}

export class EngineeringAgent {

    static process(input: string, currentIntent: DesignIntent): AgentResponse {
        const lower = input.toLowerCase();

        // 1. Check for Explicit Material Changes
        // "Change to Steel", "Make it Aluminum"
        for (const matKey of Object.keys(MATERIAL_LIBRARY)) {
            const matName = MATERIAL_LIBRARY[matKey].name;
            const simpleName = matName.split(' ')[0].toLowerCase(); // "aluminum", "steel"

            if (lower.includes(`change to ${simpleName}`) || lower.includes(`make it ${simpleName}`) || lower.includes(`use ${simpleName}`)) {
                return {
                    text: `Switching material to ${matName}.`,
                    intentUpdate: {
                        materials: [matName]
                    },
                    action: 'trigger_simulation'
                };
            }
        }

        // 2. Check for Refinement Intents (Optimization)
        if (lower.includes("lighter") || lower.includes("reduce weight")) {
            // Logic: Reduce thickness or switch to lighter material
            const currentThick = parseFloat(currentIntent.parameters.thickness_mm?.toString() || '0');
            if (currentThick > 3) {
                const newThick = currentThick - 1;
                return {
                    text: `I can reduce the weight by thinning the walls. Reducing thickness from ${currentThick}mm to ${newThick}mm.`,
                    intentUpdate: {
                        parameters: {
                            ...currentIntent.parameters,
                            thickness_mm: newThick
                        }
                    },
                    action: 'trigger_simulation'
                };
            } else {
                return {
                    text: "The walls are already quite thin (3mm). I recommend switching to Carbon Fiber or Titanium for better strength-to-weight ratio.",
                };
            }
        }

        if (lower.includes("stronger") || lower.includes("beef up")) {
            const currentThick = parseFloat(currentIntent.parameters.thickness_mm?.toString() || '0');
            const newThick = currentThick + 2;
            return {
                text: `Reinforcing the design. Increasing thickness to ${newThick}mm.`,
                intentUpdate: {
                    parameters: {
                        ...currentIntent.parameters,
                        thickness_mm: newThick
                    }
                },
                action: 'trigger_simulation'
            };
        }

        // 3. Check for Context/Load Updates (Trigger Solver)
        // "Load is 10kN", "Hold 500kg"
        const parsed = parseDesignDescription(input);
        if (parsed.context.load) {
            return {
                text: `Understood. Design must withstand ${parsed.context.load} Newtons. Running engineering solver...`,
                intentUpdate: {
                    parameters: {
                        ...currentIntent.parameters,
                        // Ensure primitive type is set if detected (e.g. "bracket") so solver knows what to solve
                        primitive_type: parsed.primitiveType !== 'box' ? parsed.primitiveType : (currentIntent.parameters.primitive_type || 'plate'),
                        context: {
                            ...(currentIntent.parameters.context || {}),
                            load: parsed.context.load
                        }
                    }
                },
                action: 'trigger_solver'
            };
        }

        // 4. Check for Cost/Price Intents
        if (lower.includes('cost') || lower.includes('price') || lower.includes('how much')) {
            // Rough volume estimation if not available (default box)
            const l = parseFloat(currentIntent.parameters.length_mm?.toString() || '100');
            const w = parseFloat(currentIntent.parameters.width_mm?.toString() || '100');
            const h = parseFloat(currentIntent.parameters.thickness_mm?.toString() || '10');
            const vol = l * w * h;
            const matName = currentIntent.materials[0] || 'Aluminum 6061-T6';

            const costCNC = CostEngine.calculateCost(vol, matName, 'CNC');

            return {
                text: `Estimated Manufacturing Cost (${matName}): $${costCNC.totalCost} (CNC).\nBreakdown: Material $${costCNC.materialCost}, Machining $${costCNC.machiningCost}.`
            };
        }

        // 5. Check for Export Intents
        if (lower.includes('gltf') || lower.includes('glb')) {
            return {
                text: "Exporting GLTF 3D Model...",
                action: 'trigger_export_gltf'
            };
        }

        if (lower.includes('export') || lower.includes('download') || lower.includes('save') || lower.includes('stl')) {
            return {
                text: "Generating STL file for manufacturing...",
                action: 'trigger_export'
            };
        }

        // 6. Check for Visualization Intents
        if (lower.includes('show stress') || lower.includes('show heatmap') || lower.includes('fem')) {
            return {
                text: "Activating real-time stress visualization (FEM). Red areas indicate peak stress.",
                action: 'show_heatmap'
            };
        }

        // 7. Check for New Design (Interrogative Logic)
        if (lower.startsWith("design a") || lower.startsWith("i need a") || lower.startsWith("create a") || lower === "bolt" || lower === "bracket") {

            // Interrogation: Bolt
            if (parsed.primitiveType === 'bolt' && !parsed.standardSpec) {
                // If they didn't specify M-size (e.g. "Design a bolt")
                return {
                    text: "What size bolt do you need? (e.g., M6, M10, M12)"
                };
            }

            // Interrogation: Bracket/Plate Load
            if (['plate', 'bracket', 'mount', 'base', 'box'].includes(parsed.primitiveType) && !parsed.context.load) {
                // Return partial design but ask for load to enable Solver
                const newParams: Record<string, any> = { ...parsed.dimensions, ...parsed.context, primitive_type: parsed.primitiveType };
                return {
                    text: `I've initialized a generic ${parsed.profile}. To engineer the thickness correctly, I need to know the load. How much weight must it hold? (e.g., 5kg, 100N)`,
                    intentUpdate: {
                        part_id: `GEN-${Date.now().toString().slice(-4)}`,
                        materials: [parsed.material],
                        parameters: newParams
                    }
                };
            }

            // Full re-parse (Success)
            const newParams: Record<string, any> = { ...parsed.dimensions, ...parsed.context, primitive_type: parsed.primitiveType };
            if (parsed.standardSpec) newParams['thread'] = parsed.standardSpec;

            return {
                text: `Starting new design: ${parsed.profile}.`,
                intentUpdate: {
                    part_id: `GEN-${Date.now().toString().slice(-4)}`,
                    materials: [parsed.material],
                    parameters: newParams
                },
                action: 'trigger_solver'
            };
        }

        // Default Fallback
        return {
            text: "I didn't quite catch that engineering intent. You can ask me to 'Make it lighter', 'Change to Steel', or 'Design a generic M10 bolt'."
        };
    }
}

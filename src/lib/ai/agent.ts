
// Layer 6: The Interface (Conversational Agent)
// Translates natural language engineering requests into Design Intent mutations.

import { DesignIntent } from '../schemas/designIntent';
import { parseDesignDescription } from '../nlp/designParser';
import { MATERIAL_LIBRARY } from '../simulation/materialLibrary';

export interface AgentMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export interface AgentResponse {
    text: string;
    intentUpdate?: Partial<DesignIntent>;
    action?: 'trigger_solver' | 'trigger_simulation';
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
                        context: {
                            ...(currentIntent.parameters.context || {}),
                            load: parsed.context.load
                        }
                    }
                },
                action: 'trigger_solver'
            };
        }

        // 4. Check for New Design (Reset)
        if (lower.startsWith("design a") || lower.startsWith("i need a") || lower.startsWith("create a")) {
            // Full re-parse
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

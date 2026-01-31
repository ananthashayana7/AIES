
import { EngineeringAgent } from '../lib/ai/agent';
import { EngineeringSolver } from '../lib/ai/solver';
import { generateDesignIntent, parseDesignDescription } from '../lib/nlp/designParser';
import { DesignIntent } from '../lib/schemas/designIntent';

// Mock initial state
let currentIntent: DesignIntent = {
    part_id: 'INIT',
    materials: ['Aluminum 6061-T6'],
    parameters: {},
    constraints: [],
    objectives: [],
    acceptance: {}
};

async function runDemo() {
    console.log("🤖 MEC AGENT DEMONSTRATION 🤖\n");

    // --- TURN 1: Vague Request ---
    console.log("👤 User: 'I need a mount for a NEMA 17 motor.'");

    // 1. NLP Parse
    const parsed1 = parseDesignDescription("I need a mount for a NEMA 17 motor.");
    // 2. Agent Process
    // We mock the agent receiving this. In the real app, the UI passes this.
    // However, the Agent logic usually takes the raw string.

    // For the demo, let's manually construct the state update as the App would
    // But wait, Agent.process takes (input, currentIntent)

    const response1 = EngineeringAgent.process("I need a mount for a NEMA 17 motor.", currentIntent);

    console.log(`🤖 Agent: "${response1.text}"`);

    if (response1.intentUpdate) {
        currentIntent = { ...currentIntent, ...response1.intentUpdate };
    }

    console.log("\n--------------------------------------------------\n");

    // --- TURN 2: User provides Load ---
    console.log("👤 User: 'It needs to hold 5kg.'");

    const response2 = EngineeringAgent.process("It needs to hold 5kg.", currentIntent);

    console.log(`🤖 Agent: "${response2.text}"`);

    if (response2.intentUpdate) {
        // Deep merge parameters for the demo
        currentIntent = {
            ...currentIntent,
            ...response2.intentUpdate,
            parameters: {
                ...currentIntent.parameters,
                ...response2.intentUpdate.parameters,
                context: {
                    ...currentIntent.parameters.context,
                    // @ts-ignore
                    ...response2.intentUpdate.parameters?.context
                }
            }
        };
    }

    // Check if Solver was triggered
    if (response2.action === 'trigger_solver') {
        console.log("⚙️  [System]: Triggering Solver Loop...");

        // Extract load from context
        // @ts-ignore
        const load = currentIntent.parameters.context?.load;
        const type = currentIntent.parameters.primitive_type || 'plate';

        console.log(`   - Solving for: ${type}`);
        console.log(`   - Load: ${load} N`);
        console.log(`   - Material: ${currentIntent.materials[0]}`);

        const solverResult = await EngineeringSolver.solveComponent(
            type,
            load,
            currentIntent.materials[0],
            1.5
        );

        console.log("\n📊 SOLVER LOG:");
        solverResult.log.forEach(l => console.log(`   ${l}`));

        console.log(`\n✅ FINAL RECOMMENDATION: Use ${solverResult.recommendedSpec} (SF: ${solverResult.safetyFactor})`);
    }

    console.log("\n--------------------------------------------------\n");
    console.log("DEMO COMPLETE.");
}

runDemo();

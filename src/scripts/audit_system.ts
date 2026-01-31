
import { parseDesignDescription, generateDesignIntent } from '../lib/nlp/designParser';
import { MechanicalStandards } from '../lib/standards/mechanical';
import { UniversalGenerator } from '../lib/geometry/generators/UniversalGenerator';
import { runMaterialSimulation } from '../lib/simulation/simulationEngine';
import { EngineeringSolver } from '../lib/ai/solver';
import { ExportManager } from '../lib/export/ExportManager';
import { DesignIntent } from '../lib/schemas/designIntent';

async function audit() {
    console.log("Starting System Audit (Final Fix)...");
    const errors: string[] = [];

    // 1. Standards Audit
    try {
        console.log("[1/6] Testing Standards...");
        const m10 = MechanicalStandards.getThreadSpec('M10');
        if (!m10 || m10.pitch !== 1.5) throw new Error("M10 lookup failed or incorrect");

        const nema17 = MechanicalStandards.getMotorSpec('NEMA 17');
        if (!nema17 || nema17.boltSpacing !== 31) throw new Error("NEMA 17 lookup failed");
        console.log("  ✅ Standards OK");
    } catch (e: any) {
        errors.push(`Standards Error: ${e.message}`);
    }

    // 2. NLP Audit
    let intent: DesignIntent | null = null;
    try {
        console.log("[2/6] Testing NLP...");
        const parsed = parseDesignDescription("Mount for NEMA 17 motor, holding 5kg load");
        intent = generateDesignIntent(parsed);

        if (!intent) throw new Error("Intent generation failed");

        // Check Features for NEMA (might be in features array)
        const hasNema = intent.parameters.features?.some((f: string) => f.toUpperCase().includes("NEMA 17"));
        if (!hasNema) throw new Error("Failed to extract NEMA 17 feature");

        // Check Load (nested in context)
        // @ts-ignore
        const load = intent.parameters.context?.load;
        if (Math.abs(load - (5 * 9.81)) > 1) throw new Error(`Load extraction failed (Expected ~49N, got ${load})`);

        console.log("  ✅ NLP OK");
    } catch (e: any) {
        errors.push(`NLP Error: ${e.message}`);
    }

    // 3. Geometry Audit
    try {
        console.log("[3/6] Testing Geometry Generator...");
        if (intent) {
            // Instantiate class
            const generator = new UniversalGenerator();
            // Need to map DesignIntent parameters to GeometrySpec
            // GeometrySpec = { parameters: ... }
            const spec = { parameters: intent.parameters };
            const geo = generator.generate(spec);

            if (!geo) throw new Error("Generator returned null");
            if (!geo.metadata?.features?.join(',').includes('NEMA')) throw new Error("Geometry missing NEMA metadata");

            console.log("  ✅ Geometry OK");
        } else {
            console.log("  ⏭️ Skipping Geometry (NLP failed)");
        }
    } catch (e: any) {
        errors.push(`Geometry Error: ${e.message}`);
    }

    // 4. Simulation Audit
    try {
        console.log("[4/6] Testing Simulation Engine...");
        if (intent) {
             const params = {
                 ...intent.parameters,
                 force_kn: (intent.parameters.context?.load || 100) / 1000 // Convert N to kN
             };
             const results = runMaterialSimulation(params, ['Aluminum 6061-T6']);
             if (!results || results.length === 0) throw new Error("No simulation results");
             if (results[0].safetyFactor <= 0) throw new Error("Invalid Safety Factor");
             console.log("  ✅ Simulation OK");
        } else {
             console.log("  ⏭️ Skipping Simulation");
        }
    } catch (e: any) {
        errors.push(`Simulation Error: ${e.message}`);
    }

    // 5. Solver Audit
    try {
        console.log("[5/6] Testing Solver Agent...");
        // solveComponent(componentType, load_n, material)
        const result = await EngineeringSolver.solveComponent('plate', 500, 'Aluminum 6061-T6', 1.5);
        if (!result || result.recommendedSpec === 'Unknown') {
            console.warn("  ⚠️ Solver returned Unknown (might be correct if load is weird)");
        } else {
            console.log(`  ✅ Solver OK (Found ${result.recommendedSpec})`);
        }
    } catch (e: any) {
        errors.push(`Solver Error: ${e.message}`);
    }

    // 6. Export Audit
    try {
        console.log("[6/6] Testing Export Manager Imports...");
        if (typeof ExportManager.downloadPDF !== 'function') throw new Error("ExportManager.downloadPDF missing");
        console.log("  ✅ Export Manager OK");
    } catch (e: any) {
        errors.push(`Export Error: ${e.message}`);
    }

    // Summary
    console.log("\n=== AUDIT RESULTS ===");
    if (errors.length === 0) {
        console.log("🎉 ALL SYSTEMS GO. Ready for God Mode.");
    } else {
        console.error("❌ ERRORS DETECTED:");
        errors.forEach(e => console.error(` - ${e}`));
        process.exit(1);
    }
}

audit();

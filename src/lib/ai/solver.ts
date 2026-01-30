
// The Solver Agent (Layer 5)
// Orchestrates Design -> Standards -> Simulation loop to solve engineering problems.

import MechanicalStandards from '../standards/mechanical';
import { runMaterialSimulation } from '../simulation/simulationEngine';
import { MATERIAL_LIBRARY } from '../simulation/materialLibrary';

export interface SolverResult {
    recommendedSpec: string; // e.g. "M10"
    safetyFactor: number;
    mass_g: number;
    iterations: number;
    log: string[];
}

export class EngineeringSolver {

    /**
     * Finds the optimal standard component size for a given load.
     * @param componentType 'bolt' | 'bearing'
     * @param load_n Force in Newtons
     * @param material Material Name (default: Steel S235)
     * @param minSafetyFactor Target SF (default: 1.5)
     */
    static solveComponent(
        componentType: string,
        load_n: number,
        material: string = 'Steel S235',
        minSafetyFactor: number = 1.5
    ): SolverResult {
        const log: string[] = [];
        log.push(`Starting Solver: Find ${componentType} for ${load_n}N load (Material: ${material}, Min SF: ${minSafetyFactor})`);

        if (componentType.toLowerCase() === 'bolt') {
            return this.solveBolt(load_n, material, minSafetyFactor, log);
        } else if (['plate', 'bracket', 'mount', 'base', 'box'].includes(componentType.toLowerCase())) {
            return this.solvePlate(load_n, material, minSafetyFactor, log);
        } else if (componentType.toLowerCase() === 'bearing') {
            // Simplified bearing solver logic if needed
            return { recommendedSpec: 'Unknown', safetyFactor: 0, mass_g: 0, iterations: 0, log };
        }

        return { recommendedSpec: 'Unknown', safetyFactor: 0, mass_g: 0, iterations: 0, log };
    }

    private static solvePlate(load_n: number, material: string, targetSF: number, log: string[]): SolverResult {
        // Iterate thickness for a standard bracket (assumed 100mm overhang/length)
        const TEST_LENGTH = 100; // mm
        const TEST_WIDTH = 50;   // mm
        let iterations = 0;

        // Try thickness 1mm to 25mm
        for (let t = 1; t <= 25; t += 1) {
            iterations++;

            // Run Simulation (Generic Beam/Plate)
            const params = {
                primitive_type: 'plate',
                length_mm: TEST_LENGTH,
                width_mm: TEST_WIDTH,
                thickness_mm: t,
                force_kn: load_n / 1000
            };

            const result = runMaterialSimulation(params, [material])[0];

            log.push(`Iteration ${iterations}: Testing ${t}mm -> Stress: ${result.stress_mpa} MPa, SF: ${result.safetyFactor}`);

            if (result.safetyFactor >= targetSF) {
                log.push(`✅ Solution Found: ${t}mm thickness passes with SF ${result.safetyFactor}`);
                return {
                    recommendedSpec: `${t}mm Plate`,
                    safetyFactor: result.safetyFactor,
                    mass_g: result.mass_g,
                    iterations,
                    log
                };
            }
        }

        log.push("❌ Could not solve within thickness limits (25mm). Material too weak?");
        return {
            recommendedSpec: 'None',
            safetyFactor: 0,
            mass_g: 0,
            iterations,
            log
        };
    }

    private static solveBolt(load_n: number, material: string, targetSF: number, log: string[]): SolverResult {
        // Get all metric threads sorted by size
        const sizes = Object.keys(MechanicalStandards.METRIC_THREADS).sort((a, b) => {
            const sizeA = parseFloat(a.replace('M', ''));
            const sizeB = parseFloat(b.replace('M', ''));
            return sizeA - sizeB;
        });

        let iterations = 0;

        for (const size of sizes) {
            iterations++;
            // Run Simulation for this size
            const params = {
                primitive_type: 'bolt',
                thread: size,
                length_mm: 20, // Dummy length for stress calc
                force_kn: load_n / 1000
            };

            const result = runMaterialSimulation(params, [material])[0];

            log.push(`Iteration ${iterations}: Testing ${size} -> Stress: ${result.stress_mpa} MPa, SF: ${result.safetyFactor}`);

            if (result.safetyFactor >= targetSF) {
                log.push(`✅ Solution Found: ${size} passes with SF ${result.safetyFactor}`);
                return {
                    recommendedSpec: size,
                    safetyFactor: result.safetyFactor,
                    mass_g: result.mass_g,
                    iterations,
                    log
                };
            }
        }

        log.push("❌ No standard size found within library limits.");
        return {
            recommendedSpec: 'None',
            safetyFactor: 0,
            mass_g: 0,
            iterations,
            log
        };
    }
}

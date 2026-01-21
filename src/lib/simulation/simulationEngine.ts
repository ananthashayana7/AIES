// Simulation Engine v0.9+
// Conceptual FEA-lite results for material comparison.

import { MaterialProperties, MATERIAL_LIBRARY } from './materialLibrary';

export interface SimulationResult {
    materialName: string;
    mass_g: number;
    safetyFactor: number;
    deflection_mm: number;
    cost_score: number;
    thermal_perf: 'Low' | 'Medium' | 'High';
}

export function runMaterialSimulation(
    params: Record<string, any>,
    selectedMaterials: string[]
): SimulationResult[] {
    const l_m = (parseFloat(params['length_mm']?.toString() || '100')) / 1000;
    const w_m = (parseFloat(params['width_mm']?.toString() || '100')) / 1000;
    const t_m = (parseFloat(params['thickness_mm']?.toString() || '5')) / 1000;
    const force_n = (parseFloat(params['force_kn']?.toString() || '0')) * 1000;

    // Simplistic volume for a plate or bracket
    const volume_m3 = l_m * w_m * t_m;

    return selectedMaterials.map(matName => {
        const mat = MATERIAL_LIBRARY[matName] || MATERIAL_LIBRARY["Aluminum 6061-T6"];

        // Mass calc
        const mass_kg = volume_m3 * mat.density_kg_m3;

        // Safety Factor (Bending stress calc for a cantilever as proxy)
        // Sigma = (M * c) / I  where M = F * L
        const moment = force_n * l_m;
        const c = t_m / 2;
        const inertia = (w_m * Math.pow(t_m, 3)) / 12;
        const stress_pa = (moment * c) / (inertia || 0.000001);
        const stress_mpa = stress_pa / 1000000;

        const sf = mat.yield_strength_mpa / (stress_mpa || 1);

        // Deflection calc: delta = (F * L^3) / (3 * E * I)
        const e_pa = mat.elastic_modulus_gpa * 1000000000;
        const deflection_m = (force_n * Math.pow(l_m, 3)) / (3 * e_pa * inertia || 1);

        return {
            materialName: mat.name,
            mass_g: Math.round(mass_kg * 1000),
            safetyFactor: Number(sf.toFixed(2)),
            deflection_mm: Number((deflection_m * 1000).toFixed(3)),
            cost_score: mat.cost_index,
            thermal_perf: mat.thermal_conductivity_wmk > 100 ? 'High' : (mat.thermal_conductivity_wmk > 40 ? 'Medium' : 'Low')
        };
    });
}

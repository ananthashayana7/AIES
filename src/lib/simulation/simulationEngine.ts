// Simulation Engine v0.9+
// Conceptual FEA-lite results for material comparison.

import { MaterialProperties, MATERIAL_LIBRARY } from './materialLibrary';
import MechanicalStandards from '../standards/mechanical';

export interface SimulationResult {
    materialName: string;
    mass_g: number;
    safetyFactor: number;
    deflection_mm: number;
    cost_score: number;
    thermal_perf: 'Low' | 'Medium' | 'High';
    stress_mpa?: number;
    failure_mode?: string;
    heatmapData?: Float32Array; // Vertex colors [r, g, b, ...]
}

export function runMaterialSimulation(
    params: Record<string, any>,
    selectedMaterials: string[]
): SimulationResult[] {
    const type = params['primitive_type']?.toString().toLowerCase() || 'plate';
    const force_n = (parseFloat(params['force_kn']?.toString() || '0')) * 1000;

    // Dispatch to specific solver
    if (type === 'bolt' || type === 'screw' || params['thread']) {
        return solveBolt(params, selectedMaterials, force_n);
    } else if (type === 'bearing') {
        return solveBearing(params, selectedMaterials, force_n);
    } else {
        return solveGenericBeam(params, selectedMaterials, force_n);
    }
}

function solveBolt(params: Record<string, any>, materials: string[], force_n: number): SimulationResult[] {
    const size = params['thread']?.toString() || params['diameter']?.toString() || 'M6';
    const length_mm = parseFloat(params['length_mm']?.toString() || '20');

    // Get standard specs
    const spec = MechanicalStandards.getThreadSpec(size);
    // Use minor diameter (root) for stress area as worst case
    const dia_mm = spec ? spec.minorDia : (parseFloat(size.replace(/[^0-9.]/g, '')) || 6) * 0.8;

    // Tensile Stress Area (Approx: Pi * (d_minor/2)^2)
    const area_mm2 = Math.PI * Math.pow(dia_mm / 2, 2);
    const stress_mpa = force_n / area_mm2; // N/mm² = MPa

    // Volume (approx shank)
    const vol_mm3 = Math.PI * Math.pow((spec ? spec.majorDia : dia_mm) / 2, 2) * length_mm;

    return materials.map(matName => {
        const mat = MATERIAL_LIBRARY[matName] || MATERIAL_LIBRARY["Steel S235"];
        const yieldStrength = mat.yield_strength_mpa;

        // Safety Factor = Yield / Tensile Stress
        // For bolts, usually use Proof Strength (approx 0.9 * Yield)
        const proofStrength = yieldStrength * 0.9;
        const sf = proofStrength / (stress_mpa || 0.001);

        // Deflection (Elongation): delta = (F * L) / (A * E)
        const e_mpa = mat.elastic_modulus_gpa * 1000;
        const elongation_mm = (force_n * length_mm) / (area_mm2 * e_mpa || 1);

        return {
            materialName: mat.name,
            mass_g: Number((vol_mm3 * mat.density_kg_m3 / 1000000).toFixed(1)),
            safetyFactor: Number(sf.toFixed(2)),
            deflection_mm: Number(elongation_mm.toFixed(4)),
            cost_score: mat.cost_index,
            thermal_perf: 'Medium', // Bolts typically don't care unless high-temp
            stress_mpa: Number(stress_mpa.toFixed(1)),
            failure_mode: 'Tensile Yield'
        };
    });
}

function solveBearing(params: Record<string, any>, materials: string[], force_n: number): SimulationResult[] {
    const od_mm = parseFloat(params['diameter_mm']?.toString() || '22');
    const width_mm = parseFloat(params['height_mm']?.toString() || '7');

    // Basic Static Load Rating (Co) estimation based on size (Very approximate!)
    // Co approx proportional to OD * Width * k
    const k_bearing = 10; // Factor
    const capacity_n = od_mm * width_mm * k_bearing * 10; // e.g. 22*7*10*10 = 15400N (approx 1.5kN) for 608

    return materials.map(matName => {
        // Bearings are almost always Chromium Steel (closest to S235/4140 in our basic lib)
        // If user selects plastic, it's MUCH weaker.
        let materialFactor = 1.0;
        const mat = MATERIAL_LIBRARY[matName];

        if (matName.includes("Plastic") || matName.includes("Nylon")) materialFactor = 0.05;
        if (matName.includes("Aluminum")) materialFactor = 0.3;

        const ratedLoad = capacity_n * materialFactor;
        const sf = ratedLoad / (force_n || 1);

        return {
            materialName: matName,
            mass_g: Number((Math.PI * (od_mm/2)**2 * width_mm * mat.density_kg_m3 / 1000000).toFixed(1)),
            safetyFactor: Number(sf.toFixed(2)),
            deflection_mm: 0, // Bearings are rigid for this level of sim
            cost_score: mat.cost_index,
            thermal_perf: 'Medium',
            stress_mpa: 0,
            failure_mode: 'Static Load Limit'
        };
    });
}

function solveGenericBeam(params: Record<string, any>, materials: string[], force_n: number): SimulationResult[] {
    const l_m = (parseFloat(params['length_mm']?.toString() || '100')) / 1000;
    const w_m = (parseFloat(params['width_mm']?.toString() || '100')) / 1000;
    const t_m = (parseFloat(params['thickness_mm']?.toString() || '5')) / 1000;

    // Simplistic volume for a plate or bracket
    const volume_m3 = l_m * w_m * t_m;

    return materials.map(matName => {
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
            thermal_perf: mat.thermal_conductivity_wmk > 100 ? 'High' : (mat.thermal_conductivity_wmk > 40 ? 'Medium' : 'Low'),
            stress_mpa: Number(stress_mpa.toFixed(1)),
            failure_mode: 'Bending Yield'
        };
    });
}

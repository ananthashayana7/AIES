// Material Library v0.9+
// Technical properties for conceptual simulation and trade-offs.

export interface MaterialProperties {
    name: string;
    density_kg_m3: number;
    yield_strength_mpa: number;
    elastic_modulus_gpa: number;
    thermal_conductivity_wmk: number;
    cost_index: number; // 1-10 (1 = generic steel, 10 = aerospace titanium)
    color: string;
}

export const MATERIAL_LIBRARY: Record<string, MaterialProperties> = {
    "Aluminum 6061-T6": {
        name: "Aluminum 6061-T6",
        density_kg_m3: 2700,
        yield_strength_mpa: 276,
        elastic_modulus_gpa: 68.9,
        thermal_conductivity_wmk: 167,
        cost_index: 2,
        color: "#c0c0c0"
    },
    "Steel S235": {
        name: "Steel S235",
        density_kg_m3: 7850,
        yield_strength_mpa: 235,
        elastic_modulus_gpa: 210,
        thermal_conductivity_wmk: 50,
        cost_index: 1,
        color: "#707070"
    },
    "Titanium Ti-6Al-4V": {
        name: "Titanium Ti-6Al-4V",
        density_kg_m3: 4430,
        yield_strength_mpa: 880,
        elastic_modulus_gpa: 113.8,
        thermal_conductivity_wmk: 6.7,
        cost_index: 8,
        color: "#929292"
    },
    "Carbon Fiber (UD)": {
        name: "Carbon Fiber (UD)",
        density_kg_m3: 1600,
        yield_strength_mpa: 1500, // Longitudinal
        elastic_modulus_gpa: 135,
        thermal_conductivity_wmk: 5,
        cost_index: 10,
        color: "#1a1a1a"
    }
};

export type MaterialId = keyof typeof MATERIAL_LIBRARY;

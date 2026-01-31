// Material Library v1.0 (Professional Grade)
// Technical properties for conceptual simulation and trade-offs.

export interface MaterialProperties {
    name: string;
    density_kg_m3: number;
    yield_strength_mpa: number;
    elastic_modulus_gpa: number;
    thermal_conductivity_wmk: number;
    cost_index: number; // 1-10 (1 = generic steel, 10 = aerospace titanium)
    machinability: number; // 0-100 (100 = easiest/Free Machining Brass)
    color: string;
}

export const MATERIAL_LIBRARY: Record<string, MaterialProperties> = {
    // --- ALUMINUM ALLOYS ---
    "Aluminum 6061-T6": {
        name: "Aluminum 6061-T6",
        density_kg_m3: 2700,
        yield_strength_mpa: 276,
        elastic_modulus_gpa: 68.9,
        thermal_conductivity_wmk: 167,
        cost_index: 2,
        machinability: 80,
        color: "#c0c0c0"
    },
    "Aluminum 7075-T6": {
        name: "Aluminum 7075-T6",
        density_kg_m3: 2810,
        yield_strength_mpa: 503,
        elastic_modulus_gpa: 71.7,
        thermal_conductivity_wmk: 130,
        cost_index: 4,
        machinability: 70,
        color: "#a0a0a0"
    },

    // --- STEEL ALLOYS ---
    "Steel S235": {
        name: "Steel S235",
        density_kg_m3: 7850,
        yield_strength_mpa: 235,
        elastic_modulus_gpa: 210,
        thermal_conductivity_wmk: 50,
        cost_index: 1,
        machinability: 50,
        color: "#707070"
    },
    "Stainless Steel 304": {
        name: "Stainless Steel 304",
        density_kg_m3: 8000,
        yield_strength_mpa: 215,
        elastic_modulus_gpa: 193,
        thermal_conductivity_wmk: 16.2,
        cost_index: 3,
        machinability: 40,
        color: "#e0e0e0"
    },
    "Stainless Steel 316L": {
        name: "Stainless Steel 316L",
        density_kg_m3: 8000,
        yield_strength_mpa: 170,
        elastic_modulus_gpa: 193,
        thermal_conductivity_wmk: 16.3,
        cost_index: 4,
        machinability: 35,
        color: "#d0d0d0"
    },
    "Tool Steel D2": {
        name: "Tool Steel D2",
        density_kg_m3: 7700,
        yield_strength_mpa: 1600, // Hardened
        elastic_modulus_gpa: 210,
        thermal_conductivity_wmk: 20,
        cost_index: 5,
        machinability: 20, // Very hard
        color: "#505050"
    },

    // --- EXOTICS ---
    "Titanium Ti-6Al-4V": {
        name: "Titanium Ti-6Al-4V",
        density_kg_m3: 4430,
        yield_strength_mpa: 880,
        elastic_modulus_gpa: 113.8,
        thermal_conductivity_wmk: 6.7,
        cost_index: 8,
        machinability: 15,
        color: "#929292"
    },
    "Brass C360": {
        name: "Brass C360",
        density_kg_m3: 8500,
        yield_strength_mpa: 310,
        elastic_modulus_gpa: 97,
        thermal_conductivity_wmk: 115,
        cost_index: 5,
        machinability: 100, // The standard for machinability
        color: "#d4af37"
    },

    // --- PLASTICS ---
    "Delrin (Acetal)": {
        name: "Delrin (Acetal)",
        density_kg_m3: 1410,
        yield_strength_mpa: 69,
        elastic_modulus_gpa: 3.1,
        thermal_conductivity_wmk: 0.23,
        cost_index: 2,
        machinability: 90,
        color: "#f5f5f5"
    },
    "Nylon 6/6": {
        name: "Nylon 6/6",
        density_kg_m3: 1150,
        yield_strength_mpa: 82,
        elastic_modulus_gpa: 2.8,
        thermal_conductivity_wmk: 0.25,
        cost_index: 1.5,
        machinability: 85,
        color: "#fffff0"
    },
    "PEEK": {
        name: "PEEK",
        density_kg_m3: 1320,
        yield_strength_mpa: 100,
        elastic_modulus_gpa: 3.6,
        thermal_conductivity_wmk: 0.25,
        cost_index: 10,
        machinability: 80,
        color: "#deb887"
    },

    // --- COMPOSITES ---
    "Carbon Fiber (UD)": {
        name: "Carbon Fiber (UD)",
        density_kg_m3: 1600,
        yield_strength_mpa: 1500, // Longitudinal
        elastic_modulus_gpa: 135,
        thermal_conductivity_wmk: 5,
        cost_index: 10,
        machinability: 10, // Abrasive
        color: "#1a1a1a"
    }
};

export type MaterialId = keyof typeof MATERIAL_LIBRARY;

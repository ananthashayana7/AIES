
import { MATERIAL_LIBRARY } from './materialLibrary';

export interface CostReport {
    materialCost: number;
    machiningCost: number;
    totalCost: number;
    setupTime: number;
    cycleTime: number;
    breakdown: {
        volume_cm3: number;
        material_rate: number;
        machining_rate: number;
    };
}

export class CostEngine {
    // Basic Machining Rates ($/hr)
    static readonly MACHINE_RATES = {
        'CNC_MILL_3AXIS': 60,
        'CNC_LATHE': 50,
        '3D_PRINT_FDM': 5,
        '3D_PRINT_SLA': 10
    };

    static calculateCost(
        volume_mm3: number,
        materialName: string,
        process: 'CNC' | 'Print' = 'CNC',
        complexity: number = 1 // 1 = simple, 5 = complex
    ): CostReport {
        const mat = MATERIAL_LIBRARY[materialName] || MATERIAL_LIBRARY['Aluminum 6061-T6'];

        // 1. Material Cost
        // Density in kg/m3. Volume in mm3.
        // Mass (kg) = (Vol * 1e-9) * Density
        const mass_kg = (volume_mm3 / 1e9) * mat.density_kg_m3;

        // Base material price ($/kg) - Estimations
        let pricePerKg = 1.0; // Steel is very cheap
        if (mat.name.includes('Aluminum')) pricePerKg = 4.0; // Aluminum is pricier
        if (mat.name.includes('Titanium')) pricePerKg = 40.0;
        if (mat.name.includes('Plastic') || mat.name.includes('ABS')) pricePerKg = 20; // Filament is pricey per kg

        const materialCost = mass_kg * pricePerKg * 1.2; // +20% waste

        // 2. Machine Time
        let rate = 0;
        let setupTime = 0; // hours
        let removalRate = 0; // mm3/min (MRR)

        if (process === 'CNC') {
            rate = this.MACHINE_RATES.CNC_MILL_3AXIS;
            setupTime = 0.5; // 30 min setup

            // MRR depends on material hardness
            // Steel S235 yield is 235, but it's harder than Aluminum 6061 (yield 276? No, Alu is softer but yield is comparable. Hardness is what matters).
            // Let's rely on name or explicit hardness if we had it.
            // Simplified: Steel takes longer.
            if (mat.name.includes('Steel') || mat.name.includes('Titanium') || mat.name.includes('Iron')) {
                removalRate = 5000;
            } else {
                removalRate = 20000; // Aluminum, Plastic
            }

        } else {
            rate = this.MACHINE_RATES['3D_PRINT_FDM'];
            setupTime = 0.1; // 6 min prep
            removalRate = 1000; // Slow deposition
        }

        // Cycle Time (hrs) = (Volume / MRR) / 60 + (Complexity Overhead)
        // Complexity adds tool changes or slower paths
        // Ensure removalRate is not zero
        if (removalRate <= 0) removalRate = 1000;

        const machiningTimeHours = (volume_mm3 / removalRate / 60) * complexity;
        const totalTime = setupTime + machiningTimeHours;

        const machiningCost = totalTime * rate;

        return {
            materialCost: parseFloat(materialCost.toFixed(2)),
            machiningCost: parseFloat(machiningCost.toFixed(2)),
            totalCost: parseFloat((materialCost + machiningCost).toFixed(2)),
            setupTime: parseFloat(setupTime.toFixed(2)),
            cycleTime: parseFloat(machiningTimeHours.toFixed(2)),
            breakdown: {
                volume_cm3: parseFloat((volume_mm3 / 1000).toFixed(2)),
                material_rate: pricePerKg,
                machining_rate: rate
            }
        };
    }
}

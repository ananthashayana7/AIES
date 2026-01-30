
import { DesignIntent } from '../schemas/designIntent';
import { MATERIAL_LIBRARY } from './materialLibrary';

export interface OperationStep {
    order: number;
    description: string;
    tool: string;
    process: 'Mill' | 'Lathe' | 'Drill' | 'Print' | 'Setup';
    estTime_min: number;
}

export interface ManufacturingPlan {
    steps: OperationStep[];
    totalTime_min: number;
    estimatedCost: number;
    stockSize: string;
}

export class ManufacturingEngine {

    static generateSOP(intent: DesignIntent): ManufacturingPlan {
        const steps: OperationStep[] = [];
        let order = 10;
        let totalTime = 0;

        const params = intent.parameters;
        const matName = intent.materials[0] || 'Aluminum 6061-T6';
        const mat = MATERIAL_LIBRARY[matName] || MATERIAL_LIBRARY['Aluminum 6061-T6'];

        // 1. Stock Prep
        const l = parseFloat(params.length_mm?.toString() || '100');
        const w = parseFloat(params.width_mm?.toString() || '100');
        const h = parseFloat(params.thickness_mm?.toString() || '10');
        const stockPad = 5; // mm padding
        const stockSize = `${(l+stockPad).toFixed(0)}x${(w+stockPad).toFixed(0)}x${(h+2).toFixed(0)}mm ${matName}`;

        steps.push({
            order: order,
            description: `Saw cut stock to ${stockSize}`,
            tool: 'Band Saw',
            process: 'Setup',
            estTime_min: 5
        });
        order += 10;
        totalTime += 5;

        // 2. Determine Primary Process
        const primitive = params.primitive_type?.toString().toLowerCase();
        const isTurned = ['cylinder', 'bolt', 'shaft', 'bearing'].includes(primitive || '');
        const isMilled = !isTurned;

        // 3. Generate Operations
        if (isTurned) {
            steps.push({
                order: order,
                description: `Turn OD to ⌀${params.diameter_mm || 50}mm`,
                tool: 'CNMG Insert',
                process: 'Lathe',
                estTime_min: 15 / (mat.machinability / 100) // Harder material = slower
            });
            order += 10;
            totalTime += steps[steps.length-1].estTime_min;
        }
        else if (isMilled) {
            steps.push({
                order: order,
                description: `Face top surface to height ${h}mm`,
                tool: '50mm Face Mill',
                process: 'Mill',
                estTime_min: 5
            });
            order += 10;
            totalTime += 5;

            steps.push({
                order: order,
                description: `Profile Contour ${l}x${w}mm`,
                tool: '12mm End Mill',
                process: 'Mill',
                estTime_min: (l*2 + w*2) / 200 * (100 / mat.machinability) // Rough perimeter calc
            });
            order += 10;
            totalTime += steps[steps.length-1].estTime_min;
        }

        // 4. Feature Processing
        // Holes
        if (params.hole_count || params.context?.load) {
            // Assume holes exist if load is high or explicitly asked
            // Or if NEMA feature detected
            const isNema = Object.keys(params).some(k => k.toString().includes('NEMA') || params[k]?.toString().includes('NEMA'));

            if (isNema) {
                steps.push({
                    order: order,
                    description: `Bore Pilot Hole`,
                    tool: 'Boring Head / End Mill',
                    process: 'Mill',
                    estTime_min: 8
                });
                order += 10;
                totalTime += 8;

                steps.push({
                    order: order,
                    description: `Drill 4x Mounting Holes`,
                    tool: 'Drill Bit',
                    process: 'Drill',
                    estTime_min: 4
                });
                order += 10;
                totalTime += 4;
            }
        }

        // 5. Threads
        if (params.thread) {
             steps.push({
                order: order,
                description: `Cut Thread ${params.thread}`,
                tool: 'Threading Tool / Tap',
                process: isTurned ? 'Lathe' : 'Drill',
                estTime_min: 5
            });
            order += 10;
            totalTime += 5;
        }

        // 6. Finishing
        steps.push({
            order: order,
            description: `Deburr and Inspect`,
            tool: 'Hand Tools',
            process: 'Setup',
            estTime_min: 10
        });
        totalTime += 10;

        // Cost Estimation ($60/hr shop rate)
        const shopRate = 60;
        const estimatedCost = (totalTime / 60) * shopRate;

        return {
            steps,
            totalTime_min: parseFloat(totalTime.toFixed(1)),
            estimatedCost: parseFloat(estimatedCost.toFixed(2)),
            stockSize
        };
    }
}

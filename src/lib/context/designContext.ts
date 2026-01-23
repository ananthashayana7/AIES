// src/lib/context/designContext.ts

/**
 * Simple in-memory design context to support iterative design modifications.
 * It stores the previous DesignIntent and provides utilities to merge a new
 * intent with the previous one based on detected changes.
 */

import { DesignIntent } from '@/lib/schemas/designIntent';

let previousIntent: DesignIntent | null = null;

/** Get the previously stored intent, if any. */
export function getPreviousIntent(): DesignIntent | null {
    return previousIntent ? { ...previousIntent } : null;
}

/** Store the latest intent as the new "previous" for the next round. */
export function setCurrentIntent(intent: DesignIntent): void {
    previousIntent = { ...intent };
}

/**
 * Merge a new intent with the previous one.
 * The algorithm is straightforward:
 *   - For each parameter present in the new intent, replace the old value.
 *   - If a parameter is omitted, retain the old value.
 *   - Detect special modifiers like "thicker", "larger", "add holes" etc.
 *   - Return a new merged DesignIntent.
 */
export function mergeIntents(newIntent: DesignIntent): DesignIntent {
    const old = getPreviousIntent();
    if (!old) return newIntent;

    // Merge parameters – new overrides old, missing keep old
    const mergedParameters = { ...old.parameters, ...newIntent.parameters };

    // Merge materials if provided, otherwise keep old
    const mergedMaterials = newIntent.materials && newIntent.materials.length > 0 ? newIntent.materials : old.materials;

    // Simple heuristic for relative sizing adjectives
    const sizeModifiers = ['thin', 'thick', 'large', 'small'];
    for (const key of Object.keys(newIntent.parameters)) {
        const val = newIntent.parameters[key];
        if (typeof val === 'string') {
            const lower = val.toLowerCase();
            if (sizeModifiers.includes(lower)) {
                // Example: "thick" -> increase thickness by 20%
                const numericKey = key.replace(/_mm$/i, '');
                const oldVal = parseFloat(old.parameters[key] as any) || 0;
                const factor = lower === 'thick' || lower === 'large' ? 1.2 : 0.8;
                mergedParameters[key] = (oldVal * factor).toFixed(2);
            }
        }
    }

    const merged: DesignIntent = {
        ...old,
        parameters: mergedParameters,
        materials: mergedMaterials,
        // Preserve other fields (constraints, objectives, acceptance, guidance_steps) from old
    };

    // Store the merged result as the new previous intent for future rounds
    setCurrentIntent(merged);
    return merged;
}

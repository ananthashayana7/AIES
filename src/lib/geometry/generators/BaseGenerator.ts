// Base Geometry Generator Interface
import * as THREE from 'three';

export interface GeometrySpec {
    type?: string;
    parameters: Record<string, any>;
    geometry?: any;
    features?: any;
}

export interface GeneratedGeometry {
    mesh: THREE.BufferGeometry;
    dimensions: {
        length: number;
        width: number;
        height: number;
    };
    metadata?: {
        volume_mm3?: number;
        surfaceArea_mm2?: number;
        features?: string[];
    };
}

export abstract class BaseGenerator {
    abstract generate(spec: GeometrySpec): GeneratedGeometry;

    protected extractUnit(value: any): number {
        if (typeof value === 'number') return value;
        if (value?.value !== undefined) return value.value;
        return parseFloat(value) || 0;
    }
}

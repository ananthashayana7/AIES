// Base Geometry Generator Interface
import * as THREE from 'three';

export interface GeometrySpec {
    type?: string;
    parameters: Record<string, any>;
    geometry?: any;
    features?: any;
}

export interface GeneratedGeometry {
    mesh: THREE.BufferGeometry | THREE.Object3D;
    dimensions: {
        length?: number;
        width?: number;
        height?: number;
        radius?: number;
        diameter?: number;
        outerDiameter?: number;
        pitchDiameter?: number;
        thickness?: number;
        [key: string]: number | undefined;
    };
    metadata?: {
        volume_mm3?: number;
        surfaceArea_mm2?: number;
        mass_g?: number;
        features?: string[];
        [key: string]: any;
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

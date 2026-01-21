// Baseplate Generator (for rectangular parts)
import * as THREE from 'three';
import { BaseGenerator, GeometrySpec, GeneratedGeometry } from './BaseGenerator';

export class BaseplateGenerator extends BaseGenerator {
    generate(spec: GeometrySpec): GeneratedGeometry {
        // Extract dimensions from various possible locations
        const params = spec.parameters || {};
        const geo = spec.geometry || {};

        const length = this.extractUnit(params.length_mm || geo.length || params.dimensions?.length || 100);
        const width = this.extractUnit(params.width_mm || geo.width || params.dimensions?.width || 100);
        const thickness = this.extractUnit(params.thickness_mm || geo.thickness || params.dimensions?.thickness || 10);

        // Convert mm to meters for Three.js
        const l = length * 0.01;
        const w = width * 0.01;
        const t = thickness * 0.01;

        // Create box geometry
        const geometry = new THREE.BoxGeometry(l, t, w);

        // Add holes if specified
        const holeDia = this.extractUnit(params.hole_dia_mm) * 0.01;
        const holeCount = parseInt(params.hole_count || '0');

        // TODO: Add actual holes using CSG operations
        // For now, return simple box

        return {
            mesh: geometry,
            dimensions: {
                length: length / 100,
                width: width / 100,
                height: thickness / 100
            },
            metadata: {
                volume_mm3: length * width * thickness,
                features: holeCount > 0 ? [`${holeCount} holes`] : []
            }
        };
    }
}

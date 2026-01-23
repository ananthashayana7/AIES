
import * as THREE from 'three';
import { BaseGenerator, GeometrySpec, GeneratedGeometry } from './BaseGenerator';

export class CylinderGenerator extends BaseGenerator {
    generate(spec: GeometrySpec): GeneratedGeometry {
        const geo = spec.geometry || {};
        const params = spec.parameters || {};

        // Extract dimensions
        // Accessors: try explicit params first, then normalized geometry
        const height = this.extractUnit(params.height_mm || geo.height || params.length_mm || 100);

        let radius = this.extractUnit(params.radius_mm || geo.radius);
        if (!radius) {
            const diameter = this.extractUnit(params.diameter_mm || geo.diameter || 50);
            radius = diameter / 2;
        }

        const wallThickness = this.extractUnit(params.thickness_mm || geo.thickness || 0); // 0 = solid

        // THREE.js Cylinder: radiusTop, radiusBottom, height, radialSegments
        // Convert mm to meters
        const r = radius * 0.01;
        const h = height * 0.01;
        const t = wallThickness * 0.01;

        let mesh: THREE.BufferGeometry;

        if (wallThickness > 0 && wallThickness < radius) {
            // Hollow Cylinder (Pipe/Bottle)
            // Create shape with hole - use SCALED values (meters)
            const shape = new THREE.Shape();
            shape.absarc(0, 0, r, 0, Math.PI * 2, false);

            const hole = new THREE.Path();
            hole.absarc(0, 0, r - t, 0, Math.PI * 2, true);
            shape.holes.push(hole);

            const extrudeSettings = {
                depth: h,
                bevelEnabled: false,
                curveSegments: 32
            };

            const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            // Re-orient to stand upright (Extrude goes along Z by default)
            geometry.rotateX(-Math.PI / 2);
            geometry.center();
            mesh = geometry;
        } else {
            // Solid Cylinder
            mesh = new THREE.CylinderGeometry(r, r, h, 32);
        }

        return {
            mesh: mesh,
            dimensions: {
                radius: radius / 100, // normalized for view logic usually expecting m
                height: height / 100,
                length: (radius * 2) / 100, // Approximate bounding box
                width: (radius * 2) / 100
            },
            metadata: {
                volume_mm3: Math.PI * radius * radius * height,
                features: [wallThickness > 0 ? 'Hollow Cylinder' : 'Solid Cylinder']
            }
        };
    }
}

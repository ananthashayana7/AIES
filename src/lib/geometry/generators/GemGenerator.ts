
import * as THREE from 'three';
import { BaseGenerator, GeometrySpec, GeneratedGeometry } from './BaseGenerator';

export class GemGenerator extends BaseGenerator {
    generate(spec: GeometrySpec): GeneratedGeometry {
        const geo = spec.geometry || {};
        const params = spec.parameters || {};

        const size = this.extractUnit(params.diameter_mm || params.width_mm || 5); // Default 5mm gem
        const radius = size / 2;
        const cut = (params.cut || 'diamond').toLowerCase();

        console.log(`[GemGenerator] Generating ${cut} of size ${size}mm`);

        let geometry: THREE.BufferGeometry;

        if (cut.includes('round') || cut.includes('brilliant') || cut.includes('diamond')) {
            // Approximation of a brilliant cut using a Cylinder with 8 segments (low poly aesthetic)
            // Top (Crown)
            const crownHeight = radius * 0.4;
            const crown = new THREE.ConeGeometry(radius, crownHeight, 8);
            crown.translate(0, crownHeight / 2, 0);

            // Bottom (Pavilion)
            const pavilionHeight = radius * 0.6;
            const pavilion = new THREE.ConeGeometry(radius, pavilionHeight, 8, 1, false, 0, Math.PI * 2);
            pavilion.rotateX(Math.PI); // Flip
            pavilion.translate(0, -pavilionHeight / 2, 0);

            // Girdle (Middle) - merged via array if needed, but for now simple Octahedron is better
            geometry = new THREE.OctahedronGeometry(radius * 0.01, 0); // High poly? No, faceted.

            // Let's use custom points for a "Diamond" profile if Octahedron is too simple
            // Actually Octahedron is a decent starting point for "Diamond" icon
            geometry = new THREE.OctahedronGeometry(radius * 0.01, 0);
            // Scale Y to look more like a gem
            geometry.scale(1, 1.4, 1);
        } else {
            // Generic Gem
            geometry = new THREE.IcosahedronGeometry(radius * 0.01, 0);
        }

        // Ensure flat shading for faceted look
        geometry.computeVertexNormals();

        return {
            mesh: geometry,
            dimensions: {
                length: size / 1000,
                width: size / 1000,
                height: size / 1000
            },
            metadata: {
                features: ['Faceted', cut.toUpperCase()]
            }
        };
    }
}

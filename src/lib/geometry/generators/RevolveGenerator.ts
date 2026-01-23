
import * as THREE from 'three';
import { BaseGenerator, GeometrySpec, GeneratedGeometry } from './BaseGenerator';

export class RevolveGenerator extends BaseGenerator {
    generate(spec: GeometrySpec): GeneratedGeometry {
        const geo = spec.geometry || {};
        const params = spec.parameters || {};
        const profileType = (spec.type || params.profile || 'vase').toLowerCase();

        // Dimensions
        const height = this.extractUnit(params.height_mm || geo.height || 200);
        const diameter = this.extractUnit(params.diameter_mm || params.width_mm || 100);
        const radius = diameter / 2;

        // Create Points for Lathe
        let points: THREE.Vector2[] = [];

        if (profileType.includes('bowl')) {
            // Simple Bowl Curve
            for (let i = 0; i <= 10; i++) {
                const x = (i / 10) * radius;
                const y = Math.pow(i / 10, 2) * height; // Parabolic
                points.push(new THREE.Vector2(x * 0.01, y * 0.01)); // Scale to meters
            }
        } else if (profileType.includes('vase')) {
            // Classic Vase S-Curve
            // Base
            points.push(new THREE.Vector2(0, 0));
            points.push(new THREE.Vector2(radius * 0.6 * 0.01, 0));

            // Curve
            const steps = 20;
            for (let i = 0; i <= steps; i++) {
                const t = i / steps; // 0 to 1
                // S-Curve modulation of radius
                const rMod = 0.6 + 0.4 * Math.sin(t * Math.PI * 2 - Math.PI / 2);
                const x = radius * rMod * 0.01;
                const y = t * height * 0.01;
                points.push(new THREE.Vector2(x, y));
            }
        } else {
            // Generic Cylinder/Cone fallback via Revolve (Straight line)
            points.push(new THREE.Vector2(0, 0));
            points.push(new THREE.Vector2(radius * 0.01, 0));
            points.push(new THREE.Vector2(radius * 0.01, height * 0.01));
            points.push(new THREE.Vector2(0, height * 0.01));
        }

        // Generate Lathe Geometry
        const segments = 32;
        const geometry = new THREE.LatheGeometry(points, segments);

        // Orient upright
        geometry.rotateX(-Math.PI / 2); // Unneeded? Lathe revolves around Y. Re-check orientation in view.
        // Usually Lathe revolves around Y. If View is Y-up, it stands up.
        // ParametricMesh rotates entire group by -90 X, effectively Z-up.
        // So Lathe (Y-up) becomes Z-up (laying down?).
        // Let's verify orientation in Mesh. For now, center it.
        geometry.center();

        return {
            mesh: geometry,
            dimensions: {
                length: diameter / 100, // m
                width: diameter / 100, // m
                height: height / 100 // m
            },
            metadata: {
                volume_mm3: Math.PI * radius * radius * height * 0.7, // Approx
                features: ['Radially Symmetric', profileType.toUpperCase()]
            }
        };
    }
}

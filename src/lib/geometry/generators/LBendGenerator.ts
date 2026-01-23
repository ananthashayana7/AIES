// L-Bend Sheet Metal Geometry Generator
import * as THREE from 'three';
import { BaseGenerator, GeometrySpec, GeneratedGeometry } from './BaseGenerator';

export class LBendGenerator extends BaseGenerator {
    generate(spec: GeometrySpec): GeneratedGeometry {
        const geo = spec.geometry || {};

        // Extract parameters from spec
        const thickness = this.extractUnit(geo.thickness) || 2;
        const legA = this.extractUnit(geo.legA) || 50;
        const legB = this.extractUnit(geo.legB) || 50;
        const bendAngleDeg = this.extractUnit(geo.bendAngle) || this.extractUnit(geo.angle) || 90;
        const innerRadius = this.extractUnit(geo.innerBendRadius) || this.extractUnit(geo.bend_radius) || thickness;

        // Convert to meters for Three.js (mm → m * 0.01)
        const t = thickness * 0.001;
        const lA = legA * 0.001;
        const lB = legB * 0.001;
        const r = innerRadius * 0.001;
        const angle = (bendAngleDeg * Math.PI) / 180;

        // Create combined geometry
        const geometry = this.createLBendMesh(lA, lB, t, r, angle);

        // Calculate dimensions for simulation
        const maxLength = Math.max(lA, lB * Math.cos(angle));
        const maxWidth = t;
        const maxHeight = Math.max(lB * Math.sin(angle), t);

        return {
            mesh: geometry,
            dimensions: {
                length: legA / 1000,
                width: thickness / 1000,
                height: legB / 1000
            },
            metadata: {
                features: ['l-bend', `angle:${bendAngleDeg}deg`]
            }
        };
    }

    private createLBendMesh(
        legA: number,
        legB: number,
        thickness: number,
        bendRadius: number,
        bendAngle: number
    ): THREE.BufferGeometry {
        // Since we can't easily rely on BufferGeometryUtils in this environment, 
        // we will manually create and merge the geometries by transforming them 
        // and merging attributes.

        // 1. LEG A (Flat Horizontal)
        const legAGeom = new THREE.BoxGeometry(legA, thickness, thickness);
        legAGeom.translate(legA / 2, 0, 0); // Origin at start

        // 2. LEG B (Vertical/Angled)
        const legBGeom = new THREE.BoxGeometry(legB, thickness, thickness);

        // Position Leg B relative to end of bend
        // Bend arc length = radius * angle
        // But for visual simplicity, we position it at the end of the idealized bend

        // Effective bend offset
        const bendOffsetX = (bendRadius + thickness) * Math.sin(bendAngle);
        const bendOffsetY = (bendRadius + thickness) * (1 - Math.cos(bendAngle));

        legBGeom.rotateZ(bendAngle);
        legBGeom.translate(
            legA + bendOffsetX + (legB / 2) * Math.cos(bendAngle),
            bendOffsetY + (legB / 2) * Math.sin(bendAngle),
            0
        );

        // 3. MERGE (Simple concatenation of attributes)
        // Note: Real merging usually requires re-indexing, but for visual mesh 
        // non-indexed merging is safer if we don't use BufferGeometryUtils

        const mergedGeometry = new THREE.BufferGeometry();

        // Helper to get non-indexed attributes
        const toNonIndexed = (geo: THREE.BufferGeometry) => {
            return geo.index ? geo.toNonIndexed() : geo;
        };

        const g1 = toNonIndexed(legAGeom);
        const g2 = toNonIndexed(legBGeom);

        const pos1 = g1.getAttribute('position').array;
        const pos2 = g2.getAttribute('position').array;

        const combinedPos = new Float32Array(pos1.length + pos2.length);
        combinedPos.set(pos1);
        combinedPos.set(pos2, pos1.length);

        const norm1 = g1.getAttribute('normal').array;
        const norm2 = g2.getAttribute('normal').array;

        const combinedNorm = new Float32Array(norm1.length + norm2.length);
        combinedNorm.set(norm1);
        combinedNorm.set(norm2, norm1.length);

        const uv1 = g1.getAttribute('uv').array;
        const uv2 = g2.getAttribute('uv').array;

        const combinedUV = new Float32Array(uv1.length + uv2.length);
        combinedUV.set(uv1);
        combinedUV.set(uv2, uv1.length);

        mergedGeometry.setAttribute('position', new THREE.BufferAttribute(combinedPos, 3));
        mergedGeometry.setAttribute('normal', new THREE.BufferAttribute(combinedNorm, 3));
        mergedGeometry.setAttribute('uv', new THREE.BufferAttribute(combinedUV, 2));

        // Center entire geometry
        mergedGeometry.computeBoundingBox();
        mergedGeometry.center();

        return mergedGeometry;
    }

    // Helper for units
    protected extractUnit(val: any): number {
        if (typeof val === 'number') return val;
        if (typeof val === 'object' && val.value) return val.value;
        return 0;
    }
}

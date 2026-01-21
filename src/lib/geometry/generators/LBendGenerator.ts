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
        const bendAngle = this.extractUnit(geo.bendAngle) || 90;
        const innerRadius = this.extractUnit(geo.innerBendRadius) || thickness * 1.5;

        // Convert to meters for Three.js (mm → m * 0.01)
        const t = thickness * 0.01;
        const lA = legA * 0.01;
        const lB = legB * 0.01;
        const r = innerRadius * 0.01;
        const angle = (bendAngle * Math.PI) / 180;

        // Create combined geometry
        const geometry = this.createLBendMesh(lA, lB, t, r, angle);

        // Calculate dimensions for simulation
        const maxLength = Math.max(lA, lB * Math.cos(angle));
        const maxWidth = t;
        const maxHeight = Math.max(lB * Math.sin(angle), t);

        return {
            mesh: geometry,
            dimensions: {
                length: legA / 100, // Convert back to meters for simulation
                width: thickness / 100,
                height: legB / 100
            },
            metadata: {
                features: ['l-bend', `angle:${bendAngle}deg`]
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
        const shapes: THREE.Vector3[] = [];
        const segments = 16; // Smoothness of bend

        // LEG A - Flat horizontal section
        // Bottom face vertices
        shapes.push(new THREE.Vector3(0, 0, 0));
        shapes.push(new THREE.Vector3(legA, 0, 0));
        shapes.push(new THREE.Vector3(legA, 0, thickness));
        shapes.push(new THREE.Vector3(0, 0, thickness));

        // Create extruded box for Leg A
        const legAGeom = new THREE.BoxGeometry(legA, thickness, thickness);
        legAGeom.translate(legA / 2, 0, thickness / 2);

        // BEND REGION - Curved transition
        const bendGeom = this.createBendSection(bendRadius, thickness, bendAngle, segments);
        bendGeom.translate(legA, 0, 0);

        // LEG B - Vertical section (rotated)
        const legBGeom = new THREE.BoxGeometry(legB, thickness, thickness);
        legBGeom.rotateZ(bendAngle);

        // Position leg B at end of bend
        const bendEndX = legA + bendRadius * Math.sin(bendAngle);
        const bendEndY = bendRadius * (1 - Math.cos(bendAngle));
        legBGeom.translate(
            bendEndX + (legB / 2) * Math.cos(bendAngle),
            bendEndY + (legB / 2) * Math.sin(bendAngle),
            thickness / 2
        );

        // Merge all geometries
        const mergedGeometry = new THREE.BufferGeometry();
        mergedGeometry.setAttribute('position', legAGeom.getAttribute('position'));
        mergedGeometry.setIndex(legAGeom.getIndex());

        // For now, return leg A geometry (bend merging requires BufferGeometryUtils)
        // TODO: Properly merge bend and leg B
        return legAGeom;
    }

    private createBendSection(
        radius: number,
        thickness: number,
        angle: number,
        segments: number
    ): THREE.BufferGeometry {
        // Create curved tube for bend
        const curve = new THREE.EllipseCurve(
            0, 0,
            radius, radius,
            0, angle,
            false,
            0
        );

        const points = curve.getPoints(segments);
        const path = new THREE.CatmullRomCurve3(
            points.map(p => new THREE.Vector3(p.x, p.y, 0))
        );

        const shape = new THREE.Shape();
        shape.moveTo(-thickness / 2, -thickness / 2);
        shape.lineTo(thickness / 2, -thickness / 2);
        shape.lineTo(thickness / 2, thickness / 2);
        shape.lineTo(-thickness / 2, thickness / 2);
        shape.closePath();

        const extrudeSettings = {
            steps: segments,
            bevelEnabled: false,
            extrudePath: path
        };

        return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }
}

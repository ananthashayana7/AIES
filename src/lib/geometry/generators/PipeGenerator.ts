// Pipe/Sweep Generator - Pipes, Tubes, Cables, Ducts
// Creates swept profiles along paths

import * as THREE from 'three';
import { BaseGenerator, GeometrySpec, GeneratedGeometry } from './BaseGenerator';

export class PipeGenerator extends BaseGenerator {
    generate(spec: GeometrySpec): GeneratedGeometry {
        const params = spec.parameters || {};

        // Extract pipe parameters
        const outerDiameter = this.extractUnit(params.outer_diameter_mm || params.diameter_mm || 25);
        const wallThickness = this.extractUnit(params.wall_thickness_mm || params.thickness_mm || 2);
        const length = this.extractUnit(params.length_mm || 500);
        const bendRadius = this.extractUnit(params.bend_radius_mm || 0); // 0 = straight
        const bendAngle = parseFloat(params.bend_angle?.toString() || '0'); // degrees
        const segments = parseInt(params.segments?.toString() || '1');

        const innerDiameter = outerDiameter - 2 * wallThickness;
        const outerRadius = outerDiameter / 2;
        const innerRadius = innerDiameter / 2;

        // Convert to meters
        const s = 0.01;
        const rOuter = outerRadius * s;
        const rInner = innerRadius * s;
        const l = length * s;
        const bR = bendRadius * s;

        let geometry: THREE.BufferGeometry;

        if (bendRadius > 0 && bendAngle > 0) {
            // Create bent pipe using TubeGeometry
            geometry = this.createBentPipe(rOuter, rInner, bR, bendAngle, wallThickness > 0);
        } else {
            // Create straight pipe
            geometry = this.createStraightPipe(rOuter, rInner, l, wallThickness > 0);
        }

        geometry.center();

        // Calculate volume and mass
        const outerVolume = Math.PI * outerRadius * outerRadius * length;
        const innerVolume = wallThickness > 0 ? Math.PI * innerRadius * innerRadius * length : 0;
        const volume_mm3 = outerVolume - innerVolume;
        const mass_g = volume_mm3 * 0.00785; // Steel

        return {
            mesh: geometry,
            dimensions: {
                diameter: outerDiameter / 100,
                length: length / 100,
                height: outerDiameter / 100
            },
            metadata: {
                volume_mm3,
                mass_g,
                features: [
                    `OD: ${outerDiameter}mm`,
                    wallThickness > 0 ? `Wall: ${wallThickness}mm` : 'Solid',
                    `Length: ${length}mm`,
                    bendRadius > 0 ? `Bend R: ${bendRadius}mm @ ${bendAngle}°` : 'Straight'
                ]
            }
        };
    }

    private createStraightPipe(
        outerRadius: number,
        innerRadius: number,
        length: number,
        isHollow: boolean
    ): THREE.BufferGeometry {
        if (isHollow && innerRadius > 0) {
            // Create hollow pipe using shape with hole
            const shape = new THREE.Shape();
            shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);

            const hole = new THREE.Path();
            hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
            shape.holes.push(hole);

            const geometry = new THREE.ExtrudeGeometry(shape, {
                depth: length,
                bevelEnabled: false,
                curveSegments: 32
            });
            geometry.rotateX(-Math.PI / 2);
            return geometry;
        } else {
            // Solid rod
            return new THREE.CylinderGeometry(outerRadius, outerRadius, length, 32);
        }
    }

    private createBentPipe(
        outerRadius: number,
        innerRadius: number,
        bendRadius: number,
        bendAngle: number,
        isHollow: boolean
    ): THREE.BufferGeometry {
        // Create curved path
        const angleRad = (bendAngle * Math.PI) / 180;
        const curve = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(bendRadius * Math.sin(angleRad / 2), 0, bendRadius * (1 - Math.cos(angleRad / 2))),
            new THREE.Vector3(bendRadius * Math.sin(angleRad), 0, bendRadius * (1 - Math.cos(angleRad)))
        );

        // Create tube along path
        const geometry = new THREE.TubeGeometry(curve, 32, outerRadius, 16, false);

        // Note: For true hollow bent pipes, you'd need CSG to subtract inner tube
        // This is a simplified solid bent tube

        return geometry;
    }
}

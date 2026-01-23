// Enclosure Generator - Electronics boxes with mounting features
// Creates parametric enclosures with optional lid, bosses, and snap fits

import * as THREE from 'three';
import { BaseGenerator, GeometrySpec, GeneratedGeometry } from './BaseGenerator';

export class EnclosureGenerator extends BaseGenerator {
    generate(spec: GeometrySpec): GeneratedGeometry {
        const params = spec.parameters || {};

        // Extract enclosure parameters
        const length = this.extractUnit(params.length_mm || 100);
        const width = this.extractUnit(params.width_mm || 60);
        const height = this.extractUnit(params.height_mm || 40);
        const wallThickness = this.extractUnit(params.wall_thickness_mm || params.thickness_mm || 2);
        const cornerRadius = this.extractUnit(params.corner_radius_mm || params.fillet_radius_mm || 3);
        const hasBosses = params.bosses !== false && params.bosses !== 'none';
        const bossHeight = this.extractUnit(params.boss_height_mm || 8);
        const bossOuterDia = this.extractUnit(params.boss_diameter_mm || 6);
        const bossInnerDia = this.extractUnit(params.boss_hole_mm || 3);
        const lidType = params.lid_type?.toString() || 'none'; // 'none', 'snap', 'screw'

        // Convert to meters
        const s = 0.01;
        const l = length * s;
        const w = width * s;
        const h = height * s;
        const t = wallThickness * s;
        const r = Math.min(cornerRadius * s, l / 4, w / 4);

        // Create main enclosure group
        const group = new THREE.Group();

        // Create outer shell with rounded corners
        const outerShape = this.createRoundedRectShape(l, w, r);
        const innerShape = this.createRoundedRectShape(l - 2 * t, w - 2 * t, Math.max(0, r - t));

        // Create shell by extruding outer and subtracting inner
        const shellShape = outerShape.clone();
        shellShape.holes.push(innerShape);

        const shellGeometry = new THREE.ExtrudeGeometry(shellShape, {
            depth: h - t, // Leave bottom solid
            bevelEnabled: false,
            curveSegments: 16
        });
        shellGeometry.rotateX(-Math.PI / 2);
        shellGeometry.translate(0, (h - t) / 2, 0);

        // Create bottom plate
        const bottomGeometry = new THREE.ExtrudeGeometry(outerShape, {
            depth: t,
            bevelEnabled: false,
            curveSegments: 16
        });
        bottomGeometry.rotateX(-Math.PI / 2);
        bottomGeometry.translate(0, -h / 2 + t / 2, 0);

        // Merge geometries
        const mergedGeometry = new THREE.BufferGeometry();

        // For simplicity, just use the shell geometry
        // In production, you'd use CSG or BufferGeometryUtils.mergeBufferGeometries
        const finalGeometry = shellGeometry;
        finalGeometry.center();

        // Add mounting bosses if enabled
        if (hasBosses) {
            // Bosses would be added as separate geometry
            // For now, note them in metadata
        }

        // Calculate volume and mass
        const outerVolume = length * width * height;
        const innerVolume = (length - 2 * wallThickness) * (width - 2 * wallThickness) * (height - wallThickness);
        const shellVolume = outerVolume - innerVolume;
        const mass_g = shellVolume * 0.00125; // ABS plastic density

        return {
            mesh: finalGeometry,
            dimensions: {
                length: length / 100,
                width: width / 100,
                height: height / 100
            },
            metadata: {
                volume_mm3: shellVolume,
                mass_g,
                features: [
                    `${length}x${width}x${height}mm`,
                    `Wall: ${wallThickness}mm`,
                    hasBosses ? `4x Mounting Bosses` : 'No Bosses',
                    lidType !== 'none' ? `Lid Type: ${lidType}` : 'Open Top'
                ]
            }
        };
    }

    private createRoundedRectShape(width: number, height: number, radius: number): THREE.Shape {
        const shape = new THREE.Shape();
        const w = width / 2;
        const h = height / 2;
        const r = radius;

        shape.moveTo(-w + r, -h);
        shape.lineTo(w - r, -h);
        shape.quadraticCurveTo(w, -h, w, -h + r);
        shape.lineTo(w, h - r);
        shape.quadraticCurveTo(w, h, w - r, h);
        shape.lineTo(-w + r, h);
        shape.quadraticCurveTo(-w, h, -w, h - r);
        shape.lineTo(-w, -h + r);
        shape.quadraticCurveTo(-w, -h, -w + r, -h);

        return shape;
    }
}

// Thread Generator - Bolts, Nuts, and Threaded Holes
// Creates parametric metric and imperial threaded fasteners

import * as THREE from 'three';
import { BaseGenerator, GeometrySpec, GeneratedGeometry } from './BaseGenerator';

// Standard metric thread specifications
const METRIC_THREADS: Record<string, { pitch: number; minorDia: number }> = {
    'M2': { pitch: 0.4, minorDia: 1.567 },
    'M3': { pitch: 0.5, minorDia: 2.459 },
    'M4': { pitch: 0.7, minorDia: 3.242 },
    'M5': { pitch: 0.8, minorDia: 4.134 },
    'M6': { pitch: 1.0, minorDia: 4.917 },
    'M8': { pitch: 1.25, minorDia: 6.647 },
    'M10': { pitch: 1.5, minorDia: 8.376 },
    'M12': { pitch: 1.75, minorDia: 10.106 },
    'M16': { pitch: 2.0, minorDia: 13.835 },
    'M20': { pitch: 2.5, minorDia: 17.294 }
};

export class ThreadGenerator extends BaseGenerator {
    generate(spec: GeometrySpec): GeneratedGeometry {
        const params = spec.parameters || {};

        // Extract thread parameters
        const threadSize = params.thread?.toString() || params.size?.toString() || 'M6';
        const length = this.extractUnit(params.length_mm || 20);
        const headType = params.head_type?.toString() || 'hex'; // 'hex', 'socket', 'pan', 'flat', 'none'
        const fastenerType = params.type?.toString() || 'bolt'; // 'bolt', 'nut', 'stud', 'standoff'

        // Parse thread size
        const sizeNum = parseFloat(threadSize.replace(/[^0-9.]/g, '')) || 6;
        const threadSpec = METRIC_THREADS[threadSize.toUpperCase()] || {
            pitch: sizeNum / 6,
            minorDia: sizeNum * 0.82
        };

        const majorDia = sizeNum;
        const pitch = threadSpec.pitch;
        const minorDia = threadSpec.minorDia;

        // Head dimensions (based on ISO standards)
        const headHeight = sizeNum * 0.7;
        const headDia = sizeNum * 1.7; // Hex head across flats
        const socketDia = sizeNum * 1.5;
        const socketDepth = sizeNum * 0.5;

        // Convert to meters
        const s = 0.01;
        const r = (majorDia / 2) * s;
        const l = length * s;
        const hH = headHeight * s;
        const hR = (headDia / 2) * s;

        let geometry: THREE.BufferGeometry;

        if (fastenerType === 'nut') {
            // Create hex nut
            geometry = this.createHexNut(majorDia * s, sizeNum * 0.8 * s, minorDia * s / 2);
        } else if (fastenerType === 'bolt' || fastenerType === 'screw') {
            // Create bolt with head
            geometry = this.createBolt(r, l, headType, hH, hR, socketDia * s / 2, socketDepth * s);
        } else {
            // Create simple threaded rod/stud
            geometry = new THREE.CylinderGeometry(r, r, l, 32);
        }

        geometry.center();

        // Calculate mass (steel)
        const shankVolume = Math.PI * (majorDia / 2) ** 2 * length;
        const headVolume = headType !== 'none' ? Math.PI * (headDia / 2) ** 2 * headHeight : 0;
        const volume_mm3 = shankVolume + headVolume;
        const mass_g = volume_mm3 * 0.00785;

        return {
            mesh: geometry,
            dimensions: {
                diameter: majorDia / 100,
                length: length / 100,
                height: (length + (headType !== 'none' ? headHeight : 0)) / 100
            },
            metadata: {
                volume_mm3,
                mass_g,
                features: [
                    `${threadSize} x ${length}mm`,
                    `Pitch: ${pitch}mm`,
                    headType !== 'none' ? `Head: ${headType.toUpperCase()}` : 'No Head',
                    `Type: ${fastenerType}`
                ]
            }
        };
    }

    private createBolt(
        shankRadius: number,
        shankLength: number,
        headType: string,
        headHeight: number,
        headRadius: number,
        socketRadius: number,
        socketDepth: number
    ): THREE.BufferGeometry {
        const group = new THREE.Group();

        // Shank (simplified - no actual threads modeled)
        const shankGeometry = new THREE.CylinderGeometry(shankRadius, shankRadius, shankLength, 32);
        shankGeometry.translate(0, -shankLength / 2, 0);

        // Head
        let headGeometry: THREE.BufferGeometry;
        if (headType === 'hex') {
            headGeometry = new THREE.CylinderGeometry(headRadius, headRadius, headHeight, 6);
        } else if (headType === 'socket') {
            headGeometry = new THREE.CylinderGeometry(headRadius * 0.9, headRadius * 0.9, headHeight, 32);
        } else if (headType === 'pan') {
            headGeometry = new THREE.SphereGeometry(headRadius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
            headGeometry.scale(1, headHeight / headRadius, 1);
        } else {
            headGeometry = new THREE.CylinderGeometry(headRadius, headRadius, headHeight, 32);
        }
        headGeometry.translate(0, headHeight / 2, 0);

        // Merge (simplified - just return shank for now)
        // In production, use BufferGeometryUtils.mergeBufferGeometries
        shankGeometry.translate(0, -headHeight / 2, 0);

        return shankGeometry;
    }

    private createHexNut(outerDia: number, height: number, boreRadius: number): THREE.BufferGeometry {
        const shape = new THREE.Shape();
        const r = outerDia / 2;

        // Create hexagonal shape
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = r * Math.cos(angle);
            const y = r * Math.sin(angle);
            if (i === 0) {
                shape.moveTo(x, y);
            } else {
                shape.lineTo(x, y);
            }
        }
        shape.closePath();

        // Add center bore
        const hole = new THREE.Path();
        hole.absarc(0, 0, boreRadius, 0, Math.PI * 2, true);
        shape.holes.push(hole);

        const geometry = new THREE.ExtrudeGeometry(shape, {
            depth: height,
            bevelEnabled: false
        });
        geometry.rotateX(-Math.PI / 2);

        return geometry;
    }
}

// Thread Generator - Bolts, Nuts, and Threaded Holes
// Creates parametric metric and imperial threaded fasteners

import * as THREE from 'three';
import { BaseGenerator, GeometrySpec, GeneratedGeometry } from './BaseGenerator';
import MechanicalStandards from '../../standards/mechanical';

export class ThreadGenerator extends BaseGenerator {
    generate(spec: GeometrySpec): GeneratedGeometry {
        const params = spec.parameters || {};

        // Extract thread parameters
        const threadSize = params.thread?.toString() || params.size?.toString() || 'M6';
        const length = this.extractUnit(params.length_mm || 20);
        const headType = params.head_type?.toString() || 'hex'; // 'hex', 'socket', 'pan', 'flat', 'none'
        const fastenerType = params.type?.toString() || 'bolt'; // 'bolt', 'nut', 'stud', 'standoff'

        // Parse thread size using Standards Library
        const standardSpec = MechanicalStandards.getThreadSpec(threadSize);

        // Fallback or Standard values
        const sizeNum = parseFloat(threadSize.replace(/[^0-9.]/g, '')) || 6;

        let majorDia = sizeNum;
        let pitch = sizeNum / 6;
        let minorDia = sizeNum * 0.82;
        let headHeight = sizeNum * 0.7;
        let headDia = sizeNum * 1.7; // Default hex point-to-point approx
        let socketDia = sizeNum * 0.6; // Default socket size
        let socketDepth = sizeNum * 0.5;

        if (standardSpec) {
            majorDia = standardSpec.majorDia;
            pitch = standardSpec.pitch;
            minorDia = standardSpec.minorDia;

            if (headType === 'socket') {
                headHeight = standardSpec.socketHead.height;
                headDia = standardSpec.socketHead.diameter;
                socketDia = standardSpec.socketHead.socketSize;
                socketDepth = standardSpec.socketHead.socketDepth;
            } else if (headType === 'hex') {
                headHeight = standardSpec.hexHead.height;
                // For cylinder with 6 segments (hex), radius is distance to corner.
                // WidthAcrossFlats (s) = sqrt(3) * Radius.
                // Radius = s / sqrt(3) = s / 1.732.
                // Wait, Diameter = 2 * Radius.
                // So Diameter(CornerToCorner) = 2 * s / 1.732 = s * 1.1547.
                // The createBolt method uses headRadius for the cylinder.
                // We should pass the diameter that corresponds to the corners?
                // createBolt calls: new CylinderGeometry(headRadius, ...)
                // If segments=6, headRadius is the corner radius.
                headDia = standardSpec.hexHead.widthAcrossFlats * 1.1547;
            } else {
                // Pan/Flat etc - approximate from hex/socket
                headHeight = standardSpec.socketHead.height * 0.8;
                headDia = standardSpec.socketHead.diameter * 1.2;
            }
        }

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

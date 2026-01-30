// Premium Universal Geometry Generator v2.0
// Creates high-quality, detailed 3D shapes from parsed design intent
// Features: High polygon count, smooth curves, proper hollowing, detailed features

import * as THREE from 'three';
import { BaseGenerator, GeometrySpec, GeneratedGeometry } from './BaseGenerator';
import MechanicalStandards from '../../standards/mechanical';

// Quality settings for premium output
const QUALITY = {
    SEGMENTS_LOW: 32,
    SEGMENTS_MEDIUM: 48,
    SEGMENTS_HIGH: 64,
    SEGMENTS_ULTRA: 128,
    BEVEL_SEGMENTS: 4,
    CURVE_SEGMENTS: 24,
};

interface PrimitiveSpec {
    type: string;
    dimensions: Record<string, number>;
    modifiers: string[];
    features: string[];
    material?: string;
}

export class UniversalGenerator extends BaseGenerator {
    generate(spec: GeometrySpec): GeneratedGeometry {
        const params = spec.parameters || {};
        const geometry = spec.geometry || {};

        // Merge all parameters
        const all = { ...geometry, ...params };

        // Extract primitive type
        const primitiveType = (all.primitive_type || all.profile || 'box').toString().toLowerCase();

        // Extract dimensions with smart defaults
        const dims = this.extractDimensions(all, primitiveType);

        // Extract modifiers and features
        const modifiers: string[] = Array.isArray(all.modifiers) ? all.modifiers : [];
        const features: string[] = Array.isArray(all.features) ? all.features : [];

        // Create the premium geometry
        const mesh = this.createPremiumGeometry(primitiveType, dims, modifiers, features);

        // Center the geometry
        mesh.center();
        mesh.computeVertexNormals();

        // Calculate volume
        const volume = this.calculateVolume(primitiveType, dims);

        return {
            mesh,
            dimensions: {
                length: dims.length / 100,
                width: dims.width / 100,
                height: dims.height / 100,
                diameter: dims.diameter / 100,
            },
            metadata: {
                volume_mm3: volume,
                mass_g: volume * 0.00270,
                features: [`${primitiveType}`, ...modifiers, ...features],
            }
        };
    }

    private extractDimensions(params: Record<string, any>, primitiveType: string): Record<string, number> {
        // Smart defaults based on primitive type
        const defaults: Record<string, Record<string, number>> = {
            box: { length: 100, width: 100, height: 20, thickness: 2, fillet: 0 },
            cylinder: { diameter: 50, height: 100, thickness: 2 },
            sphere: { diameter: 50 },
            cone: { diameter: 50, height: 100, topDiameter: 0 },
            torus: { diameter: 50, tubeRadius: 10 },
            wedge: { length: 100, width: 50, height: 50 },
            prism: { length: 100, width: 50, height: 50 },
            dome: { diameter: 100, height: 50 },
            spinner: { diameter: 80, thickness: 7, hole_diameter: 22 },
        };

        const def = defaults[primitiveType] || defaults.box;

        return {
            length: this.extractUnit(params.length_mm || params.length || def.length || 100),
            width: this.extractUnit(params.width_mm || params.width || def.width || 100),
            height: this.extractUnit(params.height_mm || params.height || def.height || 20),
            thickness: this.extractUnit(params.thickness_mm || params.wall_thickness_mm || params.thickness || def.thickness || 2),
            diameter: this.extractUnit(params.diameter_mm || params.diameter || def.diameter || 50),
            radius: this.extractUnit(params.radius_mm || params.radius || (params.diameter_mm || def.diameter || 50) / 2),
            fillet: this.extractUnit(params.fillet_radius || params.fillet || def.fillet || 0),
            chamfer: this.extractUnit(params.chamfer_size || params.chamfer || 0),
            tubeRadius: this.extractUnit(params.tube_radius || def.tubeRadius || 10),
            topDiameter: this.extractUnit(params.top_diameter || def.topDiameter || 0),
        };
    }

    private createPremiumGeometry(
        primitiveType: string,
        dims: Record<string, number>,
        modifiers: string[],
        features: string[]
    ): THREE.BufferGeometry {
        const scale = 0.01; // mm to meters
        const isHollow = modifiers.includes('hollow') || modifiers.includes('shell');
        const hasRounding = modifiers.includes('rounded') || modifiers.includes('filleted') || dims.fillet > 0;

        // Check for Motor Mount features (Layer 2 Standards Injection)
        const motorFeature = features.find(f => f.includes('NEMA'));

        // If it's a plate/bracket with a motor mount
        if (motorFeature && ['plate', 'bracket', 'mount', 'base', 'box'].includes(primitiveType)) {
            const motorSpec = MechanicalStandards.getMotorSpec(motorFeature);
            if (motorSpec) {
                return this.createMotorMountPlate(dims, scale, motorSpec, hasRounding);
            }
        }

        switch (primitiveType) {
            case 'cylinder':
            case 'bottle':
            case 'can':
            case 'tube':
            case 'pipe':
            case 'rod':
            case 'shaft':
            case 'pillar':
            case 'column':
                return isHollow
                    ? this.createHollowCylinder(dims, scale)
                    : this.createSolidCylinder(dims, scale);

            case 'sphere':
            case 'ball':
            case 'globe':
            case 'orb':
                return isHollow
                    ? this.createHollowSphere(dims, scale)
                    : this.createSolidSphere(dims, scale);

            case 'dome':
            case 'hemisphere':
                return this.createDome(dims, scale, isHollow);

            case 'cone':
            case 'funnel':
            case 'nozzle':
                return isHollow
                    ? this.createHollowCone(dims, scale)
                    : this.createSolidCone(dims, scale);

            case 'torus':
            case 'donut':
            case 'ring':
            case 'washer':
            case 'o-ring':
                return this.createTorus(dims, scale);

            case 'wedge':
            case 'ramp':
            case 'slope':
                return this.createWedge(dims, scale);

            case 'prism':
            case 'triangular':
                return this.createTriangularPrism(dims, scale);

            case 'enclosure':
            case 'case':
            case 'housing':
            case 'box':
                return isHollow
                    ? this.createHollowBox(dims, scale, hasRounding)
                    : hasRounding
                        ? this.createRoundedBox(dims, scale)
                        : this.createSolidBox(dims, scale);

            case 'plate':
            case 'baseplate':
            case 'slab':
            case 'panel':
            default:
                return hasRounding
                    ? this.createRoundedBox(dims, scale)
                    : this.createSolidBox(dims, scale);

            case 'spinner':
                return this.createSpinner(dims, scale);
        }
    }

    // ===== PREMIUM SOLID GEOMETRIES =====

    private createSolidBox(dims: Record<string, number>, scale: number): THREE.BufferGeometry {
        const l = dims.length * scale;
        const w = dims.width * scale;
        const h = dims.height * scale;
        return new THREE.BoxGeometry(l, h, w, 1, 1, 1);
    }

    private createRoundedBox(dims: Record<string, number>, scale: number): THREE.BufferGeometry {
        const l = dims.length * scale;
        const w = dims.width * scale;
        const h = dims.height * scale;
        const r = Math.min(dims.fillet || 2, dims.length / 6, dims.width / 6, dims.height / 3) * scale;

        // Create a 2D rounded rectangle and extrude
        const shape = new THREE.Shape();
        const hw = l / 2, hd = w / 2;

        shape.moveTo(-hw + r, -hd);
        shape.lineTo(hw - r, -hd);
        shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
        shape.lineTo(hw, hd - r);
        shape.quadraticCurveTo(hw, hd, hw - r, hd);
        shape.lineTo(-hw + r, hd);
        shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
        shape.lineTo(-hw, -hd + r);
        shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);

        const extrudeSettings = {
            depth: h,
            bevelEnabled: true,
            bevelThickness: r,
            bevelSize: r,
            bevelOffset: -r,
            bevelSegments: QUALITY.BEVEL_SEGMENTS,
            curveSegments: QUALITY.CURVE_SEGMENTS
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.rotateX(-Math.PI / 2);
        return geometry;
    }

    private createHollowBox(dims: Record<string, number>, scale: number, rounded: boolean): THREE.BufferGeometry {
        const l = dims.length * scale;
        const w = dims.width * scale;
        const h = dims.height * scale;
        const t = dims.thickness * scale;
        const r = rounded ? Math.min(dims.fillet || 2, dims.length / 8) * scale : 0;

        // Create outer shape
        const outer = rounded
            ? this.createRoundedRectShape(l, w, r)
            : this.createRectShape(l, w);

        // Create inner shape (hole)
        const innerL = l - 2 * t;
        const innerW = w - 2 * t;
        const innerR = Math.max(0, r - t);

        const inner = rounded
            ? this.createRoundedRectPath(innerL, innerW, innerR)
            : this.createRectPath(innerL, innerW);

        outer.holes.push(inner);

        const extrudeSettings = {
            depth: h - t, // Leave bottom solid
            bevelEnabled: false,
            curveSegments: QUALITY.CURVE_SEGMENTS
        };

        const geometry = new THREE.ExtrudeGeometry(outer, extrudeSettings);
        geometry.rotateX(-Math.PI / 2);
        return geometry;
    }

    private createSolidCylinder(dims: Record<string, number>, scale: number): THREE.BufferGeometry {
        const r = dims.radius * scale;
        const h = dims.height * scale;
        return new THREE.CylinderGeometry(r, r, h, QUALITY.SEGMENTS_HIGH, 1, false);
    }

    private createHollowCylinder(dims: Record<string, number>, scale: number): THREE.BufferGeometry {
        const outerR = dims.radius * scale;
        const innerR = (dims.radius - dims.thickness) * scale;
        const h = dims.height * scale;

        // Create hollow cylinder using shape with hole
        const shape = new THREE.Shape();
        shape.absarc(0, 0, outerR, 0, Math.PI * 2, false);

        const hole = new THREE.Path();
        hole.absarc(0, 0, Math.max(innerR, 0.001), 0, Math.PI * 2, true);
        shape.holes.push(hole);

        const geometry = new THREE.ExtrudeGeometry(shape, {
            depth: h,
            bevelEnabled: false,
            curveSegments: QUALITY.SEGMENTS_HIGH
        });
        geometry.rotateX(-Math.PI / 2);
        return geometry;
    }

    private createSolidSphere(dims: Record<string, number>, scale: number): THREE.BufferGeometry {
        const r = (dims.diameter / 2) * scale;
        return new THREE.SphereGeometry(r, QUALITY.SEGMENTS_HIGH, QUALITY.SEGMENTS_MEDIUM);
    }

    private createHollowSphere(dims: Record<string, number>, scale: number): THREE.BufferGeometry {
        // Note: True hollow sphere requires CSG, for now just return solid
        // In production, use three-bvh-csg or similar
        const r = (dims.diameter / 2) * scale;
        return new THREE.SphereGeometry(r, QUALITY.SEGMENTS_HIGH, QUALITY.SEGMENTS_MEDIUM);
    }

    private createDome(dims: Record<string, number>, scale: number, isHollow: boolean): THREE.BufferGeometry {
        const r = (dims.diameter / 2) * scale;
        // Create hemisphere
        return new THREE.SphereGeometry(
            r,
            QUALITY.SEGMENTS_HIGH,
            QUALITY.SEGMENTS_MEDIUM / 2,
            0,
            Math.PI * 2,
            0,
            Math.PI / 2
        );
    }

    private createSolidCone(dims: Record<string, number>, scale: number): THREE.BufferGeometry {
        const bottomR = (dims.diameter / 2) * scale;
        const topR = (dims.topDiameter / 2) * scale;
        const h = dims.height * scale;
        return new THREE.CylinderGeometry(topR, bottomR, h, QUALITY.SEGMENTS_HIGH, 1, false);
    }

    private createHollowCone(dims: Record<string, number>, scale: number): THREE.BufferGeometry {
        const bottomR = (dims.diameter / 2) * scale;
        const topR = (dims.topDiameter / 2) * scale;
        const h = dims.height * scale;
        const t = dims.thickness * scale;

        // Create frustum with hollow center
        const shape = new THREE.Shape();

        // Outer profile
        shape.moveTo(-bottomR, 0);
        shape.lineTo(-topR, h);
        shape.lineTo(topR, h);
        shape.lineTo(bottomR, 0);
        shape.closePath();

        // Inner profile (hole) - only if there's enough space
        if (bottomR > t && topR + t < bottomR) {
            const inner = new THREE.Path();
            inner.moveTo(-bottomR + t, t);
            inner.lineTo(-topR - t * 0.5, h - t);
            inner.lineTo(topR + t * 0.5, h - t);
            inner.lineTo(bottomR - t, t);
            inner.closePath();
            shape.holes.push(inner);
        }

        // For now, return solid cone as CSG would be needed for proper hollow
        return new THREE.CylinderGeometry(topR, bottomR, h, QUALITY.SEGMENTS_HIGH, 1, false);
    }

    private createTorus(dims: Record<string, number>, scale: number): THREE.BufferGeometry {
        const R = (dims.diameter / 2) * scale;
        const r = dims.tubeRadius * scale;
        return new THREE.TorusGeometry(R, r, QUALITY.SEGMENTS_MEDIUM, QUALITY.SEGMENTS_HIGH);
    }

    private createWedge(dims: Record<string, number>, scale: number): THREE.BufferGeometry {
        const l = dims.length * scale;
        const w = dims.width * scale;
        const h = dims.height * scale;

        // Create wedge shape (right triangle profile)
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.lineTo(l, 0);
        shape.lineTo(0, h);
        shape.closePath();

        const geometry = new THREE.ExtrudeGeometry(shape, {
            depth: w,
            bevelEnabled: false,
            curveSegments: QUALITY.CURVE_SEGMENTS
        });
        geometry.translate(-l / 2, -h / 2, -w / 2);
        geometry.rotateX(-Math.PI / 2);
        return geometry;
    }

    private createTriangularPrism(dims: Record<string, number>, scale: number): THREE.BufferGeometry {
        const l = dims.length * scale;
        const w = dims.width * scale;
        const h = dims.height * scale;

        // Equilateral triangle cross-section (or isoceles based on width/height)
        const shape = new THREE.Shape();
        shape.moveTo(-w / 2, 0);
        shape.lineTo(w / 2, 0);
        shape.lineTo(0, h);
        shape.closePath();

        const geometry = new THREE.ExtrudeGeometry(shape, {
            depth: l,
            bevelEnabled: false,
            curveSegments: QUALITY.CURVE_SEGMENTS
        });
        geometry.translate(0, -h / 3, -l / 2);
        return geometry;
    }

    // ===== HELPER SHAPE CREATORS =====

    private createRectShape(l: number, w: number): THREE.Shape {
        const shape = new THREE.Shape();
        const hw = l / 2, hd = w / 2;
        shape.moveTo(-hw, -hd);
        shape.lineTo(hw, -hd);
        shape.lineTo(hw, hd);
        shape.lineTo(-hw, hd);
        shape.closePath();
        return shape;
    }

    private createRectPath(l: number, w: number): THREE.Path {
        const path = new THREE.Path();
        const hw = l / 2, hd = w / 2;
        path.moveTo(-hw, -hd);
        path.lineTo(hw, -hd);
        path.lineTo(hw, hd);
        path.lineTo(-hw, hd);
        path.closePath();
        return path;
    }

    private createRoundedRectShape(l: number, w: number, r: number): THREE.Shape {
        const shape = new THREE.Shape();
        const hw = l / 2, hd = w / 2;
        const radius = Math.min(r, hw * 0.9, hd * 0.9);

        shape.moveTo(-hw + radius, -hd);
        shape.lineTo(hw - radius, -hd);
        shape.quadraticCurveTo(hw, -hd, hw, -hd + radius);
        shape.lineTo(hw, hd - radius);
        shape.quadraticCurveTo(hw, hd, hw - radius, hd);
        shape.lineTo(-hw + radius, hd);
        shape.quadraticCurveTo(-hw, hd, -hw, hd - radius);
        shape.lineTo(-hw, -hd + radius);
        shape.quadraticCurveTo(-hw, -hd, -hw + radius, -hd);

        return shape;
    }

    private createRoundedRectPath(l: number, w: number, r: number): THREE.Path {
        const path = new THREE.Path();
        const hw = l / 2, hd = w / 2;
        const radius = Math.min(r, hw * 0.9, hd * 0.9);

        path.moveTo(-hw + radius, -hd);
        path.lineTo(hw - radius, -hd);
        path.quadraticCurveTo(hw, -hd, hw, -hd + radius);
        path.lineTo(hw, hd - radius);
        path.quadraticCurveTo(hw, hd, hw - radius, hd);
        path.lineTo(-hw + radius, hd);
        path.quadraticCurveTo(-hw, hd, -hw, hd - radius);
        path.lineTo(-hw, -hd + radius);
        path.quadraticCurveTo(-hw, -hd, -hw + radius, -hd);

        return path;
    }

    // ===== VOLUME CALCULATION =====

    private calculateVolume(type: string, dims: Record<string, number>): number {
        switch (type) {
            case 'cylinder':
            case 'tube':
            case 'pipe':
            case 'rod':
            case 'shaft':
                return Math.PI * dims.radius * dims.radius * dims.height;
            case 'sphere':
            case 'ball':
                return (4 / 3) * Math.PI * Math.pow(dims.diameter / 2, 3);
            case 'dome':
            case 'hemisphere':
                return (2 / 3) * Math.PI * Math.pow(dims.diameter / 2, 3);
            case 'cone':
            case 'funnel':
                const r1 = dims.diameter / 2;
                const r2 = dims.topDiameter / 2;
                return (Math.PI * dims.height / 3) * (r1 * r1 + r1 * r2 + r2 * r2);
            case 'torus':
            case 'donut':
            case 'ring':
                return 2 * Math.PI * Math.PI * (dims.diameter / 2) * dims.tubeRadius * dims.tubeRadius;
            case 'wedge':
            case 'prism':
                return (dims.length * dims.width * dims.height) / 2;
            case 'spinner':
                return (Math.PI * Math.pow(dims.diameter / 2, 2) * dims.thickness) * 0.6; // Approx 60% solidity
            default:
                return dims.length * dims.width * dims.height;
        }
    }

    private createMotorMountPlate(
        dims: Record<string, number>,
        scale: number,
        motor: { boltSpacing: number; pilotDia: number; mountingHole: string },
        rounded: boolean
    ): THREE.BufferGeometry {
        const l = dims.length * scale;
        const w = dims.width * scale;
        const h = dims.thickness * scale || 0.05; // Default 5mm
        const r = rounded ? Math.min(dims.fillet || 2, dims.length / 8) * scale : 0;

        // Base Plate
        const shape = rounded
            ? this.createRoundedRectShape(l, w, r)
            : this.createRectShape(l, w);

        // Center Pilot Hole
        const pilotR = (motor.pilotDia / 2) * scale;
        const pilotHole = new THREE.Path();
        pilotHole.absarc(0, 0, pilotR, 0, Math.PI * 2, true);
        shape.holes.push(pilotHole);

        // Mounting Holes (4 corners)
        const spacing = (motor.boltSpacing / 2) * scale;
        // Parse M3/M4 from string or default to 3mm
        const screwSize = parseFloat(motor.mountingHole.replace('M', '')) || 3;
        const holeR = (screwSize / 2) * scale * 1.1; // +10% clearance

        const corners = [
            { x: spacing, y: spacing },
            { x: -spacing, y: spacing },
            { x: spacing, y: -spacing },
            { x: -spacing, y: -spacing }
        ];

        corners.forEach(c => {
            const screwHole = new THREE.Path();
            screwHole.absarc(c.x, c.y, holeR, 0, Math.PI * 2, true);
            shape.holes.push(screwHole);
        });

        const extrudeSettings = {
            depth: h,
            bevelEnabled: false,
            curveSegments: QUALITY.CURVE_SEGMENTS
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.rotateX(-Math.PI / 2);
        return geometry;
    }

    private createSpinner(dims: Record<string, number>, scale: number): THREE.BufferGeometry {
        const shape = new THREE.Shape();

        // Parametric Rose Curve: r = a + b * cos(3 * theta)
        // a + b = max radius (D/2)
        // a - b = min radius (at the "valleys" between lobes)
        const R = (dims.diameter / 2) * scale;
        const b = R * 0.4; // Amplitude of the lobes
        const a = R - b;   // Base radius

        const numPoints = 120;
        for (let i = 0; i <= numPoints; i++) {
            const theta = (i / numPoints) * Math.PI * 2;
            const r = a + b * Math.cos(3 * theta);
            const x = r * Math.cos(theta);
            const y = r * Math.sin(theta);
            if (i === 0) shape.moveTo(x, y);
            else shape.lineTo(x, y);
        }

        // Holes
        // 22mm standard bearing = 0.022m. Radius = 0.011m.
        // 608 bearing is standard for spinners.
        const defaultHoleMM = 22;
        const holeR = ((dims.hole_diameter || defaultHoleMM) / 2) * scale; // in meters if scale=0.001

        // Center hole
        const centerHole = new THREE.Path();
        centerHole.absarc(0, 0, holeR, 0, Math.PI * 2, true);
        shape.holes.push(centerHole);

        // Lobe holes
        // Position them near the peak of the lobes
        // Peak is at r = a + b = R
        // We want the hole to be centered within the lobe.
        // Lobe "mass" is roughly at distance R - 1.5*holeR? 
        const lobeDist = R - holeR * 1.5;

        for (let i = 0; i < 3; i++) {
            // Peaks are at 0, 2pi/3, 4pi/3
            const angle = (i * Math.PI * 2) / 3;
            const hx = Math.cos(angle) * lobeDist;
            const hy = Math.sin(angle) * lobeDist;

            const lobeHole = new THREE.Path();
            lobeHole.absarc(hx, hy, holeR, 0, Math.PI * 2, true);
            shape.holes.push(lobeHole);
        }

        const extrudeSettings = {
            depth: dims.thickness * scale,
            bevelEnabled: true,
            bevelThickness: 1 * scale,
            bevelSize: 1 * scale,
            bevelSegments: 3,
            curveSegments: QUALITY.CURVE_SEGMENTS
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.rotateX(-Math.PI / 2);
        return geometry;
    }
}

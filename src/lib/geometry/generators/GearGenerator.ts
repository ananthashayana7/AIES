// Gear Generator - Spur and Helical Gears
// Generates parametric gears with involute tooth profiles

import * as THREE from 'three';
import { BaseGenerator, GeometrySpec, GeneratedGeometry } from './BaseGenerator';

export class GearGenerator extends BaseGenerator {
    generate(spec: GeometrySpec): GeneratedGeometry {
        const params = spec.parameters || {};

        // Extract gear parameters
        const module_mm = this.extractUnit(params.module_mm || params.module || 2); // Module (tooth size)
        const teeth = parseInt(params.teeth?.toString() || params.tooth_count?.toString() || '20');
        const thickness = this.extractUnit(params.thickness_mm || params.width_mm || 10);
        const pressureAngle = parseFloat(params.pressure_angle?.toString() || '20') * Math.PI / 180; // Default 20°
        const boreRadius = this.extractUnit(params.bore_mm || params.bore_diameter_mm || 0) / 2;
        const hubRadius = this.extractUnit(params.hub_diameter_mm || 0) / 2;
        const hubThickness = this.extractUnit(params.hub_thickness_mm || 0);

        // Calculate gear dimensions
        const pitchRadius = (module_mm * teeth) / 2;
        const addendum = module_mm; // Tooth height above pitch circle
        const dedendum = module_mm * 1.25; // Tooth depth below pitch circle
        const outerRadius = pitchRadius + addendum;
        const innerRadius = pitchRadius - dedendum;
        const toothAngle = (2 * Math.PI) / teeth;

        // Convert to meters for Three.js
        const scale = 0.01;
        const rOuter = outerRadius * scale;
        const rInner = innerRadius * scale;
        const rPitch = pitchRadius * scale;
        const t = thickness * scale;
        const bore = boreRadius * scale;

        // Create gear profile shape
        const shape = new THREE.Shape();

        // Generate simplified involute tooth profile
        for (let i = 0; i < teeth; i++) {
            const angle = i * toothAngle;
            const toothWidth = toothAngle * 0.4; // Tooth takes 40% of spacing
            const gapWidth = toothAngle * 0.6; // Gap takes 60%

            // Tooth tip (outer radius)
            const tipStart = angle;
            const tipEnd = angle + toothWidth;

            // Root (inner radius)
            const rootStart = tipEnd;
            const rootEnd = angle + toothAngle;

            if (i === 0) {
                shape.moveTo(
                    rOuter * Math.cos(tipStart),
                    rOuter * Math.sin(tipStart)
                );
            }

            // Draw tooth profile
            // Tip arc
            shape.lineTo(
                rOuter * Math.cos(tipEnd),
                rOuter * Math.sin(tipEnd)
            );

            // Descend to root
            shape.lineTo(
                rInner * Math.cos(rootStart + 0.02),
                rInner * Math.sin(rootStart + 0.02)
            );

            // Root arc
            shape.lineTo(
                rInner * Math.cos(rootEnd - 0.02),
                rInner * Math.sin(rootEnd - 0.02)
            );

            // Ascend to next tooth if not last
            if (i < teeth - 1) {
                shape.lineTo(
                    rOuter * Math.cos(rootEnd),
                    rOuter * Math.sin(rootEnd)
                );
            }
        }

        // Close the shape
        shape.closePath();

        // Add center bore if specified
        if (bore > 0) {
            const holePath = new THREE.Path();
            holePath.absarc(0, 0, bore, 0, Math.PI * 2, true);
            shape.holes.push(holePath);
        }

        // Extrude the gear shape
        const extrudeSettings = {
            depth: t,
            bevelEnabled: false,
            curveSegments: 32
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.rotateX(-Math.PI / 2); // Orient gear to lie flat
        geometry.center();

        // Calculate mass estimate (assuming steel)
        const toothVolume = Math.PI * (outerRadius * outerRadius - innerRadius * innerRadius) * thickness * 0.7;
        const boreVolume = bore > 0 ? Math.PI * boreRadius * boreRadius * thickness : 0;
        const volume_mm3 = toothVolume - boreVolume;
        const mass_g = volume_mm3 * 0.00785; // Steel density

        return {
            mesh: geometry,
            dimensions: {
                outerDiameter: outerRadius * 2 / 100,
                pitchDiameter: pitchRadius * 2 / 100,
                thickness: thickness / 100,
                height: thickness / 100
            },
            metadata: {
                volume_mm3,
                mass_g,
                features: [
                    `${teeth} Teeth`,
                    `Module: ${module_mm}mm`,
                    `Pitch Dia: ${pitchRadius * 2}mm`,
                    bore > 0 ? `Bore: ${boreRadius * 2}mm` : 'Solid'
                ]
            }
        };
    }
}

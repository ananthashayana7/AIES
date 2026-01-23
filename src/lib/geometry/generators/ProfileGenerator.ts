
import * as THREE from 'three';
import { BaseGenerator, GeometrySpec, GeneratedGeometry } from './BaseGenerator';

export class ProfileGenerator extends BaseGenerator {
    generate(spec: GeometrySpec): GeneratedGeometry {
        const geo = spec.geometry || {};
        const params = spec.parameters || {};

        // Extract Dimensions
        const length = this.extractUnit(params.length_mm || geo.length || 1000);
        const width = this.extractUnit(params.width_mm || params.flange_width || geo.width || 100); // Flange Width
        const height = this.extractUnit(params.height_mm || params.web_height || geo.height || 100); // Web Height
        const thickness = this.extractUnit(params.thickness_mm || params.web_thickness || geo.thickness || 10);
        const flangeThickness = this.extractUnit(params.flange_thickness || thickness);

        const profileType = (spec.type || params.profile || 'i-beam').toLowerCase();

        // Create 2D Shape
        let shape: THREE.Shape;

        if (profileType.includes('i-beam')) {
            shape = this.drawIBeam(width, height, thickness, flangeThickness);
        } else if (profileType.includes('t-profile') || profileType.includes('t-slot')) {
            shape = this.drawTProfile(width, height, thickness, flangeThickness);
        } else if (profileType.includes('c-channel') || profileType.includes('u-channel')) {
            shape = this.drawCChannel(width, height, thickness, flangeThickness);
        } else {
            // Default to I-Beam 
            shape = this.drawIBeam(width, height, thickness, flangeThickness);
        }

        // Extrude
        const extrudeSettings = {
            depth: length * 0.01, // Convert mm to meters (THREE units)
            bevelEnabled: false,
            curveSegments: 12
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

        // Center and orient
        geometry.center();

        return {
            mesh: geometry,
            dimensions: {
                length: length / 100, // m
                width: width / 100, // m
                height: height / 100 // m
            },
            metadata: {
                volume_mm3: this.calculateVolume(profileType, length, width, height, thickness, flangeThickness),
                features: [profileType.toUpperCase(), `L:${length}mm`]
            }
        };
    }

    private drawIBeam(w: number, h: number, tw: number, tf: number): THREE.Shape {
        // Units: Meters (input inputs are mm, so we scale down)
        const scale = 0.01;
        const W = w * scale;
        const H = h * scale;
        const TW = tw * scale; // Web thickness
        const TF = tf * scale; // Flange thickness

        const shape = new THREE.Shape();

        // Draw I-Profile centered at 0,0
        // Top Flange
        shape.moveTo(-W / 2, H / 2);
        shape.lineTo(W / 2, H / 2);
        shape.lineTo(W / 2, H / 2 - TF);
        // Web
        shape.lineTo(TW / 2, H / 2 - TF); // Right side of web
        shape.lineTo(TW / 2, -H / 2 + TF);
        // Bottom Flange
        shape.lineTo(W / 2, -H / 2 + TF);
        shape.lineTo(W / 2, -H / 2);
        shape.lineTo(-W / 2, -H / 2);
        shape.lineTo(-W / 2, -H / 2 + TF);
        // Web back up
        shape.lineTo(-TW / 2, -H / 2 + TF);
        shape.lineTo(-TW / 2, H / 2 - TF);
        // Top Flange finish
        shape.lineTo(-W / 2, H / 2 - TF);
        shape.lineTo(-W / 2, H / 2);

        return shape;
    }

    private drawTProfile(w: number, h: number, tw: number, tf: number): THREE.Shape {
        const scale = 0.01;
        const W = w * scale;
        const H = h * scale;
        const TW = tw * scale;
        const TF = tf * scale;

        const shape = new THREE.Shape();

        // Top Flange
        shape.moveTo(-W / 2, H / 2);
        shape.lineTo(W / 2, H / 2);
        shape.lineTo(W / 2, H / 2 - TF);
        // Web
        shape.lineTo(TW / 2, H / 2 - TF);
        shape.lineTo(TW / 2, -H / 2);
        shape.lineTo(-TW / 2, -H / 2);
        shape.lineTo(-TW / 2, H / 2 - TF);
        // Finish
        shape.lineTo(-W / 2, H / 2 - TF);
        shape.lineTo(-W / 2, H / 2);

        return shape;
    }

    private drawCChannel(w: number, h: number, tw: number, tf: number): THREE.Shape {
        const scale = 0.01;
        const W = w * scale;
        const H = h * scale;
        const TW = tw * scale;
        const TF = tf * scale;

        const shape = new THREE.Shape();
        // C shape facing right
        // Top Flange
        shape.moveTo(-W / 2, H / 2);
        shape.lineTo(W / 2, H / 2);
        shape.lineTo(W / 2, H / 2 - TF);
        shape.lineTo(-W / 2 + TW, H / 2 - TF);
        // Web internal
        shape.lineTo(-W / 2 + TW, -H / 2 + TF);
        // Bottom Flange internal
        shape.lineTo(W / 2, -H / 2 + TF);
        shape.lineTo(W / 2, -H / 2);
        shape.lineTo(-W / 2, -H / 2);
        shape.lineTo(-W / 2, H / 2);

        return shape;
    }

    private calculateVolume(type: string, l: number, w: number, h: number, tw: number, tf: number): number {
        // Approx area * length
        let area = 0;
        if (type.includes('i-beam')) {
            area = (2 * w * tf) + ((h - 2 * tf) * tw);
        } else if (type.includes('t-profile')) {
            area = (w * tf) + ((h - tf) * tw);
        } else if (type.includes('c-channel')) {
            area = (2 * w * tf) + ((h - 2 * tf) * tw); // Same as I-beam effectively minus symmetry
        }
        return area * l;
    }
}

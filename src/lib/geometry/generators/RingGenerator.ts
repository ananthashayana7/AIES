
import * as THREE from 'three';
import { BaseGenerator, GeometrySpec, GeneratedGeometry } from './BaseGenerator';
import { GemGenerator } from './GemGenerator';

export class RingGenerator extends BaseGenerator {
    generate(spec: GeometrySpec): GeneratedGeometry {
        const geo = spec.geometry || {};
        const params = spec.parameters || {};

        // Ring Dimensions
        const ringSize = this.extractUnit(params.diameter_mm || params.ring_size || 20); // Internal diameter
        const bandWidth = this.extractUnit(params.band_width || params.width_mm || 4); // Breadth
        const bandThickness = this.extractUnit(params.thickness_mm || 2);

        // Convert to meters
        const radius = (ringSize / 2) * 0.01;
        const tubeRadius = (bandThickness / 2) * 0.01;

        // 1. Create Band (Torus)
        // TorusGeometry(radius, tube, radialSegments, tubularSegments)
        const bandGeometry = new THREE.TorusGeometry(radius, tubeRadius, 16, 50);

        // Scale z to make it wider (Band Width)
        // Torus is created in XY plane, tube radius is thickness.
        // We want flat band? 
        // For simple torus ring, scale Z? No, Torus tube is circular.
        // Let's just use Torus for now.

        const bandMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xFFD700, // Gold Default
            metalness: 1.0,
            roughness: 0.1,
            envMapIntensity: 1.0,
            name: 'GoldBand'
        });

        const bandMesh = new THREE.Mesh(bandGeometry, bandMaterial);
        bandMesh.rotation.x = Math.PI / 2; // Lie flat

        // 2. Create Gem (if requested or default)
        const gemGen = new GemGenerator();
        const gemSpec = {
            parameters: {
                diameter_mm: bandWidth * 2, // Gem slightly larger than band
                cut: 'diamond'
            }
        };
        const gemResult = gemGen.generate(gemSpec);
        const gemGeometry = gemResult.mesh as THREE.BufferGeometry;

        const gemMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0.0,
            roughness: 0.0,
            transmission: 1.0, // Glass/Crystal
            thickness: 0.5,
            ior: 2.4, // Diamond IOR
            name: 'DiamondGem'
        });

        const gemMesh = new THREE.Mesh(gemGeometry, gemMaterial);

        // Position Gem on top of Ring
        // Radius of ring + tube radius
        const gemY = radius + tubeRadius * 0.8;
        gemMesh.position.set(0, gemY, 0); // Top of ring (if lying flat? rotation needed)

        // Since band is rotated X=90, Y is "up" in component space? 
        // We assembled in local Group space.
        // Let's group them.

        const assembly = new THREE.Group();
        assembly.add(bandMesh);
        // Correct gem position relative to rotated band?
        // Band rotated X=90. So its "up" is Z?
        // Actually Torus default is in XY plane around Z axis.
        // If we rotate X 90, it lays on XZ plane.
        // So "Top" is +Z or -Z?
        // Let's just create Group.

        // Reset band rotation, handle in Group
        bandMesh.rotation.set(0, 0, 0); // Faces Z
        gemMesh.position.set(0, radius + tubeRadius, 0); // Top of circle

        assembly.add(bandMesh);
        assembly.add(gemMesh);

        // Metadata
        assembly.userData = { isAssembly: true };

        return {
            mesh: assembly,
            dimensions: {
                length: ringSize / 100,
                width: ringSize / 100,
                height: (ringSize + bandWidth) / 100
            },
            metadata: {
                features: ['Ring Assembly', 'Gold Band', 'Diamond Setting']
            }
        };
    }
}

'use client';

// Generative Geometry Visualization
// Creates actual 3D shapes from JSON specifications

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { DesignIntent } from '@/lib/schemas/designIntent';
import { GeneratedVariant } from '@/lib/variants/variantGenerator';
import { detectShapeType, normalizeGeometrySpec, LBendGenerator, BaseplateGenerator } from '@/lib/geometry';

interface ParametricMeshProps {
    variant: GeneratedVariant;
    intent: DesignIntent;
    inspectMode?: boolean;
    onClick?: (region: string) => void;
}

export default function ParametricMesh({ variant, intent, inspectMode, onClick }: ParametricMeshProps) {
    const meshRef = useRef<THREE.Group>(null);

    // ===== GENERATIVE GEOMETRY SYSTEM =====
    const geometry = useMemo(() => {
        // Normalize intent to consistent format
        const normalizedSpec = normalizeGeometrySpec(intent);
        const shapeType = detectShapeType(intent);

        console.log('[GeometryGen] Detected shape type:', shapeType);
        console.log('[GeometryGen] Spec:', normalizedSpec);

        try {
            let generated;

            switch (shapeType) {
                case 'l-bend':
                    console.log('[GeometryGen] Using L-Bend Generator');
                    const lbendGen = new LBendGenerator();
                    generated = lbendGen.generate(normalizedSpec);
                    break;

                case 'spinner':
                    // TODO: Implement SpinnerGenerator
                    // For now, fall back to baseplate
                    console.log('[GeometryGen] Spinner detected - using fallback');
                    const fallbackGen = new BaseplateGenerator();
                    generated = fallbackGen.generate(normalizedSpec);
                    break;

                case 'baseplate':
                default:
                    console.log('[GeometryGen] Using Baseplate Generator');
                    const baseplateGen = new BaseplateGenerator();
                    generated = baseplateGen.generate(normalizedSpec);
                    break;
            }

            console.log('[GeometryGen] Generated dimensions:', generated.dimensions);
            return generated.mesh;

        } catch (error) {
            console.error('[GeometryGen] Error generating geometry:', error);
            // Fallback to simple box on error
            return new THREE.BoxGeometry(1, 0.1, 1);
        }
    }, [intent]);

    const handleClick = (region: string) => (e: any) => {
        if (inspectMode && onClick) {
            e.stopPropagation();
            onClick(region);
        }
    };

    const params = variant.parameters;
    const simMode = params['sim_mode'] === 'Heatmap';

    return (
        <group ref={meshRef} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh geometry={geometry} onClick={handleClick('body')}>
                <meshStandardMaterial
                    color={simMode ? "#ff0000" : "#ffffff"}
                    emissive={simMode ? "#ff3300" : "#000000"}
                    emissiveIntensity={simMode ? 0.8 : 0}
                    metalness={0.0}
                    roughness={1.0}
                    transparent
                    opacity={simMode ? 0.7 : 0.8}
                />
            </mesh>
            <mesh geometry={geometry}>
                <meshStandardMaterial color={simMode ? "#fff" : "#000000"} wireframe />
            </mesh>

            {simMode && (
                <pointLight position={[0.5, 0.5, 0.1]} intensity={2} color="#ff0000" />
            )}
        </group>
    );
}

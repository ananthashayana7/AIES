
'use client';

// Generative Geometry Visualization
// Creates actual 3D shapes from JSON specifications

import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useAppStore } from '@/store/appStore';
import { ExportManager } from '@/lib/export/ExportManager';
import { DesignIntent } from '@/lib/schemas/designIntent';
import { GeneratedVariant } from '@/lib/variants/variantGenerator';
import { detectShapeType, normalizeGeometrySpec, LBendGenerator, BaseplateGenerator, CylinderGenerator, ProfileGenerator, RevolveGenerator, RingGenerator, GemGenerator, GearGenerator, EnclosureGenerator, ThreadGenerator, PipeGenerator, UniversalGenerator } from '@/lib/geometry';

interface ParametricMeshProps {
    variant: GeneratedVariant;
    intent: DesignIntent;
    inspectMode?: boolean;
    heatmapData?: Float32Array; // Optional visual FEM data
    onClick?: (region: string) => void;
}

// ===== PREMIUM MATERIAL SYSTEM =====
// High-quality PBR material properties for realistic rendering
const getMaterialProps = (matName: string): Record<string, any> => {
    const name = matName.toLowerCase();

    // METALS
    if (name.includes('gold')) return {
        color: '#FFD700', metalness: 1.0, roughness: 0.15,
        envMapIntensity: 1.2, clearcoat: 0.3
    };
    if (name.includes('silver')) return {
        color: '#C0C0C0', metalness: 1.0, roughness: 0.1,
        envMapIntensity: 1.5, clearcoat: 0.5
    };
    if (name.includes('platinum')) return {
        color: '#E5E4E2', metalness: 1.0, roughness: 0.05,
        envMapIntensity: 1.8, clearcoat: 0.6
    };
    if (name.includes('stainless')) return {
        color: '#8B8D8E', metalness: 0.95, roughness: 0.2,
        envMapIntensity: 1.0
    };
    if (name.includes('steel')) return {
        color: '#71797E', metalness: 0.85, roughness: 0.35,
        envMapIntensity: 0.8
    };
    if (name.includes('aluminum') || name.includes('aluminium')) return {
        color: '#A8A9AD', metalness: 0.7, roughness: 0.3,
        envMapIntensity: 0.9
    };
    if (name.includes('titanium')) return {
        color: '#878681', metalness: 0.75, roughness: 0.4,
        envMapIntensity: 0.7
    };
    if (name.includes('copper')) return {
        color: '#B87333', metalness: 0.95, roughness: 0.25,
        envMapIntensity: 1.0
    };
    if (name.includes('brass')) return {
        color: '#B5A642', metalness: 0.9, roughness: 0.3,
        envMapIntensity: 0.9
    };
    if (name.includes('bronze')) return {
        color: '#CD7F32', metalness: 0.85, roughness: 0.35,
        envMapIntensity: 0.8
    };
    if (name.includes('chrome')) return {
        color: '#CCCCCC', metalness: 1.0, roughness: 0.05,
        envMapIntensity: 2.0, clearcoat: 0.8
    };
    if (name.includes('iron') || name.includes('cast iron')) return {
        color: '#48494B', metalness: 0.6, roughness: 0.6
    };
    if (name.includes('zinc')) return {
        color: '#8C8C8C', metalness: 0.7, roughness: 0.5
    };
    if (name.includes('nickel')) return {
        color: '#A0A0A0', metalness: 0.85, roughness: 0.25,
        envMapIntensity: 1.0
    };

    // PLASTICS
    if (name.includes('abs')) return {
        color: '#2563EB', metalness: 0.0, roughness: 0.4,
        clearcoat: 0.2
    };
    if (name.includes('pla')) return {
        color: '#22C55E', metalness: 0.0, roughness: 0.5
    };
    if (name.includes('nylon') || name.includes('polyamide')) return {
        color: '#F5F5DC', metalness: 0.0, roughness: 0.6
    };
    if (name.includes('polycarbonate') || name.includes('pc')) return {
        color: '#E5E5E5', metalness: 0.0, roughness: 0.2,
        transparent: true, opacity: 0.85, clearcoat: 0.5
    };
    if (name.includes('acrylic') || name.includes('pmma')) return {
        color: '#FFFFFF', metalness: 0.0, roughness: 0.1,
        transparent: true, opacity: 0.9, clearcoat: 0.8
    };
    if (name.includes('pvc')) return {
        color: '#808080', metalness: 0.0, roughness: 0.5
    };
    if (name.includes('hdpe') || name.includes('polyethylene')) return {
        color: '#FFFAF0', metalness: 0.0, roughness: 0.7
    };
    if (name.includes('polypropylene') || name.includes('pp')) return {
        color: '#F0F0F0', metalness: 0.0, roughness: 0.65
    };
    if (name.includes('peek')) return {
        color: '#C4A484', metalness: 0.0, roughness: 0.4
    };
    if (name.includes('delrin') || name.includes('pom')) return {
        color: '#F5F5F5', metalness: 0.0, roughness: 0.35
    };
    if (name.includes('teflon') || name.includes('ptfe')) return {
        color: '#FFFEF0', metalness: 0.0, roughness: 0.1
    };
    if (name.includes('plastic')) return {
        color: '#3B82F6', metalness: 0.0, roughness: 0.45
    };

    // RUBBER/ELASTOMERS
    if (name.includes('rubber') || name.includes('epdm')) return {
        color: '#1C1C1C', metalness: 0.0, roughness: 0.9
    };
    if (name.includes('silicone')) return {
        color: '#E0E0E0', metalness: 0.0, roughness: 0.8,
        transparent: true, opacity: 0.7
    };
    if (name.includes('neoprene')) return {
        color: '#2D2D2D', metalness: 0.0, roughness: 0.85
    };

    // COMPOSITES
    if (name.includes('carbon fiber') || name.includes('carbon')) return {
        color: '#1A1A1A', metalness: 0.4, roughness: 0.3,
        clearcoat: 0.6
    };
    if (name.includes('fiberglass')) return {
        color: '#F5F5DC', metalness: 0.1, roughness: 0.5
    };
    if (name.includes('kevlar')) return {
        color: '#DAA520', metalness: 0.1, roughness: 0.6
    };

    // WOOD
    if (name.includes('oak')) return {
        color: '#B8860B', metalness: 0.0, roughness: 0.7
    };
    if (name.includes('walnut')) return {
        color: '#5D432C', metalness: 0.0, roughness: 0.65
    };
    if (name.includes('maple')) return {
        color: '#FFE4C4', metalness: 0.0, roughness: 0.6
    };
    if (name.includes('pine')) return {
        color: '#DEB887', metalness: 0.0, roughness: 0.75
    };
    if (name.includes('bamboo')) return {
        color: '#E3C16F', metalness: 0.0, roughness: 0.5
    };
    if (name.includes('wood')) return {
        color: '#8B4513', metalness: 0.0, roughness: 0.7
    };

    // GLASS/CERAMIC
    if (name.includes('glass')) return {
        color: '#FFFFFF', metalness: 0.0, roughness: 0.0,
        transparent: true, opacity: 0.4, clearcoat: 1.0
    };
    if (name.includes('diamond')) return {
        color: '#B9F2FF', metalness: 0.0, roughness: 0.0,
        transparent: true, opacity: 0.5, clearcoat: 1.0, ior: 2.42
    };
    if (name.includes('ceramic') || name.includes('porcelain')) return {
        color: '#FFFAF0', metalness: 0.0, roughness: 0.2,
        clearcoat: 0.5
    };

    // STONE/CONCRETE
    if (name.includes('granite')) return {
        color: '#676767', metalness: 0.0, roughness: 0.6
    };
    if (name.includes('marble')) return {
        color: '#F5F5F5', metalness: 0.0, roughness: 0.3,
        clearcoat: 0.4
    };
    if (name.includes('concrete')) return {
        color: '#808080', metalness: 0.0, roughness: 0.9
    };

    // Default: professional gray aluminum-like
    return {
        color: '#B0B0B0', metalness: 0.5, roughness: 0.4,
        envMapIntensity: 0.7
    };
};

export default function ParametricMesh({ variant, intent, inspectMode, onClick }: ParametricMeshProps) {
    const meshRef = useRef<THREE.Group>(null);

    // ===== GENERATIVE GEOMETRY SYSTEM =====
    const geometry = useMemo(() => {
        // Normalize intent to consistent format
        const normalizedSpec = normalizeGeometrySpec(intent);
        const shapeType = detectShapeType(intent);

        console.log('[GeometryGen] Detected shape type:', shapeType);
        try {
            let generated;

            switch (shapeType) {
                case 'l-bend':
                    const lbendGen = new LBendGenerator();
                    generated = lbendGen.generate(normalizedSpec);
                    break;

                case 'i-beam':
                case 't-profile':
                case 'c-channel':
                    const profGen = new ProfileGenerator();
                    generated = profGen.generate(normalizedSpec);
                    break;

                case 'cylinder':
                case 'bottle':
                    const cylGen = new CylinderGenerator();
                    generated = cylGen.generate(normalizedSpec);
                    break;

                case 'vase':
                case 'bowl':
                case 'cup':
                    const revGen = new RevolveGenerator();
                    generated = revGen.generate(normalizedSpec);
                    break;

                case 'ring':
                case 'jewelry':
                    const ringGen = new RingGenerator();
                    generated = ringGen.generate(normalizedSpec);
                    break;

                // Phase 8: Advanced Geometry
                case 'gear':
                case 'cog':
                case 'sprocket':
                    const gearGen = new GearGenerator();
                    generated = gearGen.generate(normalizedSpec);
                    break;

                case 'enclosure':
                case 'case':
                case 'housing':
                    const encGen = new EnclosureGenerator();
                    generated = encGen.generate(normalizedSpec);
                    break;

                case 'thread':
                case 'bolt':
                case 'nut':
                case 'screw':
                    const threadGen = new ThreadGenerator();
                    generated = threadGen.generate(normalizedSpec);
                    break;

                case 'pipe':
                case 'duct':
                    const pipeGen = new PipeGenerator();
                    generated = pipeGen.generate(normalizedSpec);
                    break;

                // Universal primitives (sphere, cone, wedge, prism, custom, or any unknown)
                case 'sphere':
                case 'ball':
                case 'dome':
                case 'cone':
                case 'funnel':
                case 'wedge':
                case 'ramp':
                case 'prism':
                case 'torus':
                case 'donut':
                case 'custom':
                    const universalGen = new UniversalGenerator();
                    generated = universalGen.generate(normalizedSpec);
                    break;

                case 'baseplate':
                case 'box':
                case 'plate':
                default:
                    // Try universal generator first for flexibility, fall back to baseplate
                    try {
                        const uniGen = new UniversalGenerator();
                        generated = uniGen.generate(normalizedSpec);
                    } catch {
                        const baseplateGen = new BaseplateGenerator();
                        generated = baseplateGen.generate(normalizedSpec);
                    }
                    break;
            }
            return generated.mesh;


        } catch (error) {
            console.error('[GeometryGen] Error generating geometry:', error);
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
    const showHeatmap = useAppStore(state => state.showHeatmap);
    const activeVisual = showHeatmap || inspectMode || params['sim_mode'] === 'Heatmap';

    // Apply Heatmap Colors if available
    useEffect(() => {
        if (meshRef.current && geometry && activeVisual) {
            const mesh = meshRef.current.children[0] as THREE.Mesh;
            if (mesh && mesh.geometry) {
                // Simple mockup: Color based on X position (cantilever stress)
                const count = mesh.geometry.attributes.position.count;
                const colors = new Float32Array(count * 3);
                const positions = mesh.geometry.attributes.position;

                for (let i = 0; i < count; i++) {
                    const x = positions.getX(i);
                    // Normalize x (approx 0 to 0.2m)
                    const stress = Math.min(1, Math.max(0, (x + 0.1) * 5));
                    // Blue (0) -> Red (1)
                    colors[i * 3] = stress;     // R
                    colors[i * 3 + 1] = 0;      // G
                    colors[i * 3 + 2] = 1 - stress; // B
                }

                mesh.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            }
        }
    }, [geometry, inspectMode]);

    // Determine Material Visuals
    const materialName = (typeof intent.materials[0] === 'string' ? intent.materials[0] : 'Aluminum') || 'Aluminum';
    const matProps = getMaterialProps(materialName);

    // Export Listener
    useEffect(() => {
        const handleExport = (e: any) => {
            if (meshRef.current) {
                ExportManager.downloadSTL(meshRef.current, e.detail?.filename || 'design');
            }
        };
        window.addEventListener('EXPORT_STL_REQUESTED', handleExport);
        return () => window.removeEventListener('EXPORT_STL_REQUESTED', handleExport);
    }, [geometry]);

    // Render Logic for Assemblies (Groups)
    if (geometry instanceof THREE.Group || (geometry instanceof THREE.Object3D && !(geometry as any).isBufferGeometry)) {
        return (
            <group ref={meshRef} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <primitive object={geometry} onClick={handleClick('body')} />
                {activeVisual && (
                    <pointLight position={[0.5, 0.5, 0.1]} intensity={2} color="#ff0000" />
                )}
                <ambientLight intensity={1.0} />
                <spotLight position={[10, 10, 10]} intensity={2} />
            </group>
        );
    }

    // Default Single Mesh Render
    return (
        <group ref={meshRef} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh geometry={geometry as THREE.BufferGeometry} onClick={handleClick('body')}>
                {activeVisual ? (
                    <meshStandardMaterial
                        vertexColors
                        side={THREE.DoubleSide}
                        roughness={0.5}
                    />
                ) : (
                    <meshPhysicalMaterial
                        {...matProps}
                        side={THREE.DoubleSide}
                    />
                )}
            </mesh>
            <mesh geometry={geometry as THREE.BufferGeometry}>
                <meshStandardMaterial color={activeVisual ? "#fff" : "#000000"} wireframe transparent opacity={0.1} />
            </mesh>

            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1.0} />
            <directionalLight position={[-5, 5, 5]} intensity={1.5} />

            {activeVisual && (
                <pointLight position={[0.5, 0.5, 0.1]} intensity={2} color="#ff0000" />
            )}
        </group>
    );
}

'use client';

// AI-Driven 3D Model Generator
// Generates geometry from parameters using procedural rules

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DesignIntent } from '@/lib/schemas/designIntent';
import { GeneratedVariant } from '@/lib/variants/variantGenerator';

interface ViewSettings {
    mode: 'standard' | 'wireframe' | 'xray';
}

interface ParametricMeshProps {
    variant: GeneratedVariant;
    intent: DesignIntent;
    inspectMode?: boolean;
    viewSettings?: ViewSettings;
    onClick?: (region: string) => void;
}

// Variant colors
const variantColors: Record<string, string> = {
    strength: '#4f46e5',
    weight: '#0891b2',
    cost: '#d97706',
};

export default function ParametricMesh({ variant, intent, inspectMode, viewSettings, onClick }: ParametricMeshProps) {
    const meshRef = useRef<THREE.Group>(null);

    // Get custom params if available
    const customParams = (intent as any).customParams || {};
    const aiDescription = ((intent as any).aiDescription || '').toLowerCase();

    // Detect part type from AI description
    const isFidgetSpinner = aiDescription.includes('fidget') || aiDescription.includes('spinner');
    const isGear = aiDescription.includes('gear') || customParams['Teeth'] || customParams['Module'];
    const isShaft = aiDescription.includes('shaft') || customParams['Keyway'];
    const isEnclosure = aiDescription.includes('enclosure') || aiDescription.includes('box');

    const scale = 0.01;

    // Animation
    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += isFidgetSpinner ? 0.02 : 0.003;
        }
    });

    const handleClick = (region: string) => (e: THREE.Event) => {
        if (inspectMode && onClick) {
            e.stopPropagation();
            onClick(region);
        }
    };

    // Generate geometry based on detected type
    if (isFidgetSpinner) {
        return <FidgetSpinnerMesh
            meshRef={meshRef}
            params={customParams}
            intent={intent}
            variant={variant}
            scale={scale}
            viewSettings={viewSettings}
            onClick={handleClick}
        />;
    }

    if (isGear) {
        return <GearMesh
            meshRef={meshRef}
            params={customParams}
            intent={intent}
            variant={variant}
            scale={scale}
            viewSettings={viewSettings}
            onClick={handleClick}
        />;
    }

    if (isShaft) {
        return <ShaftMesh
            meshRef={meshRef}
            params={customParams}
            intent={intent}
            variant={variant}
            scale={scale}
            viewSettings={viewSettings}
            onClick={handleClick}
        />;
    }

    // Default: bracket/enclosure
    return <BracketMesh
        meshRef={meshRef}
        intent={intent}
        variant={variant}
        scale={scale}
        viewSettings={viewSettings}
        onClick={handleClick}
    />;
}

// Helper for material props based on view mode
function useMaterialProps(viewSettings?: ViewSettings, baseColor: string = '#2a2a3a', baseMetalness: number = 0.5, baseRoughness: number = 0.5) {
    const isWireframe = viewSettings?.mode === 'wireframe';
    const isXray = viewSettings?.mode === 'xray';

    return {
        color: baseColor,
        metalness: isXray ? 0.1 : baseMetalness,
        roughness: isXray ? 0.1 : baseRoughness,
        wireframe: isWireframe,
        transparent: isXray,
        opacity: isXray ? 0.3 : 1,
        depthWrite: !isXray,
        side: isXray ? THREE.DoubleSide : THREE.FrontSide,
    };
}

// Fidget Spinner Generator
function FidgetSpinnerMesh({ meshRef, params, intent, variant, scale, viewSettings, onClick }: any) {
    const diameter = parseFloat(params['Diameter']?.value || '80') * scale;
    const thickness = parseFloat(params['Thickness']?.value || '8') * scale;
    const arms = parseInt(params['Arms']?.value || '3');
    const bore = parseFloat(params['Bore Diameter']?.value || '22') * scale;

    const accentColor = variantColors[variant.variantType] || '#4f46e5';

    const bodyMat = useMaterialProps(viewSettings, "#3a3a4a", 0.7, 0.3);
    const hubMat = useMaterialProps(viewSettings, "#2a2a3a", 0.8, 0.2);
    const weightMat = useMaterialProps(viewSettings, accentColor, 0.8, 0.2);

    // Create spinner arms
    const armGeometries = useMemo(() => {
        const geoms: THREE.BufferGeometry[] = [];
        const armLength = diameter * 0.35;
        const armWidth = diameter * 0.15;

        for (let i = 0; i < arms; i++) {
            const angle = (i / arms) * Math.PI * 2;
            const armShape = new THREE.Shape();

            // Rounded arm shape
            const r = armWidth / 2;
            armShape.moveTo(-r, 0);
            armShape.lineTo(-r, armLength - r);
            armShape.arc(r, 0, r, Math.PI, 0, true);
            armShape.lineTo(r, 0);
            armShape.arc(-r, 0, r, 0, Math.PI, true);

            const geom = new THREE.ExtrudeGeometry(armShape, { depth: thickness, bevelEnabled: false });
            geom.rotateX(-Math.PI / 2);
            geom.rotateY(angle);
            geom.translate(Math.cos(angle) * r, 0, Math.sin(angle) * r);

            geoms.push(geom);
        }
        return geoms;
    }, [arms, diameter, thickness]);

    return (
        <group ref={meshRef} position={[0, thickness / 2, 0]}>
            {/* Center hub */}
            <mesh onClick={onClick('body')}>
                <cylinderGeometry args={[bore * 1.3, bore * 1.3, thickness, 32]} />
                <meshStandardMaterial {...hubMat} />
            </mesh>

            {/* Center bearing hole */}
            <mesh onClick={onClick('hole')}>
                <cylinderGeometry args={[bore / 2, bore / 2, thickness + 0.01, 24]} />
                <meshStandardMaterial color="#050508" metalness={0.9} roughness={0.1} />
            </mesh>

            {/* Arms */}
            {armGeometries.map((geom, i) => (
                <mesh key={i} geometry={geom} castShadow onClick={onClick('body')}>
                    <meshStandardMaterial {...bodyMat} />
                </mesh>
            ))}

            {/* Arm end weights */}
            {Array.from({ length: arms }).map((_, i) => {
                const angle = (i / arms) * Math.PI * 2;
                const dist = diameter * 0.38;
                return (
                    <mesh
                        key={`w${i}`}
                        position={[Math.cos(angle) * dist, 0, Math.sin(angle) * dist]}
                        onClick={onClick('body')}
                    >
                        <cylinderGeometry args={[diameter * 0.12, diameter * 0.12, thickness, 24]} />
                        <meshStandardMaterial {...weightMat} />
                    </mesh>
                );
            })}

            {/* Center accent ring */}
            <mesh position={[0, thickness / 2 + 0.002, 0]}>
                <torusGeometry args={[bore * 0.7, bore * 0.08, 16, 32]} rotation={[Math.PI / 2, 0, 0]} />
                <meshStandardMaterial color={accentColor} metalness={0.9} roughness={0.1} emissive={accentColor} emissiveIntensity={0.2} />
            </mesh>

            <pointLight position={[0, 0.3, 0]} intensity={0.5} distance={2} color={accentColor} />
        </group>
    );
}

// Gear Generator
function GearMesh({ meshRef, params, intent, variant, scale, viewSettings, onClick }: any) {
    const module = parseFloat(params['Module']?.value || '2');
    const teeth = parseInt(params['Teeth']?.value || '24');
    const faceWidth = parseFloat(params['Face Width']?.value || '15') * scale;
    const bore = parseFloat(params['Bore Diameter']?.value || '10') * scale;

    const pitchRadius = (module * teeth) / 2 * scale;
    const addendum = module * scale;
    const dedendum = 1.25 * module * scale;

    const accentColor = variantColors[variant.variantType] || '#4f46e5';

    const bodyMat = useMaterialProps(viewSettings, "#3a3a4a", 0.75, 0.25);
    const hubMat = useMaterialProps(viewSettings, "#2a2a3a", 0.8, 0.2);

    // Create gear profile
    const gearShape = useMemo(() => {
        const shape = new THREE.Shape();
        const outerR = pitchRadius + addendum;
        const rootR = pitchRadius - dedendum;
        const toothAngle = (Math.PI * 2) / teeth;

        for (let i = 0; i < teeth; i++) {
            const angle = i * toothAngle;
            const tipAngle = angle + toothAngle * 0.25;
            const nextAngle = angle + toothAngle;

            if (i === 0) {
                shape.moveTo(Math.cos(angle) * rootR, Math.sin(angle) * rootR);
            }

            // Tooth tip
            shape.lineTo(Math.cos(tipAngle - 0.03) * outerR, Math.sin(tipAngle - 0.03) * outerR);
            shape.lineTo(Math.cos(tipAngle + 0.03) * outerR, Math.sin(tipAngle + 0.03) * outerR);

            // Root
            shape.lineTo(Math.cos(nextAngle) * rootR, Math.sin(nextAngle) * rootR);
        }

        // Center hole
        const holePath = new THREE.Path();
        holePath.absarc(0, 0, bore, 0, Math.PI * 2, true);
        shape.holes.push(holePath);

        return shape;
    }, [teeth, pitchRadius, addendum, dedendum, bore]);

    return (
        <group ref={meshRef} position={[0, faceWidth / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh castShadow onClick={onClick('body')}>
                <extrudeGeometry args={[gearShape, { depth: faceWidth, bevelEnabled: false }]} />
                <meshStandardMaterial {...bodyMat} />
            </mesh>

            {/* Hub */}
            <mesh position={[0, 0, faceWidth / 2]} onClick={onClick('body')}>
                <cylinderGeometry args={[bore * 1.5, bore * 1.5, faceWidth * 1.2, 24]} rotation={[Math.PI / 2, 0, 0]} />
                <meshStandardMaterial {...hubMat} />
            </mesh>

            <pointLight position={[0, 0.3, 0]} intensity={0.4} distance={2} color={accentColor} />
        </group>
    );
}

// Shaft Generator
function ShaftMesh({ meshRef, params, intent, variant, scale, viewSettings, onClick }: any) {
    const diameter = parseFloat(params['Diameter']?.value || '25') * scale;
    const length = parseFloat(params['Length']?.value || '150') * scale;
    const chamfer = parseFloat(params['Chamfer']?.value || '1') * scale;

    const accentColor = variantColors[variant.variantType] || '#4f46e5';

    const bodyMat = useMaterialProps(viewSettings, "#4a4a5a", 0.75, 0.25);
    const endMat = useMaterialProps(viewSettings, "#3a3a4a", 0.75, 0.25);

    return (
        <group ref={meshRef} position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            {/* Main shaft */}
            <mesh castShadow onClick={onClick('body')}>
                <cylinderGeometry args={[diameter / 2, diameter / 2, length, 32]} />
                <meshStandardMaterial {...bodyMat} />
            </mesh>

            {/* Chamfers */}
            <mesh position={[0, length / 2, 0]}>
                <cylinderGeometry args={[diameter / 2 - chamfer, diameter / 2, chamfer * 2, 32]} />
                <meshStandardMaterial {...endMat} />
            </mesh>
            <mesh position={[0, -length / 2, 0]}>
                <cylinderGeometry args={[diameter / 2, diameter / 2 - chamfer, chamfer * 2, 32]} />
                <meshStandardMaterial {...endMat} />
            </mesh>

            <pointLight position={[0, 0.3, 0]} intensity={0.4} distance={2} color={accentColor} />
        </group>
    );
}

// Default Bracket Mesh
function BracketMesh({ meshRef, intent, variant, scale, viewSettings, onClick }: any) {
    const { L, W, H } = intent.envelope;
    const scaledL = L * scale;
    const scaledW = W * scale;
    const scaledH = H * scale;
    const wall = variant.wallThickness * scale;
    const filletR = variant.filletRadius * scale;

    const accentColor = variantColors[variant.variantType] || '#4f46e5';

    const bodyMat = useMaterialProps(viewSettings, "#2a2a3a", 0.75, 0.25);

    const bodyGeometry = useMemo(() => {
        const outerShape = new THREE.Shape();
        const hw = scaledL / 2;
        const hd = scaledW / 2;
        const r = Math.min(filletR, hw * 0.3, hd * 0.3);

        outerShape.moveTo(-hw + r, -hd);
        outerShape.lineTo(hw - r, -hd);
        outerShape.quadraticCurveTo(hw, -hd, hw, -hd + r);
        outerShape.lineTo(hw, hd - r);
        outerShape.quadraticCurveTo(hw, hd, hw - r, hd);
        outerShape.lineTo(-hw + r, hd);
        outerShape.quadraticCurveTo(-hw, hd, -hw, hd - r);
        outerShape.lineTo(-hw, -hd + r);
        outerShape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);

        const innerHw = hw - wall;
        const innerHd = hd - wall;
        if (innerHw > 0 && innerHd > 0) {
            const innerR = r * 0.5;
            const holePath = new THREE.Path();
            holePath.moveTo(-innerHw + innerR, -innerHd);
            holePath.lineTo(innerHw - innerR, -innerHd);
            holePath.quadraticCurveTo(innerHw, -innerHd, innerHw, -innerHd + innerR);
            holePath.lineTo(innerHw, innerHd - innerR);
            holePath.quadraticCurveTo(innerHw, innerHd, innerHw - innerR, innerHd);
            holePath.lineTo(-innerHw + innerR, innerHd);
            holePath.quadraticCurveTo(-innerHw, innerHd, -innerHw, innerHd - innerR);
            holePath.lineTo(-innerHw, -innerHd + innerR);
            holePath.quadraticCurveTo(-innerHw, -innerHd, -innerHw + innerR, -innerHd);
            outerShape.holes.push(holePath);
        }

        return new THREE.ExtrudeGeometry(outerShape, { depth: scaledH, bevelEnabled: false });
    }, [scaledL, scaledW, scaledH, wall, filletR]);

    return (
        <group ref={meshRef} position={[0, scaledH / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh geometry={bodyGeometry} castShadow receiveShadow onClick={onClick('body')}>
                <meshStandardMaterial {...bodyMat} />
            </mesh>
            <pointLight position={[0, 0, scaledH + 0.1]} intensity={0.4} distance={1.5} color={accentColor} />
        </group>
    );
}
